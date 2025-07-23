/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { MemoryManager } from '../../../../lib/memoryManager';
import { CharacterLoader } from '../../../../lib/characterLoader';
import { ExampleDialogue } from '../../../../types/character';
import { DEFAULT_SYSTEM_PROMPT } from '../../../../lib/defaultSystemPrompt';
import { chatCompletion as callOpenRouter } from '../../../../lib/openRouter';


// NOTE: セキュリティのため API キーはハードコードしない

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
    
    // プロバイダを決定
    let provider: 'gemini' | 'openrouter' = settings?.provider || 'openrouter'; // デフォルトをopenrouterに
    
    // 設定されたモデルがOpenRouterのGeminiモデルの場合、プロバイダを強制的にopenrouterに
    const openRouterGeminiModels = [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-pro',
    ];
    if (settings?.model && openRouterGeminiModels.includes(settings.model)) {
      provider = 'openrouter';
    }

    // モデル設定（Gemini/OpenRouter 共通で使うパラメータをまとめて保持）
    const modelConfig = {
      model: settings?.model || (provider === 'gemini' ? 'gemini-2.5-flash' : 'openai/gpt-4o-mini'),
      generationConfig: {
        temperature: settings?.temperature || 0.7,
        topP: settings?.topP || 0.9,
        maxOutputTokens: settings?.maxTokens || 2048,
        ...(settings?.presencePenalty !== undefined && !(settings?.model || 'gemini-2.5-flash').includes('flash') ? {
          presencePenalty: settings?.presencePenalty ?? 0.6,
          frequencyPenalty: settings?.frequencyPenalty ?? 0.4,
        } : {})
      }
    };

    console.log('Model config maxOutputTokens:', modelConfig.generationConfig.maxOutputTokens); // デバッグログ追加

    // キャラクター情報からプロンプトを生成
    let basePrompt = '';
    
    if (character) {
      basePrompt = `あなたは{{char}}です。以下の設定に従って{{char}}として行動してください。

【キャラクター設定】
{{char}}の名前: {{char}}
{{char}}の性格: ${character.personality}
{{char}}の外見: ${character.appearance}
{{char}}の話し方: ${character.speaking_style}
{{char}}のシナリオ: ${character.scenario}

${character.example_dialogue ? `【会話例】\n${character.example_dialogue.map((ex: ExampleDialogue) => `{{user}}: ${ex.user}\n{{char}}: ${ex.char}`).join('\n\n')}` : ''}

上記の設定を厳密に守り、{{char}}として一貫した返答をしてください。
{{user}}は会話相手を指します。{{char}}は{{char}}を指します。`;
    } else {
      // 完全なフォールバック
      basePrompt = `あなたは{{char}}（ナミ）という名前の航海士です。明るく親しみやすい関西弁で話してください。{{user}}は会話相手を指します。`;
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
      let personaInfo = `\n\n【{{user}}の情報】\n`;
      personaInfo += `- {{user}}のタイプ: ${persona.name}\n`;
      
      if (persona.likes && persona.likes.length > 0) {
        personaInfo += `- {{user}}の好きなもの: ${persona.likes.join(', ')}\n`;
      }
      
      if (persona.dislikes && persona.dislikes.length > 0) {
        personaInfo += `- {{user}}の嫌いなもの: ${persona.dislikes.join(', ')}\n`;
      }
      
      if (persona.other_settings) {
        personaInfo += `- {{user}}のその他の特徴: ${persona.other_settings}\n`;
      }
      
      personaInfo += `\n上記の{{user}}情報を考慮して、{{char}}として{{user}}に合わせた返答をしてください。`;
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

    // ここで繰り返し禁止・心情変化指示を追加
    basePrompt += '\n【超重要】過去のやり取りや感情・関係性を繰り返さず、キャラクターの心情や関係性は状況に応じて自然に変化・進展させてください。同じ言葉や感情表現を何度も使うことは禁止です。会話や物語が進むごとに、キャラクターの気持ちや態度も変化させてください。';
    
    // モデルが応答を生成しないことを避けるための指示を強化
    basePrompt += '\n【最終指示】必ず{{char}}の返答を生成してください。空の応答や不完全な応答は許可されません。';

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
    // ---- プロンプト短縮 ----
    // 1) 空行除去 2) 直近10件 3) assistant 長文 (>250文字) はスキップ
    const filteredConversation = (conversation && Array.isArray(conversation))
      ? conversation
          .filter((msg: { role: string; content: string }) => msg && msg.content?.trim())
          .slice(-(settings?.historySize || 8)) // 設定値を反映
          .filter((msg: { role: string; content: string }) => msg.role === 'user' || msg.content.length < 250)
      : [];

    let historyText = filteredConversation.map((msg: { role: string; content: string }) => {
      const speaker = msg.role === 'user' ? '{{user}}' : '{{char}}';
      return `${speaker}: ${msg.content}`;
    }).join('\n');

    // ユーザー行（continue 時は追加しない）
    const userLine = doContinue ? '' : `{{user}}: ${message}\n`;

    let fullPrompt = `${basePrompt}\n\n${historyText}${historyText ? '\n' : ''}${userLine}{{char}}:`;

    if (doContinue) {
      fullPrompt += '\n【重要】この続きでは、ユーザーの思考・行動・セリフは一切含めず、{{char}}（キャラクター）の返答・独白・行動・心情描写のみを自然に書き続けてください。物語や会話が進行するようにしてください。';
    }
    
    // プロンプト長が30,000文字を超える場合は古い履歴から削除
    const MAX_PROMPT_CHARS = 30000;
    if (fullPrompt.length > MAX_PROMPT_CHARS) {
      console.warn('プロンプトが長すぎるため履歴を削除して短縮します');
      // 履歴を古い順に削除しながら短縮
      while (fullPrompt.length > MAX_PROMPT_CHARS && filteredConversation.length > 0) {
        filteredConversation.shift();
        historyText = filteredConversation.map((msg: { role: string; content: string }) => {
          const speaker = msg.role === 'user' ? '{{user}}' : '{{char}}';
          return `${speaker}: ${msg.content}`;
        }).join('\n');
        fullPrompt = `${basePrompt}\n\n${historyText}${historyText ? '\n' : ''}${userLine}{{char}}:`;
      }
    }
    
    console.log('Final prompt:', fullPrompt);

    // ---------- OpenRouter 経由の応答 ----------
    if (provider === 'openrouter') {
      try {
        const openRouterApiKey = settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY; // let から const に変更
        
        // APIキーの重複を修正（重複している場合は半分にカット）を削除
        // if (openRouterApiKey && openRouterApiKey.length > 100 && openRouterApiKey.startsWith('sk-or-v1-')) {
        //   const halfLength = openRouterApiKey.substring(0, halfLength);
        //   const secondHalf = openRouterApiKey.substring(halfLength);
        //   if (firstHalf === secondHalf) {
        //     console.log('OpenRouter APIキーの重複を検出、修正しています');
        //     openRouterApiKey = firstHalf;
        //   }
        // }
        
        console.log('OpenRouter API Key check:', {
          hasSettingsApiKey: !!settings?.openRouterApiKey,
          hasEnvApiKey: !!process.env.OPENROUTER_API_KEY,
          settingsApiKeyLength: settings?.openRouterApiKey?.length || 0,
          finalApiKeyLength: openRouterApiKey?.length || 0,
          finalApiKeyStart: openRouterApiKey?.substring(0, 15) || 'none'
        });
        
        if (!openRouterApiKey) {
          return NextResponse.json({
            success: false,
            error: 'OpenRouter APIキーが設定されていません。設定画面でAPIキーを入力してください。'
          }, { status: 500 });
        }

        const messagesForOpenRouter = [
          { role: 'system' as const, content: basePrompt },
          ...filteredConversation.map((msg: { role: 'user' | 'assistant'; content: string }) => ({
            role: msg.role,
            content: msg.content,
          })),
          ...(doContinue ? [] : [{ role: 'user' as const, content: message }])
        ];

        const openRouterModel = settings?.model || 'openai/gpt-3.5-turbo';

        // OpenRouterで複数候補を生成（並列リクエスト）
        const candidateCount = Math.min(settings?.candidateCount || 1, 5); // 最大5個まで
        const candidatePromises = Array.from({ length: candidateCount }, () =>
          callOpenRouter({
            apiKey: openRouterApiKey,
            model: openRouterModel,
            messages: messagesForOpenRouter,
            temperature: modelConfig.generationConfig.temperature,
            maxTokens: modelConfig.generationConfig.maxOutputTokens,
          })
        );

        try {
          const openRouterTexts = await Promise.all(candidatePromises);
          const userName = persona?.name || 'あなた';
          
          const candidates = openRouterTexts.map(text => 
            text.replace(/\{\{char}}/g, character.name).replace(/\{\{user}}/g, userName)
          );

          console.log(`OpenRouter: ${candidateCount}個の候補を生成しました`);

          return NextResponse.json({
            success: true,
            content: candidates[0], // 最初の候補をメインとして使用
            candidates: candidates
          });
        } catch (multipleRequestError) {
          console.warn('複数候補生成に失敗、単一候補で再試行:', multipleRequestError);
          
          // フォールバック: 1つだけ生成
          const openRouterText = await callOpenRouter({
            apiKey: openRouterApiKey,
            model: openRouterModel,
            messages: messagesForOpenRouter,
            temperature: modelConfig.generationConfig.temperature,
            maxTokens: modelConfig.generationConfig.maxOutputTokens,
          });

          const userName = persona?.name || 'あなた';
          const replaced = openRouterText
            .replace(/\{\{char}}/g, character.name)
            .replace(/\{\{user}}/g, userName);

          return NextResponse.json({
            success: true,
            content: replaced,
            candidates: [replaced]
          });
        }
      } catch (openRouterError) {
        console.error('OpenRouter error:', openRouterError);
        return NextResponse.json({
          success: false,
          error: openRouterError instanceof Error ? openRouterError.message : 'OpenRouter との通信に失敗しました'
        }, { status: 500 });
      }
    }
    
    // ---------- インスピレーション返信 (候補3つ) ----------
    // ここに来ることは通常ないが型安全のため
    return NextResponse.json({ success: false, error: 'Provider not supported' }, { status: 500 });
    
  } catch (error) {
    console.error('Simple chat API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}