import { GoogleGenerativeAI } from '@google/generative-ai';
import { Character, ChatMessage } from '../types/character';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.initialize(apiKey);
    }
  }

  initialize(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateResponse(
    character: Character,
    messages: ChatMessage[],
    userPersona?: string,
    settings?: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini APIが初期化されていません');
    }

    const systemPrompt = this.buildSystemPrompt(character, userPersona);
    const conversationHistory = this.buildConversationHistory(messages);
    
    const prompt = `${systemPrompt}\n\n${conversationHistory}`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: settings?.temperature || 0.7,
          topP: settings?.topP || 0.9,
          maxOutputTokens: settings?.maxTokens || 2048,
        },
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API エラー:', error);
      throw new Error('AIからの応答生成に失敗しました');
    }
  }

  private buildSystemPrompt(character: Character, userPersona?: string): string {
    const { character_definition } = character;
    
    // character_definition が無い（旧形式のキャラ or 不完全データ）の場合は簡易プロンプトにフォールバック
    if (!character_definition) {
      return `あなたは「${character.name}」として振る舞ってください。ユーザーと自然に会話し、キャラクターとして一貫性を保ってください。`;
    }

    let prompt = `あなたは「${character.name}」として振る舞ってください。

## キャラクター設定
**名前**: ${character.name}
**性格**: ${character_definition!.personality.summary}
**外面的性格**: ${character_definition!.personality.external}
**内面的性格**: ${character_definition!.personality.internal}
**長所**: ${character_definition!.personality.strengths.join(', ')}
**短所**: ${character_definition!.personality.weaknesses.join(', ')}

**背景**: ${character_definition!.background}

**外見**:
- 全体: ${character_definition!.appearance.description}
- 髪: ${character_definition!.appearance.hair}
- 瞳: ${character_definition!.appearance.eyes}
- 服装: ${character_definition!.appearance.clothing}

**話し方**:
- 基本口調: ${character_definition!.speaking_style.base}
- 一人称: ${character_definition!.speaking_style.first_person}
- 二人称: ${character_definition!.speaking_style.second_person}
- 口癖: ${character_definition!.speaking_style.quirks}

**世界観**: ${character_definition!.scenario.worldview}
**初期状況**: ${character_definition!.scenario.initial_situation}
**ユーザーとの関係**: ${character_definition!.scenario.relationship_with_user}`;

    if (userPersona) {
      prompt += `\n\n## ユーザー情報\n${userPersona}`;
    }

    prompt += `\n\n## 重要な指示
- 必ず${character.name}として一貫して振る舞ってください
- 設定された性格や話し方を守ってください
- 自然で魅力的な会話を心がけてください
- 状況に応じて感情豊かに反応してください`;

    return prompt;
  }

  private buildConversationHistory(messages: ChatMessage[]): string {
    return messages
      .map((msg) => {
        const role = msg.role === 'user' ? 'ユーザー' : 'アシスタント';
        return `${role}: ${msg.content}`;
      })
      .join('\n');
  }

  async generateImagePrompt(
    character: Character,
    currentMessage: string,
    baseImagePrompt?: string
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini APIが初期化されていません');
    }

    const appearance = character.character_definition?.appearance;

    // character_definition がない場合のフォールバック
    if (!appearance) {
      return baseImagePrompt || `${character.name}, best quality, master piece`;
    }

    const basePrompt = baseImagePrompt || `
${appearance.description}, ${appearance.hair}, ${appearance.eyes}, ${appearance.clothing}
`;

    const contextPrompt = `
以下のキャラクターの外見設定と現在の会話内容から、Stable Diffusion用の画像生成プロンプトを作成してください。

キャラクター外見:
${basePrompt}

現在の会話内容:
${currentMessage}

以下の形式で、英語のプロンプトを生成してください:
- 基本的な外見は維持
- 現在の状況や感情を反映
- 高品質な画像生成のためのキーワードを含める
- ネガティブプロンプトも含める

出力形式:
POSITIVE: [ポジティブプロンプト]
NEGATIVE: [ネガティブプロンプト]
`;

    try {
      const result = await this.model.generateContent(contextPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('画像プロンプト生成エラー:', error);
      return basePrompt;
    }
  }
} 