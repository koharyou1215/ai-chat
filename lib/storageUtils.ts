/**
 * ローカルストレージ操作の共通ユーティリティ
 * 型安全性とエラーハンドリングを統一
 */

export interface StorageOptions {
  prefix?: string;
  serialize?: (value: unknown) => string;
  deserialize?: (value: string) => unknown;
  defaultValue?: unknown;
}

/**
 * 型安全なローカルストレージ操作クラス
 */
export class StorageManager {
  private prefix: string;
  private serialize: (value: unknown) => string;
  private deserialize: (value: string) => unknown;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || '';
    this.serialize = options.serialize || JSON.stringify;
    this.deserialize = options.deserialize || JSON.parse;
  }

  /**
   * キーを生成（プレフィックス付き）
   */
  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  /**
   * 値を取得
   */
  get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) {
        return defaultValue;
      }
      return this.deserialize(item) as T;
    } catch (error) {
      console.warn(`Failed to get item from localStorage (key: ${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * 値を設定
   */
  set(key: string, value: unknown): boolean {
    try {
      localStorage.setItem(this.getKey(key), this.serialize(value));
      return true;
    } catch (error) {
      console.warn(`Failed to set item to localStorage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * 値を削除
   */
  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.warn(`Failed to remove item from localStorage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * 全ての値をクリア（プレフィックス付きのみ）
   */
  clear(): boolean {
    try {
      if (this.prefix) {
        // プレフィックス付きのキーのみ削除
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${this.prefix}:`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } else {
        // 全てクリア
        localStorage.clear();
      }
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * キーが存在するかチェック
   */
  has(key: string): boolean {
    try {
      return localStorage.getItem(this.getKey(key)) !== null;
    } catch (error) {
      console.warn(`Failed to check if key exists (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * すべてのキーを取得
   */
  keys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (this.prefix) {
            if (key.startsWith(`${this.prefix}:`)) {
              keys.push(key.substring(this.prefix.length + 1));
            }
          } else {
            keys.push(key);
          }
        }
      }
      return keys;
    } catch (error) {
      console.warn('Failed to get localStorage keys:', error);
      return [];
    }
  }

  /**
   * ストレージサイズを取得（概算）
   */
  getSize(): number {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (this.prefix && !key.startsWith(`${this.prefix}:`)) {
            continue;
          }
          const value = localStorage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
      return total;
    } catch (error) {
      console.warn('Failed to calculate localStorage size:', error);
      return 0;
    }
  }
}

/**
 * デフォルトのストレージマネージャー
 */
export const storage = new StorageManager();

/**
 * アプリ設定用のストレージマネージャー
 */
export const appStorage = new StorageManager({ prefix: 'app' });

/**
 * ユーザーデータ用のストレージマネージャー
 */
export const userStorage = new StorageManager({ prefix: 'user' });

/**
 * テーマ設定用のストレージマネージャー
 */
export const themeStorage = new StorageManager({ prefix: 'theme' });

/**
 * 一時データ用のストレージマネージャー
 */
export const tempStorage = new StorageManager({ prefix: 'temp' });

/**
 * 設定の型安全な取得・設定
 */
export interface AppSettings {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  voiceId?: string;
  theme?: string;
  [key: string]: unknown;
}

/**
 * アプリ設定の取得
 */
export function getAppSettings(): AppSettings {
  return appStorage.get<AppSettings>('settings', {});
}

/**
 * アプリ設定の保存
 */
export function saveAppSettings(settings: Partial<AppSettings>): boolean {
  const currentSettings = getAppSettings();
  return appStorage.set('settings', { ...currentSettings, ...settings });
}

/**
 * 特定の設定値の取得
 */
export function getAppSetting<T>(key: string, defaultValue?: T): T | undefined {
  const settings = getAppSettings();
  return settings[key] as T ?? defaultValue;
}

/**
 * 特定の設定値の保存
 */
export function setAppSetting(key: string, value: unknown): boolean {
  const settings = getAppSettings();
  settings[key] = value;
  return appStorage.set('settings', settings);
}

/**
 * データのバックアップ
 */
export function backupData(): string {
  try {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = value;
        }
      }
    }
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to backup data:', error);
    throw new Error('データのバックアップに失敗しました');
  }
}

/**
 * データの復元
 */
export function restoreData(backupData: string): boolean {
  try {
    const data = JSON.parse(backupData);
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid backup data format');
    }

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      }
    }
    return true;
  } catch (error) {
    console.error('Failed to restore data:', error);
    return false;
  }
}

/**
 * ストレージのクリーンアップ（古いデータの削除）
 */
export function cleanupStorage(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
  try {
    let cleanedCount = 0;
    const now = Date.now();

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.includes('timestamp')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const timestamp = parseInt(value, 10);
            if (now - timestamp > maxAge) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          } catch {
            // タイムスタンプでない場合はスキップ
          }
        }
      }
    }

    return cleanedCount;
  } catch (error) {
    console.error('Failed to cleanup storage:', error);
    return 0;
  }
}