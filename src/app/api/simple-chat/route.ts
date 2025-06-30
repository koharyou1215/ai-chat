import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MemoryManager } from '../../../../lib/memoryManager';
import { CharacterLoader } from '../../../../lib/characterLoader';
import { ExampleDialogue } from '../../../../types/character';
import { DEFAULT_SYSTEM_PROMPT } from '../../../../lib/defaultSystemPrompt';

// NOTE: セキュリティのため API キーはハードコードしない
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

if (!GEMINI_API_KEY) {
  console.warn('[simple-chat] GEMINI_API_KEY が設定されていません');
}

export async function POST(request: NextRequest) {
  try {
    console.log('Simple chat API called');
    
    const { message, settings, persona, characterId, character: clientCharacter, memos, conversation, continue: doContinue } = await request.json();
    console.log('User message:', message);
    console.log('Character ID:', characterId);
    console.log('Settings:', settings);
    
    if (!message && !doContinue) {
      return NextResponse.json({
        success: false,
        error: 'メッセージが空です'
      }, { status: 400 });
    }

    // キャラクター情報を決定
    let character = null;
    if (clientCharacter && clientCharacter.name) {
      character = clientCharacter;
      console.log('Client-provided character used:', character.name);
    } else if (characterId) {
      character = CharacterLoader.getCharacterByName(characterId);
      console.log('Loaded character from server:', character?.name);
    }
    if (!character) {
      character = CharacterLoader.getCharacterByName('ナミ');
      console.log('Fallback to default character:', character?.name);
    }
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // モデル設定を適用
    const modelConfig = {
      model: settings?.model || 'gemini-2.5-flash',
      generationConfig: {
        temperature: settings?.temperature || 0.7,
        topP: settings?.topP || 0.9,
        maxOutputTokens: settings?.maxTokens || 2048,
      }
    };
    
    const model = genAI.getGenerativeModel(modelConfig);
    
    // キャラクター情報からプロンプトを生成
    let basePrompt = '';
    
    if (character) {
      basePrompt = `あなたは「${character.name}」です。以下の設定に従って行動してください。

【キャラクター設定】
名前: ${character.name}
性格: ${character.personality}
外見: ${character.appearance}
話し方: ${character.speaking_style}
シナリオ: ${character.scenario}

${character.example_dialogue ? `【会話例】\n${character.example_dialogue.map((ex: ExampleDialogue) => `ユーザー: ${ex.user}\n${character.name}: ${ex.char}`).join('\n\n')}` : ''}

上記の設定を厳密に守り、${character.name}として一貫した返答をしてください。`;
    } else {
      // 完全なフォールバック
      basePrompt = `あなたは「ナミ」という名前の航海士です。明るく親しみやすい関西弁で話してください。`;
    }
    
    // メモリ情報を追加
    if (memos && characterId) {
      const memorySummary = MemoryManager.generateMemorySummary(memos, characterId || character.name, settings?.memorySize || 1000);
      if (memorySummary) {
        basePrompt += `\n\n${memorySummary}`;
        basePrompt += `\n\n上記の記憶情報を参考にして、一貫性のある自然な返答をしてください。`;
      }
    }
    
    // Persona情報を追加
    if (persona && persona.name) {
      let personaInfo = `\n\n【ユーザー情報】\n`;
      personaInfo += `- ユーザーのタイプ: ${persona.name}\n`;
      
      if (persona.likes && persona.likes.length > 0) {
        personaInfo += `- 好きなもの: ${persona.likes.join(', ')}\n`;
      }
      
      if (persona.dislikes && persona.dislikes.length > 0) {
        personaInfo += `- 嫌いなもの: ${persona.dislikes.join(', ')}\n`;
      }
      
      if (persona.other_settings) {
        personaInfo += `- その他の特徴: ${persona.other_settings}\n`;
      }
      
      personaInfo += `\n上記のユーザー情報を考慮して、相手に合わせた返答をしてください。`;
      basePrompt += personaInfo;
    }
    
    // デフォルトシステムプロンプトを先頭に
    basePrompt = `${DEFAULT_SYSTEM_PROMPT}\n\n${basePrompt}`;

    // 追加のユーザー設定プロンプト
    if (settings?.enableSystemPrompt && settings?.systemPrompt) {
      basePrompt = `${basePrompt}\n\n${settings.systemPrompt}`;
    }
    
    // Jailbreakプロンプトを追加
    if (settings?.enableJailbreak && settings?.jailbreakPrompt) {
      basePrompt = `${settings.jailbreakPrompt}\n\n${basePrompt}`;
    }
    
    // レスポンス形式に応じた指示を追加
    if (settings?.responseFormat && settings.responseFormat !== 'normal') {
      const formatInstructions = {
        roleplay: '\n\n【重要】完全にキャラクターになりきって、そのキャラクターとして自然に反応してください。',
        narrative: '\n\n【重要】物語のような美しい描写を交えて、情景豊かに表現してください。',
        dialogue: '\n\n【重要】自然で親しみやすい会話を心がけ、親近感のある返答をしてください。',
        descriptive: '\n\n【重要】詳細な描写と感情表現を豊富に使い、臨場感のある返答をしてください。'
      };
      
      const instruction = formatInstructions[settings.responseFormat as keyof typeof formatInstructions];
      if (instruction) {
        basePrompt += instruction;
      }
    }
    
    // 会話履歴をテキスト化（空文字やundefinedを除外）
    const filteredConversation = (conversation && Array.isArray(conversation))
      ? conversation.filter((msg: { role: string; content: string }) => msg && msg.content && msg.content.trim().length > 0)
      : [];

    let historyText = filteredConversation.map((msg: { role: string; content: string }) => {
      const speaker = msg.role === 'user' ? 'ユーザー' : character.name;
      return `${speaker}: ${msg.content}`;
    }).join('\n');

    // ユーザー行（continue 時は追加しない）
    const userLine = doContinue ? '' : `ユーザー: ${message}\n`;

    let fullPrompt = `${basePrompt}\n\n${historyText}${historyText ? '\n' : ''}${userLine}${character.name}:`;
    
    // プロンプト長が30,000文字を超える場合は古い履歴から削除
    const MAX_PROMPT_CHARS = 30000;
    if (fullPrompt.length > MAX_PROMPT_CHARS) {
      console.warn('プロンプトが長すぎるため履歴を削除して短縮します');
      // 履歴を古い順に削除しながら短縮
      while (fullPrompt.length > MAX_PROMPT_CHARS && filteredConversation.length > 0) {
        filteredConversation.shift();
        historyText = filteredConversation.map((msg: { role: string; content: string }) => {
          const speaker = msg.role === 'user' ? 'ユーザー' : character.name;
          return `${speaker}: ${msg.content}`;
        }).join('\n');
        fullPrompt = `${basePrompt}\n\n${historyText}${historyText ? '\n' : ''}${userLine}${character.name}:`;
      }
    }
    
    console.log('Final prompt:', fullPrompt);
    
    // Gemini呼び出しを1回リトライできるように関数化
    const callGemini = async (): Promise<string> => {
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    };

    let text = await callGemini();

    // 返答が空の場合は履歴を半分にして再試行
    if (!text || text.trim().length === 0) {
      console.warn('Geminiから空の応答。履歴を短縮してリトライします');
      const reducedHistory = filteredConversation.slice(-10); // 直近10件だけ
      historyText = reducedHistory.map((msg: { role: string; content: string }) => {
        const speaker = msg.role === 'user' ? 'ユーザー' : character.name;
        return `${speaker}: ${msg.content}`;
      }).join('\n');
      fullPrompt = `${basePrompt}\n\n${historyText}${historyText ? '\n' : ''}${userLine}${character.name}:`;

      try {
        text = await callGemini();
      } catch (retryError) {
        console.error('Gemini再試行エラー:', retryError);
      }
    }
    
    // それでも空ならフォールバックメッセージを設定
    if (!text || text.trim().length === 0) {
      console.warn('Geminiが依然として空応答。フォールバックメッセージを返します');
      text = `${character.name}: …ごめんね、ちょっと言葉に詰まっちゃったみたい。もう一度質問してくれる？`;
    }
    
    return NextResponse.json({
      success: true,
      content: text
    });
    
  } catch (error) {
    console.error('Simple chat API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 