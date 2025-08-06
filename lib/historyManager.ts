import { ChatSession, ChatMessage } from '../types/character';

export interface SessionSummary {
  id: string;
  title: string;
  characterName: string;
  characterId: string;
  lastMessage: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  // 最終活動時間（updatedAt と同値）
  lastActivity?: number;
  // 会話継続時間（分）
  duration?: number;
  // お気に入りフラグ（未使用だが UI 用に用意）
  favorite?: boolean;
  /** セッション内のメッセージ配列 */
  messages: ChatMessage[];
}

class HistoryManager {
  private dbName = 'ai-chat-history';
  private version = 1;
  private db: IDBDatabase | null = null;
  private cloudSyncEnabled = false;

  async init(): Promise<void> {
    await this.initIndexedDB();
    await this.initCloudSync();
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // セッションストア
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('characterId', 'characterId', { unique: false });
          sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  private async initCloudSync(): Promise<void> {
    try {
      // クラウド同期は環境変数で制御
      this.cloudSyncEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (this.cloudSyncEnabled) {
        console.log('☁️ 履歴クラウド同期が有効です');
      } else {
        console.log('💾 ローカル履歴のみを使用します');
      }
    } catch (error) {
      console.warn('⚠️ クラウド同期初期化に失敗しました:', error);
      this.cloudSyncEnabled = false;
    }
  }

  // クラウド同期が利用可能かチェック
  isCloudSyncAvailable(): boolean {
    return this.cloudSyncEnabled;
  }

  // 履歴をクラウドと同期
  async syncWithCloud(): Promise<{ success: boolean; message: string }> {
    if (!this.cloudSyncEnabled) {
      return { success: false, message: 'クラウド同期が無効です' };
    }

    try {
      // 動的インポート（Supabaseが利用可能な場合のみ）
      const { syncHistory } = await import('./historyCloudSync');
      const localSessions = await this.getAllSessions();
      
      const result = await syncHistory(localSessions);
      
      if (result.success && result.data) {
        // クラウドからの最新データをローカルに反映
        await this.replaceAllSessions(result.data);
        return { success: true, message: `${result.data.length}件の履歴を同期しました` };
      } else {
        return { success: false, message: result.error || '同期に失敗しました' };
      }
    } catch (error) {
      console.error('❌ クラウド同期エラー:', error);
      return { success: false, message: String(error) };
    }
  }

  // 全セッションを置き換え（クラウド同期用）
  private async replaceAllSessions(sessions: SessionSummary[]): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');

    // 既存データを全削除
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // 新しいデータを追加
    for (const session of sessions) {
      await new Promise<void>((resolve, reject) => {
        const putRequest = store.put(session);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });
    }

    console.log('✅ ローカル履歴を更新しました:', sessions.length, '件');
  }

  async saveSession(session: ChatSession): Promise<void> {
    if (!this.db) await this.init();
    
    console.log('💾 セッション保存中:', session.id, session.title, session.messages.length, 'メッセージ');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      
      const request = store.put({
        ...session,
        updatedAt: Date.now()
      });
      
      request.onsuccess = () => {
        console.log('✅ セッション保存完了:', session.id);
        resolve();
      };
      request.onerror = () => {
        console.error('❌ セッション保存エラー:', request.error);
        reject(request.error);
      };
    });
  }

  async loadSession(sessionId: string): Promise<ChatSession | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.get(sessionId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSessions(): Promise<SessionSummary[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const index = store.index('updatedAt');
      const request = index.openCursor(null, 'prev'); // 新しい順
      
      const sessions: SessionSummary[] = [];
      
      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const session: ChatSession = cursor.value;
          const lastMessage = session.messages[session.messages.length - 1];
          
          console.log('📚 セッション読み込み:', session.id, session.title, session.messages.length, 'メッセージ');
          
          sessions.push({
            id: session.id,
            title: session.title,
            characterName: session.characterId,
            characterId: session.characterId,
            lastMessage: lastMessage?.content?.substring(0, 50) + '...' || '新しいチャット',
            messageCount: session.messages.length,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            lastActivity: session.updatedAt,
            duration: Math.floor((session.updatedAt - session.createdAt) / 60000),
            messages: session.messages,
          });
          
          cursor.continue();
        } else {
          console.log('📚 全セッション読み込み完了:', sessions.length, '件');
          resolve(sessions);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.delete(sessionId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSessionsByCharacter(characterId: string): Promise<SessionSummary[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const index = store.index('characterId');
      const request = index.openCursor(IDBKeyRange.only(characterId));
      
      const sessions: SessionSummary[] = [];
      
      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const session: ChatSession = cursor.value;
          const lastMessage = session.messages[session.messages.length - 1];
          
          sessions.push({
            id: session.id,
            title: session.title,
            characterName: session.characterId,
            characterId: session.characterId,
            lastMessage: lastMessage?.content?.substring(0, 50) + '...' || '新しいチャット',
            messageCount: session.messages.length,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            lastActivity: session.updatedAt,
            duration: Math.floor((session.updatedAt - session.createdAt) / 60000),
            messages: session.messages,
          });
          
          cursor.continue();
        } else {
          // 更新日時順でソート
          sessions.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(sessions);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // 自動タイトル生成
  generateTitle(messages: ChatMessage[]): string {
    if (messages.length === 0) return '新しいチャット';
    
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.substring(0, 20);
      return title + (firstUserMessage.content.length > 20 ? '...' : '');
    }
    
    return `チャット ${new Date().toLocaleDateString()}`;
  }
}

export const historyManager = new HistoryManager(); 