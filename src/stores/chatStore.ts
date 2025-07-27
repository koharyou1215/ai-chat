import { ChatMessage } from '../../types/character';
import { create } from 'zustand';

interface ChatState {
  messages: ChatMessage[];
  currentChat: string | null;
  setMessages: (messages: ChatMessage[]) => void;
  setCurrentChat: (chatId: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentChat: null,
  setMessages: (messages) => set({ messages }),
  setCurrentChat: (currentChat) => set({ currentChat }),
}));
