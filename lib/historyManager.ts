import { ChatSession, ChatMessage } from '../types/character';

export interface SessionSummary {
  id: string;
  title: string;
  characterName: string;
  lastMessage: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

class HistoryManager {
  private dbName = 'ai-chat-history';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
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

  async saveSession(session: ChatSession): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      
      const request = store.put({
        ...session,
        updatedAt: Date.now()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
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
          
          sessions.push({
            id: session.id,
            title: session.title,
            characterName: session.characterId,
            lastMessage: lastMessage?.content?.substring(0, 50) + '...' || '新しいチャット',
            messageCount: session.messages.length,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
          });
          
          cursor.continue();
        } else {
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
            lastMessage: lastMessage?.content?.substring(0, 50) + '...' || '新しいチャット',
            messageCount: session.messages.length,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
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