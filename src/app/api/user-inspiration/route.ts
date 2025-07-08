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
      .slice(-8)
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

    // ユーザーインスピレーション用プロンプト
    const inspirationPrompt = `あなたは自然な会話を生成するAIです。以下の状況で、ユーザーが返信しそうな自然で個性的な応答を3つ生成してください。

【キャラクター】${character.name}
${character.character_definition || character.description || ''}

【ユーザー設定】
${persona ? `${persona.name}: ${persona.description}` : '一般的なユーザー'}

【最新のキャラクター発言】
「${lastCharacterMessage}」

【会話の流れ】
${recentConversation}

【生成ルール】
- 会話の文脈に沿った自然な返事
- 20-80文字程度の適度な長さ
- 3つとも異なる感情・アプローチ（興味深々/共感/質問など）
- 日本語の自然な話し言葉
- キャラクターとの関係性を考慮

以下の形式で出力してください：

候補1: [ここに返信候補1]
候補2: [ここに返信候補2]  
候補3: [ここに返信候補3]`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: inspirationPrompt }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.9,
        maxOutputTokens: 300,
      }
    });

    const response = await result.response;
    const text = response.text();

    // "候補N:" の形式から候補を抽出
    const candidates = text
      .split(/候補[123]:\s*/)
      .slice(1) // 最初の空要素を除去
      .map(candidate => candidate.trim())
      .map(candidate => candidate.replace(/^\[.*?\]\s*/, '')) // [ここに〜]部分を除去
      .map(candidate => candidate.replace(/^「|」$/g, '')) // 引用符を除去
      .filter(candidate => candidate.length > 0);

    if (candidates.length === 0) {
      // フォールバック候補
      const fallbackCandidates = lastCharacterMessage.length > 0 ? [
        `それって${character.name}らしいね！`,
        'へぇ、初めて知った',
        'どうしてそう思うの？',
        'わあ、すごいなあ',
        'もう少し聞かせて？',
        'そういうことだったんだ'
      ].slice(0, 3) : [
        'よろしくお願いします！',
        'どんなお話をしましょうか？',
        '楽しみにしてます'
      ];
      return NextResponse.json({
        success: true,
        candidates: fallbackCandidates
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