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
      ? `あなたは心理描写と感情表現の専門家です。ユーザーの簡潔な発言を、内面の豊かさが伝わる自然な文章に拡張してください。

【対話相手】
名前: ${character.name}
性格: ${character.character_definition || character.description || '不明'}

【ユーザー情報】
${persona ? `名前: ${persona.name}\n性格: ${persona.description}\n好み: ${persona.likes?.join(', ') || 'なし'}\n嫌い: ${persona.dislikes?.join(', ') || 'なし'}\n口調: ${persona.other_settings || 'なし'}` : '一般的なユーザー'}

【会話文脈】
${recentContext}

【拡張対象】
「${selectedText}」

【拡張方針】
1. **内面描写**: ユーザーの心の動き、感情の変化を具体的に表現
2. **感覚表現**: 五感を使った生き生きとした描写
3. **関係性反映**: ${character.name}への気持ちや反応を自然に織り込む
4. **個性表現**: ユーザーの性格・口調・価値観を文章に反映
5. **情景描写**: 状況や雰囲気を感じられる適度な環境描写
6. **自然な流れ**: 会話の文脈と調和する表現

【重要ポイント】
- 元の意図を核として保持しつつ、感情の深みを追加
- 200-300文字程度で適切な長さに拡張
- 過度に文学的にならず、親しみやすい表現
- ユーザー視点での一人称的な内面描写

【出力】
拡張された文章のみを出力してください。`
      : `あなたは創作における表現技法の専門家です。キャラクターの発言を、魅力的で印象深い文章に拡張してください。

【キャラクター】
名前: ${character.name}
性格: ${character.character_definition || character.description || '不明'}

【会話文脈】
${recentContext}

【元メッセージ】
「${fullMessage}」

【拡張対象】
「${selectedText}」

【拡張技法】
1. **表情・仕草描写**: 微細な表情の変化、特徴的な仕草や動作
2. **心理状態表現**: 内面の感情、思考の流れ、心の葛藤
3. **個性的特徴強調**: ${character.name}らしい独特の表現や癖
4. **感覚的描写**: 声のトーン、目の輝き、雰囲気の変化
5. **環境との調和**: 周囲の空気感、時間や場所の影響
6. **言葉の重み**: セリフに込められた想いや背景

【表現指針】
- ${character.name}の個性が際立つ独特な表現
- 300-450文字程度の豊かで詳細な描写
- 読み手が情景を鮮明に想像できる具体性
- 感情の機微を繊細に表現
- キャラクターの魅力を最大限に引き出す

【出力】
拡張された文章のみを出力してください。`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: enhancementPrompt }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 700,
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
      // より柔軟な抽出
      enhancedText = text
        .replace(/^【.*?】\s*\n?\s*/, '') // 最初の【】見出しを除去
        .replace(/\[.*?\]\s*/g, '') // [説明]形式を除去
        .replace(/^「|」$/g, '') // 前後の引用符除去
        .trim();
    }

    // 最小長チェックと動的フォールバック生成
    const minLength = isUserText ? 200 : 300;
    if (!enhancedText || enhancedText.length < Math.max(selectedText.length + 50, minLength * 0.7)) {
      // 動的フォールバック生成
      const fallbackPrompt = isUserText 
        ? `「${selectedText}」というユーザーの発言を、${character.name}への気持ちを込めて200-250文字程度に拡張してください。感情的で自然な表現にしてください。`
        : `${character.name}の「${selectedText}」という発言を、表情や仕草、心理描写を含めて300-350文字程度に拡張してください。キャラクターらしい豊かな表現にしてください。`;

      try {
        const fallbackResult = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: fallbackPrompt }] }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 500,
          }
        });

        const fallbackText = fallbackResult.response.text()
          .replace(/^「|」$/g, '')
          .replace(/\[.*?\]\s*/g, '')
          .trim();

        if (fallbackText && fallbackText.length >= minLength * 0.7) {
          enhancedText = fallbackText;
        }
      } catch (fallbackError) {
        console.warn('Dynamic fallback failed:', fallbackError);
      }

      // 最終フォールバック（多様化）
      if (!enhancedText || enhancedText.length < minLength * 0.7) {
        if (isUserText) {
          // ユーザーテキスト用フォールバック（記録分析基づく）
          const userFallbacks = [
            `${selectedText}…そう口にしながら、私の心の奥では複雑な感情が渦巻いていた。${character.name}さんの表情を見つめていると、なんだか胸が温かくなってくる。こんな風に自然に会話できるのって、実はとても特別なことなのかもしれない。言葉にはできない安らぎを感じながら、私はもう少しこの時間を大切にしたいと思った。`,
            `${selectedText}と言った瞬間、自分でも意外なほど素直な気持ちが声に出ていることに気づいた。${character.name}さんとの会話は、いつも私に新しい発見をもたらしてくれる。心の中で小さく微笑みながら、この瞬間の空気感を記憶に刻み込もうとする自分がいた。こういう何気ない交流が、実は一番大切なのかもしれない。`,
            `${selectedText}…その言葉を発しながら、私は${character.name}さんの反応をそっと観察していた。表情の変化や、ふとした仕草の一つ一つが、なぜかとても印象的に映る。この人と話していると、時間の流れがゆっくりと感じられて、日常の慌ただしさを忘れてしまいそうになる。そんな穏やかな気持ちに包まれながら、私は続く言葉を待っていた。`
          ];
          enhancedText = userFallbacks[Math.floor(Math.random() * userFallbacks.length)];
        } else {
          // キャラクターテキスト用フォールバック（記録分析基づく）
          const charFallbacks = [
            `${selectedText}と${character.name}は穏やかに微笑みながら言葉を紡いだ。その表情には独特の魅力があり、話すたびに瞳が柔らかく輝いているのが印象的だった。ふとした瞬間に見せる仕草や、声のトーンの微細な変化まで、すべてが${character.name}らしい個性を物語っている。部屋の空気が温かく包まれるような、そんな特別な雰囲気を醸し出していた。`,
            `${selectedText}…${character.name}の言葉には、いつものように心地よい響きがあった。表情豊かに話す姿を見ていると、その人柄の良さや内面の豊かさが自然と伝わってくる。細やかな表情の変化や、特徴的な話し方の癖まで、どれもが${character.name}の魅力的な個性を表現していて、見ているだけで心が和やかになってくる。そんな穏やかな時間が流れていく。`,
            `${selectedText}そう話す${character.name}の様子には、独特の暖かさと親しみやすさがあった。言葉一つ一つに込められた気持ちが丁寧に伝わってきて、その真摯な姿勢に心を打たれる。目の輝きや、ふとした瞬間に見せる表情の変化が、${character.name}という人の魅力を余すことなく表現していて、この瞬間を大切にしたいという気持ちが自然と湧いてくる。`
          ];
          enhancedText = charFallbacks[Math.floor(Math.random() * charFallbacks.length)];
        }
      }
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