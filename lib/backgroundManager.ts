// キャラクター背景設定管理ユーティリティ

export interface CharacterBackground {
  characterName: string;
  backgroundUrl: string;
  timestamp: number;
}

export class BackgroundManager {
  private static readonly STORAGE_KEY = 'character-backgrounds';
  private static readonly FILE_PATH = '/api/save-background';

  // キャラクター背景設定を保存
  static async saveCharacterBackground(characterName: string, backgroundUrl: string): Promise<void> {
    try {
      // localStorageに保存
      const backgrounds = this.getStoredBackgrounds();
      const existingIndex = backgrounds.findIndex(bg => bg.characterName === characterName);
      
      const backgroundData: CharacterBackground = {
        characterName,
        backgroundUrl,
        timestamp: Date.now()
      };

      if (existingIndex >= 0) {
        backgrounds[existingIndex] = backgroundData;
      } else {
        backgrounds.push(backgroundData);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backgrounds));

      // サーバーに通知（ログ目的のみ、Vercelでは永続化されない）
      await this.saveToServer(backgroundData).catch(err => {
        console.log('💡 サーバー保存はVercelでは利用できません（ローカルストレージで管理）:', err.message);
      });
      
      console.log(`🎨 キャラクター背景設定を保存: ${characterName}`);
    } catch (error) {
      console.error('背景設定保存エラー:', error);
    }
  }

  // キャラクター背景設定を取得
  static getCharacterBackground(characterName: string): string | null {
    try {
      const backgrounds = this.getStoredBackgrounds();
      const background = backgrounds.find(bg => bg.characterName === characterName);
      return background?.backgroundUrl || null;
    } catch (error) {
      console.error('背景設定取得エラー:', error);
      return null;
    }
  }

  // すべての背景設定を取得
  static getAllBackgrounds(): CharacterBackground[] {
    return this.getStoredBackgrounds();
  }

  // キャラクター背景設定を削除
  static removeCharacterBackground(characterName: string): void {
    try {
      const backgrounds = this.getStoredBackgrounds();
      const filteredBackgrounds = backgrounds.filter(bg => bg.characterName !== characterName);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredBackgrounds));
      console.log(`🗑️ キャラクター背景設定を削除: ${characterName}`);
    } catch (error) {
      console.error('背景設定削除エラー:', error);
    }
  }

  // localStorageから背景設定を取得
  private static getStoredBackgrounds(): CharacterBackground[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('背景設定読み込みエラー:', error);
      return [];
    }
  }

  // サーバーに背景設定を保存
  private static async saveToServer(backgroundData: CharacterBackground): Promise<void> {
    try {
      const response = await fetch(this.FILE_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backgroundData),
      });

      if (!response.ok) {
        throw new Error(`サーバー保存エラー: ${response.status}`);
      }

      console.log('✅ 背景設定をサーバーに保存しました');
    } catch (error) {
      console.error('サーバー保存エラー:', error);
      // サーバー保存に失敗してもlocalStorageは保持される
    }
  }

  // 背景設定を初期化（アプリ起動時）
  static initializeBackgrounds(): void {
    try {
      const backgrounds = this.getStoredBackgrounds();
      console.log(`🎨 背景設定を初期化: ${backgrounds.length}件`);
    } catch (error) {
      console.error('背景設定初期化エラー:', error);
    }
  }
} 