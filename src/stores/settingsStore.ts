import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Settings {
  // API設定
  geminiApiKey: string;
  openRouterApiKey: string;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  
  // モデル設定
  selectedModel: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  
  // チャット設定
  enableAutoSave: boolean;
  messageDisplayLimit: number;
  enableTypingIndicator: boolean;
  enableSoundNotifications: boolean;
  
  // UI設定
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  enableAnimations: boolean;
  showTimestamps: boolean;
  
  // 音声設定
  voiceProvider: 'voicevox' | 'elevenlabs' | 'none';
  voiceSpeed: number;
  voiceVolume: number;
  voicePitch: number;
  
  // バックアップ設定
  autoBackupInterval: number;
  maxBackupCount: number;
  enableCloudSync: boolean;
}

interface SettingsStore {
  // 状態
  settings: Settings;
  
  // アクション
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
  importSettings: (settings: Settings) => void;
  exportSettings: () => Settings;
}

const defaultSettings: Settings = {
  // API設定
  geminiApiKey: '',
  openRouterApiKey: '',
  elevenLabsApiKey: '',
  elevenLabsVoiceId: '',
  
  // モデル設定
  selectedModel: 'google/gemini-2.5-flash',
  maxTokens: 8192,
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  
  // チャット設定
  enableAutoSave: true,
  messageDisplayLimit: 100,
  enableTypingIndicator: true,
  enableSoundNotifications: false,
  
  // UI設定
  theme: 'system',
  fontSize: 'medium',
  enableAnimations: true,
  showTimestamps: false,
  
  // 音声設定
  voiceProvider: 'voicevox',
  voiceSpeed: 1.0,
  voiceVolume: 0.7,
  voicePitch: 1.0,
  
  // バックアップ設定
  autoBackupInterval: 60, // minutes
  maxBackupCount: 10,
  enableCloudSync: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      settings: defaultSettings,
      
      // アクション
      updateSettings: (newSettings: Partial<Settings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },
      
      resetSettings: () => {
        set({ settings: defaultSettings });
      },
      
      importSettings: (settings: Settings) => {
        set({ settings });
      },
      
      exportSettings: () => {
        return get().settings;
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);