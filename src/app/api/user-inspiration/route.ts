import { NextRequest, NextResponse } from 'next/server';
import { AppSettings } from '../../../../types/app';
import { chatCompletion } from '../../../../lib/openRouter'; // OpenRouterクラスではなくchatCompletion関数をインポート

export async function POST(req: NextRequest) {
  console.log('[/api/user-inspiration] POSTリクエストを受信しました'); // リクエスト開始ログ
  try {
    const { message, settings }: { message: string; settings: AppSettings } = await req.json();

    // 環境変数を優先的に使用
    const openRouterApiKey = settings.openRouterApikey || process.env.OPENROUTER_API_KEY;
    
    if (!openRouterApiKey) {
      console.warn('[/api/user-inspiration] OpenRouter API Keyが設定されていません（設定画面と環境変数の両方で未設定）。');
      return NextResponse.json({ error: 'OpenRouter API Key is not set.' }, { status: 400 });
    }

    // const openRouter = new OpenRouter(settings.openRouterApikey); // OpenRouterクラスのインスタンス化は不要
    const model = settings.openRouterModel || 'mistralai/mistral-7b-instruct'; // Fallback to a default model

    console.log(`[/api/user-inspiration] OpenRouterモデル: ${model}`); // 使用モデルのログ
    console.log(`[/api/user-inspiration] プロンプトメッセージの長さ: ${message.length}`); // メッセージの長さのログ

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

    console.log('[/api/user-inspiration] OpenRouter APIへのリクエストを送信します。'); // APIリクエスト前ログ
    const response = await chatCompletion( // chatCompletion関数を直接呼び出し
      {
        apiKey: openRouterApiKey, // 環境変数優先のAPIキーを使用
        model: model,
        messages: [
          { role: 'system', content: prompt },
        ],
        temperature: 0.7,
      }
    );
    console.log(`[/api/user-inspiration] OpenRouter APIからの生レスポンス: ${JSON.stringify(response)}`); // 生レスポンスのログ

    // OpenRouterのchatCompletion関数は直接contentを返すため、responseオブジェクトの処理を変更
    const content: string = response;
    console.log(`[/api/user-inspiration] OpenRouterからの応答内容: ${content}`); // 応答内容のログ

    try {
      const parsedContent = JSON.parse(content);
      if (!parsedContent.candidates || !Array.isArray(parsedContent.candidates)) {
        console.error('[/api/user-inspiration] 応答のJSON形式が不正です。candidates配列が見つかりません。'); // JSONパース後のエラーログ
        return NextResponse.json({ error: 'Invalid JSON format from OpenRouter API: missing candidates array' }, { status: 500 });
      }
      console.log(`[/api/user-inspiration] 生成された候補数: ${parsedContent.candidates.length}`); // 候補数のログ
      return NextResponse.json(parsedContent);
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      console.error(`[/api/user-inspiration] JSONパースエラー: ${errorMessage}, 応答内容: ${content}`); // JSONパースエラーログ
      return NextResponse.json({ error: `JSON parsing error: ${errorMessage}` }, { status: 500 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[/api/user-inspiration] APIエラー: ${errorMessage}`); // キャッチされたエラーのログ
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
} 