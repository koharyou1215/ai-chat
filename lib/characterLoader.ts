import { Character } from '../types/character';

// ブラウザ環境でキャラクターデータを管理
export class CharacterLoader {
  private static characters: Character[] = [];
  
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
        "persona": "恥ずかしがり屋だが好奇心旺盛。相手を信頼すると積極的になる",
        "libido_level": "普通〜やや高め。特定の相手には強く惹かれる",
        "limits": {
          "hard": ["暴力的な行為", "屈辱的な扱い", "無理強い"],
          "soft": ["人前での行為", "過度に恥ずかしい要求"]
        },
        "kinks": ["優しいタッチ", "ロマンチックな雰囲気", "秘密の関係"],
        "involuntary_reactions": "信頼する相手からの愛情表現に弱い",
        "orgasm_details": "感情が高ぶると素直になり、普段の強がりが消える"
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
    return [...this.characters];
  }

  static getCharacterById(id: string): Character | null {
    this.initialize();
    return this.characters.find(char => char['file-name'] === id) || null;
  }

  static getCharacterByName(name: string): Character | null {
    this.initialize();
    return this.characters.find(char => char.name === name) || null;
  }

  static addCharacter(character: Character): void {
    this.initialize();
    
    // file-nameが未設定の場合は名前から生成
    if (!character['file-name']) {
      character['file-name'] = `${character.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    }
    
    const existingIndex = this.characters.findIndex(char => char['file-name'] === character['file-name']);
    if (existingIndex >= 0) {
      this.characters[existingIndex] = character;
    } else {
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
    const index = this.characters.findIndex(char => char.name === characterName);
    if (index >= 0) {
      this.characters.splice(index, 1);
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  private static saveToLocalStorage(): void {
    try {
      const customCharacters = this.characters.filter(char => char['file-name'] !== 'nami.json');
      localStorage.setItem('ai-chat-characters', JSON.stringify(customCharacters));
    } catch (error) {
      console.error('キャラクター保存エラー:', error);
    }
  }

  private static loadFromLocalStorage(): Character[] {
    try {
      const saved = localStorage.getItem('ai-chat-characters');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('キャラクター読み込みエラー:', error);
      return [];
    }
  }

  static initialize() {
    if (this.characters.length === 0) {
      const customCharacters = this.loadFromLocalStorage();
      this.characters = [this.defaultCharacter, ...customCharacters];
    }
  }

  static removeCharacter(id: string): boolean {
    this.initialize();
    const index = this.characters.findIndex(char => char['file-name'] === id);
    if (index >= 0) {
      this.characters.splice(index, 1);
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