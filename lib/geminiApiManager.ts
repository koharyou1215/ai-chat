import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

interface GeminiResponse {
  success: boolean;
  content?: string;
  error?: string;
  provider: 'gemini' | 'openrouter';
}

export class GeminiApiManager {
  private static readonly GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro', 
    'gemini-2.5-flash-lite-preview-06-17'
  ];

  private static readonly OPENROUTER_FALLBACK_MODELS = [
    'google/gemini-2.5-flash',
    'google/gemini-2.5-pro',
    'google/gemini-2.5-flash-lite-preview-06-17'
  ];

  /**
   * Gemini APIを優先してOpenRouterをフォールバックとして使用
   */
  static async generateWithPriority(
    model: string,
    messages: Array<{role: string, content: string}>,
    options: {
      maxTokens?: number;
      temperature?: number;
      openRouterApiKey?: string; // 設定画面からのAPIキーを受け取る
    } = {}
  ): Promise<GeminiResponse> {
    console.log(`🎯 generateWithPriority開始 - モデル: ${model}`);
    console.log(`🔑 APIキー状況:`, {
      hasGemini: !!process.env.GEMINI_API_KEY,
      hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
      isGeminiModel: this.isGeminiModel(model)
    });
    
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openRouterKey = options.openRouterApiKey || process.env.OPENROUTER_API_KEY;

    // Gemini APIを最初に試行
    if (geminiApiKey && this.isGeminiModel(model)) {
      console.log(`🔹 Gemini API優先: ${model}を試行中...`);
      
      try {
        const result = await this.callGeminiDirect(model, messages, options, geminiApiKey);
        if (result.success) {
          console.log(`✅ Gemini API成功: ${model}`);
          return { ...result, provider: 'gemini' };
        }
        console.log(`⚠️ Gemini API失敗: ${result.error}, OpenRouterフォールバック開始`);
      } catch (error: any) {
        console.error(`❌ Gemini APIエラー:`, {
          name: error.name,
          message: error.message,
          model: model
        });
      }
    } else {
      console.log(`⏭️ Gemini API スキップ - 理由:`, {
        hasApiKey: !!geminiApiKey,
        isGeminiModel: this.isGeminiModel(model)
      });
    }

    // OpenRouterフォールバック
    if (openRouterKey) {
      console.log(`🔄 OpenRouterフォールバック: ${model}`);
      
      try {
        const result = await this.callOpenRouterFallback(model, messages, options, openRouterKey);
        if (result.success) {
          console.log(`✅ OpenRouter成功: ${model}`);
          return { ...result, provider: 'openrouter' };
        } else {
          console.error(`❌ OpenRouter失敗: ${result.error}`);
          return {
            success: false,
            error: result.error || 'OpenRouter API呼び出しに失敗しました',
            provider: 'openrouter'
          };
        }
      } catch (error: any) {
        console.error(`❌ OpenRouterエラー:`, {
          name: error.name,
          message: error.message,
          model: model
        });
        return {
          success: false,
          error: `OpenRouter呼び出しエラー: ${error.message || error}`,
          provider: 'openrouter'
        };
      }
    } else {
      console.warn(`⚠️ OpenRouter APIキーが設定されていません`);
    }

    const finalError = 'APIキーが設定されていないか、すべてのAPI呼び出しが失敗しました';
    console.error(`❌ 全APIで失敗: ${finalError}`);
    return {
      success: false,
      error: finalError,
      provider: 'gemini'
    };
  }

  /**
   * Geminiモデルかどうかチェック
   */
  private static isGeminiModel(model: string): boolean {
    return this.GEMINI_MODELS.some(m => model.includes(m)) || 
           model.startsWith('google/gemini');
  }

  /**
   * Gemini API直接呼び出し
   */
  private static async callGeminiDirect(
    model: string,
    messages: Array<{role: string, content: string}>,
    options: any,
    apiKey: string
  ): Promise<{success: boolean, content?: string, error?: string}> {
    try {
      console.log(`🔹 Gemini API呼び出し開始: ${model}`);
      console.log(`📝 メッセージ数: ${messages.length}`);
      console.log(`⚙️ オプション:`, { maxTokens: options.maxTokens || 2000, temperature: options.temperature || 0.7 });
      
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // モデル名を正規化（google/プレフィックス削除）
      const normalizedModel = model.replace('google/', '');
      console.log(`🔄 正規化モデル名: ${normalizedModel}`);
      
      const generativeModel = genAI.getGenerativeModel({ 
        model: normalizedModel,
        generationConfig: {
          maxOutputTokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
        },
        // 安全設定を緩和（AutoHotkeyスクリプトと同様）
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, 
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ]
      });

      // メッセージを統合
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      console.log(`📄 統合プロンプト文字数: ${prompt.length}`);

      console.log(`🚀 Gemini API実行中...`);
      const result = await generativeModel.generateContent(prompt);
      
      console.log(`📨 レスポンス受信`);
      const response = await result.response;
      
      // 安全性チェック結果のログ出力
      const safetyRatings = response.candidates?.[0]?.safetyRatings;
      if (safetyRatings) {
        console.log(`🛡️ 安全性評価:`, safetyRatings);
      }
      
      // フィニッシュリーズンのチェック
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason) {
        console.log(`🏁 終了理由: ${finishReason}`);
        if (finishReason === 'SAFETY') {
          console.warn(`⚠️ 安全フィルターで停止されました`);
          return {
            success: false,
            error: `安全フィルターで停止されました: ${finishReason}`
          };
        }
      }
      
      const text = response.text();
      console.log(`✅ Gemini API成功 - レスポンス文字数: ${text.length}`);

      return {
        success: true,
        content: text
      };
    } catch (error: any) {
      console.error(`❌ Gemini APIエラー詳細:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      // より詳細なエラーメッセージを構築
      let errorMessage = 'Gemini API呼び出しエラー';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      if (error.cause) {
        errorMessage += ` (原因: ${error.cause})`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * OpenRouterフォールバック
   */
  private static async callOpenRouterFallback(
    model: string,
    messages: Array<{role: string, content: string}>,
    options: any,
    apiKey: string
  ): Promise<{success: boolean, content?: string, error?: string}> {
    try {
      console.log(`🔄 OpenRouterフォールバック開始: ${model}`);
      
      // OpenRouterフォーマットに変換（Geminiモデルのみgoogle/プレフィックス付与）
      let openRouterModel: string;
      if (model.startsWith('google/gemini')) {
        // 既にgoogle/geminiが付いている場合はそのまま使用
        openRouterModel = model;
      } else if (model.includes('gemini')) {
        // geminiが含まれているがプレフィックスがない場合は付与
        openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
      } else {
        // その他のモデルはプレフィックスを付けない
        openRouterModel = model;
      }
      console.log(`📝 OpenRouterモデル名: ${openRouterModel}`);
      console.log(`📨 リクエストメッセージ数: ${messages.length}`);
      
      const requestBody = {
        model: openRouterModel,
        messages: messages,
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
      };
      
      console.log(`🚀 OpenRouter API実行中...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_TITLE || 'AI Chat App',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📡 OpenRouterレスポンス - ステータス: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OpenRouter HTTPエラー: ${response.status} - ${errorText}`);
        throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`📋 OpenRouterレスポンスデータ構造:`, {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        hasError: !!data.error
      });
      
      if (data.error) {
        console.error(`❌ OpenRouter APIエラー:`, data.error);
        throw new Error(`OpenRouter APIエラー: ${data.error.message || data.error}`);
      }
      
      if (data.choices && data.choices[0]) {
        const content = data.choices[0].message?.content || '';
        console.log(`✅ OpenRouter API成功 - レスポンス文字数: ${content.length}`);
        return {
          success: true,
          content: content
        };
      }

      console.error(`❌ OpenRouterレスポンス形式が不正:`, data);
      throw new Error('OpenRouterレスポンス形式が不正 - choices配列がありません');
    } catch (error: any) {
      console.error(`❌ OpenRouterエラー詳細:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // より詳細なエラーメッセージを構築
      let errorMessage = 'OpenRouter呼び出しエラー';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 利用可能なGeminiモデル一覧
   */
  static getAvailableModels(): string[] {
    return [...this.GEMINI_MODELS, ...this.OPENROUTER_FALLBACK_MODELS];
  }

  /**
   * モデル表示名の取得
   */
  static getDisplayName(model: string): string {
    const displayNames: Record<string, string> = {
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-2.5-pro': 'Gemini 2.5 Pro', 
      'gemini-2.5-flash-lite-preview-06-17': 'Gemini 2.5 Flash Lite (Preview)',
      'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
      'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
      'google/gemini-2.5-flash-lite-preview-06-17': 'Gemini 2.5 Flash Lite (Preview)'
    };
    
    return displayNames[model] || model;
  }
}