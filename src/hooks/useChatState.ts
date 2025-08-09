/**
 * チャット機能の状態管理をまとめたカスタムフック
 */
import { useState } from 'react';
import { Character, UserPersona } from '../../types/character';
import { SessionSummary } from '../../lib/historyManager';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: number;
}

export interface ChatImpression {
  title: string;
  content: string;
  perspective: string;
  wordCount: number;
  description?: string;
  [key: string]: unknown;
}

export interface ChatSummary {
  overview: string;
  keyPoints: string[];
  characterInsights: string[];
  emotionalFlow: string;
  topics: string[];
  userEngagement: string;
  memorableQuotes: string[];
  stats: {
    messageCount: number;
    userMessageCount: number;
    aiMessageCount: number;
    wordCount: number;
    averageMessageLength: number;
    conversationDuration: number;
  };
  generatedAt: number;
}

export function useChatState() {
  // 基本的なチャット状態
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // セッション管理
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // キャラクター・Persona管理
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<UserPersona | null>(null);

  // モーダル状態管理
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<ChatSummary | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // UI状態
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [pendingSelection, setPendingSelection] = useState('');
  const [activeTab, setActiveTab] = useState<'characters' | 'personas' | 'history' | 'settings'>('characters');

  return {
    // 基本状態
    message,
    setMessage,
    messages,
    setMessages,
    currentCharacter,
    setCurrentCharacter,
    isLoading,
    setIsLoading,
    isGeneratingImage,
    setIsGeneratingImage,

    // セッション
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,

    // キャラクター・Persona
    isCharacterModalOpen,
    setIsCharacterModalOpen,
    editingCharacter,
    setEditingCharacter,
    allCharacters,
    setAllCharacters,
    isPersonaModalOpen,
    setIsPersonaModalOpen,
    editingPersona,
    setEditingPersona,

    // モーダル
    isImportExportOpen,
    setIsImportExportOpen,
    isSummaryOpen,
    setIsSummaryOpen,
    isGeneratingSummary,
    setIsGeneratingSummary,
    currentSummary,
    setCurrentSummary,
    isThemeModalOpen,
    setIsThemeModalOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,

    // UI
    isInputExpanded,
    setIsInputExpanded,
    pendingSelection,
    setPendingSelection,
    activeTab,
    setActiveTab
  };
}