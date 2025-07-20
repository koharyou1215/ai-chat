import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DEFAULT_SYSTEM_PROMPT } from '../../../../lib/defaultSystemPrompt';

/* eslint-disable @typescript-eslint/no-explicit-any */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

if (!GEMINI_API_KEY) {
  console.warn('[chat] GEMINI_API_KEY が設定されていません');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface ChatHistoryMsg { role: 'user' | 'assistant'; content: string; }

export async function POST(request: NextRequest) {
  try {
    const { messages, character, settings } = await request.json();
    
    console.log('Chat API called with:', { 
      messagesCount: messages?.length, 
      characterName: character?.name,
      settings 
    });
    
    const model = genAI.getGenerativeModel({ model: settings?.model || 'gemini-2.5-flash' });
    
    // キャラクター設定からシステムプロンプトを構築
    const systemPrompt = buildSystemPrompt(character);
    
    // プロンプト短縮: 直近10件、assistant 長文省略
    const recentMessages = (messages as ChatHistoryMsg[])
      .slice(-10)
      .filter((m) => m.role === 'user' || m.content.length < 250);

    const conversationHistory = recentMessages
      .map((msg) => {
        const role = msg.role === 'user' ? 'ユーザー' : character.name;
        return `${role}: ${msg.content}`;
      })
      .join('\n');
    
    const fullPrompt = `${systemPrompt}\n\n会話履歴:\n${conversationHistory}\n\n{{char}}:`;
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: settings?.temperature || 0.7,
        topP: settings?.topP || 0.9,
        maxOutputTokens: settings?.maxTokens || 2048,
        ...(settings?.presencePenalty !== undefined && !(settings?.model || 'gemini-2.5-flash').includes('flash') ? {
          presencePenalty: settings?.presencePenalty ?? 0.6,
          frequencyPenalty: settings?.frequencyPenalty ?? 0.4,
        } : {})
      },
    });
    
    const response = await result.response;
    const text = response.text();

    // プレースホルダ置換 {{char}}, {{user}}
    const userName = 'あなた';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const finalizedText = text.replace(/\{\{char}}/g, (character as {name:string}).name)
                              .replace(/\{\{user}}/g, userName);

    console.log('Gemini API response:', text);
    
    return NextResponse.json({ 
      content: finalizedText,
      success: true 
    });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'チャット生成に失敗しました', success: false },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(character: { name: string; character_definition: any }): string {
  if (!character) return '';
  
  const { character_definition } = character;
  
  const prompt = `あなたは「{{char}}」として振る舞ってください。

## キャラクター設定
**名前**: {{char}}
**性格**: ${character_definition.personality.summary}
**外面的性格**: ${character_definition.personality.external}
**内面的性格**: ${character_definition.personality.internal}
**長所**: ${character_definition.personality.strengths.join(', ')}
**短所**: ${character_definition.personality.weaknesses.join(', ')}

**Background
**: ${character_definition.background}

**話し方**:
- 基本口調: ${character_definition.speaking_style.base}
- 一人称: ${character_definition.speaking_style.first_person}
- 二人称: ${character_definition.speaking_style.second_person}
- 口癖: ${character_definition.speaking_style.quirks}

**世界観**: ${character_definition.scenario.worldview}
**初期状況**: ${character_definition.scenario.initial_situation}
**ユーザーとの関係**: ${character_definition.scenario.relationship_with_user}

## 重要な指示
- 必ず{{char}}として一貫して振る舞ってください
- 設定された性格や話し方を守ってください
- 自然で魅力的な会話を心がけてください
- 状況に応じて感情豊かに反応してください
- 返答は簡潔で自然な長さにしてください`;

  return `${DEFAULT_SYSTEM_PROMPT}\n\n${prompt}`;
} 