import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

if (!GEMINI_API_KEY) {
  console.warn('[enhanced-impression] GEMINI_API_KEY が設定されていません');
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Character {
  name: string;
  personality?: string;
  occupation?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('Enhanced impression API called');
    
    const { messages, character, sessionTitle } = await request.json();
    console.log('Messages count:', messages?.length);
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'メッセージが見つかりません'
      }, { status: 400 });
    }

    // メッセージが少なすぎる場合
    if (messages.length < 3) {
      return NextResponse.json({
        success: true,
        impressions: [
          {
            title: '会話開始',
            content: '会話がまだ短いため、詳細なインプレッションを生成するには十分な内容がありません。もう少し会話を続けてください。',
            perspective: '初期段階',
            wordCount: 0
          },
          {
            title: '準備中',
            content: 'キャラクターとの会話が始まったばかりです。より深い交流を通じて、お互いの理解を深めていきましょう。',
            perspective: '関係性',
            wordCount: 0
          },
          {
            title: '期待',
            content: 'これからどんな会話が展開されるか楽しみです。キャラクターの個性や魅力を発見できる時間になることを期待しています。',
            perspective: '未来展望',
            wordCount: 0
          }
        ]
      });
    }
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7, // 創造性を重視
        topP: 0.9,
        maxOutputTokens: 2000,
      }
    });

    // 会話履歴を整理
    const conversationText = messages
      .map((msg: ChatMessage) => `${msg.role === 'user' ? 'ユーザー' : character?.name || 'キャラクター'}: ${msg.content}`)
      .join('\n\n');

    const prompt = `以下の会話を3つの異なる視点から分析して、それぞれ200字程度のインプレッションを生成してください。

【会話タイトル】: ${sessionTitle || '新しいチャット'}
【キャラクター】: ${character?.name || 'AI'}
【キャラクター情報】: ${character?.personality || ''} ${character?.occupation || ''} ${character?.tags?.join(', ') || ''}

【会話内容】:
${conversationText}

【要求するインプレッション形式】:
以下のJSON形式で応答してください：

{
  "impressions": [
    {
      "title": "インプレッションのタイトル（10文字以内）",
      "content": "200字程度のインプレッション内容",
      "perspective": "視点の説明（例：感情面、関係性、成長など）",
      "wordCount": 文字数
    },
    {
      "title": "インプレッションのタイトル（10文字以内）",
      "content": "200字程度のインプレッション内容",
      "perspective": "視点の説明（例：感情面、関係性、成長など）",
      "wordCount": 文字数
    },
    {
      "title": "インプレッションのタイトル（10文字以内）",
      "content": "200字程度のインプレッション内容",
      "perspective": "視点の説明（例：感情面、関係性、成長など）",
      "wordCount": 文字数
    }
  ]
}

【視点のバリエーション例】:
1. 感情面: 会話を通じて感じた感情や雰囲気
2. 関係性: ユーザーとキャラクターの関係性の変化
3. 成長: 会話を通じた成長や変化
4. 個性: キャラクターの個性や特徴の発見
5. 価値観: 会話から見える価値観や考え方
6. 未来展望: 今後の関係性や会話の可能性
7. 共感: 共感できる部分や理解
8. 発見: 新しく発見したことや気づき

【重要な指示】:
- 各インプレッションは200字程度（180-220字）にしてください
- 3つの異なる視点から分析してください
- キャラクターの個性や特徴を活かしてください
- 会話の流れや感情の変化を捉えてください
- ユーザーが共感できる内容にしてください
- 客観的かつ温かみのある表現を使用してください

JSON形式以外は出力しないでください。`;

    console.log('Sending enhanced impression request to Gemini');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini response:', text);

    try {
      // JSONパースを試行
      const data = JSON.parse(text);
      
      // 文字数を正確に計算
      const impressionsWithWordCount = data.impressions.map((impression: any) => ({
        ...impression,
        wordCount: impression.content.length
      }));

      return NextResponse.json({
        success: true,
        impressions: impressionsWithWordCount,
        generatedAt: Date.now()
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', text);
      
      // フォールバック: 基本的なインプレッションを生成
      const fallbackImpressions = [
        {
          title: '会話の印象',
          content: 'この会話を通じて、キャラクターの個性や魅力がよく表れていました。自然な流れで楽しい時間を過ごすことができ、お互いの理解が深まったように感じます。',
          perspective: '全体的な印象',
          wordCount: 89
        },
        {
          title: '関係性の変化',
          content: '会話を重ねるごとに、より親密で自然な関係性が築かれているのが感じられます。キャラクターの反応やユーザーの関心が良いバランスで保たれ、心地よい交流が続いています。',
          perspective: '関係性の発展',
          wordCount: 98
        },
        {
          title: '今後の期待',
          content: 'これまでの会話の積み重ねにより、より深い話題や新しい発見が期待できる関係性が育まれています。キャラクターの個性を活かした楽しい会話が続くことを楽しみにしています。',
          perspective: '未来への期待',
          wordCount: 95
        }
      ];

      return NextResponse.json({
        success: true,
        impressions: fallbackImpressions,
        generatedAt: Date.now()
      });
    }
  } catch (error) {
    console.error('Enhanced impression generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'インプレッション生成に失敗しました'
    }, { status: 500 });
  }
} 