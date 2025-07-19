import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/* eslint-disable @typescript-eslint/no-explicit-any */

const SERVER_GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

// --- インスタンスキャッシュ（APIキーごと） ---
const genAiCache = new Map<string, GoogleGenerativeAI>();
function getGenAI(key: string) {
  if (!genAiCache.has(key)) {
    genAiCache.set(key, new GoogleGenerativeAI(key));
  }
  return genAiCache.get(key)!;
}

interface Message {
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const {
      character,
      persona,
      conversation,
      settings
    } = await req.json();

    const apiKey = (settings?.geminiApiKey as string) || SERVER_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Gemini API key not configured' 
      }, { status: 500 });
    }

    if (!character) {
      return NextResponse.json({ 
        success: false, 
        error: 'Character not specified' 
      }, { status: 400 });
    }

    const genAI = getGenAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: settings?.model || 'gemini-2.0-flash-exp'
    });

    // 会話履歴を構築（直近5~8件）
    const recentConversation = (conversation || [])
      .slice(-15)
      .map((msg: Message) => {
        const speaker = msg.role === 'user' ? 
          (persona?.name || 'ユーザー') : character.name;
        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    // 最後のキャラクターメッセージを取得
    const lastCharacterMessage = conversation && conversation.length > 0 
      ? [...conversation].reverse().find((msg: Message) => msg.role === 'assistant')?.content || ''
      : '';

    // ユーザーインスピレーション用プロンプト（多様性強化版）
    const inspirationPrompt = `あなたは創作的で多様なユーザー返信を提案する専門AIです。毎回全く異なる語彙・構文・発想を使って、重複表現を完全に避けたバリエーション豊かな候補を生成してください。

【キャラクター情報】
名前: ${character.name}
性格・特徴: ${character.character_definition || character.description || '不明'}

【ユーザー情報】
${persona ? `名前: ${persona.name}\n性格: ${persona.description}\n好み: ${persona.likes?.join(', ') || 'なし'}\n苦手: ${persona.dislikes?.join(', ') || 'なし'}\n口調・特徴: ${persona.other_settings || 'なし'}` : '一般的なユーザー（名前なし）'}

【最新のキャラクター発言】
「${lastCharacterMessage}」

【会話の文脈】
${recentConversation}

【重要指示】
以下の3つの異なるアプローチで、それぞれ全く違う種類の返信を作成してください：

1. 感情・心理重視（驚き、興味、共感、疑問など）
2. 行動・提案重視（具体的な行動や提案、体験談など）
3. 関係性・対話重視（相手への関心、質問、会話発展など）

【多様性要求】
- 過去の出力パターンと意図的に異なる語彙を選択
- 文体・語尾・表現方法を候補ごとに変える
- 定型文・常套句を避け、創造的な表現を優先
- 同じ意味でも違う言い回しを徹底

【要件】
- 各候補50-70文字程度
- 3つとも完全に異なるアプローチとトーン
- ユーザーの性格・口調を反映
- 会話を自然に発展させる内容
- ${character.name}との関係性に適した親しみ度

【禁止語】
「そうなんですね」「なるほど」「詳しく聞かせて」「${character.name}さんらしい答えですね」

【出力例】
[
  "それは斬新な視点ですね！どうしてそう思われたのか興味津々です",
  "へぇ！思わず目から鱗でした。私も試してみたいのでコツを教えて下さい",
  "たしかに一理ありますね。じゃあ次はこういう案はどうでしょう？"
]

【出力フォーマット（厳守）】
JSON配列のみを出力してください。例：
[
  "候補1の文章",
  "候補2の文章",
  "候補3の文章"
]
`;

    const requestPayload: any = {
      contents: [{ role: 'user', parts: [{ text: inspirationPrompt }] }],
      generationConfig: {
        temperature: 1.8, // 多様性を大幅向上
        topP: 0.95,
        topK: 80, // より広い語彙選択
        maxOutputTokens: 400,
        candidateCount: 3
      }
    };

    const result = await model.generateContent(requestPayload);

    // Gemini SDK は result.response.candidates に Content オブジェクト配列を返す
    let candidates: string[] = [];
    try {
      const res: any = result.response as any;
      if (res?.candidates) {
        candidates = res.candidates
          .map((cand: any) => cand.content?.parts?.[0]?.text || '')
          .map((c: string) => c.trim())
          .filter((c: string) => c.length > 0);
      }
    } catch (e) {
      console.warn('candidate parse error', e);
    }

    if (candidates.length === 0) {
      // 動的フォールバック生成（従来ロジック）
      const dynamicFallbackPrompt = `${character.name}というキャラクターとの会話で、ユーザーが使いそうな自然な返事を3つ、それぞれ50-70文字で作成してください。

【禁止語】「そうなんですね」「なるほど」「詳しく聞かせて」

キャラクター: ${character.name}
最新発言: "${lastCharacterMessage || '始めまして！'}"

候補1: [返事1]
候補2: [返事2] 
候補3: [返事3]`;

      try {
        const fallbackResult = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: dynamicFallbackPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            topP: 0.9,
            maxOutputTokens: 300,
          }
        });

        const fallbackText = fallbackResult.response.text();
        const fallbackCandidates = fallbackText
          .split(/候補[123]:\s*/)
          .slice(1)
          .map(candidate => candidate.trim())
          .map(candidate => candidate.replace(/^\[.*?\]\s*/, ''))
          .map(candidate => candidate.replace(/^「|」$/g, ''))
          .filter(candidate => candidate.length > 0);

        if (fallbackCandidates.length > 0) {
          return NextResponse.json({
            success: true,
            candidates: fallbackCandidates.slice(0, 3)
          });
        }
      } catch (fallbackError) {
        console.warn('Dynamic fallback failed:', fallbackError);
      }

      // 最終フォールバック（多様化された静的候補）
      const staticFallbackCandidates = lastCharacterMessage.length > 0 ? [
        `そうなんですね！${character.name}さんの考え方、とても興味深いです`,
        `なるほど、そういう風に思っていらっしゃるんですね`,
        `${character.name}さんらしい答えですね！もう少し詳しく聞かせてください`
      ] : [
        `${character.name}さん、こんにちは！今日はどんなお話をしましょうか？`,
        `初めまして！${character.name}さんとお話しできて嬉しいです`,
        `よろしくお願いします。${character.name}さんのことをもっと知りたいです`
      ];
      
      return NextResponse.json({
        success: true,
        candidates: staticFallbackCandidates
      });
    }

    return NextResponse.json({
      success: true,
      candidates: candidates.slice(0, 3) // 最大3つまで
    });

  } catch (error) {
    console.error('User inspiration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate user inspiration' 
    }, { status: 500 });
  }
} 