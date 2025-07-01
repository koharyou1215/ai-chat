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
    conversationContext?: string[]
  ): ImagePromptResult {
    // 基本キャラクター情報
    const baseCharacter = this.buildBaseCharacterPrompt(character);
    
    // 感情分析（より詳細に）
    const emotion = this.analyzeEmotion(aiResponse);
    
    // シチュエーション分析（文脈を重視）
    const scenario = this.analyzeScenario(aiResponse, conversationContext);
    
    // アクション分析（何をしているか）
    const action = this.analyzeAction(aiResponse);
    
    // 表情と仕草の詳細分析
    const expression = this.analyzeDetailedExpression(aiResponse);
    
    // 最終プロンプトを構築
    const prompt = this.buildEnhancedPrompt(baseCharacter, emotion, scenario, action, expression);
    
    // ネガティブプロンプト
    const negativePrompt = this.buildNegativePrompt();
    
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
    if (!appearance) {
      return `beautiful anime girl, ${character.name}`;
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
  private static analyzeEmotion(text: string): { name: string; prompt: string } {
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
   * 会話内容からシチュエーションを分析
   */
  private static analyzeScenario(text: string, context?: string[]): { name: string; prompt: string } {
    const scenarios = [
      {
        keywords: ['お風呂', 'シャワー', '入浴', '温泉', 'バスタオル'],
        name: 'バスルーム',
        prompt: 'bathroom setting, steam, water droplets, towel'
      },
      {
        keywords: ['ベッド', '寝室', '布団', '枕', '寝る', '眠い'],
        name: 'ベッドルーム',
        prompt: 'bedroom setting, bed, pillows, soft lighting'
      },
      {
        keywords: ['キッチン', '料理', '食事', 'ご飯', 'コーヒー'],
        name: 'キッチン',
        prompt: 'kitchen setting, cooking, food preparation'
      },
      {
        keywords: ['外', '散歩', '公園', '街', '外出', '買い物'],
        name: '屋外',
        prompt: 'outdoor setting, natural lighting, scenery background'
      },
      {
        keywords: ['学校', '教室', '勉強', '宿題', '制服'],
        name: '学校',
        prompt: 'school setting, classroom, desk, school uniform'
      },
      {
        keywords: ['海', 'ビーチ', '水着', '泳', '夏'],
        name: 'ビーチ',
        prompt: 'beach setting, ocean background, summer, swimwear'
      },
      {
        keywords: ['夜', '暗い', '月', '星', 'ライト'],
        name: '夜',
        prompt: 'night setting, dark atmosphere, moonlight, soft lighting'
      }
    ];

    // 現在のメッセージと過去の文脈を結合して分析
    const fullContext = context ? [...context, text].join(' ') : text;

    for (const scenario of scenarios) {
      if (scenario.keywords.some(keyword => fullContext.includes(keyword))) {
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
    expression: { name: string; prompt: string }
  ): string {
    const qualityTags = [
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

    // プロンプトの構成要素を結合（重要度順）
    const components = [
      baseCharacter,
      emotion.prompt,
      expression.prompt,
      action.prompt,
      scenario.prompt,
      lighting,
      season,
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
  private static buildNegativePrompt(): string {
    return [
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
    ].join(', ');
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