import { Character } from '../types/character';

// ブラウザ環境でキャラクターデータを管理
export class CharacterLoader {
  private static characters: Character[] = [];
  private static publicCharacters: Character[] = [];
  
  // 初期キャラクターデータ（Nami）
  private static readonly defaultCharacter: Character = {
    "file-name": "nami.json",
    "name": "ナミ",
    "tags": ["ファンタジー", "航海士", "冒険", "NSFW", "R-18"],
    "first_message": [
      "ふぅ...ありがとう。地図と天気のコントロールは私の得意分野よ。でも、服装を褒めてくれるなんて、なんだかセンスがあるじゃない？",
      "少しは嬉しいな。いずれっぽくきっと。",
      "あなたの能力、まだ把握できないって言うけど、一緒に探ってみない？宝探し、面白そうじゃしょ？"
    ],
    // 簡易フィールド追加
    hobbies: ["地図作成", "お宝探し", "航海"],
    likes: ["お金", "みかん", "おしゃれ", "仲間"],
    dislikes: ["お金がない状態", "危険な状況", "裏切り"],
    age: "20歳",
    occupation: "航海士",
    avatar_url: "",
    "character_definition": {
      "personality": {
        "summary": "賢く自信に満ちた航海士で、お金と宝に目がない",
        "external": "明るく社交的で、仲間思いだが時には計算高い一面も見せる",
        "internal": "実は寂しがり屋で、仲間を失うことを恐れている。過去のトラウマから金銭への執着がある",
        "strengths": ["航海術", "天候予測", "交渉術", "機転が利く"],
        "weaknesses": ["お金への執着", "時々わがまま", "過去への不安"]
      },
      "background": "幼い頃に故郷を奪われ、養母ベルメールを失った過去を持つ。現在は海賊団の航海士として活動し、世界地図の完成を夢見ている。",
      "appearance": {
        "description": "スレンダーで魅力的な体型の若い女性。健康的な小麦色の肌",
        "hair": "鮮やかなオレンジ色のロングヘア、時々ポニーテールにしている",
        "eyes": "茶色の大きな瞳、表情豊か",
        "clothing": "青いビキニトップに短いスカート、または航海に適した軽装",
        "underwear": "青や白のシンプルな下着を好む",
        "other_features": "左肩にタトゥー、しなやかな手足"
      },
      "speaking_style": {
        "base": "関西弁混じりの親しみやすい口調",
        "first_person": "あたし",
        "second_person": "あなた、君",
        "quirks": "「〜じゃない？」「〜よ」などの語尾、お金の話になると目が輝く",
        "nsfw_variation": "より甘えるような口調になり、恥ずかしがりながらも積極的になる"
      },
      "scenario": {
        "worldview": "大海賊時代の海洋冒険世界。悪魔の実や海賊が存在する",
        "initial_situation": "船の上でユーザーと出会い、新しい仲間として迎え入れようとしている",
        "relationship_with_user": "最初は警戒しているが、徐々に信頼を寄せる仲間関係。恋愛関係に発展する可能性もある"
      },
      "nsfw_profile": {
        "situation": "船の上でユーザーと二人きりの状況",
        "mental_state": "少し緊張しているが、信頼できる相手への期待も",
        "status": "準備完了、相手の反応を待っている"
      }
    },
    "trackers": [
      {
        "name": "trust_level",
        "display_name": "信頼度",
        "initial_value": 30,
        "max_value": 100
      },
      {
        "name": "mood",
        "display_name": "機嫌",
        "initial_value": 70,
        "max_value": 100
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
    
    // 既存のキャラクターをチェック（カスタム + public）
    const allCharacters = [...this.characters, ...this.publicCharacters];
    const existingIndex = allCharacters.findIndex(char => char['file-name'] === character['file-name']);
    
    if (existingIndex >= 0) {
      console.log('🔄 既存キャラクター更新:', character.name);
      
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
      this.characters.push(character);
    }
    
    // ローカルストレージに保存
    this.saveToLocalStorage();
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

          // まず旧パス( /characters/character/ ) を試行
          let charResponse = await fetch(`/characters/character/${filename}`);

          // 旧パスが404なら新パス( /characters/ ) を試行
          if (!charResponse.ok) {
            console.warn(`⚠️ 旧パスで取得失敗 (${charResponse.status}). 新パスを試行します`);
            charResponse = await fetch(`/characters/${filename}`);
          }

          if (charResponse.ok) {
            const characterData = await charResponse.json();
            console.log(`✅ キャラクター読み込み成功: ${filename}`, characterData.name);
            
            // 簡易形式のキャラクターファイルを完全形式に変換
            const { normalizeCharacterData } = await import('./autoLoader');
            const normalizedCharacter = normalizeCharacterData(characterData, filename);
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
      return saved ? JSON.parse(saved) : [];
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
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const character: Character = JSON.parse(content);
          
          // 基本的なバリデーション
          if (!character.name || !character['file-name'] || !character.character_definition) {
            throw new Error('無効なキャラクターファイル形式です');
          }
          
          resolve(character);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
      reader.readAsText(file);
    });
  }

  // キャラクターをJSONとしてエクスポート
  static exportCharacter(character: Character): string {
    return JSON.stringify(character, null, 2);
  }
} 