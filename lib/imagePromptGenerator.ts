import { Character } from '../types/character';

export interface ImagePromptResult {
  prompt: string;
  negativePrompt: string;
  emotion: string;
  scenario: string;
}

export class ImagePromptGenerator {
  /**
   * AIの返答と会話状況から最適な画像プロンプトを生成
   */
  static generateImagePrompt(
    character: Character,
    aiResponse: string,
    conversationContext?: string[],
    settings?: any
  ): ImagePromptResult {
    // 設定値の取得（デフォルト値付き）
    const contextWeight = settings?.contextPromptWeight ?? 0.7;
    const emotionSensitivity = settings?.emotionDetectionSensitivity ?? 0.5;
    const scenarioEnabled = settings?.scenarioDetectionEnabled ?? true;
    const qualityTags = settings?.customQualityTags || 'masterpiece, best quality, highly detailed, beautiful lighting, anime style, high resolution, 8k';
    
    console.log('🎨 画像生成設定:', {
      contextWeight,
      emotionSensitivity,
      scenarioEnabled,
      customQualityTags: settings?.customQualityTags ? 'カスタム設定' : 'デフォルト使用'
    });
    
    // 基本キャラクター情報
    const baseCharacter = this.buildBaseCharacterPrompt(character);
    
    // 会話履歴が無効な場合は基本外見のみ
    if (contextWeight === 0.0) {
      return {
        prompt: `${baseCharacter}, ${qualityTags}`,
        negativePrompt: this.buildNegativePrompt(character),
        emotion: '自然',
        scenario: 'デフォルト'
      };
    }
    
    // 感情分析（感度に基づいて調整）
    const emotion = this.analyzeEmotion(aiResponse, emotionSensitivity);
    
    // シチュエーション分析（設定で無効にできる）
    const scenario = scenarioEnabled ? 
      this.analyzeScenario(aiResponse, conversationContext) : 
      { name: 'デフォルト', prompt: '' };
    
    // アクション分析（何をしているか）
    const action = this.analyzeAction(aiResponse);
    
    // 表情と仕草の詳細分析
    const expression = this.analyzeDetailedExpression(aiResponse);
    
    // 衣装の状態分析（新機能）
    const clothingState = this.analyzeClothingState(aiResponse, conversationContext);
    
    // 最終プロンプトを構築（重みを考慮）
    const prompt = this.buildEnhancedPrompt(
      baseCharacter, 
      emotion, 
      scenario, 
      action, 
      expression, 
      clothingState, 
      contextWeight,
      qualityTags
    );
    
    // ネガティブプロンプト
    const negativePrompt = this.buildNegativePrompt(character);
    
    return {
      prompt,
      negativePrompt,
      emotion: emotion.name,
      scenario: scenario.name
    };
  }

  /**
   * キャラクターの基本外見プロンプトを構築
   */
  private static buildBaseCharacterPrompt(character: Character): string {
    const appearance = character.character_definition?.appearance;
    
    // 1. ルートレベルの英文プロンプトを最優先使用
    if (character.appearancePrompt) {
      console.log('🎨 ルートレベルの外見プロンプト使用:', character.appearancePrompt);
      return character.appearancePrompt;
    }
    
    // 2. character_definition内の英文プロンプトをチェック
    if (appearance?.prompt) {
      console.log('🎨 character_definition内の外見プロンプト使用:', appearance.prompt);
      return appearance.prompt;
    }
    
    // フォールバック: 従来の日本語描写から構築
    if (!appearance) {
      return `beautiful anime girl, {{char}}`;
    }

    const parts = [];
    
    // 基本描写
    if (appearance.description) {
      parts.push(appearance.description);
    }
    
    // 髪の毛
    if (appearance.hair) {
      parts.push(appearance.hair);
    }
    
    // 目
    if (appearance.eyes) {
      parts.push(appearance.eyes);
    }
    
    // 服装
    if (appearance.clothing) {
      parts.push(appearance.clothing);
    }
    
    return parts.join(', ');
  }

  /**
   * AIの返答から感情を分析
   */
  private static analyzeEmotion(text: string, sensitivity: number = 0.5): { name: string; prompt: string } {
    const emotions = [
      {
        keywords: ['嬉しい', '楽しい', '笑', 'うふふ', 'わーい', '最高', 'やったー', '😊', '😄', '🎉'],
        name: '喜び',
        prompt: 'happy expression, bright smile, sparkling eyes, cheerful'
      },
      {
        keywords: ['怒', 'イライラ', 'ムカつく', 'プンプン', '許せない', '💢', '😠', '😡'],
        name: '怒り',
        prompt: 'angry expression, frowning, furrowed brows, clenched fists'
      },
      {
        keywords: ['悲しい', '泣', 'うるうる', 'しょんぼり', '寂しい', '😢', '😭', '😔'],
        name: '悲しみ',
        prompt: 'sad expression, teary eyes, downcast look, melancholic'
      },
      {
        keywords: ['恥ずかし', '照れ', 'もじもじ', 'ドキドキ', '赤面', '😳', '😊', '💕'],
        name: '恥ずかしさ',
        prompt: 'blushing, shy expression, embarrassed, looking away'
      },
      {
        keywords: ['驚', 'びっくり', 'えっ', 'まじで', 'うそ', '😲', '😱', '🤔'],
        name: '驚き',
        prompt: 'surprised expression, wide eyes, open mouth, shocked'
      },
      {
        keywords: ['困', '悩', 'うーん', 'どうしよう', '迷', '😅', '😰', '🤷'],
        name: '困惑',
        prompt: 'confused expression, troubled look, thinking pose'
      },
      {
        keywords: ['愛', '好き', 'ラブ', 'ドキ', '胸きゅん', '💕', '❤️', '😍'],
        name: '愛情',
        prompt: 'loving expression, gentle smile, warm eyes, affectionate'
      }
    ];

    for (const emotion of emotions) {
      if (emotion.keywords.some(keyword => text.includes(keyword))) {
        return emotion;
      }
    }

    // デフォルト：自然な表情
    return {
      name: '自然',
      prompt: 'natural expression, gentle look, calm'
    };
  }

  /**
   * 会話内容からシチュエーションを分析（より詳細な情報を含む）
   */
  private static analyzeScenario(text: string, context?: string[]): { name: string; prompt: string } {
    // 会話履歴全体を分析対象とする
    const fullText = context ? [...context, text].join(' ') : text;
    
    const scenarios = [
      {
        keywords: ['お風呂', 'シャワー', '入浴', '温泉', 'バスタオル'],
        name: 'バスルーム',
        prompt: 'bathroom setting, steam, water droplets, towel, wet hair, bathrobe'
      },
      {
        keywords: ['ベッド', '寝室', '布団', '枕', '寝る', '眠い'],
        name: 'ベッドルーム',
        prompt: 'bedroom setting, bed, pillows, soft lighting, intimate atmosphere'
      },
      {
        keywords: ['キッチン', '料理', '食事', 'ご飯', 'コーヒー'],
        name: 'キッチン',
        prompt: 'kitchen setting, cooking, food preparation, apron, domestic scene'
      },
      {
        keywords: ['リビング', '居間', 'ソファ', 'テレビ', 'くつろぐ'],
        name: 'リビングルーム',
        prompt: 'living room, sofa, cozy, relaxed atmosphere, home interior, comfortable'
      },
      {
        keywords: ['カフェ', '喫茶店', 'コーヒーショップ', 'お茶', '軽食'],
        name: 'カフェ',
        prompt: 'cafe, coffee shop, casual setting, comfortable seating, window view, social atmosphere'
      },
      {
        keywords: ['オフィス', '職場', 'デスク', 'パソコン', '仕事'],
        name: 'オフィス',
        prompt: 'office, desk, computer, professional setting, workplace, business attire'
      },
      {
        keywords: ['図書館', '本屋', '本', '静か', '勉強'],
        name: '図書館',
        prompt: 'library, bookstore, quiet atmosphere, shelves of books, intellectual setting'
      },
      {
        keywords: ['店', '買い物', 'デパート', 'モール', 'ショッピング'],
        name: '店',
        prompt: 'store, shop, shopping, retail environment, shopping bags, fashion items'
      },
      {
        keywords: ['学校', '教室', '勉強', '宿題', '制服'],
        name: '学校',
        prompt: 'school setting, classroom, desk, school uniform, academic atmosphere'
      },
      {
        keywords: ['電車', 'バス', '駅', '空港', '乗り物'],
        name: '交通機関',
        prompt: 'train, bus, station, transportation, indoor vehicle, public space'
      },
      {
        keywords: ['病院', '医者', '診察', '病室', 'クリニック'],
        name: '病院',
        prompt: 'hospital, clinic, medical setting, sterile environment, medical equipment'
      },
      {
        keywords: ['屋外', '外', '散歩', '公園', '街', '外出', '買い物', '道', '広場', '広大な自然'],
        name: '屋外',
        prompt: 'outdoor setting, natural lighting, scenery background, street, public square, urban environment'
      },
      {
        keywords: ['森', '林', '木', '自然', '森林浴'],
        name: '森',
        prompt: 'forest, woods, trees, nature, sunlight filtering through leaves, natural environment'
      },
      {
        keywords: ['山', '登山', '頂上', '山脈', '高所'],
        name: '山',
        prompt: 'mountain, mountain peak, hiking, scenic view, outdoor adventure'
      },
      {
        keywords: ['川', '湖', '水辺', '小川', '池'],
        name: '水辺',
        prompt: 'river, lake, waterside, calm water, serene landscape, water reflection'
      },
      {
        keywords: ['海', 'ビーチ', '水着', '泳', '夏', '砂浜', '波', '海岸'],
        name: 'ビーチ',
        prompt: 'beach setting, ocean background, summer, swimwear, sandy beach, waves, seaside'
      },
      {
        keywords: ['夜', '暗い', '月', '星', 'ライト', '夜空', '星空', '月明かり'],
        name: '夜',
        prompt: 'night setting, dark atmosphere, moonlight, starlight, soft artificial lighting, evening mood'
      },
      {
        keywords: ['雨', '傘', '水たまり', '雨具', '雨の日'],
        name: '雨の日',
        prompt: 'rainy day, umbrella, wet ground, reflections, gloomy atmosphere, rain drops'
      },
      {
        keywords: ['雪', '冬', '雪景色', '雪だるま', '寒い'],
        name: '雪景色',
        prompt: 'snowy landscape, winter, snow falling, cold atmosphere, cozy indoor view, winter clothing'
      }
    ];

    // 現在のメッセージと過去の文脈を結合して分析（fullTextを使用）

    for (const scenario of scenarios) {
      if (scenario.keywords.some(keyword => fullText.includes(keyword))) {
        return scenario;
      }
    }

    // デフォルト：室内
    return {
      name: '室内',
      prompt: 'indoor setting, room background, soft lighting'
    };
  }

  /**
   * アクション分析（何をしているか）
   */
  private static analyzeAction(text: string): { name: string; prompt: string } {
    const actions = [
      {
        keywords: ['手を振', '挨拶', 'おはよう', 'こんにちは', 'こんばんは'],
        name: '挨拶',
        prompt: 'waving hand, greeting gesture, friendly pose'
      },
      {
        keywords: ['食べ', '飲み', 'お茶', 'コーヒー', '食事'],
        name: '食事',
        prompt: 'eating, drinking, holding cup, dining'
      },
      {
        keywords: ['歩', '走', '移動', '向かう'],
        name: '移動',
        prompt: 'walking, running, dynamic pose, movement'
      },
      {
        keywords: ['考え', '悩み', 'うーん', '思考'],
        name: '思考',
        prompt: 'thinking pose, hand on chin, contemplating'
      },
      {
        keywords: ['笑', '微笑', 'にこ', 'くすくす'],
        name: '笑顔',
        prompt: 'smiling, laughing, cheerful expression'
      },
      {
        keywords: ['見', '眺め', '観察', 'じっと'],
        name: '観察',
        prompt: 'looking, gazing, observing, focused attention'
      },
      {
        keywords: ['座', '椅子', 'ソファ'],
        name: '座る',
        prompt: 'sitting, seated pose, relaxed posture'
      },
      {
        keywords: ['立', '起立', 'まっすぐ'],
        name: '立つ',
        prompt: 'standing, upright posture, confident stance'
      }
    ];

    for (const action of actions) {
      if (action.keywords.some(keyword => text.includes(keyword))) {
        return action;
      }
    }

    return { name: '自然', prompt: 'natural pose, casual stance' };
  }

  /**
   * 衣装の状態分析（破れる、濡れるなど）
   */
  private static analyzeClothingState(text: string, context?: string[]): { name: string; prompt: string } {
    const fullText = context ? [...context, text].join(' ') : text;
    
    const clothingStates = [
      {
        keywords: ['破れる', '破れ', '裂ける', '裂け', '破損'],
        name: '破れた衣装',
        prompt: 'torn clothing, ripped fabric, damaged clothes, revealing'
      },
      {
        keywords: ['濡れる', '濡れ', '湿る', '湿り', '水'],
        name: '濡れた衣装',
        prompt: 'wet clothing, soaked fabric, water droplets, clinging fabric'
      },
      {
        keywords: ['脱ぐ', '脱げ', '脱がす', '脱がせる', '裸'],
        name: '脱衣状態',
        prompt: 'partially undressed, removing clothes, revealing skin'
      },
      {
        keywords: ['着替え', '着替える', '新しい服', '衣装替え'],
        name: '着替え',
        prompt: 'changing clothes, new outfit, fresh clothing'
      },
      {
        keywords: ['汚れる', '汚れ', '泥', '汚染'],
        name: '汚れた衣装',
        prompt: 'dirty clothing, stained fabric, messy appearance'
      },
      {
        keywords: ['皺', 'しわ', 'くしゃくしゃ'],
        name: '皺だらけ',
        prompt: 'wrinkled clothing, creased fabric, disheveled'
      }
    ];

    for (const state of clothingStates) {
      if (state.keywords.some(keyword => fullText.includes(keyword))) {
        return state;
      }
    }

    return { name: '通常', prompt: 'clean clothing, well-maintained outfit' };
  }

  /**
   * 表情と仕草の詳細分析
   */
  private static analyzeDetailedExpression(text: string): { name: string; prompt: string } {
    const expressions = [
      {
        keywords: ['ウィンク', 'ぱちり', '片目'],
        name: 'ウィンク',
        prompt: 'winking, one eye closed, playful expression'
      },
      {
        keywords: ['頷', 'うん', 'そうだね'],
        name: '頷き',
        prompt: 'nodding, agreeing gesture, understanding look'
      },
      {
        keywords: ['首をかしげ', '？', 'はて', '疑問'],
        name: '首かしげ',
        prompt: 'tilting head, questioning look, curious expression'
      },
      {
        keywords: ['指差', 'あっち', 'そっち', 'こっち'],
        name: '指差し',
        prompt: 'pointing, directional gesture, indicating'
      },
      {
        keywords: ['抱きしめ', 'ぎゅっ', 'ハグ'],
        name: '抱擁',
        prompt: 'hugging, embracing, affectionate gesture'
      },
      {
        keywords: ['手をひら', 'ストップ', '待って'],
        name: '制止',
        prompt: 'stop gesture, hand raised, halt motion'
      }
    ];

    for (const expression of expressions) {
      if (expression.keywords.some(keyword => text.includes(keyword))) {
        return expression;
      }
    }

    return { name: '自然', prompt: 'natural facial expression, relaxed features' };
  }

  /**
   * 強化された画像プロンプトを構築
   */
  private static buildEnhancedPrompt(
    baseCharacter: string,
    emotion: { name: string; prompt: string },
    scenario: { name: string; prompt: string },
    action: { name: string; prompt: string },
    expression: { name: string; prompt: string },
    clothingState: { name: string; prompt: string },
    contextWeight: number = 0.7,
    customQualityTags?: string
  ): string {
    const qualityTags = customQualityTags || [
      'masterpiece',
      'best quality',
      'highly detailed',
      'beautiful lighting',
      'anime style',
      'high resolution',
      '8k',
      'perfect anatomy',
      'detailed face',
      'expressive eyes'
    ].join(', ');

    // 環境要因を追加
    const lighting = this.getTimeBasedLighting();
    const season = this.getSeasonalEnvironment();

    // コンテキスト重みに基づいてプロンプト構成を調整
    const contextComponents = [
      emotion.prompt,
      expression.prompt,
      action.prompt,
      clothingState.prompt,
      scenario.prompt,
      lighting,
      season
    ].filter(component => component && component.trim() !== '');

    // 重みに基づいてコンテキスト要素を調整
    const adjustedContextComponents = contextWeight === 0 ? [] : 
      contextWeight < 0.5 ? contextComponents.slice(0, 2) : // 低重み：感情と表情のみ
      contextWeight < 0.8 ? contextComponents.slice(0, 4) : // 中重み：アクションまで
      contextComponents; // 高重み：すべて含む

    const components = [
      baseCharacter,
      ...adjustedContextComponents,
      qualityTags
    ].filter(component => component && component.trim() !== '');

    return components.join(', ');
  }

  /**
   * 最終的な画像プロンプトを構築（後方互換性のため残す）
   */
  private static buildFinalPrompt(
    baseCharacter: string,
    emotion: { name: string; prompt: string },
    scenario: { name: string; prompt: string }
  ): string {
    const qualityTags = [
      'masterpiece',
      'best quality',
      'highly detailed',
      'beautiful lighting',
      'anime style',
      'high resolution',
      '8k'
    ].join(', ');

    // 環境要因を追加
    const lighting = this.getTimeBasedLighting();
    const season = this.getSeasonalEnvironment();

    return `${baseCharacter}, ${emotion.prompt}, ${scenario.prompt}, ${lighting}, ${season}, ${qualityTags}`;
  }

  /**
   * ネガティブプロンプトを構築
   */
  private static buildNegativePrompt(character?: Character): string {
    const baseNegative = [
      'lowres',
      'bad anatomy',
      'bad hands',
      'text',
      'error',
      'missing fingers',
      'extra digit',
      'fewer digits',
      'cropped',
      'worst quality',
      'low quality',
      'normal quality',
      'jpeg artifacts',
      'signature',
      'watermark',
      'username',
      'blurry',
      'bad face',
      'ugly',
      'duplicate',
      'morbid',
      'mutilated',
      'extra fingers',
      'mutated hands',
      'poorly drawn hands',
      'poorly drawn face',
      'mutation',
      'deformed',
      'bad proportions',
      'extra limbs',
      'cloned face',
      'disfigured',
      'gross proportions',
      'malformed limbs',
      'missing arms',
      'missing legs',
      'extra arms',
      'extra legs',
      'fused fingers',
      'too many fingers'
    ];

    // キャラクター固有のネガティブプロンプトがあれば優先使用
    if (character?.appearanceNegativePrompt) {
      return character.appearanceNegativePrompt;
    }
    
    if (character?.character_definition?.appearance?.negativePrompt) {
      return character.character_definition.appearance.negativePrompt;
    }

    return baseNegative.join(', ');
  }

  /**
   * 時間帯による照明調整
   */
  static getTimeBasedLighting(): string {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return 'morning light, soft sunlight, bright atmosphere';
    } else if (hour >= 12 && hour < 17) {
      return 'afternoon light, warm sunlight, clear lighting';
    } else if (hour >= 17 && hour < 20) {
      return 'evening light, golden hour, warm atmosphere';
    } else {
      return 'night lighting, soft artificial light, cozy atmosphere';
    }
  }

  /**
   * 季節による環境調整
   */
  static getSeasonalEnvironment(): string {
    const month = new Date().getMonth() + 1;
    
    if (month >= 3 && month <= 5) {
      return 'spring atmosphere, cherry blossoms, fresh green';
    } else if (month >= 6 && month <= 8) {
      return 'summer atmosphere, bright sunshine, vivid colors';
    } else if (month >= 9 && month <= 11) {
      return 'autumn atmosphere, fallen leaves, warm colors';
    } else {
      return 'winter atmosphere, snow, cool lighting';
    }
  }
} 