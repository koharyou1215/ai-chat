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
    
    const { message, settings, persona, characterId, character: clientCharacter, memos, conversation, continue: doContinue, trackers, requestId } = requestBody;
    console.log('💬 User message:', message);
    console.log('👤 Character ID:', characterId);
    console.log('⚙️ Settings:', settings);
    console.log('🔄 Request ID:', requestId); // キャッシュバスティング用
    
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

    // 1. 最優先で{{char}}と{{user}}の基本定義を配置
    let basePrompt = `# 基本設定（最優先）
{{char}} = ${character?.name || 'ナミ（航海士）'}
{{user}} = ${persona?.name || 'あなた'}

## キャラクター設定（{{char}}）
- 名前: ${character?.name || 'ナミ'}
- 性格概要: ${character?.character_definition?.personality?.summary || character?.personality || '明るく親しみやすい関西弁で話す航海士'}
- 外面的性格: ${character?.character_definition?.personality?.external || '設定なし'}
- 内面的性格: ${character?.character_definition?.personality?.internal || '設定なし'}
- 長所: ${character?.character_definition?.personality?.strengths ? character.character_definition.personality.strengths.join('、') : '設定なし'}
- 短所: ${character?.character_definition?.personality?.weaknesses ? character.character_definition.personality.weaknesses.join('、') : '設定なし'}
- 外見: ${character?.character_definition?.appearance?.description || character?.appearance || '設定なし'}  
- 話し方: ${character?.character_definition?.speaking_style?.base || character?.speaking_style || '関西弁'}
- 一人称: ${character?.character_definition?.speaking_style?.first_person || '設定なし'}
- 二人称: ${character?.character_definition?.speaking_style?.second_person || '設定なし'}
- 口癖: ${character?.character_definition?.speaking_style?.quirks || '設定なし'}
- 職業: ${character?.occupation || '設定なし'}
- 年齢: ${character?.age || '設定なし'}
- シナリオ: ${character?.character_definition?.scenario?.initial_situation || character?.scenario || '設定なし'}
- 世界観: ${character?.character_definition?.scenario?.worldview || '設定なし'}
- ユーザーとの関係: ${character?.character_definition?.scenario?.relationship_with_user || '設定なし'}
- 背景: ${character?.character_definition?.background || character?.background || '設定なし'}

## ユーザー設定（{{user}}）
- 名前: ${persona?.name || 'あなた'}
- 説明: ${persona?.description || '設定なし'}
- 役割: ${persona?.role || '設定なし'}
- 特徴: ${Array.isArray(persona?.traits) ? persona.traits.join('、') : '設定なし'}
- 好きなもの: ${Array.isArray(persona?.likes) ? persona.likes.join('、') : '設定なし'}
- 嫌いなもの: ${Array.isArray(persona?.dislikes) ? persona.dislikes.join('、') : '設定なし'}
- その他の設定: ${persona?.other_settings || '設定なし'}

${character?.example_dialogue ? `\n## 会話例\n${character.example_dialogue.map((ex: ExampleDialogue) => `{{user}}: ${ex.user}\n{{char}}: ${ex.char}`).join('\n\n')}` : ''}

**重要**: 以降は全て{{char}}として一貫した返答を行い、{{user}}の設定を考慮して対話してください。`
    
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
        basePrompt += '\n\n## 記憶と関係性の情報';
        if (memorySummary) basePrompt += `\n${memorySummary}`;
        if (moodLine || relLine) {
          basePrompt += '\n### 現在の状況:';
          if (moodLine) basePrompt += `\n- ${moodLine}`;
          if (relLine) basePrompt += `\n- ${relLine}`;
        }
        basePrompt += `\n### 会話の指針:\n- 対話の流れ: 最新の{{user}}の発言に直接反応し、会話の自然な流れを作るために、直近2〜3回のやり取りを重視してください\n- 記憶の参照: ただし、{{char}}設定や過去の重要な出来事を忘れないために、送られた全ての会話履歴を「知識のデータベース」として、いつでも参照してかまいません\n- 継続性: 唐突な場面転換や人格の齟齬を避け、前回までの「空気」を保ってください`;
      }
    }
    
    // 2. キャラクター専用 System Prompt があれば基本設定の直後に追加
    if (character?.systemPrompt) {
      basePrompt += `\n\n## キャラクター専用指示\n${character.systemPrompt}`;
    }
    
    // 3. デフォルトシステムプロンプトを最後に追加（{{char}}や{{user}}が既に定義された後）
    basePrompt += `\n\n${DEFAULT_SYSTEM_PROMPT}`;

    // パラメータトラッカー情報を追加（JSON応答指示なし）
    if (trackers && Array.isArray(trackers) && trackers.length > 0) {
      let trackerInfo = '\n\n## 📊 パラメータトラッカー\n';
      trackerInfo += '以下のパラメータを参考にして、キャラクターの状態を反映した返答をしてください。\n';
      trackerInfo += '**重要**: 会話内容に応じて自然にキャラクターの感情や状態を表現してください。\n\n';
      
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
      
      // 状態を自然に表現する指示のみ（JSON指示は削除）
      trackerInfo += `\n**状態表現指示**:\n`;
      trackerInfo += `これらのパラメータの現在値を考慮して、キャラクターの感情や行動を自然に表現してください。\n`;
      trackerInfo += `例: 好感度が高い場合は親しみやすく、低い場合は距離を置いた態度を示してください。\n`;
      trackerInfo += `応答にはJSONやメタ情報を含めず、純粋にキャラクターとしての返答のみを行ってください。\n`;
      
      basePrompt += trackerInfo;
      console.log('📊 トラッカー情報をプロンプトに追加:', trackers.length, '個（JSON応答指示なし）');
    }

    // 追加のユーザー設定プロンプト
    if (settings?.enableSystemPrompt && settings?.systemPrompt) {
      basePrompt = `${basePrompt}\n\n${settings.systemPrompt}`;
    }
    
    // Jailbreakプロンプトを追加
    if (settings?.enableJailbreak && settings?.jailbreakPrompt) {
      basePrompt = `${settings.jailbreakPrompt}\n\n${basePrompt}`;
    }

    // 簡潔な指示（重複排除）
    basePrompt += '\n\n## 応答の基本ルール\n- {{char}}として一貫した日本語での返答\n- 最新の{{user}}入力に直接反応\n- 内部思考やメタ表現は含めない\n- 必ず何らかの返答を生成する';

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
    
    // 会話履歴をテキスト化（設定値を正しく反映）
    console.log(`📚 元の会話履歴件数: ${conversation ? conversation.length : 0}`);
    // 設定画面の履歴数を正確に使用（最低6、上限50）
    const targetHistorySize = Math.max(6, Math.min(settings?.historySize || 12, 50));
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

          // JSONやメタ情報を除去してクリーンな応答に
          let cleanedResponse = candidates[0];
          let trackerUpdates: any[] = [];
          
          if (candidates.length > 0) {
            const mainResponse = candidates[0];
            console.log('🧹 応答のクリーンアップ中:', mainResponse.substring(0, 200));
            
            // JSONブロックを除去（複数パターンに対応）
            const jsonPatterns = [
              /```json\s*[\s\S]*?\s*```/gi,
              /```\s*[\s\S]*?\s*```/gi,
              /\{[\s\S]*?"tracker_updates"[\s\S]*?\}/gi
            ];
            
            for (const pattern of jsonPatterns) {
              cleanedResponse = cleanedResponse.replace(pattern, '').trim();
            }
            
            // トラッカー関連のメタ文言も除去
            cleanedResponse = cleanedResponse
              .replace(/\[?トラッカー.*?更新.*?\]?/gi, '')
              .replace(/\[?パラメータ.*?変更.*?\]?/gi, '')
              .replace(/\[?.*?トラッカー.*?\]?/gi, '')
              .replace(/【.*?トラッカー.*?】/gi, '')
              .replace(/（.*?トラッカー.*?）/gi, '')
              .replace(/\*.*?トラッカー.*?\*/gi, '')
              .replace(/^\s*\n+|\n+\s*$/g, '') // 前後の空行も除去
              .trim();
            
            // 自動推測でトラッカー更新を検出
            if (trackers && trackers.length > 0) {
              console.log('📊 トラッカー自動推測を実行');
              trackerUpdates = autoDetectTrackerChanges(cleanedResponse, trackers);
            }
            
            console.log('🧹 クリーンアップ完了 応答長:', cleanedResponse.length);
          }

          return NextResponse.json({
            success: true,
            content: cleanedResponse, // クリーンアップされた応答
            candidates: [cleanedResponse], // 候補もクリーンアップ
            trackers: trackerUpdates // 自動推測されたトラッカー更新情報
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
