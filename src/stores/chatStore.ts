import { create } from 'zustand';

interface ChatState {
  messages: any[];
  currentChat: string | null;
  setMessages: (messages: any[]) => void;
  setCurrentChat: (chatId: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentChat: null,
  setMessages: (messages) => set({ messages }),
  setCurrentChat: (currentChat) => set({ currentChat }),
}));
