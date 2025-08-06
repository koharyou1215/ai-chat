import { NextRequest, NextResponse } from 'next/server';
import { MemoryManager } from '../../../../lib/memoryManager';
import { CharacterLoader } from '../../../../lib/characterLoader';
import { ExampleDialogue } from '../../../../types/character';
import { DEFAULT_SYSTEM_PROMPT } from '../../../../lib/defaultSystemPrompt';
import { GeminiApiManager } from '../../../../lib/geminiApiManager';


// NOTE: セキュリティのため API キーはハードコードしない

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Simple chat API called');
    
    // リクエストボディの解析
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('📋 リクエストボディ解析成功');
    } catch (parseError) {
      console.error('❌ リクエストボディ解析エラー:', parseError);
      return NextResponse.json({
        success: false,
        error: 'リクエストボディの解析に失敗しました'
      }, { status: 400 });
    }
    
    const { message, settings, persona, characterId, character: clientCharacter, memos, conversation, continue: doContinue, trackers } = requestBody;
    console.log('💬 User message:', message);
    console.log('👤 Character ID:', characterId);
    console.log('⚙️ Settings:', settings);
    
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
    
    // プロバイダを決定 - Geminiを優先
    let provider: 'gemini' | 'openrouter' = 'gemini'; // デフォルトをgeminiに変更
    
    // Gemini APIが利用できない場合はOpenRouterに切り替え
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiApiKey) {
      provider = 'openrouter';
      console.log('🔄 Gemini APIキーが設定されていないため、OpenRouterを使用します');
    }
    
    // ユーザー設定でプロバイダが指定されている場合はそれを優先
    if (settings?.provider) {
      provider = settings.provider;
      console.log(`⚙️ ユーザー設定によりプロバイダを${provider}に設定`);
    }
    
    // 設定されたモデルがGeminiモデルで、Gemini APIキーがある場合は直接Gemini API使用
    const directGeminiModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro', 
      'gemini-2.5-flash',
      'gemini-2.5-pro'
    ];
    const openRouterGeminiModels = [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-pro',
    ];
    
    // Geminiモデルの場合のプロバイダ判定
    if (settings?.model && directGeminiModels.includes(settings.model) && geminiApiKey) {
      provider = 'gemini';
      console.log(`🔄 直接Geminiモデル指定のため、プロバイダをgeminiに変更`);
    } else if (settings?.model && openRouterGeminiModels.includes(settings.model)) {
      provider = 'openrouter';
      console.log(`🔄 OpenRouter Geminiモデル指定のため、プロバイダをopenrouterに変更`);
    }

    // モデル設定（Gemini/OpenRouter 共通で使うパラメータをまとめて保持）
    const modelConfig = {
      model: settings?.model || (provider === 'gemini' ? 'gemini-1.5-flash' : 'openai/gpt-4o-mini'),
      generationConfig: {
        temperature: settings?.temperature || 0.7,
        topP: settings?.topP || 0.9,
        maxOutputTokens: settings?.maxTokens || 2048,
        ...(settings?.presencePenalty !== undefined && !(settings?.model || 'gemini-1.5-flash').includes('flash') ? {
          presencePenalty: settings?.presencePenalty ?? 0.6,
          frequencyPenalty: settings?.frequencyPenalty ?? 0.4,
        } : {})
      }
    };

    console.log('✅ プロバイダとモデル設定:', {
      provider,
      model: modelConfig.model,
      hasGeminiKey: !!geminiApiKey,
      hasOpenRouterKey: !!(settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY)
    });

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
    }   // デフォルトシステムプロンプトを先頭に
    basePrompt = `${DEFAULT_SYSTEM_PROMPT}\n\n${basePrompt}`;
    
    // キャラクター専用 System Prompt があれば最優先で追加
    if (character?.systemPrompt) {
      basePrompt = `${character.systemPrompt}\n\n${basePrompt}`;
    }

    // パラメータトラッカー情報を追加
    if (trackers && Array.isArray(trackers) && trackers.length > 0) {
      let trackerInfo = '\n\n## 📊 パラメータトラッカー\n';
      trackerInfo += '以下のパラメータを参考にして、キャラクターの状態を反映した返答をしてください：\n\n';
      
      trackers.forEach(tracker => {
        if (tracker && tracker.display_name) {
          trackerInfo += `**${tracker.display_name}** (${tracker.name}): `;
          
          switch (tracker.type) {
            case 'numeric':
              const value = tracker.initial_value || 0;
              const min = tracker.min_value || 0;
              const max = tracker.max_value || 100;
              trackerInfo += `${value}/${max} (${min}-${max})`;
              break;
            case 'state':
              trackerInfo += `${tracker.initial_state || '不明'}`;
              if (tracker.possible_states && tracker.possible_states.length > 0) {
                trackerInfo += ` (可能な状態: ${tracker.possible_states.join(', ')})`;
              }
              break;
            case 'boolean':
              trackerInfo += `${tracker.initial_boolean ? '有効' : '無効'}`;
              break;
            case 'text':
              trackerInfo += `${tracker.initial_text || '(空)'}`;
              break;
          }
          
          if (tracker.description) {
            trackerInfo += ` - ${tracker.description}`;
          }
          
          trackerInfo += '\n';
        }
      });
      
      basePrompt += trackerInfo;
    }

    // 追加のユーザー設定プロンプト
    if (settings?.enableSystemPrompt && settings?.systemPrompt) {
      basePrompt = `${basePrompt}\n\n${settings.systemPrompt}`;
    }
    
    // Jailbreakプロンプトを追加
    if (settings?.enableJailbreak && settings?.jailbreakPrompt) {
      basePrompt = `${settings.jailbreakPrompt}\n\n${basePrompt}`;
    }

    // 最新入力への集中を強調
    basePrompt += '\n【超重要】最新のユーザー入力に直接応答してください。過去の会話履歴は参考程度に留め、現在の話題に集中してください。2-3ラウンド前の会話に戻ることは避け、最新のメッセージに対する直接的な反応を優先してください。';
    
    // モデルが応答を生成しないことを避けるための指示を強化
    basePrompt += '\n【最終指示】必ず{{char}}の返答を生成してください。空の応答や不完全な応答は許可されません。';
    
    // Geminiの内部思考プロセスを防ぐための指示を追加
    basePrompt += '\n【重要】あなたの内部的な思考プロセスや「Responding to the Situation」のようなメタ的な表現は一切含めず、直接的に{{char}}として返答してください。';
    
    // 日本語での応答を強制
    basePrompt += '\n【言語指示】必ず日本語で返答してください。英語での返答は禁止です。';

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
    // 1) 空行除去 2) 直近の履歴を適切に制限 3) 長すぎるメッセージは要約
    console.log(`📚 元の会話履歴件数: ${conversation ? conversation.length : 0}`);
    const filteredConversation = (conversation && Array.isArray(conversation))
      ? conversation
          .filter((msg: { role: string; content: string }) => msg && msg.content?.trim())
          .slice(-(Math.min(settings?.historySize || 8, 8))) // 履歴サイズを最大8件に制限
          .map((msg: { role: string; content: string }) => {
            // 長すぎるメッセージは要約
            if (msg.content.length > 300) {
              return {
                role: msg.role as 'user' | 'assistant',
                content: msg.content.substring(0, 500) + '...'
              };
            }
            return {
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            };
          })
      : [];

    console.log(`📏 フィルター後の会話履歴件数: ${filteredConversation.length}`);

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
    
    console.log(`📄 プロンプト生成完了 - 文字数: ${fullPrompt.length}`);
    
    // プロンプト長が2000文字を超える場合は古い履歴から削除
    const MAX_PROMPT_CHARS = 2000;
    if (fullPrompt.length > MAX_PROMPT_CHARS) {
      console.warn(`⚠️ プロンプトが長すぎます（${fullPrompt.length}文字）履歴を削除して短縮します`);
      // 履歴を古い順に削除しながら短縮
      while (fullPrompt.length > MAX_PROMPT_CHARS && filteredConversation.length > 0) {
        filteredConversation.shift();
        historyText = filteredConversation.map((msg: { role: string; content: string }) => {
          const speaker = msg.role === 'user' ? '{{user}}' : '{{char}}';
          return `${speaker}: ${msg.content}`;
        }).join('\n');
        fullPrompt = `${basePrompt}\n\n${historyText}${historyText ? '\n' : ''}${userLine}{{char}}:`;
      }
      
      // それでも長い場合は各メッセージを短縮
      if (fullPrompt.length > MAX_PROMPT_CHARS) {
        const shortenedConversation = filteredConversation.map((msg: { role: string; content: string }) => ({
          ...msg,
          content: msg.content.length > 150 ? msg.content.substring(0, 150) + '...' : msg.content
        }));
        historyText = shortenedConversation.map((msg: { role: string; content: string }) => {
          const speaker = msg.role === 'user' ? '{{user}}' : '{{char}}';
          return `${speaker}: ${msg.content}`;
        }).join('\n');
        fullPrompt = `${basePrompt}\n\n${historyText}${historyText ? '\n' : ''}${userLine}{{char}}:`;
      }
      
      console.log(`🔧 プロンプト短縮完了 - 最終文字数: ${fullPrompt.length}`);
    }
    
    console.log('Final prompt:', fullPrompt);

    // ---------- Gemini API 直接呼び出し ----------
    if (provider === 'gemini') {
      try {
        console.log('🔹 Gemini API直接呼び出し開始');
        
        if (!geminiApiKey) {
          return NextResponse.json({
            success: false,
            error: 'Gemini APIキーが設定されていません。環境変数GEMINI_API_KEYまたはGOOGLE_API_KEYを設定してください。'
          }, { status: 500 });
        }

        // メッセージを統合してGemini形式に変換
        const messagesForGemini = [
          { role: 'system', content: basePrompt },
          ...filteredConversation.map((msg: { role: 'user' | 'assistant'; content: string }) => ({
            role: msg.role,
            content: msg.content,
          })),
          ...(doContinue ? [] : [{ role: 'user' as const, content: message }])
        ];

        // Gemini API優先システムを使用
        const response = await GeminiApiManager.generateWithPriority(
          modelConfig.model,
          messagesForGemini,
          {
            maxTokens: modelConfig.generationConfig.maxOutputTokens,
            temperature: modelConfig.generationConfig.temperature,
            openRouterApiKey: settings?.openRouterApiKey // フォールバック用
          }
        );
        
        if (!response.success || !response.content) {
          throw new Error(`Gemini生成失敗: ${response.error || 'レスポンスが空です'}`);
        }

        console.log(`✅ Gemini API成功（${response.provider}）:`, response.content.substring(0, 100) + '...');

        const userName = persona?.name || 'あなた';
        const replaced = response.content
          .replace(/\{\{char}}/g, character.name)
          .replace(/\{\{user}}/g, userName);

        return NextResponse.json({
          success: true,
          content: replaced,
          candidates: [replaced]
        });
      } catch (geminiError) {
        console.error('❌ Gemini API error:', geminiError);
        return NextResponse.json({
          success: false,
          error: geminiError instanceof Error ? geminiError.message : 'Gemini APIとの通信に失敗しました'
        }, { status: 500 });
      }
    }

    // ---------- OpenRouter 経由の応答 ----------
    if (provider === 'openrouter') {
      try {
        // 設定画面を優先で取得
        const envApiKey = process.env.OPENROUTER_API_KEY;
        const settingsApiKey = settings?.openRouterApiKey;
        const openRouterApiKey = settingsApiKey || envApiKey;
        
        // デバッグ用：環境変数の詳細確認
        console.log('Environment variables debug:', {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV,
          VERCEL_URL: process.env.VERCEL_URL,
          OPENROUTER_API_KEY_EXISTS: !!process.env.OPENROUTER_API_KEY,
          OPENROUTER_API_KEY_LENGTH: process.env.OPENROUTER_API_KEY?.length || 0,
          OPENROUTER_API_KEY_FORMAT: process.env.OPENROUTER_API_KEY?.startsWith('sk-or-v1-') ? 'valid_format' : 'invalid_format'
        });
        
        console.log('OpenRouter API Key check:', {
          hasSettingsApiKey: !!settingsApiKey,
          hasEnvApiKey: !!envApiKey,
          settingsApiKeyLength: settingsApiKey?.length || 0,
          envApiKeyLength: envApiKey?.length || 0,
          finalApiKeyLength: openRouterApiKey?.length || 0,
          finalApiKeyStart: openRouterApiKey?.substring(0, 15) || 'none',
          envApiKeyStart: envApiKey?.substring(0, 15) || 'none',
          isProduction: process.env.NODE_ENV === 'production',
          apiKeyFormat: openRouterApiKey?.startsWith('sk-or-v1-') ? 'valid' : 'invalid',
          allEnvVars: {
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV,
            hasEnvKey: !!process.env.OPENROUTER_API_KEY
          }
        });
        
        if (!openRouterApiKey) {
          return NextResponse.json({
            success: false,
            error: 'OpenRouter APIキーが設定されていません。設定画面でAPIキーを入力してください。'
          }, { status: 500 });
        }

        // APIキーの形式チェック
        if (!openRouterApiKey.startsWith('sk-or-v1-')) {
          return NextResponse.json({
            success: false,
            error: 'OpenRouter APIキーの形式が正しくありません。正しいAPIキーを設定してください。'
          }, { status: 500 });
        }

        const openRouterModel = settings?.model || 'openai/gpt-3.5-turbo';

        // Geminiモデルの場合の特別な処理
        const messagesForOpenRouter = [
          { role: 'system' as const, content: basePrompt },
          ...filteredConversation.map((msg: { role: 'user' | 'assistant'; content: string }) => ({
            role: msg.role,
            content: msg.content,
          })),
          ...(doContinue ? [] : [{ role: 'user' as const, content: message }])
        ];

        // Gemini 2.5 Proの場合は日本語出力を強制
        if (openRouterModel.includes('gemini-2.5-pro')) {
          // システムメッセージを最初のユーザーメッセージに統合
          if (messagesForOpenRouter[0].role === 'system') {
            const systemContent = messagesForOpenRouter[0].content;
            if (messagesForOpenRouter[1] && messagesForOpenRouter[1].role === 'user') {
              messagesForOpenRouter[1].content = `${systemContent}\n\n${messagesForOpenRouter[1].content}`;
              messagesForOpenRouter.shift(); // システムメッセージを削除
            }
          }
          
          // 最後のメッセージに日本語出力を強制する指示を追加
          const lastMessage = messagesForOpenRouter[messagesForOpenRouter.length - 1];
          if (lastMessage && lastMessage.role === 'user') {
            lastMessage.content += '\n\n（必ず日本語で詳しく返答してください。最低でも3-4文以上の充実した返答をしてください。英語は絶対に使わないでください。）';
          }
        }

        // Gemini API優先でOpenRouterフォールバック（複数候補生成）
        const candidateCount = Math.min(settings?.candidateCount || 1, 5); // 最大5個まで
        console.log(`🔄 AI API呼び出し開始（Gemini優先、${candidateCount}個の候補を順次生成）`);
        
        const generatedTexts: string[] = [];
        
        try {
          for (let i = 0; i < candidateCount; i++) {
            console.log(`📋 候補${i + 1}/${candidateCount}を生成中...`);
            
            try {
              // Gemini API優先システムを使用
              const response = await GeminiApiManager.generateWithPriority(
                openRouterModel,
                messagesForOpenRouter,
                {
                  maxTokens: modelConfig.generationConfig.maxOutputTokens,
                  temperature: modelConfig.generationConfig.temperature,
                  openRouterApiKey: settings?.openRouterApiKey // 設定画面からのAPIキーを渡す
                }
              );
              
              console.log(`🔍 generateWithPriority結果:`, {
                success: response.success,
                provider: response.provider,
                hasContent: !!response.content,
                contentLength: response.content?.length || 0,
                error: response.error
              });
              
              if (response.success && response.content) {
                generatedTexts.push(response.content);
                console.log(`✅ 候補${i + 1}生成完了 (${response.provider}): ${response.content.substring(0, 50)}...`);
              } else {
                console.warn(`⚠️ 候補${i + 1}の生成に失敗: ${response.error}`);
              }
              
              // レート制限対策として各リクエスト間に1秒の遅延
              if (i < candidateCount - 1) {
                console.log('⏱️ レート制限対策として1秒待機中...');
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (candidateError) {
              console.warn(`⚠️ 候補${i + 1}の生成に失敗:`, candidateError);
              // 1つでも成功していれば継続、全て失敗の場合は下でエラーハンドリング
            }
          }
          
          if (generatedTexts.length === 0) {
            throw new Error('All AI candidate requests failed (Gemini + OpenRouter)');
          }
          
          console.log(`✅ AI API呼び出し完了（${generatedTexts.length}/${candidateCount}個成功）`);
          
          const userName = persona?.name || 'あなた';
          
          const candidates = generatedTexts.map((text, index) => {
            console.log(`📝 候補${index + 1}:`, text.substring(0, 100) + '...');
            return text.replace(/\{\{char}}/g, character.name).replace(/\{\{user}}/g, userName);
          });

          console.log('📋 生成された候補:', {
            candidateCount: candidates.length,
            candidates: candidates.map((c, i) => ({ index: i, length: c.length, preview: c.substring(0, 100) }))
          });

          if (!candidates || candidates.length === 0) {
            console.error('❌ 候補が生成されませんでした');
            return NextResponse.json({
              success: false,
              error: 'AI API応答に content が含まれていません。モデルがビジー状態か、APIキーに問題がある可能性があります。'
            }, { status: 500 });
          }

          if (!candidates[0] || !candidates[0].trim()) {
            console.error('❌ 最初の候補が空です:', candidates[0]);
            return NextResponse.json({
              success: false,
              error: 'AI API応答が空です。モデルがビジー状態か、APIキーに問題がある可能性があります。'
            }, { status: 500 });
          }

          console.log(`✅ AI API: ${candidateCount}個の候補を生成しました`);

          return NextResponse.json({
            success: true,
            content: candidates[0], // 最初の候補をメインとして使用
            candidates: candidates
          });
        } catch (multipleRequestError) {
          console.warn('❌ 順次候補生成に失敗、単一候補で再試行:', multipleRequestError);
          
          // フォールバック: 1つだけ生成（レート制限やその他のエラー対策）
          try {
            console.log('🔄 単一候補生成開始（Gemini優先フォールバック）');
            const response = await GeminiApiManager.generateWithPriority(
              openRouterModel,
              messagesForOpenRouter,
              {
                maxTokens: modelConfig.generationConfig.maxOutputTokens,
                temperature: modelConfig.generationConfig.temperature,
                openRouterApiKey: settings?.openRouterApiKey // 設定画面からのAPIキーを渡す
              }
            );

            if (!response.success || !response.content) {
              throw new Error(`AI生成失敗: ${response.error || 'レスポンスが空です'}`);
            }

            console.log(`✅ 単一候補生成完了（${response.provider}）:`, response.content.substring(0, 100) + '...');

            const userName = persona?.name || 'あなた';
            const replaced = response.content
              .replace(/\{\{char}}/g, character.name)
              .replace(/\{\{user}}/g, userName);

            return NextResponse.json({
              success: true,
              content: replaced,
              candidates: [replaced]
            });
          } catch (singleRequestError) {
            console.error('❌ 単一候補生成も失敗:', singleRequestError);
            throw singleRequestError;
          }
        }
      } catch (aiApiError) {
        console.error('AI API error:', aiApiError);
        return NextResponse.json({
          success: false,
          error: aiApiError instanceof Error ? aiApiError.message : 'AI APIとの通信に失敗しました'
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
