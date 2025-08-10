import { NextRequest, NextResponse } from 'next/server';
import { GeminiApiManager } from '../../../../lib/geminiApiManager';

export async function POST(request: NextRequest) {
  console.log('🔍 Enhance Text API 開始');
  
  try {
    const body = await request.json();
    const { 
      text, 
      conversationHistory,
      settings
    } = body;

    console.log('🔍 リクエストデータ:', {
      hasText: !!text,
      textLength: text?.length || 0,
      hasConversationHistory: !!conversationHistory,
      conversationHistoryLength: conversationHistory?.length || 0,
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
    let finalPrompt = enhancementPrompt.replace(/\{\{user\}\}/g, text);
    
    // 会話履歴がある場合は、コンテキストとして含める
    if (conversationHistory && conversationHistory.trim()) {
      const basePrompt = finalPrompt;
      finalPrompt = `以下の会話履歴を参考にして、テキストを改善してください。会話の流れや文脈に合わせて自然に強化してください。

会話履歴:
${conversationHistory}

強化対象のテキスト: ${text}

${basePrompt}`;
    }
    
    console.log(`🔍 プロンプト置換確認:`, {
      originalPromptLength: enhancementPrompt.length,
      textLength: text.length,
      conversationHistoryLength: conversationHistory?.length || 0,
      finalPromptLength: finalPrompt.length,
      hasUserPlaceholder: enhancementPrompt.includes('{{user}}'),
      hasConversationHistory: !!conversationHistory,
      replacementOccurred: enhancementPrompt !== finalPrompt
    });
    
    console.log(`🔍 プロンプト長: ${finalPrompt.length}文字`);

    // GeminiApiManager priority system を使用（503エラー対策）
    const maxTokens = settings?.maxTokens || 1500;
    const selectedModel = settings?.model || 'gemini-1.5-flash';
    console.log(`🔹 GeminiApiManager priority call開始（model: ${selectedModel}, maxTokens: ${maxTokens}）`);
    
    // メッセージ形式に変換
    const messagesForGemini = [
      { role: 'user', content: finalPrompt }
    ];
    
    // GeminiApiManagerのgenerateWithPriorityを使用してフォールバック機能を活用
    const generateResult = await GeminiApiManager.generateWithPriority(
      selectedModel,
      messagesForGemini,
      {
        maxTokens: maxTokens,
        temperature: 0.7,
        openRouterApiKey: settings?.openRouterApiKey
      }
    );

    if (!generateResult.success || !generateResult.content) {
      console.error('❌ GeminiApiManager generateWithPriority失敗:', generateResult.error);
      return NextResponse.json({
        success: false,
        error: generateResult.error || 'AI生成に失敗しました'
      }, { status: 500 });
    }

    const content = generateResult.content;
    console.log(`✅ GeminiApiManager成功 - レスポンス文字数: ${content.length} (provider: ${generateResult.provider})`);

    if (!content) {
      console.warn('⚠️ 返却テキストが空です');
      return NextResponse.json({
        success: false,
        error: 'AI応答が空です'
      }, { status: 500 });
    }

    const enhancedText = content.trim();

    console.log(`✅ テキスト強化成功（GeminiApiManager）:`, {
      originalLength: text.length,
      enhancedLength: enhancedText.length,
      provider: generateResult.provider
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