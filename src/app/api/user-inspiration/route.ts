import { NextRequest, NextResponse } from 'next/server';
import { AppSettings } from '../../../../types/app';
import { Character } from '../../../../types/character';
import { chatCompletion } from '../../../../lib/openRouter';
import { GeminiApiManager } from '../../../../lib/geminiApiManager';

export async function POST(req: NextRequest) {
  console.log('[/api/user-inspiration] POSTリクエストを受信しました');
  try {
    const { message, settings, character }: { 
      message: string; 
      settings: AppSettings; 
      character?: Character;
    } = await req.json();

    // 設定画面を優先で取得
    const envApiKey = process.env.OPENROUTER_API_KEY;
    const settingsApiKey = settings?.openRouterApiKey as string | undefined;
    const openRouterApiKey = settingsApiKey || envApiKey;
    
    console.log('[/api/user-inspiration] OpenRouter API Key check:', {
      hasSettingsApiKey: !!settingsApiKey,
      hasEnvApiKey: !!envApiKey,
      settingsApiKeyLength: settingsApiKey?.length || 0,
      envApiKeyLength: envApiKey?.length || 0,
      finalApiKeyLength: openRouterApiKey?.length || 0,
      finalApiKeyStart: openRouterApiKey?.substring(0, 15) || 'none',
      envApiKeyStart: envApiKey?.substring(0, 15) || 'none',
      isProduction: process.env.NODE_ENV === 'production',
      apiKeyFormat: openRouterApiKey?.startsWith('sk-or-v1-') ? 'valid' : 'invalid'
    });
    
    if (!openRouterApiKey) {
      console.warn('[/api/user-inspiration] OpenRouter API Keyが設定されていません');
      return NextResponse.json({ error: 'OpenRouter API Key is not set.' }, { status: 400 });
    }

    // APIキーの形式チェック
    if (!openRouterApiKey.startsWith('sk-or-v1-')) {
      return NextResponse.json({ error: 'OpenRouter APIキーの形式が正しくありません。' }, { status: 400 });
    }

    const model = settings?.model || 'openai/gpt-4o-mini';
    
    // インスピレーション用の専用トークン数設定（デフォルト500）
    const inspirationMaxTokens = settings?.inspirationMaxTokens || 1500; // thinking系モデル対応で増加

    console.log(`[/api/user-inspiration] OpenRouterモデル: ${model}`);
    console.log(`[/api/user-inspiration] インスピレーション用トークン数: ${inspirationMaxTokens}`);
    console.log(`[/api/user-inspiration] プロンプトメッセージの長さ: ${message.length}`);
    console.log(`[/api/user-inspiration] キャラクター情報:`, character ? {
      name: character.name,
      personality: character.personality?.substring(0, 100) + '...',
      hasCharacterDefinition: !!character.character_definition
    } : 'なし');

    // キャラクター設定を組み込んだプロンプトを作成
    let characterPrompt = '';
    if (character) {
      characterPrompt = `
あなたは「${character.name}」というキャラクターです。

${character.personality ? `性格: ${character.personality}` : ''}
${character.character_definition ? `キャラクター設定: ${JSON.stringify(character.character_definition)}` : ''}
${character.speaking_style ? `話し方: ${character.speaking_style}` : ''}
${character.scenario ? `シナリオ: ${character.scenario}` : ''}

上記の設定に従って、キャラクターとして自然な返信を生成してください。
`;
    }

    // 設定画面のプロンプトを使用、デフォルトプロンプトをフォールバック
    const customPrompt = settings?.inspirationPrompt;
    console.log('[/api/user-inspiration] カスタムプロンプト確認:', {
      hasCustomPrompt: !!customPrompt,
      customPromptLength: customPrompt?.length || 0,
      customPromptPreview: customPrompt ? customPrompt.substring(0, 100) + '...' : 'なし'
    });
    const basePrompt = customPrompt || `# ユーザー返信生成AI

あなたは自然で魅力的なユーザー返信を生成する専門AIです。与えられた情報を基に、ユーザーが実際に返しそうなリアルな返信を1つ作成してください。

## 入力情報

### キャラクター情報
- **名前**: {{char}}
- **性格・特徴**: {character.character_definition || character.description || '不明'}

### ユーザー情報
- **名前**: {persona.name}
- **性格**: {persona.description}
- **好み**: {persona.likes?.join(', ') || 'なし'}
- **苦手**: {persona.dislikes?.join(', ') || 'なし'}
- **口調・特徴**: {persona.other_settings || 'なし'}

### 会話データ
- **キャラクターの最新発言**: 「{lastCharacterMessage}」
- **直近の会話流れ**: {recentConversation}

## 生成要件

### 必須条件
1. **文字数**: 100～150文字（句読点含む）
2. **口調**: ユーザーの設定された口調・性格を忠実に反映
3. **会話継続**: 自然に会話が発展する内容
4. **関係性**: {{char}}との親しみ度に適した表現
5. **自然性**: 実際の人間が返しそうなリアルな反応

### 避けるべき表現
- 「そうなんですね」「なるほど」
- 「詳しく聞かせて」「教えて」
- 「{{char}}さんらしい」「さすが」
- その他の定型的・機械的な相槌

### 推奨する要素
- ユーザーの個性が表れる独特な反応
- 感情や驚き、興味を自然に表現
- 会話に新しい要素や視点を加える
- キャラクターの発言への具体的な反応や感想

## 出力要件
**返信候補のみを1つ出力してください。説明や解説は不要です。**`;

    const hasConversation = message && message.trim();
    const actionType = hasConversation ? '会話に適した返信' : '初回挨拶';
    const generalActionType = hasConversation ? '返信' : '挨拶';
    
    const prompt = `${characterPrompt}${basePrompt}

${hasConversation ? `会話履歴:\n${message}\n` : ''}
${character ? `「${character.name}」との${actionType}を提案してください。` : `ユーザーが送信できる自然な${generalActionType}を生成してください。`}`;

    // 複数候補を生成（順次リクエスト - レート制限対策）
    const candidateCount = Math.min(settings?.candidateCount || 1, 5); // 最大5個まで
    console.log(`[/api/user-inspiration] ${candidateCount}個の候補を順次生成開始`);
    
    const inspirationTexts: string[] = [];
    
    try {
      for (let i = 0; i < candidateCount; i++) {
        console.log(`[/api/user-inspiration] 候補${i + 1}/${candidateCount}を生成中...`);
        
        try {
          // Gemini API優先システムを使用
          const response = await GeminiApiManager.generateWithPriority(
            [{ role: 'user', content: prompt }],
            {
              model: model,
              maxTokens: inspirationMaxTokens,
              temperature: 0.7,
              openRouterApiKey
            }
          );
          
          if (response.success && response.content && response.content.trim()) {
            inspirationTexts.push(response.content.trim());
            console.log(`[/api/user-inspiration] ✅ 候補${i + 1}生成完了 (${response.provider}): ${response.content.trim().substring(0, 50)}...`);
          } else {
            console.warn(`[/api/user-inspiration] ⚠️ 候補${i + 1}の生成に失敗: ${response.error}`);
          }
          
          // レート制限対策として各リクエスト間に1秒の遅延
          if (i < candidateCount - 1) {
            console.log('[/api/user-inspiration] ⏱️ レート制限対策として1秒待機中...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (candidateError) {
          console.warn(`[/api/user-inspiration] ⚠️ 候補${i + 1}の生成に失敗:`, candidateError);
          // 1つでも成功していれば継続、全て失敗の場合は下でエラーハンドリング
        }
      }
      
      if (inspirationTexts.length === 0) {
        throw new Error('All inspiration candidate requests failed');
      }
      
      console.log(`[/api/user-inspiration] ✅ ${inspirationTexts.length}/${candidateCount}個の候補生成完了`);
      
      return NextResponse.json({ 
        candidates: inspirationTexts,
        directResponse: true 
      });
      
    } catch (error) {
      console.error('[/api/user-inspiration] 候補生成中にエラー:', error);
      return NextResponse.json({ 
        candidates: ["会話の流れを理解できませんでした。もう一度お聞かせください。"],
        fallback: true 
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[/api/user-inspiration] APIエラー: ${errorMessage}`);
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
