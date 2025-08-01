import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion as callOpenRouter } from '../../../../lib/openRouter'; // OpenRouterをインポート

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''; // 削除

// if (!GEMINI_API_KEY) { // 削除
//   console.warn('[enhance-text] GEMINI_API_KEY が設定されていません');
// }

export async function POST(request: NextRequest) {
  try {
    const { text, character, context, variantCount = 1, settings, isUserText = false } = await request.json();
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'テキストが提供されていません'
      }, { status: 400 });
    }

    // 設定画面を優先でAPIキーを取得
    const openRouterApiKey = settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY; // 設定画面を優先
    
    if (!openRouterApiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenRouter APIキーが設定されていません'
      }, { status: 500 });
    }

    const modelToUse = settings?.model || 'anthropic/claude-sonnet-4'; // OpenRouterモデル

    // const genAI = new GoogleGenerativeAI(apiKey); // 削除
    // const model = genAI.getGenerativeModel({ // 削除
    //   model: 'gemini-1.5-flash',
    //   generationConfig: {
    //     temperature: 0.8,
    //     topP: 0.9,
    //     maxOutputTokens: variantCount === 1 ? 500 : 1000,
    //   }
    // });

    // 設定画面のプロンプトを使用、デフォルトプロンプトをフォールバック
    const customPrompt = settings?.enhancementPrompt;
    console.log('[/api/enhance-text] カスタムプロンプト確認:', {
      hasCustomPrompt: !!customPrompt,
      customPromptLength: customPrompt?.length || 0,
      customPromptPreview: customPrompt?.substring(0, 100) + '...'
    });
    const basePrompt = customPrompt || `以下のテキストをより魅力的で自然な表現に改善してください。

【改善のポイント】
- より自然で読みやすい文章にする
- 感情や意図をより明確に表現する
- 会話の流れに合った表現にする
- 魅力的で印象的な表現にする

【入力テキスト】
${text}

【改善されたテキスト】`;

    // キャラクター情報を構築
    const characterInfo = character ? `
【キャラクター情報】
名前: {{char}}
性格: ${character.personality || ''}
話し方: ${character.speaking_style || ''}
職業: ${character.occupation || ''}
` : '';

    // 会話コンテキストを構築
    const conversationContext = context && context.length > 0 ? `
【会話コンテキスト】
${context.slice(-3).map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'ユーザー' : character?.name || 'キャラクター'}: ${msg.content}`).join('\n')}
` : '';

    if (variantCount === 1) {
      // シンプル高速版（1本のみ）
      const simplePrompt = isUserText ? 
        `${basePrompt}

${conversationContext}

【重要な指示】
- 元のテキストの意図や内容は保持してください
- ユーザーとして自然で魅力的な表現にしてください
- 会話の流れを考慮して自然な表現にしてください
- 大幅に強化して魅力的にしてください
- JSON形式ではなく、強化されたテキストのみを返してください
- 遠慮せずに魅力的で面白い表現にしてください
**- {{char}}のセリフや行動は絶対に含めないでください。**
**- 強化された文章は必ず元のテキストの内容に関連付けてください。**

強化されたテキスト:` :
        `${basePrompt}

${characterInfo}
${conversationContext}

【重要な指示】
- 元のテキストの意図や内容は保持してください
- キャラクターの設定がある場合は、その個性を反映してください
- 会話の流れを考慮して自然な表現にしてください
- 過度に長くならないよう適切な長さに調整してください
- JSON形式ではなく、強化されたテキストのみを返してください
**- {{char}}のセリフや行動は絶対に含めないでください。**
**- 強化された文章は必ず元のテキストの内容に関連付けてください。**

強化されたテキスト:`;

      // OpenRouter API呼び出し
      const enhancedText = await callOpenRouter({
        apiKey: openRouterApiKey,
        model: modelToUse,
        messages: [{ role: 'user', content: simplePrompt }],
        temperature: 0.8,
        maxTokens: variantCount === 1 ? 500 : 1000,
      });
      // --- 余計なヘッダー行を除去 ---
      const delimiter = '強化されたテキスト:';
      const finalText = enhancedText.includes(delimiter)
        ? enhancedText.split(delimiter).pop()?.trim() || enhancedText.trim()
        : enhancedText.trim();

      return NextResponse.json({
        success: true,
        originalText: text,
        enhancedText: finalText
      });
    } else {
      // 従来の3バリエーション版
      const detailedPrompt = `以下のテキストを、より魅力的で表現豊かな文章に強化してください。

${characterInfo}
${conversationContext}

【元のテキスト】
${text}

【強化の方向性】
以下の要素を考慮して、3つの異なるバリエーションを生成してください：

1. **感情表現の強化**: 感情や気持ちをより具体的に表現
2. **詳細描写の追加**: 状況やBackgroundをより詳しく説明
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
**- {{char}}のセリフや行動は絶対に含めないでください。**
**- 強化された文章は必ず元のテキストの内容に関連付けてください。**

JSON形式以外は出力しないでください。`;

      const openRouterResponseText = await callOpenRouter({
        apiKey: openRouterApiKey,
        model: modelToUse,
        messages: [{ role: 'user', content: detailedPrompt }],
        temperature: 0.8,
        maxTokens: variantCount === 1 ? 500 : 1000,
      });
      const responseText = openRouterResponseText; // OpenRouterからの応答を使用

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
          console.error('Raw response:', responseText);
        
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
    }
  } catch (error) {
    console.error('Text enhancement error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'テキスト強化に失敗しました'
    }, { status: 500 });
  }
} 