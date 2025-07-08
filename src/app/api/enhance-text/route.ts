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

export async function POST(req: NextRequest) {
  try {
    const {
      selectedText,
      fullMessage,
      character,
      persona,
      conversationContext,
      settings,
      isUserText
    } = await req.json();

    const apiKey = (settings?.geminiApiKey as string) || SERVER_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Gemini API key not configured' 
      }, { status: 500 });
    }

    if (!selectedText || !character) {
      return NextResponse.json({ 
        success: false, 
        error: 'Selected text or character not specified' 
      }, { status: 400 });
    }

    const genAI = getGenAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: settings?.model || 'gemini-2.0-flash-exp'
    });

    // 会話文脈を構築（直近5件）
    const recentContext = (conversationContext || [])
      .slice(-5)
      .map((msg: any) => `${msg.role === 'user' ? 'ユーザー' : character.name}: ${msg.content}`)
      .join('\n');

    // 文章強化プロンプト
    const enhancementPrompt = isUserText 
      ? `あなたはユーザーの文章作成アシスタントです。以下の簡潔な文章を、より表現豊かで感情的な文章に拡張してください。

【相手キャラクター】
名前: ${character.name}
設定: ${character.character_definition || character.description || ''}

【ユーザー情報】
${persona ? `名前: ${persona.name}\n説明: ${persona.description}\n好きなもの: ${persona.likes?.join(', ') || 'なし'}\n嫌いなもの: ${persona.dislikes?.join(', ') || 'なし'}\nその他設定: ${persona.other_settings || 'なし'}` : '一般的なユーザー'}

【会話の流れ】
${recentContext}

【ユーザーの簡潔な文章】
「${selectedText}」

【拡張ルール】
1. ユーザー視点での自然な表現に拡張
2. 元の意図・感情を保持しつつ詳細化
3. ${character.name}への感情や反応を含める
4. ユーザーの性格・好み・口調を反映
5. 200-300文字程度に拡張
6. 自然な日本語の話し言葉
7. 過度に文学的にならず、親しみやすい表現
8. 相手との関係性を意識した言葉選び

以下の形式で出力してください：

【拡張文】
[ここに拡張された文章]`
      : `あなたは創作的な文章拡張の専門家です。以下の指示に従って、選択された一文を自然で魅力的な文章に拡張してください。

【キャラクター】
名前: ${character.name}
設定: ${character.character_definition || character.description || ''}

【会話の流れ】
${recentContext}

【元のメッセージ全体】
「${fullMessage}」

【拡張対象の一文】
「${selectedText}」

【拡張ルール】
1. 選択された一文の核となる意味・感情を保持する
2. キャラクターの性格・口調・特徴を反映
3. 感情の動き、心理描写、表情、仕草、環境描写を適切に追加
4. 300-400文字程度に拡張（元の文が短い場合はより詳細に）
5. 会話の流れと自然に繋がるように調整
6. 過度に大げさにせず、自然な範囲で豊かな表現を心がける
7. 日本語の美しい表現を使用

以下の形式で出力してください：

【拡張文】
[ここに拡張された文章]`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: enhancementPrompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 600,
      }
    });

    const response = await result.response;
    const text = response.text();

    // 【拡張文】部分を抽出
    let enhancedText = text;
    const match = text.match(/【拡張文】\s*\n?\s*([^【]*)/);
    if (match && match[1]) {
      enhancedText = match[1].trim();
    } else {
      // フォールバック: 元の形式で返す
      enhancedText = text.replace(/^【拡張文】\s*\n?\s*/, '').trim();
    }

    // 余分な改行や装飾を除去
    enhancedText = enhancedText
      .replace(/^\[.*?\]\s*/, '') // [ここに〜]除去
      .replace(/^「|」$/g, '') // 前後の引用符除去
      .trim();

    if (!enhancedText || enhancedText.length < selectedText.length) {
      // 拡張に失敗した場合のフォールバック
      enhancedText = `${selectedText}。${character.name}の表情には、複雑な感情が浮かんでいた。その言葉の背後にある想いが、空気に静かに響いているようだった。`;
    }

    return NextResponse.json({
      success: true,
      originalText: selectedText,
      enhancedText: enhancedText,
      characterName: character.name
    });

  } catch (error) {
    console.error('Text enhancement error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to enhance text' 
    }, { status: 500 });
  }
} 