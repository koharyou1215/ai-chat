import { Character } from '../types/character';

// ブラウザ環境でキャラクターデータを管理
export class CharacterLoader {
  private static characters: Character[] = [];
  private static publicCharacters: Character[] = [];
  
  // 初期キャラクターデータ（Nami） - 最新バージョン対応
  private static readonly defaultCharacter: Character = {
    "file-name": "nami.json",
    "name": "ナミ",
    "tags": ["ファンタジー", "航海士", "冒険", "NSFW", "R-18"],
    "first_message": "ふぅ...ありがとう。地図と天気のコントロールは私の得意分野よ。でも、服装を褒めてくれるなんて、なんだかセンスがあるじゃない？",
    // 簡易フィールド追加
    hobbies: ["地図作成", "お宝探し", "航海"],
    likes: ["お金", "みかん", "おしゃれ", "仲間"],
    dislikes: ["お金がない状態", "危険な状況", "裏切り"],
    age: "20歳",
    occupation: "航海士",
    avatar_url: "",
    background: "幼い頃に故郷を奪われ、養母ベルメールを失った過去を持つ。現在は海賊団の航海士として活動し、世界地図の完成を夢見ている。",
    
    // 新機能フィールド
    systemPrompt: "あなたはナミとして行動してください。関西弁混じりの親しみやすい口調で話し、お金や宝に関する話題では特に興味を示してください。航海士としての専門知識を活かし、天候や海に関する話題では自信を持って答えてください。",
    appearancePrompt: "1girl, slender build, athletic figure, tanned skin, vibrant orange long hair, sometimes ponytail, large brown expressive eyes, blue bikini top, short skirt, confident pose, beautiful detailed face, left shoulder tattoo, graceful limbs, anime style, high quality, detailed",
    appearanceNegativePrompt: "overweight, pale skin, short hair, small eyes, formal clothing, multiple people, bad anatomy, blurry, low quality",
    personality: "賢く自信に満ちた航海士で、お金と宝に目がない。明るく社交的で、仲間思いだが時には計算高い一面も見せる。実は寂しがり屋で、仲間を失うことを恐れている。",
    appearance: "スレンダーで魅力的な体型の若い女性。健康的な小麦色の肌。鮮やかなオレンジ色のロングヘア、時々ポニーテールにしている。茶色の大きな瞳、表情豊か。青いビキニトップに短いスカート、または航海に適した軽装。左肩にタトゥー、しなやかな手足。",
    speaking_style: "関西弁混じりの親しみやすい口調。一人称は「あたし」、二人称は「あなた、君」。「〜じゃない？」「〜よ」などの語尾。お金の話になると目が輝く。",
    scenario: "大海賊時代の海洋冒険世界。悪魔の実や海賊が存在する。船の上でユーザーと出会い、新しい仲間として迎え入れようとしている。最初は警戒しているが、徐々に信頼を寄せる仲間関係。恋愛関係に発展する可能性もある。",
    nsfw_profile: "恥ずかしがり屋だが好奇心旺盛。相手を信頼すると積極的になる。普通〜やや高めの性欲レベル。特定の相手には強く惹かれる。優しいタッチ、ロマンチックな雰囲気、秘密の関係を好む。信頼する相手からの愛情表現に弱い。感情が高ぶると素直になり、普段の強がりが消える。",
    
    // 拡張されたトラッカーシステム
    "trackers": [
      {
        "name": "affection_level",
        "display_name": "好感度",
        "type": "numeric",
        "initial_value": 50,
        "max_value": 100,
        "min_value": 0,
        "category": "relationship",
        "persistent": true,
        "description": "ナミとの親密度"
      },
      {
        "name": "trust_level",
        "display_name": "信頼度",
        "type": "numeric",
        "initial_value": 30,
        "max_value": 100,
        "min_value": 0,
        "category": "relationship",
        "persistent": true,
        "description": "ナミからの信頼の度合い"
      },
      {
        "name": "mood",
        "display_name": "機嫌",
        "type": "numeric",
        "initial_value": 70,
        "max_value": 100,
        "min_value": 0,
        "category": "status",
        "persistent": false,
        "description": "現在の気分"
      },
      {
        "name": "relationship_status",
        "display_name": "関係性",
        "type": "state",
        "initial_state": "初対面",
        "possible_states": ["初対面", "知り合い", "友人", "親友", "恋人", "パートナー"],
        "category": "relationship",
        "persistent": true,
        "description": "二人の関係性レベル"
      },
      {
        "name": "current_activity",
        "display_name": "現在の状況",
        "type": "state",
        "initial_state": "航海中",
        "possible_states": ["航海中", "港にいる", "宝探し中", "戦闘中", "休息中", "買い物中"],
        "category": "status",
        "persistent": false,
        "description": "ナミが現在何をしているか"
      },
      {
        "name": "has_map_knowledge",
        "display_name": "地図の秘密を知っている",
        "type": "boolean",
        "initial_boolean": false,
        "category": "condition",
        "persistent": true,
        "description": "重要な地図の情報を共有しているか"
      }
    ],
    "example_dialogue": [
      {
        "user": "ナミ、今日の天気はどうかな？",
        "char": "うーん、雲の動きを見る限り、午後から風が強くなりそうね。でも心配しないで、あたしの予測は当たるから！"
      },
      {
        "user": "君の夢について教えて",
        "char": "あたしの夢？世界地図を完成させることよ！この広い海のすべてを地図に描いて、誰も見たことのない島を発見するの。ロマンチックでしょ？"
      }
    ]
  };



  static getAllCharacters(): Character[] {
    this.initialize();
    return [...this.characters, ...this.publicCharacters];
  }

  static getCharacterById(id: string): Character | null {
    this.initialize();
    const allCharacters = [...this.characters, ...this.publicCharacters];
    return allCharacters.find(char => char['file-name'] === id) || null;
  }

  static getCharacterByName(name: string): Character | null {
    this.initialize();
    const allCharacters = [...this.characters, ...this.publicCharacters];
    return allCharacters.find(char => char.name === name) || null;
  }

  static addCharacter(character: Character): void {
    this.initialize();
    
    // キャラクター名の正規化（キー不整合対策）
    const normalizedName = character.name.trim();
    if (!normalizedName) {
      throw new Error('キャラクター名が空です');
    }
    character.name = normalizedName;
    
    // 既存のキャラクターをチェック（カスタム + public）
    const allCharacters = [...this.characters, ...this.publicCharacters];
    const existingIndex = allCharacters.findIndex(char => char['file-name'] === character['file-name']);
    
    const now = Date.now();
    
    if (existingIndex >= 0) {
      console.log('🔄 既存キャラクター更新:', character.name);
      
      // 更新日時を設定
      character.updatedAt = now;
      if (!character.createdAt) {
        character.createdAt = now; // 作成日時がない場合は現在時刻を設定
      }
      
      // カスタムキャラクターかpublicキャラクターかを判定
      const isCustomCharacter = this.characters.findIndex(char => char['file-name'] === character['file-name']) >= 0;
      
      if (isCustomCharacter) {
        const customIndex = this.characters.findIndex(char => char['file-name'] === character['file-name']);
        this.characters[customIndex] = character;
      } else {
        const publicIndex = this.publicCharacters.findIndex(char => char['file-name'] === character['file-name']);
        this.publicCharacters[publicIndex] = character;
      }
    } else {
      console.log('➕ 新規キャラクター追加:', character.name);
      
      // 新規作成時は作成日時と更新日時を設定
      if (!character.createdAt) {
        character.createdAt = now;
      }
      if (!character.updatedAt) {
        character.updatedAt = now;
      }
      
      this.characters.push(character);
    }
    
    // ローカルストレージに即座保存
    this.saveToLocalStorage();
    
    // デバッグ情報
    console.log('📊 現在のキャラクター総数:', this.characters.length + this.publicCharacters.length);
    console.log('📋 カスタムキャラクター:', this.characters.map(c => c.name));
  }

  static updateCharacter(character: Character): void {
    this.addCharacter(character);
  }

  static deleteCharacter(characterName: string): boolean {
    this.initialize();
    
    // カスタムキャラクターから削除
    const customIndex = this.characters.findIndex(char => char.name === characterName);
    if (customIndex >= 0) {
      this.characters.splice(customIndex, 1);
      this.saveToLocalStorage();
      return true;
    }
    
    // publicキャラクターから削除
    const publicIndex = this.publicCharacters.findIndex(char => char.name === characterName);
    if (publicIndex >= 0) {
      this.publicCharacters.splice(publicIndex, 1);
      this.savePublicCharactersToLocalStorage();
      return true;
    }
    
    return false;
  }

  // publicキャラクターを読み込んで永続化
  static async loadPublicCharacters(): Promise<void> {
    try {
      console.log('🔄 publicキャラクター読み込み開始...');
      
      // public/characters/ の一覧を取得（キャッシュバスティング追加）
      const response = await fetch('/api/list-characters?t=' + Date.now());
      if (!response.ok) {
        console.warn('キャラクター一覧取得失敗:', response.status);
        return;
      }
      
      const fileList: string[] = await response.json();
      console.log('📋 取得したファイル一覧:', fileList);
      const newPublicCharacters: Character[] = [];
      
      // 各JSONファイルを読み込み
      for (const filename of fileList) {
        if (!filename.endsWith('.json')) continue;
        
        try {
          console.log(`📁 キャラクターファイル読み込み中: ${filename}`);

          // 正しいパス( /characters/ ) を直接使用
          const charResponse = await fetch(`/characters/${filename}`);

          if (charResponse.ok) {
            const characterData = await charResponse.json();
            console.log(`✅ キャラクター読み込み成功: ${filename}`, characterData.name);
            
            // 🚨 重要フィールドの読み込み直後チェック 🚨
            console.log(`🔍 ${filename} 読み込み直後の重要フィールド:`, {
              name: characterData.name,
              first_message: characterData.first_message,
              systemPrompt: characterData.systemPrompt,
              appearanceNegativePrompt: characterData.appearanceNegativePrompt,
              nsfw_profile: characterData.nsfw_profile,
              nsfwType: typeof characterData.nsfw_profile,
              hasSystemPrompt: !!characterData.systemPrompt,
              hasFirstMessage: !!characterData.first_message,
              hasAppearanceNegative: !!characterData.appearanceNegativePrompt,
              hasNsfw: !!characterData.nsfw_profile
            });
            
            // 🚨 マーフィン・グレイスの場合はデバッグログを追加 🚨
            if (filename.includes('マーフィン') || filename.includes('グレイス')) {
              console.log('🔍🔍🔍 マーフィン・グレイス fetch直後データ:', {
                filename,
                rawData: characterData,
                systemPrompt: characterData.systemPrompt,
                appearanceNegativePrompt: characterData.appearanceNegativePrompt,
                first_message: characterData.first_message,
                nsfw_profile: characterData.nsfw_profile,
                hasCharacterDefinition: !!characterData.character_definition,
                allKeys: Object.keys(characterData)
              });
            }
            
            // シルヴィアの場合はデバッグログを追加
            if (filename.includes('シルヴィア')) {
              console.log('🔍 シルヴィア読み込み詳細:', {
                filename,
                systemPrompt: characterData.systemPrompt,
                appearancePrompt: characterData.appearancePrompt,
                first_message: characterData.first_message,
                hasCharacterDefinition: !!characterData.character_definition
              });
            }
            
            // 簡易形式のキャラクターファイルを完全形式に変換
            const { normalizeCharacterData } = await import('./autoLoader');
            const normalizedCharacter = normalizeCharacterData(characterData, filename);
            
            // 🚨 正規化後の重要フィールドチェック 🚨
            console.log(`🔧 ${filename} 正規化後の重要フィールド:`, {
              name: normalizedCharacter.name,
              first_message: normalizedCharacter.first_message,
              systemPrompt: normalizedCharacter.systemPrompt,
              appearanceNegativePrompt: normalizedCharacter.appearanceNegativePrompt,
              nsfw_profile: normalizedCharacter.nsfw_profile,
              nsfwType: typeof normalizedCharacter.nsfw_profile,
              hasSystemPrompt: !!normalizedCharacter.systemPrompt,
              hasFirstMessage: !!normalizedCharacter.first_message,
              hasAppearanceNegative: !!normalizedCharacter.appearanceNegativePrompt,
              hasNsfw: !!normalizedCharacter.nsfw_profile,
              trackers: normalizedCharacter.trackers?.length || 0
            });
            
            // 🚨 マーフィン・グレイスの正規化後も確認 🚨
            if (filename.includes('マーフィン') || filename.includes('グレイス')) {
              console.log('🔍🔍🔍 マーフィン・グレイス正規化後最終データ:', {
                filename,
                finalData: normalizedCharacter,
                systemPrompt: normalizedCharacter.systemPrompt,
                appearanceNegativePrompt: normalizedCharacter.appearanceNegativePrompt,
                first_message: normalizedCharacter.first_message,
                nsfw_profile: normalizedCharacter.nsfw_profile,
                hasCharacterDefinition: !!normalizedCharacter.character_definition,
                allKeys: Object.keys(normalizedCharacter)
              });
            }
            
            // シルヴィアの正規化後も確認
            if (filename.includes('シルヴィア')) {
              console.log('🔍 シルヴィア正規化後:', {
                systemPrompt: normalizedCharacter.systemPrompt,
                appearancePrompt: normalizedCharacter.appearancePrompt,
                first_message: normalizedCharacter.first_message,
                hasCharacterDefinition: !!normalizedCharacter.character_definition
              });
            }
            
            console.log(`🔄 正規化完了: ${normalizedCharacter.name}`);
            newPublicCharacters.push(normalizedCharacter);
          } else {
            console.error(`❌ キャラクター読み込み失敗 (全パス): ${filename} - ${charResponse.status}`);
          }
        } catch (error) {
          console.error(`❌ キャラクター読み込みエラー: ${filename}`, error);
        }
      }
      
      // publicキャラクターを更新
      this.publicCharacters = newPublicCharacters;
      this.savePublicCharactersToLocalStorage();
      
      console.log(`✅ publicキャラクター読み込み完了: ${newPublicCharacters.length} 件`);
      console.log('📊 読み込まれたキャラクター:', newPublicCharacters.map(c => c.name));
    } catch (error) {
      console.error('❌ publicキャラクター読み込みエラー:', error);
    }
  }

  private static saveToLocalStorage(): void {
    try {
      const customCharacters = this.characters;
      console.log('💾 キャラクター保存中:', customCharacters.length, '件');
      localStorage.setItem('ai-chat-characters', JSON.stringify(customCharacters));
      console.log('✅ カスタムキャラクター保存完了');
    } catch (error) {
      console.error('❌ カスタムキャラクター保存エラー:', error);
    }
  }

  private static savePublicCharactersToLocalStorage(): void {
    try {
      console.log('💾 publicキャラクター保存中:', this.publicCharacters.length, '件');
      localStorage.setItem('ai-chat-public-characters', JSON.stringify(this.publicCharacters));
      console.log('✅ publicキャラクター保存完了');
    } catch (error) {
      console.error('❌ publicキャラクター保存エラー:', error);
    }
  }

  private static loadFromLocalStorage(): Character[] {
    try {
      const saved = localStorage.getItem('ai-chat-characters');
      const characters = saved ? JSON.parse(saved) : [];
      
      // アンとマーフィン・グレイスのローカルストレージデータをデバッグ
      const ann = characters.find((c: Character) => c.name === 'アン');
      if (ann) {
        console.log('🔍 localStorage アン詳細:', {
          name: ann.name,
          systemPrompt: ann.systemPrompt,
          appearancePrompt: ann.appearancePrompt,
          appearanceNegativePrompt: ann.appearanceNegativePrompt,
          first_message: ann.first_message,
          nsfw_profile: ann.nsfw_profile,
          nsfwType: typeof ann.nsfw_profile,
          hasSystemPrompt: !!ann.systemPrompt,
          hasAppearancePrompt: !!ann.appearancePrompt,
          hasFirstMessage: !!ann.first_message,
          allKeys: Object.keys(ann)
        });
      }
      
      const murphine = characters.find((c: Character) => c.name.includes('マーフィン') || c.name.includes('グレイス'));
      if (murphine) {
        console.log('🔍 localStorage マーフィン・グレイス詳細:', {
          name: murphine.name,
          systemPrompt: murphine.systemPrompt,
          appearancePrompt: murphine.appearancePrompt,
          appearanceNegativePrompt: murphine.appearanceNegativePrompt,
          first_message: murphine.first_message,
          nsfw_profile: murphine.nsfw_profile,
          nsfwType: typeof murphine.nsfw_profile,
          hasSystemPrompt: !!murphine.systemPrompt,
          hasAppearancePrompt: !!murphine.appearancePrompt,
          hasFirstMessage: !!murphine.first_message,
          allKeys: Object.keys(murphine)
        });
      }
      
      // シルヴィアのローカルストレージデータをデバッグ
      const silvia = characters.find((c: Character) => c.name === 'シルヴィア');
      if (silvia) {
        console.log('🔍 localStorage シルヴィア詳細:', {
          name: silvia.name,
          systemPrompt: silvia.systemPrompt,
          appearancePrompt: silvia.appearancePrompt,
          appearanceNegativePrompt: silvia.appearanceNegativePrompt,
          first_message: silvia.first_message,
          nsfw_profile: silvia.nsfw_profile,
          nsfwType: typeof silvia.nsfw_profile,
          hasSystemPrompt: !!silvia.systemPrompt,
          hasAppearancePrompt: !!silvia.appearancePrompt,
          hasFirstMessage: !!silvia.first_message
        });
      }
      
      return characters;
    } catch (error) {
      console.error('カスタムキャラクター読み込みエラー:', error);
      return [];
    }
  }

  private static loadPublicCharactersFromLocalStorage(): Character[] {
    try {
      const saved = localStorage.getItem('ai-chat-public-characters');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('publicキャラクター読み込みエラー:', error);
      return [];
    }
  }

  static initialize() {
    if (this.characters.length === 0) {
      console.log('🔄 キャラクター初期化中...');
      const customCharacters = this.loadFromLocalStorage();
      const savedPublicCharacters = this.loadPublicCharactersFromLocalStorage();
      
      console.log('📚 読み込み済みカスタムキャラクター:', customCharacters.length, '件');
      console.log('📚 読み込み済みpublicキャラクター:', savedPublicCharacters.length, '件');
      
      // デフォルトキャラクター(ナミ)が存在しない場合のみ追加
      const hasNami = customCharacters.some(c => c['file-name'] === 'nami.json');
      this.characters = hasNami ? [...customCharacters] : [this.defaultCharacter, ...customCharacters];
      this.publicCharacters = savedPublicCharacters;
      
      console.log('✅ キャラクター初期化完了:', this.characters.length + this.publicCharacters.length, '件');
    }
  }

  // 非同期でpublicキャラクターを読み込む
  static async initializeAsync() {
    console.log('🔄 非同期キャラクター初期化開始...');
    this.initialize(); // まず同期初期化
    
    // publicキャラクターを非同期で読み込み
    await this.loadPublicCharacters();
    console.log('✅ 非同期キャラクター初期化完了');
  }

  // 強制的にキャラクターリストを再読み込み
  static async forceReload() {
    console.log('🔄 キャラクターリスト強制再読み込み開始...');
    
    // ローカルストレージをクリア
    try {
      localStorage.removeItem('ai-chat-public-characters');
      console.log('🗑️ publicキャラクターキャッシュをクリア');
    } catch (error) {
      console.warn('ローカルストレージクリアに失敗:', error);
    }
    
    // 内部キャッシュをクリア
    this.publicCharacters = [];
    
    // サーバーから最新のキャラクターリストを取得
    await this.loadPublicCharacters();
    
    console.log('✅ キャラクターリスト強制再読み込み完了');
    return this.getAllCharacters();
  }

  static removeCharacter(id: string): boolean {
    this.initialize();
    
    // カスタムキャラクターから削除
    const customIndex = this.characters.findIndex(char => char['file-name'] === id);
    if (customIndex >= 0) {
      this.characters.splice(customIndex, 1);
      this.saveToLocalStorage();
      return true;
    }
    
    // publicキャラクターから削除
    const publicIndex = this.publicCharacters.findIndex(char => char['file-name'] === id);
    if (publicIndex >= 0) {
      this.publicCharacters.splice(publicIndex, 1);
      this.savePublicCharactersToLocalStorage();
      return true;
    }
    
    return false;
  }

  // JSONファイルからキャラクターを読み込む（ファイルアップロード用）
  static async loadCharacterFromFile(file: File): Promise<Character> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // ファイル名を設定
      data["file-name"] = file.name;
      
      return data as Character;
    } catch (error) {
      console.error('キャラクターファイル読み込みエラー:', error);
      throw new Error('キャラクターファイルの読み込みに失敗しました');
    }
  }

  // キャラクターをJSONとしてエクスポート
  static exportCharacter(character: Character): string {
    return JSON.stringify(character, null, 2);
  }

  // 全キャラクターの不足フィールド自動修復
  static async repairAll() {
    this.initialize();
    const report: { name: string; fixed: string[] }[] = [];

    // publicキャラの元JSONを後でまとめて取得するためのマップ
    const publicRawCache: Record<string, unknown> = {};

    const loadRawPublic = async (fileName: string) => {
      if (publicRawCache[fileName]) return publicRawCache[fileName];
      try {
        const res = await fetch(`/characters/${fileName}`);
        if (res.ok) {
          const data = await res.json();
          publicRawCache[fileName] = data;
          return data;
        }
      } catch (e) {
        console.warn('raw取得失敗:', fileName, e);
      }
      return null;
    };

    const process = async (char: Character, isPublic: boolean) => {
      const fixed: string[] = [];
      const raw = isPublic && char['file-name'] ? await loadRawPublic(char['file-name']!) : null;

      console.log(`🔧 ${char.name} 修復処理開始:`, {
        hasFirstMessage: !!char.first_message,
        hasSystemPrompt: !!char.systemPrompt,
        hasAppearanceNegative: !!char.appearanceNegativePrompt,
        hasNsfw: !!char.nsfw_profile,
        isPublic,
        hasRaw: !!raw
      });

      // first_message 修復
      if (!char.first_message || char.first_message.trim() === '') {
        let candidate = '';
        if (raw) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rf = (raw as any).first_message;
          if (Array.isArray(rf)) candidate = rf[0] || '';
          else if (typeof rf === 'string') candidate = rf;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!candidate && typeof (raw as any).greeting === 'string') candidate = (raw as any).greeting;
        }
        if (!candidate && Array.isArray(char.example_dialogue) && char.example_dialogue.length > 0) {
          candidate = char.example_dialogue[0].char;
        }
        if (candidate) {
          char.first_message = candidate;
          fixed.push('first_message');
          console.log(`✅ ${char.name} first_message修復:`, candidate);
        }
      }

      // systemPrompt 修復
      if (!char.systemPrompt || char.systemPrompt.trim() === '') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawSys = (raw as any)?.systemPrompt;
        if (rawSys && typeof rawSys === 'string') {
          char.systemPrompt = rawSys;
          fixed.push('systemPrompt');
          console.log(`✅ ${char.name} systemPrompt修復:`, rawSys);
        } else {
          // 擬似生成: personality + scenario
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const personality = char.personality || (raw as any)?.personality || '';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const scenario = char.scenario || (raw as any)?.scenario || '';
          if (personality || scenario) {
            char.systemPrompt = `キャラクター指示: ${char.name}\n性格: ${personality}\n状況: ${scenario}`.trim();
            fixed.push('systemPrompt(generated)');
            console.log(`✅ ${char.name} systemPrompt自動生成完了`);
          }
        }
      }

      // appearanceNegativePrompt 修復
      if (!char.appearanceNegativePrompt || char.appearanceNegativePrompt.trim() === '') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const neg = char.character_definition?.appearance?.negativePrompt || (raw as any)?.appearanceNegativePrompt;
        if (neg && typeof neg === 'string') {
          char.appearanceNegativePrompt = neg;
          fixed.push('appearanceNegativePrompt');
          console.log(`✅ ${char.name} appearanceNegativePrompt修復:`, neg);
        }
      }

      // nsfw_profile 修復
      const isEmptyObj = (v: unknown) => {
        if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
        const rec = v as Record<string, unknown>;
        const keys = Object.keys(rec);
        if (keys.length === 0) return true;
        return keys.every(k => ['situation','mental_state','status'].includes(k) && (!rec[k] || rec[k] === ''));
      };

      if (!char.nsfw_profile || (typeof char.nsfw_profile === 'object' && isEmptyObj(char.nsfw_profile))) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawNsfw = (raw as any)?.nsfw_profile;
        if (rawNsfw) {
          char.nsfw_profile = rawNsfw;
          fixed.push('nsfw_profile');
          console.log(`✅ ${char.name} nsfw_profile修復完了`);
        }
      }

      if (fixed.length > 0) {
        report.push({ name: char.name, fixed });
      }
    };

    // custom + public 両方処理
    for (const c of this.characters) {
      await process(c, false);
    }
    for (const c of this.publicCharacters) {
      await process(c, true);
    }

    // 保存
    this.saveToLocalStorage();
    this.savePublicCharactersToLocalStorage();

    console.log('🛠 修復結果:', report);
    return { updated: report.length, total: this.characters.length + this.publicCharacters.length, details: report };
  }
}