import { NextRequest, NextResponse } from 'next/server';
import { MemoryManager } from '../../../../lib/memoryManager';
import { CharacterLoader } from '../../../../lib/characterLoader';
import { ExampleDialogue } from '../../../../types/character';
import { DEFAULT_SYSTEM_PROMPT } from '../../../../lib/defaultSystemPrompt';
import { chatCompletion as callOpenRouter } from '../../../../lib/openRouter';


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
    
    const { message, settings, persona, characterId, character: clientCharacter, memos, conversation, continue: doContinue } = requestBody;
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
    }   // デフォルトシステムプロンプトを先頭に
    basePrompt = `${DEFAULT_SYSTEM_PROMPT}\n\n${basePrompt}`;
    
    // キャラクター専用 System Prompt があれば最優先で追加
    if (character?.systemPrompt) {
      basePrompt = `${character.systemPrompt}\n\n${basePrompt}`;
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
    const filteredConversation = (conversation && Array.isArray(conversation))
      ? conversation
          .filter((msg: { role: string; content: string }) => msg && msg.content?.trim())
          .slice(-(settings?.historySize || 8)) // 履歴サイズを8件に増加
          .map((msg: { role: string; content: string }) => {
            // 長すぎるメッセージは要約
            if (msg.content.length > 500) {
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
    
    // プロンプト長が15,000文字を超える場合は古い履歴から削除（より厳しい制限）
    const MAX_PROMPT_CHARS = 15000;
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
          OPENROUTER_API_KEY_START: process.env.OPENROUTER_API_KEY?.substring(0, 10) || 'none',
          OPENROUTER_API_KEY_FULL: process.env.OPENROUTER_API_KEY || 'none' // 完全なAPIキーを表示（デバッグ用）
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

        // OpenRouterで複数候補を生成（順次リクエスト - レート制限対策）
        const candidateCount = Math.min(settings?.candidateCount || 1, 5); // 最大5個まで
        console.log(`🔄 OpenRouter API呼び出し開始（${candidateCount}個の候補を順次生成）`);
        
        const openRouterTexts: string[] = [];
        
        try {
          for (let i = 0; i < candidateCount; i++) {
            console.log(`📋 候補${i + 1}/${candidateCount}を生成中...`);
            
            try {
              const candidateText = await callOpenRouter({
                apiKey: openRouterApiKey as string,
                model: openRouterModel,
                messages: messagesForOpenRouter,
                temperature: modelConfig.generationConfig.temperature,
                maxTokens: modelConfig.generationConfig.maxOutputTokens,
              });
              
              openRouterTexts.push(candidateText);
              console.log(`✅ 候補${i + 1}生成完了: ${candidateText.substring(0, 50)}...`);
              
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
          
          if (openRouterTexts.length === 0) {
            throw new Error('All OpenRouter candidate requests failed');
          }
          
          console.log(`✅ OpenRouter API呼び出し完了（${openRouterTexts.length}/${candidateCount}個成功）`);
          
          const userName = persona?.name || 'あなた';
          
          const candidates = openRouterTexts.map((text, index) => {
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
              error: 'OpenRouter 応答に content が含まれていません。モデルがビジー状態か、APIキーに問題がある可能性があります。'
            }, { status: 500 });
          }

          if (!candidates[0] || !candidates[0].trim()) {
            console.error('❌ 最初の候補が空です:', candidates[0]);
            return NextResponse.json({
              success: false,
              error: 'OpenRouter 応答が空です。モデルがビジー状態か、APIキーに問題がある可能性があります。'
            }, { status: 500 });
          }

          console.log(`✅ OpenRouter: ${candidateCount}個の候補を生成しました`);

          return NextResponse.json({
            success: true,
            content: candidates[0], // 最初の候補をメインとして使用
            candidates: candidates
          });
        } catch (multipleRequestError) {
          console.warn('❌ 順次候補生成に失敗、単一候補で再試行:', multipleRequestError);
          
          // フォールバック: 1つだけ生成（レート制限やその他のエラー対策）
          try {
            console.log('🔄 単一候補生成開始（フォールバック）');
            const openRouterText = await callOpenRouter({
              apiKey: openRouterApiKey as string,
              model: openRouterModel,
              messages: messagesForOpenRouter,
              temperature: modelConfig.generationConfig.temperature,
              maxTokens: modelConfig.generationConfig.maxOutputTokens,
            });

            console.log('✅ 単一候補生成完了（フォールバック）:', openRouterText.substring(0, 100) + '...');

            const userName = persona?.name || 'あなた';
            const replaced = openRouterText
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
