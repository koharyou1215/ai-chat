import { NextRequest, NextResponse } from 'next/server';
import { AppSettings } from '../../../../types/app';
import { chatCompletion } from '../../../../lib/openRouter';

export async function POST(req: NextRequest) {
  console.log('[/api/user-inspiration] POSTリクエストを受信しました');
  try {
    const { message, settings }: { message: string; settings: AppSettings } = await req.json();

    // 環境変数を優先的に使用
    const openRouterApiKey = settings?.OpenRouterApikey || process.env.OPENROUTER_API_KEY;
    
    console.log('[/api/user-inspiration] OpenRouter API Key check:', {
      hasSettingsApiKey: !!settings?.OpenRouterApikey,
      hasEnvApiKey: !!process.env.OPENROUTER_API_KEY,
      settingsApiKeyLength: settings?.OpenRouterApikey?.length || 0,
      finalApiKeyLength: openRouterApiKey?.length || 0,
      finalApiKeyStart: openRouterApiKey?.substring(0, 15) || 'none',
      envApiKeyStart: process.env.OPENROUTER_API_KEY?.substring(0, 15) || 'none',
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

    const prompt = `あなたは「ユーザーのメッセージから次のチャットのインスピレーションの候補を提示する」ことに特化したAIアシスタントです。
あなたの役割は、ユーザーの過去のメッセージや現在の状況を考慮し、会話をさらに面白く、深く、または新しい方向に進めるための、簡潔で魅力的な発言の候補を3つ提案することです。
各候補は、ユーザーの次の発言として自然に会話の流れにフィットするものであるべきです。
候補は日本語で、ユーザーが直接使えるような短いフレーズや質問の形式で提供してください。
また、候補にはユーザーが想像力を掻き立てられるような具体的な内容を含めてください。
あなたの思考プロセスや解説は一切出力せず、純粋にJSON形式の候補リストのみを生成してください。

ユーザーのメッセージ:
${message}

提供する候補のJSON形式の例:
\`\`\`json
{
  "candidates": [
    "候補1のテキスト",
    "候補2のテキスト",
    "候補3のテキスト"
  ]
}
\`\`\`

候補を生成してください。`;

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

    try {
      // JSONパースの改善
      let cleanedContent = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim();

      // 不完全なJSONを検出して修正
      if (!cleanedContent.endsWith('}')) {
        const lastCompleteObject = cleanedContent.lastIndexOf('"');
        if (lastCompleteObject > 0) {
          const lastBrace = cleanedContent.lastIndexOf('}');
          if (lastBrace > lastCompleteObject) {
            cleanedContent = cleanedContent.substring(0, lastBrace + 1);
          }
        }
      }

      const parsedContent = JSON.parse(cleanedContent);
      if (!parsedContent.candidates || !Array.isArray(parsedContent.candidates)) {
        console.error('[/api/user-inspiration] 応答のJSON形式が不正です。candidates配列が見つかりません。');
        return NextResponse.json({ error: 'Invalid JSON format from OpenRouter API: missing candidates array' }, { status: 500 });
      }
      console.log(`[/api/user-inspiration] 生成された候補数: ${parsedContent.candidates.length}`);
      return NextResponse.json(parsedContent);
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      console.error(`[/api/user-inspiration] JSONパースエラー: ${errorMessage}, 応答内容: ${content}`);
      
      // フォールバック: 基本的な候補を生成
      const fallbackCandidates = [
        "もう少し詳しく教えてください",
        "それは面白いですね。他には？",
        "なるほど、それでどうなりましたか？"
      ];
      
      return NextResponse.json({ 
        candidates: fallbackCandidates,
        fallback: true 
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[/api/user-inspiration] APIエラー: ${errorMessage}`);
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
