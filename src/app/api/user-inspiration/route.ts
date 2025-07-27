import { NextRequest, NextResponse } from 'next/server';
import { AppSettings } from '../../../../types/app';
import { chatCompletion } from '../../../../lib/openRouter';

export async function POST(req: NextRequest) {
  console.log('[/api/user-inspiration] POSTリクエストを受信しました');
  try {
    const { message, settings }: { message: string; settings: AppSettings } = await req.json();

    // 環境変数を最優先で取得
    const envApiKey = process.env.OPENROUTER_API_KEY;
    const settingsApiKey = settings?.openRouterApiKey as string | undefined;
    const openRouterApiKey = envApiKey || settingsApiKey;
    
    console.log('[/api/user-inspiration] OpenRouter API Key check:', {
      hasSettingsApiKey: !!settingsApiKey,
      hasEnvApiKey: !!envApiKey,
      settingsApiKeyLength: settingsApiKey?.length || 0,
      envApiKeyLength: envApiKey?.length || 0,
      finalApiKeyLength: openRouterApiKey?.length || 0,
      finalApiKeyStart: openRouterApiKey?.substring(0, 15) || 'none',
      envApiKeyStart: envApiKey?.substring(0, 15) || 'none',
      isProduction: process.env.NODE_ENV === 'production',
      apiKeyFormat: openRouterApiKey?.startsWith('sk-or-v1-') ? 'valid' : 'invalid'
    });
    
    if (!openRouterApiKey) {
      console.warn('[/api/user-inspiration] OpenRouter API Keyが設定されていません');
      return NextResponse.json({ error: 'OpenRouter API Key is not set.' }, { status: 400 });
    }

    // APIキーの形式チェック
    if (!openRouterApiKey.startsWith('sk-or-v1-')) {
      return NextResponse.json({ error: 'OpenRouter APIキーの形式が正しくありません。' }, { status: 400 });
    }

    const model = settings?.model || 'openai/gpt-4o-mini';
    
    // インスピレーション用の専用トークン数設定（デフォルト500）
    const inspirationMaxTokens = settings?.inspirationMaxTokens || 500;

    console.log(`[/api/user-inspiration] OpenRouterモデル: ${model}`);
    console.log(`[/api/user-inspiration] インスピレーション用トークン数: ${inspirationMaxTokens}`);
    console.log(`[/api/user-inspiration] プロンプトメッセージの長さ: ${message.length}`);

    // 設定画面のプロンプトを使用、デフォルトプロンプトをフォールバック
    const customPrompt = settings?.inspirationPrompt;
    const prompt = customPrompt || `あなたは創作的で自然なAIアシスタントです。
ユーザーとの会話の流れを理解し、適切で魅力的な返信を生成してください。
会話の文脈を考慮し、ユーザーの興味を引くような返信を作成してください。
返信は自然で親しみやすく、会話を続けるのに適した内容にしてください。

会話履歴:
${message}

上記の会話履歴を踏まえて、AIとして適切な返信を生成してください。`;

    console.log('[/api/user-inspiration] OpenRouter APIへのリクエストを送信します。');
    const response = await chatCompletion({
      apiKey: openRouterApiKey,
      model: model,
      messages: [
        { role: 'system', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: inspirationMaxTokens, // 専用のトークン数を使用
    });
    console.log(`[/api/user-inspiration] OpenRouter APIからの生レスポンス: ${JSON.stringify(response)}`);

    const content: string = response;
    console.log(`[/api/user-inspiration] OpenRouterからの応答内容: ${content}`);

    // 直接的な返信として扱う（JSON形式ではない）
    if (content && content.trim()) {
      return NextResponse.json({ 
        candidates: [content.trim()],
        directResponse: true 
      });
    } else {
      console.error('[/api/user-inspiration] OpenRouterからの応答が空です。');
      return NextResponse.json({ 
        candidates: ["会話の流れを理解できませんでした。もう一度お聞かせください。"],
        fallback: true 
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[/api/user-inspiration] APIエラー: ${errorMessage}`);
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
