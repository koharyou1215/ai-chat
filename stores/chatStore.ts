import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character, ChatMessage, ChatSession, AppSettings, UserPersona, ChatMemo } from '../types/character';
import '../lib/uuidPolyfill';

interface ChatStore {
  // State
  currentCharacter: Character | null;
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  userPersonas: UserPersona[];
  currentPersona: UserPersona | null;
  settings: AppSettings;
  memos: ChatMemo[];
  isLoading: boolean;
  
  // Actions
  setCurrentCharacter: (character: Character | null) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  createNewSession: (characterId: string) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  deleteSession: (sessionId: string) => void;
  regenerateLastMessage: () => void;
  rollbackToMessage: (messageId: string) => void;
  resetCurrentSession: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  setUserPersona: (persona: UserPersona) => void;
  addUserPersona: (persona: UserPersona) => void;
  setLoading: (loading: boolean) => void;
  
  // Memo actions
  addMemo: (memo: ChatMemo) => void;
  updateMemo: (memo: ChatMemo) => void;
  deleteMemo: (memoId: string) => void;
  getMemosBySession: (sessionId: string) => ChatMemo[];
  getMemoByMessage: (messageId: string) => ChatMemo | null;
}

const defaultSettings: AppSettings = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  memorySize: 4000,
  bubbleOpacity: 0.9,
  geminiApiKey: '',
  stableDiffusionApiKey: '',
  elevenLabsApiKey: '',
  loraSettings: '',
  negativePrompt: '',
  systemPrompt: '',
  jailbreakPrompt: '',
  responseFormat: 'normal',
  enableJailbreak: false,
  enableSystemPrompt: false,
  currentTheme: 'ocean-sunset',
  customBackground: undefined,
  voiceEnabled: false,
  voiceAutoPlay: false,
  voiceId: 'pNInz6obpgDQGcFmaJgB',
  voiceStability: 0.5,
  voiceSimilarityBoost: 0.75,
  voiceStyle: 0,
  voiceUseSpeakerBoost: true,
  voiceSpeed: 1.0,
  voiceVolume: 0.8,
  model: 'gemini-2.5-flash',
  enableImageGeneration: true,
  chatNotificationSound: true
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentCharacter: null,
      currentSession: null,
      sessions: [],
      userPersonas: [],
      currentPersona: null,
      settings: defaultSettings,
      memos: [],
      isLoading: false,

      // Actions
      setCurrentCharacter: (character) => {
        set({ currentCharacter: character });
      },

      setCurrentSession: (session) => {
        set({ currentSession: session });
      },

      addMessage: (message) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const newMessage: ChatMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };

        const updatedSession = {
          ...currentSession,
          messages: [...currentSession.messages, newMessage],
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentSession: updatedSession,
          sessions: state.sessions.map((s) =>
            s.id === updatedSession.id ? updatedSession : s
          ),
        }));
      },

      createNewSession: (characterId) => {
        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          characterId,
          messages: [],
          title: `新しいチャット ${new Date().toLocaleString()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentSession: newSession,
          sessions: [newSession, ...state.sessions],
        }));
      },

      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? { ...state.currentSession, ...updates, updatedAt: Date.now() }
              : state.currentSession,
        }));
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSession:
            state.currentSession?.id === sessionId ? null : state.currentSession,
        }));
      },

      regenerateLastMessage: () => {
        const { currentSession } = get();
        if (!currentSession || currentSession.messages.length === 0) return;

        const messages = [...currentSession.messages];
        if (messages[messages.length - 1]?.role === 'assistant') {
          messages.pop();
        }

        const updatedSession = {
          ...currentSession,
          messages,
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentSession: updatedSession,
          sessions: state.sessions.map((s) =>
            s.id === updatedSession.id ? updatedSession : s
          ),
        }));
      },

      rollbackToMessage: (messageId) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const messageIndex = currentSession.messages.findIndex((m) => m.id === messageId);
        if (messageIndex === -1) return;

        const updatedSession = {
          ...currentSession,
          messages: currentSession.messages.slice(0, messageIndex + 1),
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentSession: updatedSession,
          sessions: state.sessions.map((s) =>
            s.id === updatedSession.id ? updatedSession : s
          ),
        }));
      },

      resetCurrentSession: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        const updatedSession = {
          ...currentSession,
          messages: [],
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentSession: updatedSession,
          sessions: state.sessions.map((s) =>
            s.id === updatedSession.id ? updatedSession : s
          ),
        }));
      },

      updateSettings: (settings) => {
        set((state) => ({ settings: { ...state.settings, ...settings } }));
      },

      saveSettings: async () => {
        return Promise.resolve();
      },

      loadSettings: async () => {
        return Promise.resolve();
      },

      setUserPersona: (persona) => {
        set({ currentPersona: persona });
      },

      addUserPersona: (persona) => {
        set((state) => ({ userPersonas: [...state.userPersonas, persona] }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      addMemo: (memo) => {
        set((state) => ({ memos: [...state.memos, memo] }));
      },

      updateMemo: (memo) => {
        set((state) => ({
          memos: state.memos.map((m) => (m.id === memo.id ? memo : m)),
        }));
      },

      deleteMemo: (memoId) => {
        set((state) => ({ memos: state.memos.filter((m) => m.id !== memoId) }));
      },

      getMemosBySession: (sessionId) => {
        const { memos } = get();
        return memos.filter((memo) => memo.sessionId === sessionId);
      },

      getMemoByMessage: (messageId) => {
        const { memos } = get();
        return memos.find((memo) => memo.messageId === messageId) || null;
      },
    }),
    {
      name: 'ai-chat-store',
      partialize: (state) => ({
        sessions: state.sessions,
        userPersonas: state.userPersonas,
        settings: state.settings,
        memos: state.memos,
      }),
    }
  )
);
