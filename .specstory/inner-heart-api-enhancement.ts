// 💖 内心・本心分析機能 - APIエンドポイント強化

/**
 * 既存のenhanced-impression APIに内心分析機能を追加
 * ファイル: /api/inner-heart-analysis/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Character {
  name: string;
  personality?: string;
  occupation?: string;
  tags?: string[];
}

interface InnerHeartImpression {
  title: string;
  content: string;
  perspective: string;
  emotionalDepth: number; // 1-10の感情深度
  hiddenEmotion: string;  // 隠された感情
  innerThought: string;   // 内心の声
  wordCount: number;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, character, sessionTitle, apiKey } = await request.json();

    // 会話が短すぎる場合のチェック
    if (messages.length < 3) {
      return NextResponse.json({
        success: true,
        impressions: [{
          title: '内心準備中',
          content: '会話がもう少し続いたら、キャラクターの内心をより深く分析できます。もう少しお話ししてください...',
          perspective: '初期段階',
          emotionalDepth: 1,
          hiddenEmotion: '好奇心',
          innerThought: 'この人とのお話、どんな風になっていくのかな...',
          wordCount: 0
        }]
      });
    }

    // 会話内容を整理
    const conversationText = messages
      .slice(-10) // 最新10件
      .map((msg: Message) => `${msg.role === 'user' ? 'ユーザー' : character?.name || 'キャラクター'}: ${msg.content}`)
      .join('\n\n');

    // 💝 内心・本心分析特化プロンプト
    const innerHeartPrompt = `あなたは恋愛心理学の専門家です。以下の会話からキャラクターの内心と本音を深く分析してください。

【会話タイトル】: ${sessionTitle || '新しいチャット'}
【キャラクター】: ${character?.name || 'AI'}
【キャラクター情報】: ${character?.personality || ''} ${character?.occupation || ''} ${character?.tags?.join(', ') || ''}

【会話内容】:
${conversationText}

【内心・本心分析の指示】:
キャラクターの心の奥にある本当の気持ちを3つの深層から分析してください：

1. 💭 **内心の声**: 表面には出さない心の中のつぶやき
2. 💕 **隠れた感情**: 恥ずかしくて言えない本当の気持ち  
3. 🤫 **潜在的本音**: 無意識レベルでの相手への想い

【重要な分析ポイント】:
- キャラクターが「本当は何を感じているか」
- 発言の裏にある「言葉にできない感情」
- ユーザーに対する「秘めた想い」
- 会話中の「心の動き」や「感情の変化」
- 「建前と本音のギャップ」

【必要な要素】:
- emotionalDepth: 1-10の感情深度（1=表面的、10=深層心理）
- hiddenEmotion: 隠している感情（一言で）
- innerThought: 内心の声（「...」形式で）

以下のJSON形式で応答してください：

{
  "impressions": [
    {
      "title": "内心のタイトル（10文字以内）",
      "content": "200字程度の内心分析",
      "perspective": "内心の声・隠れた感情・潜在的本音のいずれか",
      "emotionalDepth": 1-10の数値,
      "hiddenEmotion": "隠された感情",
      "innerThought": "内心のつぶやき",
      "wordCount": 文字数
    },
    {
      "title": "別の内心タイトル",
      "content": "200字程度の異なる視点の内心分析",
      "perspective": "異なる視点",
      "emotionalDepth": 1-10の数値,
      "hiddenEmotion": "隠された感情",
      "innerThought": "内心のつぶやき", 
      "wordCount": 文字数
    },
    {
      "title": "さらに別の内心タイトル",
      "content": "200字程度のさらに異なる視点の内心分析",
      "perspective": "さらに異なる視点",
      "emotionalDepth": 1-10の数値,
      "hiddenEmotion": "隠された感情",
      "innerThought": "内心のつぶやき",
      "wordCount": 文字数
    }
  ]
}

JSON形式以外は出力しないでください。`;

    // Gemini API呼び出し
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: innerHeartPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.9, // 創造性を高める
          topP: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: "text/plain"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from Gemini API');
    }

    // JSON解析
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedText);

      return NextResponse.json({
        success: true,
        impressions: result.impressions,
        generatedAt: Date.now(),
        type: 'inner-heart' // 内心分析タイプ
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', text);
      
      // フォールバック: ロマンティックな内心分析
      const fallbackImpressions = [
        {
          title: '秘めた想い',
          content: 'この会話を通じて、キャラクターの心の奥には言葉にできない特別な感情が芽生えているようです。表面的な会話の裏で、相手への好奇心や親しみが静かに育っているのが感じられます。',
          perspective: '内心の声',
          emotionalDepth: 6,
          hiddenEmotion: '好奇心と親しみ',
          innerThought: 'この人ともっとお話ししたいな...',
          wordCount: 98
        },
        {
          title: '隠れた喜び',
          content: 'キャラクターは表情には出さないものの、心の中では会話を楽しんでいる様子が伺えます。相手の反応一つ一つに内心で小さな喜びを感じ、次の言葉を待ち望んでいるのかもしれません。',
          perspective: '隠れた感情',
          emotionalDepth: 5,
          hiddenEmotion: '楽しさ',
          innerThought: 'なんだか嬉しいな、こんな気持ち...',
          wordCount: 89
        },
        {
          title: '未来への想い',
          content: '会話が続くにつれて、キャラクターの心の中では「この関係がどうなっていくのだろう」という期待と少しの不安が混在しています。相手との距離感を慎重に測りながらも、より深いつながりを求めている気持ちが見え隠れします。',
          perspective: '潜在的本音',
          emotionalDepth: 7,
          hiddenEmotion: '期待と不安',
          innerThought: 'もっと仲良くなれたらいいのに...',
          wordCount: 124
        }
      ];

      return NextResponse.json({
        success: true,
        impressions: fallbackImpressions,
        generatedAt: Date.now(),
        type: 'inner-heart',
        fallback: true
      });
    }

  } catch (error) {
    console.error('Inner heart analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '内心分析に失敗しました'
    }, { status: 500 });
  }
}
