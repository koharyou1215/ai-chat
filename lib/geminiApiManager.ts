import { GoogleGenerativeAI } from '@google/generative-ai';

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
    } = {}
  ): Promise<GeminiResponse> {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

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
      } catch (error) {
        console.error(`❌ Gemini APIエラー:`, error);
      }
    }

    // OpenRouterフォールバック
    if (openRouterKey) {
      console.log(`🔄 OpenRouterフォールバック: ${model}`);
      
      try {
        const result = await this.callOpenRouterFallback(model, messages, options, openRouterKey);
        console.log(`✅ OpenRouter成功: ${model}`);
        return { ...result, provider: 'openrouter' };
      } catch (error) {
        console.error(`❌ OpenRouterエラー:`, error);
        return {
          success: false,
          error: `両方のAPI失敗: ${error}`,
          provider: 'openrouter'
        };
      }
    }

    return {
      success: false,
      error: 'APIキーが設定されていません',
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
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // モデル名を正規化（google/プレフィックス削除）
      const normalizedModel = model.replace('google/', '');
      
      const generativeModel = genAI.getGenerativeModel({ 
        model: normalizedModel,
        generationConfig: {
          maxOutputTokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
        }
      });

      // メッセージを統合
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        content: text
      };
    } catch (error) {
      return {
        success: false,
        error: `Gemini API呼び出しエラー: ${error}`
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
      // OpenRouterフォーマットに変換
      const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_TITLE || 'AI Chat App',
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: messages,
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        return {
          success: true,
          content: data.choices[0].message?.content || ''
        };
      }

      throw new Error('OpenRouterレスポンス形式が不正');
    } catch (error) {
      return {
        success: false,
        error: `OpenRouter呼び出しエラー: ${error}`
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