import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

if (!GEMINI_API_KEY) {
  console.warn('[enhance-text] GEMINI_API_KEY が設定されていません');
}

export async function POST(request: NextRequest) {
  try {
    const { text, character, context } = await request.json();
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'テキストが提供されていません'
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 1000,
      }
    });

    // キャラクター情報を構築
    const characterInfo = character ? `
【キャラクター情報】
名前: ${character.name}
性格: ${character.personality || ''}
話し方: ${character.speaking_style || ''}
職業: ${character.occupation || ''}
` : '';

    // 会話コンテキストを構築
    const conversationContext = context && context.length > 0 ? `
【会話コンテキスト】
${context.slice(-3).map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'ユーザー' : character?.name || 'キャラクター'}: ${msg.content}`).join('\n')}
` : '';

    const prompt = `以下のテキストを、より魅力的で表現豊かな文章に強化してください。

${characterInfo}
${conversationContext}

【元のテキスト】
${text}

【強化の方向性】
以下の要素を考慮して、3つの異なるバリエーションを生成してください：

1. **感情表現の強化**: 感情や気持ちをより具体的に表現
2. **詳細描写の追加**: 状況やBackground
をより詳しく説明
3. **個性の反映**: キャラクターの性格や話し方を活かした表現
4. **会話の自然さ**: 文脈に沿った自然な流れ
5. **表現の多様性**: 同じ内容でも異なる表現方法

【要求する出力形式】
以下のJSON形式で応答してください：

{
  "enhancedVersions": [
    {
      "title": "感情重視版",
      "content": "強化されたテキスト1",
      "description": "感情表現を豊かにしたバージョン",
      "improvements": ["感情の具体化", "共感の表現", "気持ちの伝達"]
    },
    {
      "title": "詳細描写版", 
      "content": "強化されたテキスト2",
      "description": "状況やBackgroundを詳しく説明したバージョン",
      "improvements": ["状況の具体化", "Backgroundの説明", "文脈の明確化"]
    },
    {
      "title": "個性表現版",
      "content": "強化されたテキスト3", 
      "description": "キャラクターの個性を活かしたバージョン",
      "improvements": ["性格の反映", "話し方の特徴", "個性の表現"]
    }
  ]
}

【重要な指示】
- 元のテキストの意図や内容は保持してください
- 各バージョンは異なるアプローチで強化してください
- キャラクターの設定がある場合は、その個性を反映してください
- 会話の流れを考慮して自然な表現にしてください
- 過度に長くならないよう適切な長さに調整してください

JSON形式以外は出力しないでください。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    try {
      const data = JSON.parse(responseText);
      
      // 各バージョンの文字数を計算
      const enhancedVersionsWithStats = data.enhancedVersions.map((version: { content: string; [key: string]: unknown }) => ({
        ...version,
        originalLength: text.length,
        enhancedLength: version.content.length,
        improvementRatio: Math.round((version.content.length / text.length) * 100)
      }));

      return NextResponse.json({
        success: true,
        originalText: text,
        enhancedVersions: enhancedVersionsWithStats
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', text);
      
      // フォールバック: 基本的な強化を生成
      const fallbackVersions = [
        {
          title: "感情重視版",
          content: `${text} この気持ちを大切にしたいと思います。`,
          description: "感情表現を豊かにしたバージョン",
          improvements: ["感情の具体化", "共感の表現"],
          originalLength: text.length,
          enhancedLength: text.length + 15,
          improvementRatio: Math.round(((text.length + 15) / text.length) * 100)
        },
        {
          title: "詳細描写版",
          content: `現在の状況を考えると、${text} ということがより明確になります。`,
          description: "状況やBackgroundを詳しく説明したバージョン", 
          improvements: ["状況の具体化", "Backgroundの説明"],
          originalLength: text.length,
          enhancedLength: text.length + 25,
          improvementRatio: Math.round(((text.length + 25) / text.length) * 100)
        },
        {
          title: "個性表現版",
          content: `${text} これは私らしい考え方だと思います。`,
          description: "キャラクターの個性を活かしたバージョン",
          improvements: ["性格の反映", "個性の表現"],
          originalLength: text.length,
          enhancedLength: text.length + 20,
          improvementRatio: Math.round(((text.length + 20) / text.length) * 100)
        }
      ];

      return NextResponse.json({
        success: true,
        originalText: text,
        enhancedVersions: fallbackVersions
      });
    }
  } catch (error) {
    console.error('Text enhancement error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'テキスト強化に失敗しました'
    }, { status: 500 });
  }
} 