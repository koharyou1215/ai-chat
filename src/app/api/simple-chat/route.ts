import { NextRequest, NextResponse } from 'next/server';
import { MemoryManager } from '../../../../lib/memoryManager';
import { CharacterLoader } from '../../../../lib/characterLoader';
import { ExampleDialogue } from '../../../../types/character';
import { DEFAULT_SYSTEM_PROMPT } from '../../../../lib/defaultSystemPrompt';
import { GeminiApiManager } from '../../../../lib/geminiApiManager';

// 汎用トラッカー自動検出システム - 拡張版
function autoDetectTrackerChanges(aiResponse: string, trackers: any[]): any[] {
  const updates: any[] = [];
  const response = aiResponse.toLowerCase();
  const originalResponse = aiResponse; // 大文字小文字を区別する検索用
  
  console.log('🔍 自動検出開始:', response.substring(0, 100));
  
  // 数値型トラッカーの検出ルール（大幅拡張）
  const numericRules = [
    // 好感度・愛情系
    {
      patterns: ['affection', '好感度', 'love', 'fondness', 'like', 'crush'],
      positive: {
        keywords: ['嬉しい', 'ありがと', '素敵', '可愛い', 'きゃぴ', '☆', '♡', '好き', '愛', '素晴らしい', '最高', 'いいね', '楽しい', '幸せ', 'ときめ', 'ドキドキ', '微笑', '頬を赤らめ', '恥ずかしそう'],
        change: [3, 12] // +3~12
      },
      negative: {
        keywords: ['悲しい', 'がっかり', '冷たい', '嫌', '怒', '不快', '最悪', 'つまらない', '退屈', 'イライラ', '憎い', '許せない'],
        change: [-15, -3] // -15~-3
      }
    },
    // 信頼度系
    {
      patterns: ['trust', '信頼', 'confidence', 'faith', 'belief'],
      positive: {
        keywords: ['信じ', '頼りになる', '安心', '任せ', '頼む', '信用', '安全', '守って', '助けて', '大丈夫', '心配ない', '信頼'],
        change: [2, 10]
      },
      negative: {
        keywords: ['疑', '怪しい', '不安', '心配', '危険', '騙', '嘘', '裏切', '信用できない', '怖い'],
        change: [-12, -2]
      }
    },
    // 気分・機嫌系
    {
      patterns: ['mood', '気分', '機嫌', 'temper', 'spirit'],
      positive: {
        keywords: ['元気', '明るい', 'ワクワク', '興奮', '楽しみ', '上機嫌', '最高', '調子いい', 'いい感じ'],
        change: [2, 8]
      },
      negative: {
        keywords: ['疲れ', 'だるい', '眠い', '調子悪い', 'イライラ', 'ムカつく', '機嫌悪い', '憂鬱'],
        change: [-10, -2]
      }
    },
    // 興味・関心系
    {
      patterns: ['interest', '興味', 'curiosity', '関心', 'fascination'],
      positive: {
        keywords: ['面白い', '興味深い', '気になる', '知りたい', '教えて', '詳しく', '続きを', '素晴らしい'],
        change: [3, 8]
      },
      negative: {
        keywords: ['つまらない', '興味ない', 'どうでもいい', '飽きた', '退屈', 'もういい'],
        change: [-8, -2]
      }
    },
    // 没入度・集中度系
    {
      patterns: ['immersion', '没入', 'focus', '集中', 'engagement', 'role'],
      positive: {
        keywords: ['集中', '夢中', '没頭', '真剣', '本気', '演技', '役', 'なりきり', '完璧', '上手', 'リアル'],
        change: [3, 10]
      },
      negative: {
        keywords: ['集中できない', '気が散る', 'つまらない', '冷める', '現実', '普通', '適当'],
        change: [-8, -2]
      }
    },
    // 依存度・執着系
    {
      patterns: ['dependence', '依存', 'attachment', '執着', 'obsession'],
      positive: {
        keywords: ['離れたくない', 'ずっと', '必要', 'もっと', '欲しい', '求める', '切望', '渇望', '一緒に'],
        change: [2, 8]
      },
      negative: {
        keywords: ['離れる', '距離', '独立', '一人で', '必要ない', '満足', '十分'],
        change: [-6, -2]
      }
    },
    // 恥ずかしさ・羞恥系
    {
      patterns: ['shyness', '恥ずかし', 'embarrass', 'blush', '羞恥'],
      positive: {
        keywords: ['恥ずかし', '赤面', '頬を染め', '照れ', 'もじもじ', '恥じらい', 'ドキドキ', '緊張'],
        change: [2, 8]
      },
      negative: {
        keywords: ['堂々', '平気', '慣れた', '普通', '何ともない', '冷静'],
        change: [-6, -2]
      }
    },
    // 興奮・覚醒系
    {
      patterns: ['excitement', '興奮', 'arousal', '覚醒', 'stimulation'],
      positive: {
        keywords: ['興奮', 'ドキドキ', '鼓動', '熱い', '火照', '息づか', 'ゾクゾク', '刺激', 'うっとり'],
        change: [3, 10]
      },
      negative: {
        keywords: ['冷静', '落ち着', '平常', '冷める', '静か', '普通'],
        change: [-8, -3]
      }
    },
    // 体調・状態系（媚薬効果など）
    {
      patterns: ['effect', '効果', 'condition', '状態', 'influence', 'aphrodisiac', '媚薬'],
      positive: {
        keywords: ['効いて', '効果', '敏感', '感覚', '鋭敏', '変化', '影響', '作用', '薬', '魔法', 'じんわり', 'ふわふわ'],
        change: [2, 8]
      },
      negative: {
        keywords: ['効かない', '普通', '変わらない', '元通り', '回復', '正常'],
        change: [-6, -2]
      }
    },
    // 体験・経験系
    {
      patterns: ['experience', '体験', 'memory', '記憶', 'impression'],
      positive: {
        keywords: ['初めて', '新しい', '特別', '印象的', '忘れられない', '素晴らしい', '感動', '驚き'],
        change: [2, 6]
      },
      negative: {
        keywords: ['慣れた', 'いつもの', '普通', '退屈', 'つまらない'],
        change: [-4, -1]
      }
    },
    // 距離感・親密度系
    {
      patterns: ['distance', '距離', 'intimacy', '親密', 'closeness', '近さ'],
      positive: {
        keywords: ['近づく', '寄り添', '触れ', '抱きしめ', '密着', '一緒', 'そば', '隣'],
        change: [3, 8]
      },
      negative: {
        keywords: ['離れる', '距離', '遠ざか', '一人', '別々', '避ける'],
        change: [-6, -2]
      }
    }
  ];

  // 状態型トラッカーの検出ルール（拡張版）
  const stateRules = [
    {
      patterns: ['mood', '気分', '機嫌', 'feeling', 'emotion'],
      states: {
        '嬉しい': ['嬉しい', '喜', '楽しい', '幸せ', '最高', 'ハッピー', 'きゃぴ', '☆', '♡', 'わーい', 'やった'],
        '悲しい': ['悲しい', '落ち込', '憂鬱', '沈ん', 'ブルー', '泣き', 'しょんぼり', '寂し'],
        '怒り': ['怒', 'イライラ', 'ムカつ', '腹立', 'プンプン', '激怒', '憤慨'],
        '驚き': ['驚', 'びっくり', 'えっ', '！？', '衝撃', 'ショック', 'まさか', '信じられない'],
        '恥ずかし': ['恥ずかし', '照れ', '赤面', 'もじもじ', '頬を染め', '恥じらい'],
        '興奮': ['興奮', 'ドキドキ', 'ワクワク', '熱い', '鼓動', '心臓', '脈拍'],
        '普通': ['普通', '平気', '冷静', '落ち着', '安定', '穏やか'],
        '困惑': ['困惑', '戸惑', '混乱', 'わからない', '理解できない', '不思議']
      }
    },
    {
      patterns: ['relationship', '関係', 'relation'],
      states: {
        '初対面': ['初めて', 'はじめまして', '初対面', '知らない', '会ったばかり'],
        '知り合い': ['知り合い', '顔見知り', '会ったことが'],
        '友人': ['友達', '友人', '仲間', 'フレンド'],
        '親友': ['親友', '大切な友達', '特別な友達', '無二の友'],
        '恋人': ['恋人', '彼氏', '彼女', '愛する人', '恋愛関係'],
        'パートナー': ['パートナー', '運命の人', '伴侶', '生涯の', '永遠の']
      }
    },
    {
      patterns: ['activity', '活動', '状況', 'situation', 'current'],
      states: {
        '会話中': ['話', '会話', 'おしゃべり', '対話', '談話'],
        '休息中': ['休憩', '休息', 'リラックス', 'のんびり', '寝転', 'ゴロゴロ'],
        '作業中': ['作業', '仕事', '勉強', '集中', '忙し', '取り組'],
        '移動中': ['歩', '移動', '向かう', '行く', '進む', '歩い'],
        '食事中': ['食べ', '食事', '飲み', '味わ', '食す'],
        '娯楽中': ['遊び', 'ゲーム', '娯楽', '楽しんで', 'エンタメ'],
        '探索中': ['探し', '探索', '調べ', '発見', '見つけ'],
        '戦闘中': ['戦闘', '戦い', 'バトル', '攻撃', '守備'],
        '学習中': ['学習', '覚え', '習得', 'マスター', '練習'],
        '買い物中': ['買い物', 'ショッピング', '購入', '選ん'],
        '待機中': ['待機', '待っ', 'スタンバイ', '準備']
      }
    },
    {
      patterns: ['restraint', '拘束', 'bound', 'tied', 'restriction'],
      states: {
        '自由': ['自由', '解放', '束縛なし', '動ける', '制約なし'],
        '軽度拘束': ['軽く', '少し', '軽度', '軽い拘束'],
        '手足拘束': ['手足', '四肢', '縛られ', 'tied'],
        '手足拘束＋目隠し': ['目隠し', '見えない', 'blindfold', '暗闇'],
        '完全固定': ['完全', '身動き', '固定', '動けない']
      }
    },
    {
      patterns: ['vision', '視界', 'sight', 'eyes', '目'],
      states: {
        '正常': ['見える', '視界良好', '明るい', 'クリア'],
        '目隠し': ['目隠し', '見えない', '真っ暗', '暗闇', 'blind'],
        'ぼやけ': ['ぼやけ', '霞む', '不鮮明', 'ピンぼけ'],
        '眩し': ['眩し', '光', '明る過ぎ', '眼が']
      }
    }
  ];

  // ブール型トラッカーの検出ルール（拡張版）
  const booleanRules = [
    {
      patterns: ['aware', '気づ', 'realize', '理解', 'understand', 'knows', 'conscious'],
      true_keywords: ['気づく', '理解', 'わかる', '分かる', '知る', '発見', '判明', '明らか', '把握', '認識', '察し', '悟る'],
      false_keywords: ['気づかない', 'わからない', '分からない', '知らない', '無知', '無自覚', '見当つかない', '不明']
    },
    {
      patterns: ['blindfold', '目隠し', 'blind', 'eyes_covered', 'sight'],
      true_keywords: ['目隠し', '見えない', '真っ暗', '暗闇', 'blindfold', 'blind', '視界なし', '盲目'],
      false_keywords: ['目隠しを外', '見える', '明るい', '視界', '目を開け', '光', '見た', '視認']
    },
    {
      patterns: ['restrain', '拘束', 'bound', 'tied', 'restrict'],
      true_keywords: ['拘束', '縛', '束縛', '手足', '動けない', 'tied', 'bound', '固定', '制限'],
      false_keywords: ['自由', '解放', '外す', '動ける', 'free', '解除', 'リリース', '開放']
    },
    {
      patterns: ['active', '活動', 'functioning', '機能', 'working'],
      true_keywords: ['活動中', '機能している', '動作', '稼働', '有効', 'オン', '起動'],
      false_keywords: ['停止', '無効', '機能停止', 'オフ', '休止', '非活動']
    },
    {
      patterns: ['memory', '記憶', 'remember', '覚え', 'recall'],
      true_keywords: ['覚えて', '記憶', '思い出', '覚え', '忘れない', 'remember'],
      false_keywords: ['忘れ', '記憶なし', '思い出せない', '覚えていない', 'forget']
    },
    {
      patterns: ['secret', '秘密', 'hidden', '隠し', 'private'],
      true_keywords: ['秘密', '隠し', '内緒', 'secret', 'private', '非公開', '秘匿'],
      false_keywords: ['公開', '明かす', '暴露', '告白', 'open', '表に']
    },
    {
      patterns: ['complete', '完了', 'finished', '終了', 'done'],
      true_keywords: ['完了', '終了', '完成', 'done', 'finished', '達成', '済み'],
      false_keywords: ['未完了', '途中', '進行中', '未達成', '未完成', 'ongoing']
    },
    {
      patterns: ['trust', '信頼', 'believe', '信じ'],
      true_keywords: ['信じる', '信頼', 'believe', '確信', '信用', '頼り'],
      false_keywords: ['疑う', '信じない', '不信', '疑問', '疑い', 'doubt']
    }
  ];

  // 数値型トラッカーの処理
  trackers.forEach(tracker => {
    if (!tracker || !tracker.name) return;
    
    if (tracker.type === 'numeric') {
      let totalChange = 0;
      
      numericRules.forEach(rule => {
        const matchesPattern = rule.patterns.some(pattern => 
          tracker.name.toLowerCase().includes(pattern) ||
          tracker.display_name?.toLowerCase().includes(pattern)
        );
        
        if (matchesPattern) {
          // ポジティブな変化をチェック
          const positiveMatch = rule.positive.keywords.some(keyword => 
            response.includes(keyword) || originalResponse.includes(keyword)
          );
          if (positiveMatch) {
            const change = Math.floor(Math.random() * (rule.positive.change[1] - rule.positive.change[0] + 1)) + rule.positive.change[0];
            totalChange += change;
          }
          
          // ネガティブな変化をチェック
          const negativeMatch = rule.negative.keywords.some(keyword => 
            response.includes(keyword) || originalResponse.includes(keyword)
          );
          if (negativeMatch) {
            const change = Math.floor(Math.random() * (Math.abs(rule.negative.change[0]) - Math.abs(rule.negative.change[1]) + 1)) + Math.abs(rule.negative.change[1]);
            totalChange -= change;
          }
        }
      });
      
      if (totalChange !== 0) {
        const currentValue = tracker.current_value ?? tracker.initial_value ?? 0;
        const newValue = Math.max(
          tracker.min_value || 0, 
          Math.min(tracker.max_value || 100, currentValue + totalChange)
        );
        
        if (newValue !== currentValue) {
          updates.push({
            name: tracker.name,
            type: 'numeric',
            value: newValue,
            change: totalChange > 0 ? `+${totalChange}` : `${totalChange}`
          });
          console.log(`📊 ${tracker.display_name || tracker.name}: ${currentValue} → ${newValue} (${totalChange > 0 ? '+' : ''}${totalChange})`);
        }
      }
    } else if (tracker.type === 'state') {
      // 状態型の処理
      stateRules.forEach(rule => {
        const matchesPattern = rule.patterns.some(pattern => 
          tracker.name.toLowerCase().includes(pattern) ||
          tracker.display_name?.toLowerCase().includes(pattern)
        );
        
        if (matchesPattern && rule.states) {
          for (const [stateName, keywords] of Object.entries(rule.states)) {
            const matches = keywords.some(keyword => 
              response.includes(keyword) || originalResponse.includes(keyword)
            );
            
            if (matches && tracker.possible_states?.includes(stateName)) {
              const currentState = tracker.current_state ?? tracker.initial_state ?? '';
              if (currentState !== stateName) {
                updates.push({
                  name: tracker.name,
                  type: 'state',
                  value: stateName,
                  change: `${currentState}→${stateName}`
                });
                console.log(`📊 ${tracker.display_name || tracker.name}: ${currentState} → ${stateName}`);
                break; // 最初にマッチした状態を採用
              }
            }
          }
        }
      });
    } else if (tracker.type === 'boolean') {
      // ブール型の処理
      booleanRules.forEach(rule => {
        const matchesPattern = rule.patterns.some(pattern => 
          tracker.name.toLowerCase().includes(pattern) ||
          tracker.display_name?.toLowerCase().includes(pattern)
        );
        
        if (matchesPattern) {
          const trueMatch = rule.true_keywords.some(keyword => 
            response.includes(keyword) || originalResponse.includes(keyword)
          );
          const falseMatch = rule.false_keywords.some(keyword => 
            response.includes(keyword) || originalResponse.includes(keyword)
          );
          
          const currentValue = tracker.current_boolean ?? tracker.initial_boolean ?? false;
          let newValue = currentValue;
          
          if (trueMatch && !currentValue) {
            newValue = true;
          } else if (falseMatch && currentValue) {
            newValue = false;
          }
          
          if (newValue !== currentValue) {
            updates.push({
              name: tracker.name,
              type: 'boolean',
              value: newValue,
              change: `${currentValue}→${newValue}`
            });
            console.log(`📊 ${tracker.display_name || tracker.name}: ${currentValue} → ${newValue}`);
          }
        }
      });
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
