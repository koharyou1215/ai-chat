import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  console.log('🔍 Enhance Text API 開始');
  
  try {
    const body = await request.json();
    const { 
      text, 
      settings
    } = body;

    console.log('🔍 リクエストデータ:', {
      hasText: !!text,
      textLength: text?.length || 0,
      hasSettings: !!settings,
      settingsType: typeof settings,
      settingsKeys: settings ? Object.keys(settings) : []
    });

    if (!text) {
      console.error('❌ テキストがありません');
      return NextResponse.json({
        success: false,
        error: 'テキストが必要です'
      }, { status: 400 });
    }

    // プロンプトを設定から取得（設定画面のもののみ使用）
    const enhancementPrompt = settings?.enhancementPrompt;
    
    console.log(`🔍 設定データ詳細:`, {
      settingsExists: !!settings,
      enhancementPromptExists: !!enhancementPrompt,
      enhancementPromptLength: enhancementPrompt?.length || 0,
      settingsKeys: settings ? Object.keys(settings) : [],
      enhancementPromptPreview: enhancementPrompt ? enhancementPrompt.substring(0, 100) + '...' : 'なし',
      enhancementPromptType: typeof enhancementPrompt
    });
    
    if (!enhancementPrompt || typeof enhancementPrompt !== 'string' || enhancementPrompt.trim().length === 0) {
      console.error('❌ 文章強化プロンプトが無効:', {
        value: enhancementPrompt,
        type: typeof enhancementPrompt,
        isString: typeof enhancementPrompt === 'string',
        length: enhancementPrompt?.length || 0,
        isEmpty: enhancementPrompt?.trim().length === 0
      });
      return NextResponse.json({
        success: false,
        error: '設定画面で文章強化プロンプトを設定してください'
      }, { status: 400 });
    }

    // プロンプトを構築（{{user}}をテキストに置換）
    const finalPrompt = enhancementPrompt.replace(/\{\{user\}\}/g, text);
    
    console.log(`🔍 プロンプト置換確認:`, {
      originalPromptLength: enhancementPrompt.length,
      textLength: text.length,
      finalPromptLength: finalPrompt.length,
      hasUserPlaceholder: enhancementPrompt.includes('{{user}}'),
      replacementOccurred: enhancementPrompt !== finalPrompt
    });
    
    console.log(`🔍 プロンプト長: ${finalPrompt.length}文字`);

    // Gemini API直接呼び出し
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    console.log('🔍 Gemini APIキー確認:', {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasGoogleKey: !!process.env.GOOGLE_API_KEY,
      hasAnyKey: !!geminiApiKey
    });
    
    if (!geminiApiKey) {
      console.error('❌ Gemini APIキーが設定されていません');
      return NextResponse.json({
        success: false,
        error: 'Gemini APIキーが設定されていません'
      }, { status: 500 });
    }

    const maxTokens = settings?.maxTokens || 1500;
    const selectedModel = settings?.model || 'gemini-1.5-flash';
    console.log(`🔹 Gemini API直接呼び出し開始（model: ${selectedModel}, maxTokens: ${maxTokens}）`);
    
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: selectedModel.includes('gemini-') ? selectedModel : 'gemini-1.5-flash',  // Geminiモデルのみ対応
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
      // 安全設定を緩和
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

    console.log(`🚀 Gemini API実行中...`);
    
    let result;
    try {
      result = await model.generateContent(finalPrompt);
      console.log('✅ Gemini API呼び出し成功');
    } catch (generateError) {
      console.error('❌ Gemini generateContent エラー:', {
        errorMessage: generateError instanceof Error ? generateError.message : String(generateError),
        errorName: generateError instanceof Error ? generateError.name : undefined,
        stack: generateError instanceof Error ? generateError.stack : undefined
      });
      throw generateError;
    }
    
    console.log(`📨 レスポンス受信`);
    const response = await result.response;
    
    console.log(`🔍 レスポンス詳細:`, {
      candidates: response.candidates?.length || 0,
      finishReason: response.candidates?.[0]?.finishReason,
      promptTokens: response.usageMetadata?.promptTokenCount,
      responseTokens: response.usageMetadata?.candidatesTokenCount,
      hasText: !!response.text
    });
    
    // フィニッシュリーズンのチェック
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason) {
      console.log(`🏁 終了理由: ${finishReason}`);
      if (finishReason === 'SAFETY') {
        console.warn(`⚠️ 安全フィルターで停止されました`);
        return NextResponse.json({
          success: false,
          error: `安全フィルターで停止されました: ${finishReason}`
        }, { status: 500 });
      }
    }

    // メインテキスト抽出
    let content = '';
    try {
      content = response.text() || '';
      console.log('✅ テキスト抽出成功:', content.length, '文字');
    } catch (textError) {
      console.error('❌ テキスト抽出エラー:', textError);
      content = '';
    }

    // MAX_TOKENSエラーの場合、部分的な結果でも処理を続行
    if (!content && finishReason === 'MAX_TOKENS') {
      console.log(`🔍 MAX_TOKENSエラー時の詳細データ:`, {
        candidatesLength: response.candidates?.length,
        firstCandidate: response.candidates?.[0],
        contentParts: response.candidates?.[0]?.content?.parts?.length
      });
      
      try {
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
          content = candidate.content.parts
            .map((part: { text?: string }) => part.text || '')
            .join('')
            .trim();
          console.log(`🔍 MAX_TOKENS時の部分結果を取得: ${content.length}文字`);
          if (content.length > 0) {
            console.log(`🔍 部分結果内容:`, content.substring(0, 200) + '...');
          }
        }
      } catch (extractError) {
        console.warn('⚠️ 部分結果の抽出に失敗:', extractError);
      }
    }

    // 通常のテキスト抽出でも失敗した場合、candidatesから直接抽出を試行
    if (!content) {
      console.log(`🔧 通常のテキスト抽出も失敗、candidatesから直接抽出を試行...`);
      try {
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
          content = candidate.content.parts
            .map((part: { text?: string }) => part.text || '')
            .join('')
            .trim();
          console.log(`🔍 直接抽出で取得: ${content.length}文字`);
        }
      } catch (directExtractError) {
        console.warn('⚠️ 直接抽出にも失敗:', directExtractError);
      }
    }

    if (!content) {
      console.warn('⚠️ 返却テキストが空です（Gemini）');
      return NextResponse.json({
        success: false,
        error: 'Gemini応答が空です（finishReasonやsafetyRatingsを確認してください）'
      }, { status: 500 });
    }

    console.log(`✅ Gemini API成功 - レスポンス文字数: ${content.length}`);

    const enhancedText = content.trim();

    console.log(`✅ テキスト強化成功（Gemini直接）:`, {
      originalLength: text.length,
      enhancedLength: enhancedText.length
    });

    return NextResponse.json({
      success: true,
      originalText: text,
      enhancedText: enhancedText
    });

  } catch (error) {
    console.error('❌ Enhance text API error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
    }, { status: 500 });
  }
}