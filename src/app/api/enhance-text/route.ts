import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion as callOpenRouter } from '../../../../lib/openRouter'; // OpenRouterをインポート

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''; // 削除

// if (!GEMINI_API_KEY) { // 削除
//   console.warn('[enhance-text] GEMINI_API_KEY が設定されていません');
// }

export async function POST(request: NextRequest) {
  try {
    const { text, character, context, variantCount = 11, settings, isUserText = false } = await request.json();
    
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
    const basePrompt = customPrompt || `# 文章強化プロンプト

あなたは文章表現強化の専門家です。与えられたテキストを、読者が鮮明に情景を想像できる詳細な描写に変換してください。

## 入力情報
- 会話の文脈：{conversationContext}
- 強化対象テキスト：{text}

## 強化指針
1. **内容の保持**：元テキストの意図・場面進行を完全に維持
2. **描写の焦点**：「どのように」という動作の詳細に重点を置く
3. **表現の深化**：五感に訴える具体的で臨場感のある描写を追加
4. **文字数**：100～150文字程度に調整

## 創作設定
- ジャンル：創作フィクション（ファンタジー要素含む）
- 表現レベル：R-18対応

## 出力形式
- 強化されたテキストのみを出力
- 説明文、解説、JSON形式は一切使用しない
- {{char}}の台詞や行動は絶対に追加しない
- {{user}}視点の動作描写のみに集中

以下のテキストを具体的で詳細な行動描写を含む魅力的な表現に改善してください。

【改善のポイント】
- 具体的な動作や仕草を詳しく描写する
- 表情、視線、身体の動きを含める
- 感情や心理状態を行動で表現する
- 臨場感のある描写にする
- 会話に合わせた自然な行動を追加する

【入力テキスト】
${text}

【詳細な行動描写を含む改善されたテキスト】`;

    // enhancementPrompt を定義
    const enhancementPrompt = settings?.enhancementPrompt || basePrompt;

    // キャラクター情報を構築
    const characterInfo = character ? `
【キャラクター情報】
名前: {{char}}

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

【元のテキスト】
${text}

${conversationContext}

【重要な指示】
${enhancementPrompt}

強化されたテキスト:` :
        `${basePrompt}

${characterInfo}
${conversationContext}

【重要な指示】
**役割設定**
あなたは行動描写の専門家として、簡潔なテキストを詳細で具体的な行動描写に変換する役割を担います。

**変換指示**
1. **具体的な動作描写**
   - 身体の動き、表情、仕草を詳しく描写
   - 「どのように」行動するかを重点的に表現
   - 手の動き、視線、姿勢の変化を含める

2. **感情の行動表現**
   - 心理状態を身体的な反応で表現
   - 表情、声のトーン、身体の緊張を描写
   - 感情に応じた自然な動作を追加

3. **臨場感のある描写**
   - 五感に訴える要素を追加（音、触感、視覚的詳細）
   - 周囲の環境との相互作用を含める
   - 時間の流れや動作の順序を明確に

**制約事項**
- 元のテキストの意図と内容を完全に保持
- 場面を先に進めすぎない
- 追加の説明や注釈なしで直接出力

詳細な行動描写を含む強化されたテキスト:`;

      // OpenRouter API呼び出し
      const enhancedText = await callOpenRouter({
        apiKey: openRouterApiKey,
        model: modelToUse,
        messages: [{ role: 'user', content: simplePrompt }],
        temperature: 0.8,
        maxTokens: variantCount === 1 ? 1500 : 2000, // thinking系モデル対応で増加
      });
      // --- 強化されたテキストの抽出（thinking系モデル対応） ---
      let finalText = enhancedText.trim();
      
      // 1. 明確な区切り文字で分割
      const delimiters = ['強化されたテキスト:', '詳細な行動描写を含む改善されたテキスト:', '改善されたテキスト:', '強化版:'];
      for (const delimiter of delimiters) {
        if (finalText.includes(delimiter)) {
          const parts = finalText.split(delimiter);
          if (parts.length > 1) {
            finalText = parts[parts.length - 1].trim();
            break;
          }
        }
      }
      
      // 2. thinking系モデルの余計な説明を除去
      const lines = finalText.split('\n');
      const cleanLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && 
               !trimmed.includes('thinking') && 
               !trimmed.includes('analysis') && 
               !trimmed.includes('reasoning') &&
               !trimmed.startsWith('Based on') &&
               !trimmed.startsWith('Looking at') &&
               !trimmed.startsWith('The user') &&
               !/^\([0-9]+\)/.test(trimmed);
      });
      
      if (cleanLines.length > 0) {
        finalText = cleanLines.join('\n').trim();
      }
      
      // 3. 残っている数字パターンを除去
      finalText = finalText.replace(/\([0-9]+\)/g, '').trim();

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
        maxTokens: variantCount === 1 ? 1500 : 2000, // thinking系モデル対応で増加
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