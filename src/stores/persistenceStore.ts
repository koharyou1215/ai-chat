import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChatStore } from './chatStore';
import { useCharacterStore } from './characterStore';
import { usePersonaStore } from './personaStore';
import { useTrackerStore } from './trackerStore';
import { useInspirationStore } from './inspirationStore';
import { useSettingsStore } from './settingsStore';
import { useMemoStore } from './memoStore';

export interface BackupData {
  id: string;
  timestamp: number;
  version: string;
  data: {
    chat: any;
    characters: any;
    personas: any;
    tracker: any;
    inspiration: any;
    settings: any;
    memos: any;
  };
}

interface PersistenceStore {
  // 状態
  backups: BackupData[];
  isLoading: boolean;
  lastBackupTime: number;
  autoSaveEnabled: boolean;
  
  // アクション
  createBackup: (description?: string) => Promise<BackupData>;
  restoreFromBackup: (backupId: string) => Promise<void>;
  deleteBackup: (backupId: string) => void;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  clearAllData: () => void;
  setAutoSave: (enabled: boolean) => void;
  getStorageUsage: () => number;
}

export const usePersistenceStore = create<PersistenceStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      backups: [],
      isLoading: false,
      lastBackupTime: 0,
      autoSaveEnabled: true,
      
      // アクション
      createBackup: async (description = '') => {
        set({ isLoading: true });
        
        try {
          // 各ストアの現在の状態を取得
          const chatState = useChatStore.getState();
          const characterState = useCharacterStore.getState();
          const personaState = usePersonaStore.getState();
          const trackerState = useTrackerStore.getState();
          const inspirationState = useInspirationStore.getState();
          const settingsState = useSettingsStore.getState();
          const memoState = useMemoStore.getState();
          
          const backup: BackupData = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            version: '2.0',
            data: {
              chat: {
                messages: chatState.messages,
                currentChat: chatState.currentChat,
              },
              characters: {
                characters: characterState.characters,
                currentCharacter: characterState.currentCharacter,
              },
              personas: {
                personas: personaState.personas,
                currentPersona: personaState.currentPersona,
              },
              tracker: {
                showTrackerPanel: trackerState.showTrackerPanel,
                currentTrackers: trackerState.currentTrackers,
              },
              inspiration: {
                inspirationText: inspirationState.inspirationText,
                selectedText: inspirationState.selectedText,
              },
              settings: {
                settings: settingsState.settings,
              },
              memos: {
                memos: memoState.memos,
              },
            },
          };
          
          set((state) => ({
            backups: [...state.backups, backup].slice(-10), // 最大10個のバックアップを保持
            lastBackupTime: Date.now(),
            isLoading: false,
          }));
          
          return backup;
        } catch (error) {
          console.error('バックアップの作成に失敗:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      restoreFromBackup: async (backupId: string) => {
        set({ isLoading: true });
        
        try {
          const backup = get().backups.find(b => b.id === backupId);
          if (!backup) {
            throw new Error('バックアップが見つかりません');
          }
          
          // 各ストアに状態を復元
          const { data } = backup;
          
          if (data.chat) {
            useChatStore.setState(data.chat);
          }
          
          if (data.characters) {
            useCharacterStore.setState(data.characters);
          }
          
          if (data.personas) {
            usePersonaStore.setState(data.personas);
          }
          
          if (data.tracker) {
            useTrackerStore.setState(data.tracker);
          }
          
          if (data.inspiration) {
            useInspirationStore.setState(data.inspiration);
          }
          
          if (data.settings) {
            useSettingsStore.setState(data.settings);
          }
          
          if (data.memos) {
            useMemoStore.setState(data.memos);
          }
          
          set({ isLoading: false });
        } catch (error) {
          console.error('バックアップの復元に失敗:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      deleteBackup: (backupId: string) => {
        set((state) => ({
          backups: state.backups.filter(b => b.id !== backupId)
        }));
      },
      
      exportData: async () => {
        const backup = await get().createBackup('Export');
        return JSON.stringify(backup.data, null, 2);
      },
      
      importData: async (jsonData: string) => {
        try {
          const data = JSON.parse(jsonData);
          
          // データの形式を検証
          if (!data.chat && !data.characters && !data.personas) {
            throw new Error('無効なデータ形式です');
          }
          
          // 各ストアに状態をインポート
          if (data.chat) {
            useChatStore.setState(data.chat);
          }
          
          if (data.characters) {
            useCharacterStore.setState(data.characters);
          }
          
          if (data.personas) {
            usePersonaStore.setState(data.personas);
          }
          
          if (data.tracker) {
            useTrackerStore.setState(data.tracker);
          }
          
          if (data.inspiration) {
            useInspirationStore.setState(data.inspiration);
          }
          
          if (data.settings) {
            useSettingsStore.setState(data.settings);
          }
          
          if (data.memos) {
            useMemoStore.setState(data.memos);
          }
          
          // インポート後にバックアップを作成
          await get().createBackup('Import');
        } catch (error) {
          console.error('データのインポートに失敗:', error);
          throw error;
        }
      },
      
      clearAllData: () => {
        useChatStore.getState().clearMessages();
        useCharacterStore.setState({ characters: [], currentCharacter: null });
        usePersonaStore.setState({ personas: [], currentPersona: null });
        useTrackerStore.getState().resetTrackers();
        useInspirationStore.getState().reset();
        useMemoStore.getState().clearMemos();
        
        set({ backups: [] });
      },
      
      setAutoSave: (enabled: boolean) => {
        set({ autoSaveEnabled: enabled });
      },
      
      getStorageUsage: () => {
        let totalSize = 0;
        
        // ローカルストレージの使用量を計算
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key) && key.includes('-storage')) {
            totalSize += localStorage[key].length;
          }
        }
        
        return totalSize;
      },
    }),
    {
      name: 'persistence-storage',
      partialize: (state) => ({
        backups: state.backups,
        lastBackupTime: state.lastBackupTime,
        autoSaveEnabled: state.autoSaveEnabled,
      }),
    }
  )
);