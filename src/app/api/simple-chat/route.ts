import { NextRequest, NextResponse } from 'next/server';
import { MemoryManager } from '../../../../lib/memoryManager';
import { CharacterLoader } from '../../../../lib/characterLoader';
import { ExampleDialogue } from '../../../../types/character';
import { DEFAULT_SYSTEM_PROMPT } from '../../../../lib/defaultSystemPrompt';
import { GeminiApiManager } from '../../../../lib/geminiApiManager';

// トラッカー更新の自動検出
function autoDetectTrackerChanges(aiResponse: string, trackers: any[]): any[] {
  const updates: any[] = [];
  const response = aiResponse.toLowerCase();
  
  console.log('🔍 自動検出開始:', response.substring(0, 100));
  
  trackers.forEach(tracker => {
    if (!tracker || !tracker.name) return;
    
    if (tracker.type === 'numeric') {
      let change = 0;
      
      // 好感度系の検出
      if (tracker.name.includes('affection') || tracker.name.includes('好感度')) {
        if (response.includes('嬉しい') || response.includes('ありがと') || response.includes('素敵')) {
          change = Math.floor(Math.random() * 10) + 5; // +5~15
        } else if (response.includes('悲しい') || response.includes('がっかり') || response.includes('冷たい')) {
          change = -(Math.floor(Math.random() * 15) + 5); // -5~-20
        }
      }
      
      // 信頼度系の検出
      if (tracker.name.includes('trust') || tracker.name.includes('信頼')) {
        if (response.includes('信じ') || response.includes('頼りになる') || response.includes('安心')) {
          change = Math.floor(Math.random() * 8) + 3; // +3~10
        } else if (response.includes('疑') || response.includes('怪しい') || response.includes('不安')) {
          change = -(Math.floor(Math.random() * 10) + 5); // -5~-15
        }
      }
      
      if (change !== 0) {
        const currentValue = tracker.current_value ?? tracker.initial_value ?? 0;
        const newValue = Math.max(
          tracker.min_value || 0, 
          Math.min(tracker.max_value || 100, currentValue + change)
        );
        
        updates.push({
          name: tracker.name,
          type: 'numeric',
          value: newValue,
          change: change > 0 ? `+${change}` : `${change}`
        });
        console.log(`📊 ${tracker.name}: ${currentValue} → ${newValue} (${change > 0 ? '+' : ''}${change})`);
      }
    } else if (tracker.type === 'state') {
      // 気分系の検出
      if (tracker.name.includes('mood') || tracker.name.includes('気分')) {
        let newState = '';
        
        if (response.includes('嬉しい') || response.includes('楽しい') || response.includes('幸せ')) {
          newState = '嬉しい';
        } else if (response.includes('悲しい') || response.includes('落ち込ん')) {
          newState = '悲しい';
        } else if (response.includes('怒') || response.includes('イライラ')) {
          newState = '怒り';
        } else if (response.includes('驚') || response.includes('びっくり')) {
          newState = '驚き';
        } else if (response.includes('普通') || response.includes('平気')) {
          newState = '普通';
        }
        
        if (newState && tracker.possible_states?.includes(newState)) {
          const currentState = tracker.current_state ?? tracker.initial_state ?? '普通';
          if (currentState !== newState) {
            updates.push({
              name: tracker.name,
              type: 'state',
              value: newState,
              change: `${currentState}→${newState}`
            });
            console.log(`📊 ${tracker.name}: ${currentState} → ${newState}`);
          }
        }
      }
    }
  });
  
  console.log('🔍 自動検出結果:', updates.length, '個の更新');
  return updates;
}


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
    
    // メモリ情報を追加（雰囲気・関係性・継続目標を強化）
    if (memos && characterId) {
      const memorySummary = MemoryManager.generateMemorySummary(
        memos,
        characterId || character.name,
        settings?.memorySize || 1000
      );

      // 直近履歴から雰囲気（mood）と関係性（relationship）を簡易抽出
      const recentTexts = Array.isArray(conversation)
        ? conversation
            .slice(-8)
            .map((m: { content?: string }) => String(m?.content || ''))
            .join('\n')
        : '';
      const moodHints = [
        { key: '親密', rx: /(優しい|微笑|頬を|触れ|寄り添|安心|ときめ|近づ)/ },
        { key: '緊張', rx: /(黙り|沈黙|張り詰|固ま|強張|ためら|警戒)/ },
        { key: '対立', rx: /(怒|叱|睨|拒否|反発|口論|言い争|刺々)/ },
        { key: '高揚', rx: /(興奮|熱|鼓動|ドキドキ|勢い|昂ぶ)/ },
        { key: '穏やか', rx: /(落ち着|穏やか|静か|ゆったり|安堵)/ },
      ];
      const relationshipHints = [
        { key: '初対面', rx: /(初めて|まだ知ら|自己紹介|はじめま|初対面)/ },
        { key: '知り合い', rx: /(久しぶり|最近|この前|前回|前にも)/ },
        { key: '仲間', rx: /(一緒|協力|任務|役割|相棒|助け)/ },
        { key: '友人', rx: /(友|気安|くだけ|冗談|笑い合)/ },
        { key: '親密', rx: /(抱|手を|寄り添|見つめ|照れ|赤面|キス)/ },
      ];
      const foundMood = moodHints.find(h => h.rx.test(recentTexts))?.key;
      const foundRel = relationshipHints.find(h => h.rx.test(recentTexts))?.key;

      const moodLine = foundMood ? `- 現在の雰囲気(推定): ${foundMood}` : '';
      const relLine = foundRel ? `- 関係性(推定): ${foundRel}` : '';

      // 継続目標（直前ラウンドの先へ進める具体方針）
      const continuationGoal =
        '直前の身体の動き・視線・距離感・声色などの具体描写を1つ以上引き継いで、' +
        '次の一歩（感情の変化や状況の進展）を短いアクション/セリフで前進させてください。';

      if (memorySummary || moodLine || relLine) {
        basePrompt += '\n\n【長期メモと雰囲気/関係性の指針】';
        if (memorySummary) basePrompt += `\n${memorySummary}`;
        if (moodLine || relLine) {
          basePrompt += '\n- 文脈ラベル（推定）:';
          if (moodLine) basePrompt += `\n  ${moodLine}`;
          if (relLine) basePrompt += `\n  ${relLine}`;
        }
        basePrompt += `\n- 継続目標: ${continuationGoal}`;
        basePrompt += '\nこの指針を踏まえ、唐突な場面転換や人格の齟齬を避け、前回までの「空気」を保ってください。';
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
      trackerInfo += '以下のパラメータを参考にして、キャラクターの状態を反映した返答をしてください。\n';
      trackerInfo += '**重要**: 会話内容に応じてパラメータを自然に変動させ、最終的にJSON形式で更新指示を返してください。\n\n';
      
      trackers.forEach(tracker => {
        if (tracker && tracker.display_name) {
          trackerInfo += `**${tracker.display_name}** (${tracker.name}): `;
          
          switch (tracker.type) {
            case 'numeric':
              // 現在値を使用（tracker.current_valueまたはinitial_value）
              const currentValue = tracker.current_value ?? tracker.initial_value ?? 0;
              const min = tracker.min_value || 0;
              const max = tracker.max_value || 100;
              trackerInfo += `${currentValue}/${max} (範囲: ${min}-${max})`;
              break;
            case 'state':
              const currentState = tracker.current_state ?? tracker.initial_state ?? '不明';
              trackerInfo += `${currentState}`;
              if (tracker.possible_states && tracker.possible_states.length > 0) {
                trackerInfo += ` (可能な状態: ${tracker.possible_states.join(', ')})`;
              }
              break;
            case 'boolean':
              const currentBoolean = tracker.current_boolean ?? tracker.initial_boolean ?? false;
              trackerInfo += `${currentBoolean ? '有効' : '無効'}`;
              break;
            case 'text':
              const currentText = tracker.current_text ?? tracker.initial_text ?? '';
              trackerInfo += `${currentText || '(空)'}`;
              break;
          }
          
          if (tracker.description) {
            trackerInfo += ` - ${tracker.description}`;
          }
          
          trackerInfo += '\n';
        }
      });
      
      // AI用の更新指示を追加
      trackerInfo += `\n**トラッカー更新指示**:\n`;
      trackerInfo += `会話の内容に基づいて、適切なパラメータを変更してください。例:\n`;
      trackerInfo += `- ユーザーが優しい言葉をかけた → 好感度+5～15\n`;
      trackerInfo += `- ユーザーが冷たい態度を取った → 好感度-10～20\n`;
      trackerInfo += `- 楽しい会話 → 気分を「楽しい」や「嬉しい」に\n`;
      trackerInfo += `- 信頼できる行動 → 信頼度+5～10\n\n`;
      
      trackerInfo += `変更がある場合、応答の最後に以下の形式でJSONを含めてください:\n`;
      trackerInfo += `\`\`\`json\n`;
      trackerInfo += `{\n`;
      trackerInfo += `  "tracker_updates": [\n`;
      trackerInfo += `    {"name": "affection", "type": "numeric", "value": 75, "change": "+5"},\n`;
      trackerInfo += `    {"name": "mood", "type": "state", "value": "嬉しい", "change": "楽しい→嬉しい"}\n`;
      trackerInfo += `  ]\n`;
      trackerInfo += `}\n`;
      trackerInfo += `\`\`\`\n`;
      
      basePrompt += trackerInfo;
      console.log('📊 トラッカー情報をプロンプトに追加:', trackers.length, '個');
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

    // 直近のユーザー発言と直前のAI発言を強制的に再提示（直前ラウンド忘却対策）
    // conversation から最後の user/assistant を抽出して、最新入力の直前に再掲する
    const lastAssistant = Array.isArray(conversation)
      ? [...conversation].reverse().find((m: {role:string, content:string}) => m?.role === 'assistant' && m.content?.trim())
      : undefined;
    const lastUser = Array.isArray(conversation)
      ? [...conversation].reverse().find((m: {role:string, content:string}) => m?.role === 'user' && m.content?.trim())
      : undefined;

    if (lastUser || lastAssistant) {
      basePrompt += '\n\n【直前のやり取り（忘れず反映すること）】\n';
      if (lastUser) {
        basePrompt += `直前ユーザー: ${lastUser.content}\n`;
      }
      if (lastAssistant) {
        basePrompt += `直前${character?.name || '{{char}}'}: ${lastAssistant.content}\n`;
      }
      basePrompt += 'この直前のやり取りを必ず踏まえて、会話を自然に継続してください。';
    }
    
    // 会話履歴をテキスト化（空文字やundefinedを除外）
    // ---- プロンプト短縮 ----
    // 1) 空行除去 2) 直近の履歴を適切に制限 3) 長すぎるメッセージは要約
    console.log(`📚 元の会話履歴件数: ${conversation ? conversation.length : 0}`);
    // 履歴をより多めに保持（最低12、上限32まで）し、長文は要約
    const targetHistorySize = Math.max(12, Math.min(settings?.historySize || 24, 32));
    // 直前の1往復は要約せずそのまま保持し、それ以前のみ要約（直近忘却対策）
    const filteredConversation = (conversation && Array.isArray(conversation))
      ? conversation
          .filter((msg: { role: string; content: string }) => msg && typeof msg.content === 'string' && msg.content.trim().length > 0)
          .slice(-targetHistorySize)
          .map((msg: { role: string; content: string }, idx: number, arr: Array<{role:string; content:string}>) => {
            const isInLastTurnPair =
              idx >= arr.length - 2 // 最後の2件（直近のuserとassistant想定）
              || (idx === arr.length - 3 && arr.length >= 3 && arr[arr.length - 1]?.role === 'assistant' && arr[arr.length - 2]?.role === 'user');
            if (!isInLastTurnPair && msg.content.length > 300) {
              return {
                role: msg.role as 'user' | 'assistant',
                content: msg.content.substring(0, 300) + '...'
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

    // 履歴の文脈重視を明示（モデルの挙動を補助）
    if (historyText) {
      basePrompt += '\n\n【履歴の扱い】以下の会話履歴を強く参考にし、継続性のある返答を心がけてください。';
    }

    // ユーザー行（continue 時は追加しない）
    const userLine = doContinue ? '' : `{{user}}: ${message}\n`;

    // 続きを話す（doContinue=true）のときは、明確に「直前のAI発話から継続」指示を追加
    let continuationHeader = '';
    if (doContinue) {
      continuationHeader =
        '\n【続き指示】以下の履歴の直後から、' +
        '{{char}}の返答・独白・行動・心情描写のみで自然に物語/会話を継続してください。' +
        '前回の{{char}}の発言や描写を踏まえ、同じ場面・同じ流れを保ちつつ前進させてください。' +
        '新規の導入や要約は不要です。呼びかけや前置きも省き、直ちに継続本文を書き始めてください。';
    }

    let fullPrompt = `${basePrompt}${continuationHeader}\n\n${historyText}${historyText ? '\n' : ''}${userLine}{{char}}:`;

    if (doContinue) {
      // 具体的なガイドラインを強化（再生成との違いを明確化）
      fullPrompt +=
        '\n【禁止事項】要約、前回の内容の繰り返し、メタ説明、ユーザーの台詞や行動、場面転換のやり直し。\n' +
        '【必須】直前の情景・身体の動き・心情を引き継ぐ。新しい具体的な行動/セリフで一歩進める。';
    }
    
    console.log(`📄 プロンプト生成完了 - 文字数: ${fullPrompt.length}`);
    
    // プロンプト長が2000文字を超える場合は古い履歴から削除
    // 直前ターンを守るため、総量上限をやや拡大
    const MAX_PROMPT_CHARS = 3800;
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

          // トラッカー更新情報を抽出
          let extractedTrackers: any[] = [];
          let cleanedResponse = candidates[0];
          
          if (candidates.length > 0) {
            const mainResponse = candidates[0];
            console.log('📊 トラッカー更新情報を抽出中:', mainResponse.substring(0, 200));
            
            // JSONブロックの抽出と除去（複数パターンに対応）
            const jsonPatterns = [
              /```json\s*([\s\S]*?)\s*```/g,
              /```\s*([\s\S]*?)\s*```/g,
              /\{[^}]*"tracker_updates"[^}]*\}/g,
              /\{[\s\S]*?"tracker_updates"[\s\S]*?\}/g
            ];
            
            let foundTrackerUpdates = false;
            
            for (const pattern of jsonPatterns) {
              const matches = mainResponse.match(pattern);
              if (matches) {
                for (const jsonMatch of matches) {
                  try {
                    // JSONの内容を抽出
                    let jsonContent = jsonMatch.replace(/```json\s*|\s*```|```\s*|\s*```/g, '').trim();
                    
                    // もしJSONでなく文字列の場合、より柔軟に処理
                    if (!jsonContent.startsWith('{')) {
                      const jsonStart = jsonContent.indexOf('{');
                      const jsonEnd = jsonContent.lastIndexOf('}');
                      if (jsonStart !== -1 && jsonEnd !== -1) {
                        jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
                      }
                    }
                    
                    const parsed = JSON.parse(jsonContent);
                    
                    if (parsed.tracker_updates && Array.isArray(parsed.tracker_updates)) {
                      console.log('📊 トラッカー更新指示を発見:', parsed.tracker_updates);
                      extractedTrackers = parsed.tracker_updates;
                      foundTrackerUpdates = true;
                      
                      // 応答からJSONブロックを削除
                      cleanedResponse = mainResponse.replace(jsonMatch, '').trim();
                      console.log('🧹 JSON除去後の応答長:', cleanedResponse.length);
                      break;
                    }
                  } catch (parseError) {
                    console.warn('⚠️ JSON解析失敗:', parseError);
                  }
                }
                if (foundTrackerUpdates) break;
              }
            }
            
            // その他のメタデータ的な文言も除去
            if (!foundTrackerUpdates) {
              // トラッカー関連のメタ文言を除去
              cleanedResponse = cleanedResponse
                .replace(/\[?トラッカー.*?更新.*?\]?/gi, '')
                .replace(/\[?パラメータ.*?変更.*?\]?/gi, '')
                .replace(/\[?.*?トラッカー.*?\]?/gi, '')
                .replace(/【.*?トラッカー.*?】/gi, '')
                .replace(/（.*?トラッカー.*?）/gi, '')
                .replace(/\*.*?トラッカー.*?\*/gi, '')
                .trim();
            }
            
            // JSONが見つからない場合、自動推測
            if (extractedTrackers.length === 0 && trackers) {
              console.log('📊 JSONが見つからない、自動推測を試行');
              extractedTrackers = autoDetectTrackerChanges(mainResponse, trackers);
            }
          }

          return NextResponse.json({
            success: true,
            content: cleanedResponse, // クリーンアップされた応答を使用
            candidates: [cleanedResponse], // 候補もクリーンアップ
            trackers: extractedTrackers // 更新されたトラッカー情報を返す
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
