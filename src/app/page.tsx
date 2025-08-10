'use client';

// ==========================================
// 🚨 重要：このファイルにはチャット機能の基幹機能が含まれています 🚨
// ==========================================
// 
// 【絶対に削除・変更してはいけない重要な機能】:
// 1. MessageEditorModal（テキスト編集モーダル）関連のすべてのコード
// 2. CharacterImportExport（キャラクターインポート）関連のすべてのコード  
// 3. selectInspirationCandidate（インスピレーション選択）機能
// 4. handleUserInspiration（ユーザーインスピレーション）機能
// 5. handleUserTextEnhancement（テキスト強化）機能
//
// これらの機能は何度も消失する問題が発生しており、
// 保護コメントブロックで囲まれています。
// 修正や変更は慎重に行い、機能を失わないよう注意してください。
// ==========================================

// crypto.randomUUID ポリフィル
import '../../lib/uuidPolyfill';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, MessageSquare, Loader, RefreshCw, CornerUpLeft, Clock, X, Palette, Menu, Cloud, Copy, User, Activity, Zap, Edit } from 'lucide-react';
import { CharacterLoader } from '../../lib/characterLoader';
import { Character, UserPersona } from '../../types/character';
import { historyManager, SessionSummary } from '../../lib/historyManager';
// 直接インポートに変更（ChunkLoadError回避）
import CharacterGallery from '../../components/CharacterGallery';
import CharacterImportExport from '../../components/CharacterImportExport';
import ChatHistoryGallery from '../../components/ChatHistoryGallery';
// ThemeManagerは削除 - シンプルなローカルストレージ管理に変更
import { VoiceManager } from '../../lib/voiceManager';
import SettingsModal from '../../components/SettingsModal';
import QuickSettingsModal from '../../components/QuickSettingsModal';
import VoiceControls from '../../components/VoiceControls';
import CharacterModal from '../../components/CharacterModal';
import CharacterSelector from '../../components/CharacterSelector';
import PersonaModal from '../../components/PersonaModal';
import PersonaSelector from '../../components/PersonaSelector';
import { MessageMemoButton } from '../../components/ChatMemoProvider';
import ChatSummaryModal from '../../components/ChatSummaryModal';
import { MessageEditorModal } from '../../components/MessageEditorModal';
// ThemeModal削除 - インライン実装に変更
import AuthModal from '../../components/AuthModal';
import { useChatStore } from '../../stores/chatStore';
import FormattedText from '../../components/FormattedText';
import Image from 'next/image';

import { BackgroundManager } from '../../lib/backgroundManager';
import CharacterTrackerDisplay from '../../components/CharacterTracker';
import Typewriter from '../../components/Typewriter';
import { saveCharacterToCloud } from '../../lib/characterCloudSync';




interface ChatImpression {
  title: string;
  content: string;
  perspective: string;
  wordCount: number;
  description?: string;
  [key: string]: unknown;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: number;
}

interface ChatSummary {
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

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isCharacterModalFromGallery, setIsCharacterModalFromGallery] = useState(false); // ギャラリーから開いたかどうか
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<UserPersona | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<ChatSummary | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [pendingSelection, setPendingSelection] = useState('');

  // インスピレーション関連
  const [showInspiration, setShowInspiration] = useState(false);
  const [inspirationCandidates, setInspirationCandidates] = useState<string[]>([]);
  const [showUserInspiration, setShowUserInspiration] = useState(false);
  const [userInspirationCandidates, setUserInspirationCandidates] = useState<string[]>([]);
  const [showInspirationCandidates, setShowInspirationCandidates] = useState(false);
  const [isLoadingUserInspiration, setIsLoadingUserInspiration] = useState(false);

  // ユーザー文章強化機能
  const [isEnhancingUserText, setIsEnhancingUserText] = useState(false);
  
  // ボタンアニメーション
  const [sendButtonClicked, setSendButtonClicked] = useState(false);
  const [bulbButtonClicked, setBulbButtonClicked] = useState(false);
  const [sparkleButtonClicked, setSparkleButtonClicked] = useState(false);
  
  // タブ管理
  const [activeTab, setActiveTab] = useState<'characters' | 'personas' | 'history' | 'settings'>('characters');

  // 文章強化機能
  const [selectedText, setSelectedText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [showEnhanceButton, setShowEnhanceButton] = useState(false);
  const [enhanceButtonPosition, setEnhanceButtonPosition] = useState({ x: 0, y: 0 });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<{
    originalText: string;
    enhancedText: string;
    messageId: string;
  } | null>(null);
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);

  // Personaインポート/エクスポート
  // 🚨 画面右上5つのアイコン関連State変数 - 重要機能保護開始 🚨
  // これらのstate変数は何度も消失しています。絶対に削除・変更しないでください！
  
  // 1. 詳細設定関連
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // 2. クイック設定関連  
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  // 3. チャット履歴関連
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  // 4. キャラクターギャラリー関連
  const [isCharacterGalleryOpen, setIsCharacterGalleryOpen] = useState(false);
  // 5. トラッカー表示制御
  const [showTrackers, setShowTrackers] = useState(true);
  
  // 🚨 画面右上5つのアイコン関連State変数 - 重要機能保護終了 🚨

  const [isPersonaImportExportOpen, setIsPersonaImportExportOpen] = useState(false);
  const [isEnhancedImpressionOpen, setIsEnhancedImpressionOpen] = useState(false);
  const [currentImpressions, setCurrentImpressions] = useState<ChatImpression[]>([]);
  const [isGeneratingImpression, setIsGeneratingImpression] = useState(false);

  // Zustandストアから設定を取得
  const { 
    memos, 
    settings, 
    updateSettings,
    updateTrackerValue,
    getTrackerValues,
    initializeTrackersForSession,
    analyzeMessageForTrackerUpdates,
    setCurrentCharacter: setStoreCurrentCharacter,
    currentCharacter: storeCurrentCharacter,
    userPersonas,
    currentPersona,
    setUserPersona,
    addUserPersona,
    updateUserPersona,
    deleteUserPersona
  } = useChatStore();

  // タッチジェスチャー管理


  // キーボード開閉検出用の状態
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // 左スワイプによるブラウザ戻るを防止
  useEffect(() => {
    // Touch events を防止
    const preventSwipeBack = (e: TouchEvent) => {
      // 1本指で画面左端からスワイプした場合のみ防止
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const startX = touch.clientX;
        // 画面左端から30px以内でのタッチを検出
        if (startX < 30) {
          e.preventDefault();
        }
      }
    };

    // Pointer events を防止（新しいブラウザ向け）
    const preventPointerSwipeBack = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && e.clientX < 30) {
        e.preventDefault();
      }
    };

    // イベントリスナーを追加
    document.addEventListener('touchstart', preventSwipeBack, { passive: false });
    document.addEventListener('pointerdown', preventPointerSwipeBack, { passive: false });

    // ブラウザの履歴操作も制御
    const handlePopState = () => {
      // 現在の状態を維持
      window.history.pushState(null, '', window.location.href);
    };

    // 初期状態をプッシュ
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    console.log('🚫 左スワイプとブラウザ戻るを防止しました');

    // クリーンアップ
    return () => {
      document.removeEventListener('touchstart', preventSwipeBack);
      document.removeEventListener('pointerdown', preventPointerSwipeBack);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // キーボード開閉検出のためのuseEffect
  useEffect(() => {
    // visualViewport APIが利用可能かチェック
    if (!window.visualViewport) {
      console.log('📱 visualViewport APIが利用できません');
      return;
    }

    let keyboardOpenTimeout: NodeJS.Timeout;

    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      
      const currentHeight = window.visualViewport.height;
      const heightDifference = window.innerHeight - currentHeight;
      
      // キーボードが開いているかどうかを判定（100px以上の差がある場合）
      const keyboardIsOpen = heightDifference > 100;
      
      if (keyboardIsOpen !== isKeyboardOpen) {
        setIsKeyboardOpen(keyboardIsOpen);
        
        console.log(`⌨️ キーボード状態変更: ${keyboardIsOpen ? '開く' : '閉じる'} (高さ差: ${heightDifference}px)`);
        
        // キーボードが閉じた時にスクロールを復元
        if (!keyboardIsOpen) {
          // 少し遅延を入れてからスクロール復元
          clearTimeout(keyboardOpenTimeout);
          keyboardOpenTimeout = setTimeout(() => {
            console.log('🔄 キーボード閉じた - スクロール復元実行');
            scrollToBottom();
            
            // さらに少し遅延してから再度スクロール（確実にするため）
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }, 150);
        }
      }
    };

    // イベントリスナーを追加
    window.visualViewport.addEventListener('resize', handleViewportChange);
    
    // 初期状態を設定
    handleViewportChange();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      clearTimeout(keyboardOpenTimeout);
    };
  }, [isKeyboardOpen]);

  // 会話要約生成
  const handleGenerateSummary = async () => {
    if (!currentCharacter || messages.length < 3) {
      alert('要約するには最低3つのメッセージが必要です');
      return;
    }

    setIsGeneratingSummary(true);
    setIsSummaryOpen(true);
    setCurrentSummary(null);

    try {
      const response = await fetch('/api/summarize-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          characterName: currentCharacter.name,
          sessionTitle: currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || '新しいチャット' : '新しいチャット'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSummary(data.summary);
      } else {
        alert('要約の生成に失敗しました: ' + data.error);
        setIsSummaryOpen(false);
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      alert('要約の生成中にエラーが発生しました');
      setIsSummaryOpen(false);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 強化されたインプレッション生成
  const handleGenerateEnhancedImpression = async () => {
    if (!currentCharacter || messages.length < 3) {
      alert('インプレッション生成には最低3つのメッセージが必要です');
      return;
    }

    setIsGeneratingImpression(true);
    setIsEnhancedImpressionOpen(true);
    setCurrentImpressions([]);

    try {
      const response = await fetch('/api/enhanced-impression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          character: currentCharacter,
          sessionTitle: currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || '新しいチャット' : '新しいチャット',
          settings: settings, // settings オブジェクトを追加
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentImpressions(data.impressions);
      } else {
        alert('インプレッションの生成に失敗しました: ' + data.error);
        setIsEnhancedImpressionOpen(false);
      }
    } catch (error) {
      console.error('Enhanced impression generation error:', error);
      alert('インプレッションの生成中にエラーが発生しました');
      setIsEnhancedImpressionOpen(false);
    }
 finally {
      setIsGeneratingImpression(false);
    }
  };
  


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // 初期化
  useEffect(() => {
    
    const initializeApp = async () => {
      try {
        console.log('🚀 アプリ初期化開始');
        
        // キャラクター一覧を最初に読み込み
        const characters = CharacterLoader.getAllCharacters();
        
        // 🚨 初期読み込み直後のcharactersをデバッグ 🚨
        const targetChars = characters.filter(c => 
          c.name.includes('マーフィン') || c.name.includes('グレイス') || 
          c.name.includes('澪') || c.name.includes('ミオ') || 
          c.name.includes('アン')
        );
        if (targetChars.length > 0) {
          console.log('🔍🔍🔍 初期読み込み直後のcharacters対象数:', targetChars.length);
          targetChars.forEach((c, index) => {
            console.log(`🔍🔍🔍 初期[${index}] ${c.name}:`, {
              name: c.name,
              systemPrompt: c.systemPrompt?.substring(0, 50) + '...',
              appearanceNegativePrompt: c.appearanceNegativePrompt?.substring(0, 50) + '...',
              first_message: c.first_message?.substring(0, 50) + '...',
              nsfw_profile: typeof c.nsfw_profile === 'object' ? '[object]' : c.nsfw_profile?.substring(0, 50) + '...',
              hasCharacterDefinition: !!c.character_definition,
              allKeys: Object.keys(c)
            });
          });
        }
        
        setAllCharacters(characters);
        console.log('📋 キャラクター一覧読み込み完了:', characters.length, '個');
        
        // 履歴マネージャーを初期化
        await historyManager.init();
        
        // 全セッションを初期読み込み（ローカル優先で復元）
        try {
          // localStorage からセッション一覧を復元（存在すれば）
          const localSessionsRaw = localStorage.getItem('ai-chat-sessions');
          if (localSessionsRaw) {
            const localSessions: SessionSummary[] = JSON.parse(localSessionsRaw);
            // 各セッションのメッセージも復元
            for (const s of localSessions) {
              const msgsRaw = localStorage.getItem(`ai-chat-messages:${s.id}`);
              if (msgsRaw) {
                try {
                  s.messages = JSON.parse(msgsRaw);
                } catch {
                  // ignore parse error
                }
              }
            }
            setSessions(localSessions);
            console.log('📚 localStorage からセッションを復元:', localSessions.length, '件');
          } else {
            const allSessions = await historyManager.getAllSessions();
            console.log('📚 全セッション初期読み込み:', allSessions.length, '件');
            setSessions(allSessions);
          }
        } catch (error) {
          console.error('❌ 全セッション読み込みエラー:', error);
        }
        
        // 最後に選択されたキャラクターを復元、なければデフォルトキャラクターを設定
        const defaultCharacter = CharacterLoader.getCharacterByName('ナミ');
        let targetCharacter = defaultCharacter;
        
        // 優先順位: localStorage > Zustandストア > デフォルト
        let characterSource = 'default';
        
        // 1. まずローカルストレージから復元を試行（Webページ対応）
        try {
          const storedCharacterName = localStorage.getItem('ai-chat-current-character');
          if (storedCharacterName) {
            const storedCharacter = characters.find(c => c.name === storedCharacterName);
            if (storedCharacter) {
              targetCharacter = storedCharacter;
              characterSource = 'localStorage';
              console.log('✅ ローカルストレージからキャラクターを復元:', storedCharacterName);
            }
          }
        } catch (error) {
          console.warn('⚠️ ローカルストレージからの復元に失敗:', error);
        }

        // アバターのbase64が保存されていれば currentCharacter セット時に適用するため保持
        let restoredAvatarDataUrl: string | null = null;

        // 2. ローカルストレージにない場合はZustandストアから復元
        if (characterSource === 'default' && storeCurrentCharacter) {
          const lastCharacter = characters.find(c => c.name === storeCurrentCharacter.name);
          if (lastCharacter) {
            targetCharacter = lastCharacter;
            characterSource = 'zustand';
            console.log('✅ Zustandストアからキャラクターを復元:', lastCharacter.name);
            
            // Zustandストアの値をローカルストレージにも同期
            try {
              localStorage.setItem('ai-chat-current-character', lastCharacter.name);
              console.log('✅ Zustandストアの値をローカルストレージに同期');
            } catch (error) {
              console.warn('⚠️ ローカルストレージ同期に失敗:', error);
            }
          }
        }
        
        if (targetCharacter) {
          // アバターbase64の復元
          try {
            restoredAvatarDataUrl = localStorage.getItem(`ai-chat-char-avatar:${targetCharacter.name}`);
            if (restoredAvatarDataUrl) {
              targetCharacter = { ...targetCharacter, avatar_url: restoredAvatarDataUrl };
              console.log('🖼️ アバターをlocalStorageから復元');
            }
          } catch (e) {
            console.warn('アバター復元に失敗:', e);
          }

          setCurrentCharacter(targetCharacter);
          setStoreCurrentCharacter(targetCharacter);
          
          // 履歴の自動読み込み設定
          const shouldAutoLoadHistory = process.env.NODE_ENV === 'production' ? true : (settings.autoLoadHistory !== false);
          
          console.log('🔍 履歴読み込み設定:', {
            shouldAutoLoadHistory,
            nodeEnv: process.env.NODE_ENV,
            settingsAutoLoad: settings.autoLoadHistory,
            characterName: targetCharacter.name
          });
          
          // 本番環境では履歴保存を強制有効化
          if (process.env.NODE_ENV === 'production') {
            console.log('🔒 本番環境: 履歴保存を強制有効化');
            updateSettings({ 
              autoLoadHistory: true
            });
          }
          
          if (shouldAutoLoadHistory) {
            try {
              // そのキャラクターのセッションのみ読み込む（localStorage優先）
              let characterSessions: SessionSummary[] = [];
              const localSessionsRaw2 = localStorage.getItem('ai-chat-sessions');
              if (localSessionsRaw2) {
                const localAll: SessionSummary[] = JSON.parse(localSessionsRaw2);
                characterSessions = localAll.filter(s => s.characterId === targetCharacter.name);
                // 各セッションのメッセージ
                for (const s of characterSessions) {
                  const msgsRaw = localStorage.getItem(`ai-chat-messages:${s.id}`);
                  if (msgsRaw) {
                    try { s.messages = JSON.parse(msgsRaw); } catch {}
                  }
                }
                console.log('📚 localStorageからキャラクターセッション復元:', characterSessions.length, '件');
              } else {
                characterSessions = await historyManager.getSessionsByCharacter(targetCharacter.name);
                console.log('📚 キャラクターセッション読み込み結果:', characterSessions.length, '件');
              }
              setSessions(characterSessions);
              
              if (characterSessions.length > 0) {
                const lastSession = characterSessions[characterSessions.length - 1];
                setCurrentSessionId(lastSession.id);
                // メッセージは localStorage 優先で復元
                const msgsRaw = localStorage.getItem(`ai-chat-messages:${lastSession.id}`);
                setMessages(msgsRaw ? JSON.parse(msgsRaw) : (lastSession.messages || []));
                console.log('✅ 最後のセッションを復元:', lastSession.id, (msgsRaw ? JSON.parse(msgsRaw).length : lastSession.messages?.length) || 0, 'メッセージ');
              } else {
                console.log('📝 セッションがないため初期メッセージを設定');
                setInitialMessage(targetCharacter);
              }
            } catch (error) {
              console.error('❌ 履歴読み込みエラー:', error);
              setInitialMessage(targetCharacter);
            }
          } else {
            console.log('📝 履歴の自動読み込みが無効化されています');
            setInitialMessage(targetCharacter);
          }
          
          // 背景の適用（優先順位: chatBackgroundUrl > 保存済み背景 > デフォルト）
          console.log('🎨 キャラクター背景の適用開始:', targetCharacter.name);
          
          if (targetCharacter.chatBackgroundUrl) {
            console.log('✅ chatBackgroundUrlを使用して背景を適用');
            BackgroundManager.saveCharacterBackground(targetCharacter.name, targetCharacter.chatBackgroundUrl);
            loadCharacterBackground(targetCharacter.name);
          } else {
            console.log('ℹ️ chatBackgroundUrlなし - 保存済み背景またはデフォルトを使用');
            loadCharacterBackground(targetCharacter.name);
          }
        }
        
        console.log('✅ アプリ初期化完了 (キャラクターソース:', characterSource, ')');
      } catch (error) {
        console.error('履歴読み込みエラー:', error);
        // エラー時はデフォルトキャラクター設定
        const defaultCharacter = CharacterLoader.getCharacterByName('ナミ');
        if (defaultCharacter) {
          // アバター復元
          try {
            const restored = localStorage.getItem(`ai-chat-char-avatar:${defaultCharacter.name}`);
            if (restored) {
              setCurrentCharacter({ ...defaultCharacter, avatar_url: restored });
            } else {
              setCurrentCharacter(defaultCharacter);
            }
          } catch {
            setCurrentCharacter(defaultCharacter);
          }
          setStoreCurrentCharacter(defaultCharacter);
          setInitialMessage(defaultCharacter);
        }
      }
    };
    
    initializeApp();
  }, []);

  // 初期メッセージ設定のヘルパー関数
  const setInitialMessage = (character: Character) => {
    const firstMessage = character.first_message || 'こんにちは！';
      
    console.log('初期メッセージ設定:', firstMessage);
    
    setMessages([{
      id: '1',
      role: 'assistant',
      content: firstMessage,
      timestamp: Date.now()
    }]);
  };



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // キャラクター変更時の背景読み込み
  useEffect(() => {
    if (currentCharacter) {
      console.log('🎨 キャラクター変更により背景読み込み:', currentCharacter.name);
      loadCharacterBackground(currentCharacter.name);
    } else {
      // キャラクターがない場合は白背景
      const bgElement = document.getElementById('dynamic-background');
      if (bgElement) {
        bgElement.innerHTML = '';
        bgElement.style.background = '#ffffff';
        console.log('⚪ キャラクターなし - 白背景適用');
      }
    }
  }, [currentCharacter]);

  // 自動保存機能（historyManager + localStorage 二重保存）
  useEffect(() => {
    const saveCurrentSession = async () => {
      if (!currentCharacter || messages.length <= 0) return;
      
      try {
        const sessionId = currentSessionId || crypto.randomUUID();
        const title = historyManager.generateTitle(messages);
        
        const session: SessionSummary = {
          id: sessionId,
          characterId: currentCharacter.name,
          characterName: currentCharacter.name,
          // 型要件に合わせて必要なフィールドを補完
          messages: messages,
          lastMessage: messages[messages.length - 1]?.content?.slice(0, 120) || '',
          title: title,
          createdAt: currentSessionId ? Date.now() : Date.now(),
          updatedAt: Date.now(),
          messageCount: messages.length
        };
        
        // 1) historyManager に保存
        await historyManager.saveSession(session);
        
        // 2) localStorage に保存（一覧＋各セッションメッセージ）
        try {
          // 一覧を読み出し→更新
          const listRaw = localStorage.getItem('ai-chat-sessions');
          const list: SessionSummary[] = listRaw ? JSON.parse(listRaw) : [];
          const idx = list.findIndex(s => s.id === session.id);
          const saveLite: SessionSummary = { ...session, messages: [] }; // 一覧側は軽量に
          if (idx >= 0) list[idx] = saveLite; else list.push(saveLite);
          localStorage.setItem('ai-chat-sessions', JSON.stringify(list));
          // 各セッションのメッセージは別キーへ
          localStorage.setItem(`ai-chat-messages:${session.id}`, JSON.stringify(messages));
        } catch (e) {
          console.warn('localStorageへのセッション保存に失敗:', e);
        }

        if (!currentSessionId) {
          setCurrentSessionId(sessionId);
        }
        
        // 履歴リストを更新 - そのキャラクターのセッションのみ
        if (currentCharacter) {
          const characterSessions = await historyManager.getSessionsByCharacter(currentCharacter.name);
          setSessions(characterSessions);
        }
        
      } catch (error) {
        console.error('セッション保存エラー:', error);
      }
    };
    
    // メッセージが変更されたら1.5秒後に保存（やや短縮して確実化）
    const timer = setTimeout(saveCurrentSession, 1500);
    return () => clearTimeout(timer);
  }, [messages, currentCharacter, currentSessionId]);

  // 🚨 チャット機能（handleSend） - 重要機能保護開始 🚨
  // この機能は何度も消失しています。絶対に削除・変更しないでください！
  // メインチャット機能の核心部分です。
  const handleSend = async () => {
    // ボタンアニメーション実行
    setSendButtonClicked(true);
    setTimeout(() => setSendButtonClicked(false), 200);
    
    console.log('📤 送信ボタンがクリックされました', { 
      message: message.trim(), 
      messageLength: message.trim().length, 
      isLoading, 
      currentCharacter: currentCharacter?.name || 'なし' 
    });
    
    if (!message.trim() || isLoading) {
      console.log('❌ 送信条件未満: メッセージが空またはロード中');
      return;
    }

    // 送信ボタンを即座に無効化（重複送信防止）
    setIsLoading(true);
    
    // キャラクターが選択されていない場合は、デフォルトキャラクターを設定
    if (!currentCharacter) {
      console.log('⚠️ キャラクターが選択されていません。デフォルトキャラクターを設定します。');
      const defaultCharacter = CharacterLoader.getCharacterByName('ナミ');
      if (defaultCharacter) {
        setCurrentCharacter(defaultCharacter);
      } else {
        alert('キャラクターが選択されていません。サイドバーからキャラクターを選択してください。');
        setIsLoading(false); // エラー時はロード状態を解除
        return;
      }
    }

    const messageContent = message.trim();
    // ユニークなIDでメッセージを作成（重複を避けるため）
    const uniqueTimestamp = Date.now();
    const randomSeed = Math.random().toString(36).substr(2, 12);
    const messageId = `user-${uniqueTimestamp}-${randomSeed}`;
    const newMessage: Message = {
      id: messageId,
      role: 'user',
      content: messageContent,
      timestamp: uniqueTimestamp
    };

    // メッセージを即座にクリア（重複送信防止）
    setMessage('');
    
    // ユーザーメッセージを追加
    console.log('📝 ユーザーメッセージ追加:', messageId, newMessage.content.substring(0, 50));
    setMessages(prev => [...prev, newMessage]);
    if (settings.enableImageGeneration) setIsGeneratingImage(true);

    try {
      // 現在のトラッカー状態を取得してAPIに送信用のフォーマットに変換
      const currentTrackerValues = getTrackerValues(currentSessionId);
      const trackersWithCurrentState = currentCharacter?.trackers?.map(tracker => {
        const currentValue = currentTrackerValues[tracker.name];
        
        if (currentValue) {
          // 現在の状態で上書き
          return {
            ...tracker,
            current_value: tracker.type === 'numeric' ? currentValue.value : undefined,
            current_state: tracker.type === 'state' ? currentValue.value : undefined,
            current_boolean: tracker.type === 'boolean' ? currentValue.value : undefined,
            current_text: tracker.type === 'text' ? currentValue.value : undefined,
          };
        }
        
        // 現在の状態がない場合は初期値を使用
        return tracker;
      }) || [];

      // 現在のメッセージ履歴にユーザーメッセージを含めて会話コンテキストを構築
      const currentMessages = [...messages, newMessage];
      const conversationContext = currentMessages.slice(-(settings.historySize || 8));
      
      console.log('📊 会話コンテキスト:', {
        totalMessages: currentMessages.length,
        contextMessages: conversationContext.length,
        lastUserMessage: newMessage.content.substring(0, 50) + '...'
      });

      // Gemini APIでチャット応答を生成（簡単版）
      console.log('🌐 API呼び出し開始');
      const chatResponse = await fetch('/api/simple-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          message: newMessage.content,
          settings,
          persona: currentPersona,
          characterId: currentCharacter?.name,
          character: currentCharacter,
          memos,
          conversation: conversationContext,
          // 現在のトラッカー状態を送信
          trackers: trackersWithCurrentState,
          // キャッシュ防止用のユニークID
          requestId: `${uniqueTimestamp}-${randomSeed}`
        }),
      });

      let aiContent = '';
      // AI応答もユーザーメッセージに対応する一意のIDを生成
      const aiTimestamp = Date.now();
      const aiRandomSeed = Math.random().toString(36).substr(2, 12);
      const aiResponseId = `ai-${aiTimestamp}-${aiRandomSeed}`;
      const aiResponse: Message = {
        id: aiResponseId,
        role: 'assistant',
        content: '', // Start with an empty message, content will be streamed
        timestamp: aiTimestamp,
      };
      
      console.log('🤖 AI応答スロット作成:', aiResponseId);
      setMessages(prev => [...prev, aiResponse]); // 先に追加しておく

      const contentType = chatResponse.headers.get('Content-Type') || '';

      if (contentType.includes('application/json')) {
        // JSON形式（通常 or インスピレーション）
        const chatData = await chatResponse.json();
        if (chatData.success) {
          // サーバーからトラッカー更新情報を受信した場合は適用
          if (chatData.trackers && Array.isArray(chatData.trackers) && currentSessionId && currentCharacter) {
            console.log('📊 トラッカー更新情報を受信:', chatData.trackers);
            
            chatData.trackers.forEach((update: Record<string, unknown>) => {
              if (update.name && update.value !== undefined) {
                const trackerName = update.name as string;
                const newValue = update.value as string | number | boolean;
                const changeInfo = update.change || '';
                
                console.log(`🔄 トラッカー更新適用: ${trackerName} = ${newValue} (${changeInfo})`);
                updateTrackerValue(currentSessionId, trackerName, newValue);
                
                // アニメーション用の追加ログ
                console.log(`✨ トラッカー「${trackerName}」の値が変更されました: ${changeInfo}`);
              }
            });
          } else {
            // APIからトラッカー更新がない場合は、フロントエンドで自動推測を実行
            console.log('📊 APIからトラッカー更新なし、フロントエンド自動推測を実行');
            if (currentSessionId && currentCharacter && chatData.content) {
              // AI応答を分析してトラッカー値を推測更新
              analyzeMessageForTrackerUpdates(currentSessionId, {
                id: `ai-analysis-${Date.now()}`,
                role: 'assistant',
                content: chatData.content,
                timestamp: Date.now()
              }, currentCharacter);
              console.log('📊 フロントエンド自動推測完了');
            }
          }
          
          if (chatData.candidates && chatData.candidates.length > 1) {
            // インスピレーション候補がある場合
            setInspirationCandidates(chatData.candidates);
            setShowInspiration(true);
            setIsLoading(false);
            // AI返信は追加せず、候補選択を待つ
            setMessages(prev => prev.slice(0, -1)); // 追加した空のAI返信を削除
            return;
          } else if (chatData.content) {
            // 通常の返信
            aiContent = chatData.content;
          } else {
            // コンテンツがない場合のフォールバック
            aiContent = 'ごめんなさい、応答を生成できませんでした。もう一度お試しください。';
          }
        } else {
          // APIエラーの場合
          aiContent = chatData.error || 'エラーが発生しました。もう一度お試しください。';
        }
      } else {
        // ストリーム読み取り
        const reader = chatResponse.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          console.log('📡 ストリーミング開始');
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('✅ ストリーミング完了');
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            aiContent += chunk;
            console.log('💬 ストリーム受信:', chunk.length, '文字, 累計:', aiContent.length);
            
            // 部分的に表示を更新（ID指定で安全に）
            setMessages(prev => {
              const updated = [...prev];
              const targetIndex = updated.findIndex(m => m.id === aiResponseId);
              if (targetIndex >= 0) {
                updated[targetIndex] = { ...updated[targetIndex], content: aiContent };
                return updated;
              }
              return prev;
            });
          }
        }
      }

      
      // 最終更新（ID指定で安全に更新）
      const finalUpdateSuccess = await new Promise<boolean>((resolve) => {
        setMessages(prev => {
          const updated = [...prev];
          const targetIndex = updated.findIndex(m => m.id === aiResponseId);
          if (targetIndex >= 0) {
            updated[targetIndex] = { ...updated[targetIndex], content: aiContent };
            console.log('✅ 最終メッセージ更新完了:', aiResponseId, aiContent.length, '文字');
            resolve(true);
            return updated;
          } else {
            console.error('❌ 対象メッセージが見つかりません:', aiResponseId);
            resolve(false);
            return prev;
          }
        });
      });

      if (!finalUpdateSuccess) {
        console.error('❌ メッセージ更新に失敗しました');
      }

      if (aiContent && aiContent.trim()) {
        
        // 通知音
        if (settings.chatNotificationSound) {
          VoiceManager.playNotificationSound(true, 0.3);
        }

        // 画像生成を開始
        if (settings.enableImageGeneration) {
          setIsGeneratingImage(true);
        }
        
        // 画像生成（非同期）
        if (settings.enableImageGeneration) {
          handleImageGeneration(aiResponse, aiContent);
        }
      } else {
        // エラー時のフォールバック
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'ごめんなさい、今ちょっと調子が悪いみたい...もう一度話しかけてくれる？',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('❌ チャットエラー:', error);
      
      // エラー時は空のAI応答を削除して新しいエラーメッセージを追加
      setMessages(prev => {
        // 最後に追加されたAI応答を削除
        const filtered = prev.filter(m => m.role !== 'assistant' || m.content !== '');
        const errorResponse: Message = {
          id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: 'ごめんなさい、エラーが発生しました。もう一度お試しください。',
          timestamp: Date.now()
        };
        return [...filtered, errorResponse];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 画像生成処理を共通化
  const handleImageGeneration = async (aiResponse: Message, aiContent: string) => {
    if (!settings.enableImageGeneration || !currentCharacter) return;
    
    try {
      setIsGeneratingImage(true);
      // ImagePromptGeneratorをインポートして使用
      const { ImagePromptGenerator } = await import('../../lib/imagePromptGenerator');
      const imagePromptResult = ImagePromptGenerator.generateImagePrompt(currentCharacter, aiContent, messages.slice(-5).map(m => m.content), {
        customQualityTags: settings.customQualityTags,
        ...settings
      });
      console.log('Generated Image Prompt:', imagePromptResult);

      if (!imagePromptResult) {
        console.warn('画像プロンプトが生成されませんでした。');
        return;
      }

      const imageResponse = await fetch('/api/generate-image/', { // 末尾にスラッシュを追加
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePromptResult,
          character: currentCharacter,
          conversationContext: messages.slice(-5).map(m => m.content),
          loraSettings: settings.loraSettings,
          negativePrompt: settings.negativePrompt,
          width: currentCharacter?.imageWidth,
          height: currentCharacter?.imageHeight,
          steps: currentCharacter?.imageSteps,
          cfg_scale: currentCharacter?.imageCfgScale,
          sampler: currentCharacter?.imageSampler,
          imageEngine: settings.imageEngine,
          runwareModelId: settings.runwareModelId,
          runwareLoraIds: settings.runwareLoraIds,
          runwareApiKey: settings.runwareApiKey,
        }),
      });

      const imageData = await imageResponse.json();
      
      if (imageData.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === aiResponse.id 
            ? { ...msg, image: imageData.imageUrl }
            : msg
        ));
        console.log('✅ 画像生成成功:', imageData.imageUrl);
      }
    } catch (imageError) {
      console.error('Image generation failed:', imageError);
    } finally {
      setIsGeneratingImage(false);
    }
  };
  // 🚨 チャット機能（handleSend） - 重要機能保護終了 🚨

  // 画像生成テスト用関数（調査用）
  const handleImageTest = async () => {
    if (!currentCharacter) {
      alert('キャラクターを選択してください');
      return;
    }
    
    try {
      setIsGeneratingImage(true);
      console.log('🖼️ 画像生成テスト開始');
      
      // テスト用の固定プロンプト
      const testPrompt = 'beautiful anime girl, detailed face, long hair, school uniform, classroom background, high quality, best quality, masterpiece';
      
      const imageResponse = await fetch('/api/generate-image/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
          character: currentCharacter,
          conversationContext: ['テスト用の会話'],
          width: currentCharacter?.imageWidth || 512,
          height: currentCharacter?.imageHeight || 768,
          steps: currentCharacter?.imageSteps || 20,
          cfg_scale: currentCharacter?.imageCfgScale || 7,
          sampler: currentCharacter?.imageSampler || 'DPM++ 2M Karras',
          imageEngine: settings.imageEngine,
          runwareModelId: settings.runwareModelId,
          runwareLoraIds: settings.runwareLoraIds,
          runwareApiKey: settings.runwareApiKey,
        }),
      });

      console.log('📡 画像生成APIレスポンス状態:', imageResponse.status, imageResponse.statusText);
      
      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('❌ 画像生成APIエラー:', imageResponse.status, errorText);
        throw new Error(`画像生成APIエラー: ${imageResponse.status} ${errorText}`);
      }
      
      const imageData = await imageResponse.json();
      console.log('🖼️ 画像生成テスト結果:', imageData);
      
      if (imageData.success) {
        alert('画像生成テスト成功！画像が生成されました。');
        // テスト用のメッセージとして表示
        const testMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '画像生成テストが完了しました。',
          image: imageData.imageUrl, // imageUrlを使用
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, testMessage]);
      } else {
        console.error('❌ 画像生成失敗:', imageData.error);
        alert(`画像生成テスト失敗: ${imageData.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('🖼️ 画像生成テストエラー:', error);
      alert(`画像生成テストエラー: ${error}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  /* ================================================
   * 【重要】返信提案機能 - 絶対に変更・削除禁止
   * 
   * この機能はuser-inspiration APIと連携してMessageEditorModalを表示します。
   * 変更するとモーダルが表示されなくなります。
   * ================================================ */
  // ユーザーインスピレーション機能
  const handleUserInspiration = async () => {
    if (!currentCharacter || isLoadingUserInspiration) return;
    
    console.log('🔍 返信提案開始');
    
    // ボタンアニメーション実行
    setBulbButtonClicked(true);
    setTimeout(() => setBulbButtonClicked(false), 200);
    
    setIsLoadingUserInspiration(true);
    try {
      // 現在の画面表示中のメッセージを使用（sessions管理とは独立）
      const currentCharacterId = currentCharacter['file-name'] || currentCharacter.name;
      const currentSession = sessions.find(s => s.characterId === currentCharacterId);
      const sessionMessages = currentSession?.messages || [];
      
      // 現在の画面のメッセージを優先使用し、フォールバックとしてセッションのメッセージを使用
      const availableMessages = messages.length > 0 ? messages : sessionMessages;
      
      console.log(`🔍 セッション詳細デバッグ:`, {
        currentCharacterId,
        sessionsLength: sessions.length,
        sessionIds: sessions.map(s => s.characterId),
        currentSessionFound: !!currentSession,
        sessionMessagesLength: sessionMessages.length,
        currentMessagesLength: messages.length,
        availableMessagesLength: availableMessages.length,
        usingCurrentMessages: messages.length > 0
      });
      
      // 直近の2メッセージに限定してプロンプトを短くする
      const recentMessages = availableMessages.slice(-2);
      const conversationText = recentMessages.map(msg => 
        `${msg.role === 'user' ? 'ユーザー' : currentCharacter.name}: ${msg.content}`
      ).join('\n');
      
      // 会話履歴がない場合は、デフォルトメッセージを使用
      const finalMessage = conversationText.trim() || 'これまでの会話はありません。一般的な返信候補を提案してください。';
      
      console.log(`🔍 現在のキャラクター: ${currentCharacter.name} (ID: ${currentCharacterId})`);
      console.log(`🔍 現在のセッション:`, currentSession ? `見つかりました (${availableMessages.length}件のメッセージ)` : '見つかりません');
      console.log(`🔍 使用する履歴 (直近2件):`, conversationText);
      console.log(`🔍 settings詳細確認:`, {
        settingsExists: !!settings,
        inspirationPromptExists: !!settings?.inspirationPrompt,
        settingsType: typeof settings,
        settingsKeys: settings ? Object.keys(settings).slice(0, 10) : [],
        inspirationPromptLength: settings?.inspirationPrompt?.length || 0,
        inspirationPromptPreview: settings?.inspirationPrompt ? settings.inspirationPrompt.substring(0, 100) + '...' : 'なし'
      });
      
      const requestBody = {
        message: finalMessage,
        settings
      };
      
      console.log('🔍 APIリクエスト送信:', {
        url: '/api/user-inspiration',
        messageLength: finalMessage.length, // conversationTextの代わりにfinalMessageを使用
        settingsKeys: settings ? Object.keys(settings) : []
      });
      
      const response = await fetch('/api/user-inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🔍 APIレスポンス受信:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      const data = await response.json();
      console.log('🔍 APIレスポンスデータ:', {
        success: data.success,
        hasCandidates: !!data.candidates,
        candidateCount: data.candidates?.length || 0,
        error: data.error
      });
      
      if (data.candidates && data.candidates.length > 0) {
        console.log('✅ 返信提案成功:', data.candidates.length, '件の候補');
        console.log('🔍 受信した候補:', data.candidates);
        data.candidates.forEach((candidate, index) => {
          console.log(`🔍 候補${index + 1} の型:`, typeof candidate);
          console.log(`🔍 候補${index + 1} の内容:`, candidate);
          console.log(`🔍 候補${index + 1} の長さ:`, candidate?.length || 'undefined');
          console.log(`🔍 候補${index + 1} の最初の100文字:`, candidate?.substring(0, 100) || 'empty');
        });
        setUserInspirationCandidates(data.candidates);
        setShowInspirationCandidates(true);
        console.log('🔍 状態更新後:', {
          showInspirationCandidates: true,
          userInspirationCandidatesLength: data.candidates.length
        });
      } else {
        console.error('❌ 返信提案失敗:', data.error || '候補が空です');
        alert('返信提案の生成に失敗しました');
      }
    } catch (error) {
      console.error('❌ User inspiration error:', error);
      alert('返信提案中にエラーが発生しました');
    } finally {
      setIsLoadingUserInspiration(false);
    }
  };
  /* ================================================ */

  /* ================================================
   * 【重要】返答候補選択関数 - 絶対に変更・削除禁止
   * 
   * この関数はMessageEditorModalの表示に必要です。
   * 変更するとモーダルが表示されなくなります。
   * ================================================ */
  // 返答候補を選択する関数
  const selectInspirationCandidate = (candidate: string) => {
    console.log('🔍 selectInspirationCandidate実行:', { candidate, candidateLength: candidate.length });
    setEditorInitialText(candidate);
    setShowInspirationCandidates(false);
    setUserInspirationCandidates([]);
    // モーダルを開く（state反映後の次フレームで実行）
    setTimeout(() => {
      console.log('🔍 MessageEditorModal表示開始');
      setIsMessageEditorOpen(true);
    }, 0);
  };
  /* ================================================ */

  /* ================================================
   * 【重要】文章強化機能 - 絶対に変更・削除禁止
   * 
   * この機能はMessageEditorModalと連携しています。
   * 変更するとモーダルが表示されなくなります。
   * ================================================ */
  // ユーザー文章強化実行
  const handleUserTextEnhancement = async () => {
    if (!message.trim()) {
      alert('強化するテキストを入力してください');
      return;
    }
    
    if (!currentCharacter) {
      alert('キャラクターを選択してください');
      return;
    }
    
    console.log('🔍 文章強化開始');
    
    const targetText = pendingSelection || message;
    setPendingSelection('');
    
    // ボタンアニメーション実行
    setSparkleButtonClicked(true);
    setTimeout(() => setSparkleButtonClicked(false), 200);
    
    setIsEnhancingUserText(true);
    
    try {
      console.log('🔍 文章強化詳細確認:', {
        targetTextLength: targetText.length,
        targetText: targetText.substring(0, 100) + '...',
        settingsExists: !!settings,
        enhancementPromptExists: !!settings?.enhancementPrompt,
        settingsType: typeof settings,
        settingsKeys: settings ? Object.keys(settings).slice(0, 10) : [],
        enhancementPromptLength: settings?.enhancementPrompt?.length || 0,
        enhancementPromptPreview: settings?.enhancementPrompt ? settings.enhancementPrompt.substring(0, 100) + '...' : 'なし'
      });
      
      const requestBody = {
        text: targetText,
        settings: settings
      };
      
      console.log('🔍 APIリクエスト送信:', {
        url: '/api/enhance-text',
        textLength: targetText.length,
        settingsKeys: settings ? Object.keys(settings) : []
      });
      
      const response = await fetch('/api/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🔍 APIレスポンス受信:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      const data = await response.json();
      console.log('🔍 APIレスポンスデータ:', {
        success: data.success,
        hasEnhancedText: !!data.enhancedText,
        originalTextLength: data.originalText?.length || 0,
        enhancedTextLength: data.enhancedText?.length || 0,
        error: data.error
      });
      
      if (data.success) {
        console.log('✅ 文章強化成功:', data.enhancedText.length, '文字');
        setEditorInitialText(data.enhancedText);
        setIsMessageEditorOpen(true);
      } else {
        console.error('❌ 文章強化失敗:', data.error || '不明なエラー');
        alert('文章強化に失敗しました: ' + (data.error || '不明なエラー'));
      }
    } catch (error) {
      console.error('❌ User text enhancement error:', error);
      alert('文章強化中にエラーが発生しました');
    } finally {
      setIsEnhancingUserText(false);
    }
  };
  /* ================================================ */

  // 文章選択ハンドラー
  const handleTextSelection = (messageId: string) => {
    // AIメッセージの範囲選択時は強化ボタンを表示しない（コピー阻害防止）
    const targetMessage = messages.find(m => m.id === messageId);
    if (targetMessage?.role === 'assistant') {
      setShowEnhanceButton(false);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowEnhanceButton(false);
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 5 || selectedText.length > 200) {
      setShowEnhanceButton(false);
      return;
    }

    // 選択位置を取得
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setSelectedText(selectedText);
    setSelectedMessageId(messageId);
    setEnhanceButtonPosition({
      x: rect.right + 10,
      y: rect.top + window.scrollY - 10
    });
    setShowEnhanceButton(true);
  };

  // 文章強化実行
  const handleTextEnhancement = async () => {
    if (!selectedText || !selectedMessageId || !currentCharacter) return;
    
    setIsEnhancing(true);
    setShowEnhanceButton(false);
    
    try {
      const targetMessage = messages.find(m => m.id === selectedMessageId);
      if (!targetMessage) return;

      const response = await fetch('/api/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          settings: settings
        })
      });
      
      const data = await response.json();
      if (data && data.success) {
        setEnhancementResult({
          originalText: data.originalText,
          enhancedText: data.enhancedText,
          messageId: selectedMessageId
        });
        setShowEnhancementModal(true);
      } else {
        console.error('Text enhancement failed:', data?.error);
        alert('文章の強化に失敗しました: ' + (data?.error || '不明なエラー'));
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      alert('文章の強化中にエラーが発生しました');
    } finally {
      setIsEnhancing(false);
    }
  };

  // 強化された文章を適用
  const applyEnhancement = () => {
    if (!enhancementResult) return;
    
    setMessages(prev => prev.map(msg => 
      msg.id === enhancementResult.messageId 
        ? { 
            ...msg, 
            content: msg.content.replace(
              enhancementResult.originalText, 
              enhancementResult.enhancedText
            ) 
          }
        : msg
    ));
    
    setShowEnhancementModal(false);
    setEnhancementResult(null);
  };

  // 選択解除ハンドラー
  const handleDocumentClick = () => {
    setShowEnhanceButton(false);
  };

  // ドキュメントクリックイベント登録
  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 再生成機能
  const handleRegenerate = async () => {
    if (!currentCharacter || isLoading || messages.length === 0) return;
    
    console.log('🔄 再生成開始');
    
    // 最後のAIメッセージを削除
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') {
      console.log('❌ 最後のメッセージがAIメッセージではありません');
      return;
    }
    
    const messagesWithoutLast = messages.slice(0, -1);
    setMessages(messagesWithoutLast);
    setIsLoading(true);
    if (settings.enableImageGeneration) setIsGeneratingImage(true);

    try {
      // 最後のユーザーメッセージを取得
      const lastUserMessage = messagesWithoutLast.filter(m => m.role === 'user').pop();
      if (!lastUserMessage) {
        console.log('❌ ユーザーメッセージが見つかりません');
        return;
      }

      console.log('📝 再生成対象メッセージ:', lastUserMessage.content);

      // 会話履歴から最後のユーザーメッセージを除外してコンテキストを作成
      const conversationContext = messagesWithoutLast
        .filter((m) => m.id !== lastUserMessage.id)
        .slice(-(settings.historySize || 8)); // 履歴サイズを適切に設定

      console.log('📚 会話コンテキスト件数:', conversationContext.length);

      // 現在のトラッカー状態を取得してAPIに送信用のフォーマットに変換
      const currentTrackerValues = getTrackerValues(currentSessionId);
      const trackersWithCurrentState = currentCharacter?.trackers?.map(tracker => {
        const currentValue = currentTrackerValues[tracker.name];
        
        if (currentValue) {
          // 現在の状態で上書き
          return {
            ...tracker,
            current_value: tracker.type === 'numeric' ? currentValue.value : undefined,
            current_state: tracker.type === 'state' ? currentValue.value : undefined,
            current_boolean: tracker.type === 'boolean' ? currentValue.value : undefined,
            current_text: tracker.type === 'text' ? currentValue.value : undefined,
          };
        }
        
        // 現在の状態がない場合は初期値を使用
        return tracker;
      }) || [];

      // APIを呼び出して新しい応答を生成
      console.log('🌐 API呼び出し開始');
      const chatResponse = await fetch('/api/simple-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastUserMessage.content,
          settings,
          persona: currentPersona,
          characterId: currentCharacter?.name,
          character: currentCharacter,
          memos,
          conversation: conversationContext,
          // 現在のトラッカー状態を送信
          trackers: trackersWithCurrentState
        }),
      });

      console.log('📡 APIレスポンス状態:', chatResponse.status, chatResponse.statusText);

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error('❌ APIエラー:', chatResponse.status, errorText);
        throw new Error(`APIエラー: ${chatResponse.status} ${errorText}`);
      }

      let aiContent = '';
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiResponse]);

      const contentType = chatResponse.headers.get('Content-Type') || '';
      console.log('📄 レスポンスContent-Type:', contentType);

      if (contentType.includes('application/json')) {
        const json = await chatResponse.json();
        console.log('📋 JSONレスポンス:', json);
        
        if (json.success) {
          // サーバーからトラッカー状態を受信した場合は更新
          if (json.trackers && Array.isArray(json.trackers) && currentSessionId && currentCharacter) {
            json.trackers.forEach((tracker: Record<string, unknown>) => {
              if (tracker.name && tracker.current_state !== undefined) {
                updateTrackerValue(currentSessionId, tracker.name as string, tracker.current_state as string, currentCharacter);
                console.log(`🔄 トラッカー状態更新（再生成）: ${tracker.name} = ${tracker.current_state}`);
              }
              if (tracker.name && tracker.current_value !== undefined) {
                updateTrackerValue(currentSessionId, tracker.name as string, tracker.current_value as number, currentCharacter);
                console.log(`🔄 トラッカー値更新（再生成）: ${tracker.name} = ${tracker.current_value}`);
              }
              if (tracker.name && tracker.current_boolean !== undefined) {
                updateTrackerValue(currentSessionId, tracker.name as string, tracker.current_boolean as boolean, currentCharacter);
                console.log(`🔄 トラッカーブール更新（再生成）: ${tracker.name} = ${tracker.current_boolean}`);
              }
              if (tracker.name && tracker.current_text !== undefined) {
                updateTrackerValue(currentSessionId, tracker.name as string, tracker.current_text as string, currentCharacter);
                console.log(`🔄 トラッカーテキスト更新（再生成）: ${tracker.name} = ${tracker.current_text}`);
              }
            });
          }
          
          aiContent = json.content;
          console.log('✅ 再生成成功:', aiContent.substring(0, 100) + '...');
        } else {
          console.error('❌ API成功フラグがfalse:', json.error);
          throw new Error(json.error || 'API応答が失敗しました');
        }
      } else {
        console.log('📡 ストリームレスポンス処理開始');
        const reader = chatResponse.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            aiContent += decoder.decode(value, { stream: true });
            setMessages(prev => prev.map(m => (m.id === aiResponse.id ? { ...m, content: aiContent } : m)));
          }
        }
        console.log('✅ ストリーム処理完了:', aiContent.substring(0, 100) + '...');
      }

      setMessages(prev => prev.map(m => (m.id === aiResponse.id ? { ...m, content: aiContent } : m)));

      if (aiContent && aiContent.trim()) {
        if (settings.chatNotificationSound) {
          VoiceManager.playNotificationSound(true, 0.3);
        }

        // 画像生成
        if (settings.enableImageGeneration) {
          handleImageGeneration(aiResponse, aiContent);
        }
      } else {
        console.error('❌ AI応答が空です');
        // エラー時のフォールバック
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'ごめんなさい、今ちょっと調子が悪いみたい...もう一度話しかけてくれる？',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('❌ 再生成エラー:', error);
      
      // エラー時のフォールバックメッセージ
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      setIsGeneratingImage(false);
      console.log('🔄 再生成処理完了');
    }
  };

  // 会話リセット機能
  const handleReset = () => {
    if (!currentCharacter) return;
    
    console.log('会話リセット:', currentCharacter.name);
    
    // 音声再生を停止
    VoiceManager.stopAudio();
    
        const firstMessage = currentCharacter.first_message || 'こんにちは！';
      
    console.log('リセット後の初回メッセージ:', firstMessage);
    
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: firstMessage,
      timestamp: Date.now()
    }]);
  };

  // 指定メッセージまでロールバック
  const handleRollback = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    setMessages(messages.slice(0, messageIndex + 1));
  };

  // 履歴削除
  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // 履歴選択のクリックイベントを阻止
    
    if (!confirm('この履歴を削除しますか？')) return;
    
    try {
      await historyManager.deleteSession(sessionId);

      // localStorage 側からも削除
      try {
        const listRaw = localStorage.getItem('ai-chat-sessions');
        if (listRaw) {
          const list: SessionSummary[] = JSON.parse(listRaw);
          const filtered = list.filter(s => s.id !== sessionId);
          localStorage.setItem('ai-chat-sessions', JSON.stringify(filtered));
        }
        localStorage.removeItem(`ai-chat-messages:${sessionId}`);
      } catch (e) {
        console.warn('localStorage 履歴削除で警告:', e);
      }

      // 現在のキャラクターのセッションのみ更新
      if (currentCharacter) {
        const updatedSessions = await historyManager.getSessionsByCharacter(currentCharacter.name);
        setSessions(updatedSessions);
      }
      
      // 削除した履歴が現在選択中の場合はリセット
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages(currentCharacter ? [{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: currentCharacter.first_message || 'こんにちは！',
          timestamp: Date.now()
        }] : []);
      }
    } catch (error) {
      console.error('履歴削除エラー:', error);
      alert('履歴の削除に失敗しました');
    }
  };

  // キャラクター背景設定を読み込む関数
  const loadCharacterBackground = (characterName: string) => {
    try {
      console.log('🔍 背景読み込み開始:', characterName);
      
      // キャラクター固有の背景設定を確認
      const characterBackground = BackgroundManager.getCharacterBackground(characterName);
      console.log('📁 BackgroundManager背景:', characterBackground);
      
      // キャラクターデータのchatBackgroundUrlも確認
      const characterBgUrl = currentCharacter?.chatBackgroundUrl;
      console.log('👤 キャラクターchatBackgroundUrl:', characterBgUrl);
      
      // グローバル背景設定も確認
      const globalBackground = localStorage.getItem('customBackground');
      console.log('🌍 グローバル背景:', globalBackground);
      
      // 優先順位: キャラクターchatBackgroundUrl > BackgroundManager > グローバル > デフォルト
      const background = characterBgUrl || characterBackground || globalBackground;
      console.log('✅ 最終背景:', background ? '設定あり' : '設定なし');
      
      const bgElement = document.getElementById('dynamic-background');
      if (bgElement) {
        if (background) {
          if (background.startsWith('data:video/')) {
            bgElement.innerHTML = `
              <video 
                autoplay 
                muted 
                loop 
                playsInline 
                style="width: 100%; height: 100%; object-fit: cover;"
                src="${background}"
              ></video>
            `;
            console.log('🎥 動画背景を適用:', characterName);
          } else {
            bgElement.innerHTML = '';
            bgElement.style.background = `url(${background})`;
            bgElement.style.backgroundSize = 'cover';
            bgElement.style.backgroundPosition = 'center';
            console.log('🖼️ 画像背景を適用:', characterName);
          }
        } else {
          // 背景がない場合は白背景
          bgElement.innerHTML = '';
          bgElement.style.background = '#ffffff';
          bgElement.style.backgroundSize = 'auto';
          console.log('⚪ 白背景を適用:', characterName);
        }
      }
    } catch (error) {
      console.error('背景読み込みエラー:', error);
    }
  };

  // 高度な背景変更ハンドラー（画像・動画・圧縮対応）
  const handleThemeChange = async (themeId: string, customBackground?: string, characterName?: string) => {
    console.log('🎨 背景変更:', themeId, customBackground ? '背景あり' : '背景なし', characterName ? `キャラクター: ${characterName}` : '');
    
    if (customBackground) {
      // キャラクター個別の背景設定を永続化
      if (characterName) {
        await BackgroundManager.saveCharacterBackground(characterName, customBackground);
      } else {
        // グローバル設定の場合はlocalStorageに保存
        localStorage.setItem('customBackground', customBackground);
      }
      
      // 即座に背景を更新
      const bgElement = document.getElementById('dynamic-background');
      if (bgElement) {
        if (customBackground.startsWith('data:video/')) {
          // 動画背景
          bgElement.innerHTML = `
            <video 
              autoplay 
              muted 
              loop 
              playsInline 
              style="width: 100%; height: 100%; object-fit: cover;"
              src="${customBackground}"
            ></video>
          `;
          console.log('🎥 動画背景を即座に適用');
        } else {
          // 画像背景
          bgElement.innerHTML = '';
          bgElement.style.background = `url(${customBackground})`;
          bgElement.style.backgroundSize = 'cover';
          bgElement.style.backgroundPosition = 'center';
          console.log('🖼️ 画像背景を即座に適用');
        }
      }
    } else {
      // 背景削除（白背景）
      if (characterName) {
        BackgroundManager.removeCharacterBackground(characterName);
      } else {
        localStorage.removeItem('customBackground');
      }
      
      const bgElement = document.getElementById('dynamic-background');
      if (bgElement) {
        bgElement.innerHTML = '';
        bgElement.style.background = '#ffffff';
        bgElement.style.backgroundSize = 'auto';
        console.log('⚪ 白背景を即座に適用');
      }
    }
    
    // 設定を保存（キャラクター個別設定の場合はグローバル設定を更新しない）
    if (!characterName) {
      const updatedSettings = {
        ...settings,
        customBackground: customBackground || undefined
      };
      updateSettings(updatedSettings);
    }
  };

  const handleContinue = async () => {
    if (isLoading || !currentCharacter) return;
    setIsLoading(true);
    if (settings.enableImageGeneration) setIsGeneratingImage(true);
    
    try {
      // 現在のトラッカー状態を取得してAPIに送信用のフォーマットに変換
      const currentTrackerValues = getTrackerValues(currentSessionId);
      const trackersWithCurrentState = currentCharacter?.trackers?.map(tracker => {
        const currentValue = currentTrackerValues[tracker.name];
        
        if (currentValue) {
          // 現在の状態で上書き
          return {
            ...tracker,
            current_value: tracker.type === 'numeric' ? currentValue.value : undefined,
            current_state: tracker.type === 'state' ? currentValue.value : undefined,
            current_boolean: tracker.type === 'boolean' ? currentValue.value : undefined,
            current_text: tracker.type === 'text' ? currentValue.value : undefined,
          };
        }
        
        // 現在の状態がない場合は初期値を使用
        return tracker;
      }) || [];

      const chatResponse = await fetch('/api/simple-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '',
          continue: true,
          settings,
          persona: currentPersona,
          characterId: currentCharacter.name,
          character: currentCharacter,
          memos,
          conversation: messages.slice(-(settings.historySize || 15)),
          // 現在のトラッカー状態を送信
          trackers: trackersWithCurrentState
        })
      });

      let aiContent = '';
      const aiMsg: Message = { id: Date.now().toString(), role: 'assistant', content: '', timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);

      const contentType = chatResponse.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        const json = await chatResponse.json();
        if (json.success) {
          // サーバーからトラッカー状態を受信した場合は更新
          if (json.trackers && Array.isArray(json.trackers) && currentSessionId && currentCharacter) {
            json.trackers.forEach((tracker: Record<string, unknown>) => {
              if (tracker.name && tracker.current_state !== undefined) {
                updateTrackerValue(currentSessionId, tracker.name as string, tracker.current_state as string, currentCharacter);
                console.log(`🔄 トラッカー状態更新（継続）: ${tracker.name} = ${tracker.current_state}`);
              }
              if (tracker.name && tracker.current_value !== undefined) {
                updateTrackerValue(currentSessionId, tracker.name as string, tracker.current_value as number, currentCharacter);
                console.log(`🔄 トラッカー値更新（継続）: ${tracker.name} = ${tracker.current_value}`);
              }
              if (tracker.name && tracker.current_boolean !== undefined) {
                updateTrackerValue(currentSessionId, tracker.name as string, tracker.current_boolean as boolean, currentCharacter);
                console.log(`🔄 トラッカーブール更新（継続）: ${tracker.name} = ${tracker.current_boolean}`);
              }
              if (tracker.name && tracker.current_text !== undefined) {
                updateTrackerValue(currentSessionId, tracker.name as string, tracker.current_text as string, currentCharacter);
                console.log(`🔄 トラッカーテキスト更新（継続）: ${tracker.name} = ${tracker.current_text}`);
              }
            });
          }
          
          aiContent = json.content;
        }
      } else {
        const reader = chatResponse.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            aiContent += decoder.decode(value, { stream: true });
            setMessages(prev => prev.map(m => (m.id === aiMsg.id ? { ...m, content: aiContent } : m)));
          }
        }
      }

      setMessages(prev => prev.map(m => (m.id === aiMsg.id ? { ...m, content: aiContent } : m)));

      // トラッカー分析（AIメッセージが完了した後）
      if (aiContent && currentCharacter && currentSessionId) {
        const completedMessage = { ...aiResponse, content: aiContent };
        console.log('📊 トラッカー分析を実行:', {
          sessionId: currentSessionId,
          characterName: currentCharacter.name,
          messageLength: aiContent.length,
          hasTrackers: !!currentCharacter.trackers
        });
        analyzeMessageForTrackerUpdates(currentSessionId, completedMessage, currentCharacter);
        
        // トラッカー更新後、現在の値をログ出力
        if (currentCharacter.trackers) {
          const updatedValues = getTrackerValues(currentSessionId);
          console.log('📊 トラッカー更新後の値:', updatedValues);
        }
      }

      if (aiContent && settings.chatNotificationSound) {
        VoiceManager.playNotificationSound(true, 0.3);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      if (settings.enableImageGeneration) setIsGeneratingImage(false);
    }
  };

  // 画像のみ再生成（ランダムシード）
  const handleImageReroll = async (msg: Message) => {
    if (!settings.enableImageGeneration || msg.role !== 'assistant' || isGeneratingImage) return;

    try {
      setIsGeneratingImage(true);

      const recentMessages = messages.slice(-5).map(m => m.content);

      const imageResponse = await fetch('/api/generate-image/', { // 末尾にスラッシュを追加
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiResponse: msg.content,
          character: currentCharacter,
          conversationContext: recentMessages,
          settings: settings,
          loraSettings: settings.loraSettings,
          negativePrompt: settings.negativePrompt,
          seed: Math.floor(Math.random() * 2 ** 32),
          width: currentCharacter?.imageWidth,
          height: currentCharacter?.imageHeight,
          steps: currentCharacter?.imageSteps,
          cfg_scale: currentCharacter?.imageCfgScale,
          sampler: currentCharacter?.imageSampler,
          // imageEngine: settings.imageEngine, // 個別ではなく settings オブジェクト全体を渡すため削除
          // Runware固有のモデルIDとLORA IDをsettingsから渡す
          // runwareModelId: settings.runwareModelId, // settings オブジェクトに含まれているため削除
          // runwareLoraIds: settings.runwareLoraIds, // settings オブジェクトに含まれているため削除

        })
      });

      const imageData = await imageResponse.json();
      if (imageData.success) {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, image: imageData.imageUrl } : m));
      }
    } catch (e) {
      console.error('Image reroll error:', e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // チャットバブルのコピー処理
  const handleCopy = (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          console.log('コピーしました');
        }).catch(() => {
          // クリップボードAPIが失敗した場合のフォールバック
          fallbackCopy(text);
        });
      } else {
        // セキュアコンテキストでない場合のフォールバック
        fallbackCopy(text);
      }
    } catch (error) {
      console.error('コピーエラー:', error);
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      console.log('コピーしました（フォールバック）');
    } catch (error) {
      console.error('フォールバックコピーエラー:', error);
    }
  };

  /* ================================================
   * 【重要】MessageEditorModal関連の状態変数 - 絶対に変更・削除禁止
   * 
   * これらの変数はMessageEditorModalの動作に必要です。
   * 削除・変更するとモーダルが表示されなくなります。
   * ================================================ */
  // メッセージ編集モーダル
  const [isMessageEditorOpen, setIsMessageEditorOpen] = useState(false);
  const [editorInitialText, setEditorInitialText] = useState('');
  /* ================================================ */

  // キャラクター選択時の処理
  const onSelectCharacter = (character: Character) => {
    console.log('🎭 キャラクター選択:', character.name);
    
    // アバター（base64）が保存されていれば適用
    try {
      const storedAvatar = localStorage.getItem(`ai-chat-char-avatar:${character.name}`);
      if (storedAvatar) {
        character = { ...character, avatar_url: storedAvatar };
      }
    } catch (e) {
      console.warn('アバター復元に失敗（選択時）:', e);
    }

    // キャラクターを設定（ローカルステートとZustandストアの両方）
    setCurrentCharacter(character);
    setStoreCurrentCharacter(character);
    
    // ローカルストレージにも保存（Webページ対応）
    try {
      localStorage.setItem('ai-chat-current-character', character.name);
      console.log('✅ キャラクターをローカルストレージに保存:', character.name);
    } catch (error) {
      console.warn('⚠️ ローカルストレージ保存に失敗:', error);
    }
    
    // 現在のセッションをクリア
    setCurrentSessionId(null);
    setMessages([]);
    
    // 初期メッセージを設定
    setInitialMessage(character);
    
    // キャラクターの背景を適用（優先順位: chatBackgroundUrl > background > デフォルト）
    console.log('🎨 キャラクター背景の適用開始:', character.name);
    console.log('📁 chatBackgroundUrl:', character.chatBackgroundUrl);
    console.log('📁 background:', character.background);
    
    if (character.chatBackgroundUrl) {
      console.log('✅ chatBackgroundUrlを使用して背景を適用');
      loadCharacterBackground(character.name);
    } else if (character.background) {
      console.log('✅ backgroundを使用して背景を適用');
      BackgroundManager.saveCharacterBackground(character.name, character.background);
      loadCharacterBackground(character.name);
    } else {
      console.log('⚪ デフォルト背景を適用');
      loadCharacterBackground(character.name);
    }
    
    // サイドバーを閉じる
    setIsSidebarOpen(false);
  };

  return (
    <>
      <div
        ref={mainContainerRef}
        className="flex relative w-full chat-container"
        style={{
          background: '#ffffff',
          overflow: 'hidden',
          height: '100dvh',
          minHeight: '100dvh' // 追加：最小高さを保証
        }}
      >
        {/* 動的背景（画像・動画対応） */}
        <div 
          id="dynamic-background"
          className="fixed inset-0 w-full h-full z-0"
          style={{
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        {/* 背景オーバーレイ（サイドバー開時） */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
            title="タップしてサイドバーを閉じる"
          />
        )}
        
        {/* サイドバー */}
        <div className={`
          ${isSidebarOpen ? 'w-80 pointer-events-auto' : 'w-0 pointer-events-none'} 
          bg-black/80 backdrop-blur-md border-r border-white/20 flex flex-col h-screen transition-all duration-300 md:overflow-hidden overflow-y-auto scroll-touch
          relative z-50
          ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}
        `}
        style={{
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)'
        }}>
          <div className="min-w-80 flex flex-col h-full">
            {/* タブナビゲーション */}
            <div className="flex-shrink-0 border-b border-white/30 relative z-10 bg-black/20 backdrop-blur-sm">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('characters')}
                  className={`flex-1 py-4 px-4 text-sm font-medium transition-colors relative z-20 ${
                    activeTab === 'characters' 
                      ? 'text-white border-b-2 border-blue-400 bg-white/20' 
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  👤 キャラクター
                </button>
                <button
                  onClick={() => setActiveTab('personas')}
                  className={`flex-1 py-4 px-4 text-sm font-medium transition-colors relative z-20 ${
                    activeTab === 'personas' 
                      ? 'text-white border-b-2 border-blue-400 bg-white/20' 
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  🎭 ペルソナ
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-4 px-4 text-sm font-medium transition-colors relative z-20 ${
                    activeTab === 'history' 
                      ? 'text-white border-b-2 border-blue-400 bg-white/20' 
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  📚 履歴
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-4 px-4 text-sm font-medium transition-colors relative z-20 ${
                    activeTab === 'settings' 
                      ? 'text-white border-b-2 border-blue-400 bg-white/20' 
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  ⚙️ 設定
                </button>
              </div>
          </div>

            {/* タブコンテンツ */}
            <div className="flex-1 overflow-hidden">
              {/* キャラクタータブ */}
              {activeTab === 'characters' && (
                <div className="h-full flex flex-col">
            <CharacterSelector
            characters={allCharacters}
            currentCharacter={currentCharacter}
            onSelectCharacter={onSelectCharacter}
            onAddCharacter={() => {
              setEditingCharacter(null);
              setIsCharacterModalOpen(true);
            }}
            onEditCharacter={(character: Character) => {
              setEditingCharacter(character);
              setIsCharacterModalOpen(true);
            }}
            onDeleteCharacter={(character: Character) => {
              if (confirm(`「${character.name}」を削除しますか？`)) {
                CharacterLoader.deleteCharacter(character.name);
                const updatedCharacters = CharacterLoader.getAllCharacters();
                setAllCharacters(updatedCharacters);
                
                // 削除したキャラクターが現在選択中の場合
                if (currentCharacter?.name === character.name) {
                  const firstCharacter = updatedCharacters[0];
                  if (firstCharacter) {
                    console.log('削除後の代替キャラクター:', firstCharacter.name);
                    setCurrentCharacter(firstCharacter);
                    setStoreCurrentCharacter(firstCharacter);
                    setCurrentSessionId(null);
                    
                    // 代替キャラクターの背景を適用
                    loadCharacterBackground(firstCharacter.name);
                    
                    const firstMessage = firstCharacter.first_message || 'こんにちは！';
                      
                    setMessages([{
                      id: crypto.randomUUID(),
                      role: 'assistant',
                      content: firstMessage,
                      timestamp: Date.now()
                    }]);
                  } else {
                    setCurrentCharacter(null);
                    setMessages([]);
                    // キャラクターがなくなった場合はデフォルトテーマを適用
                    handleThemeChange('default', undefined);
                  }
                }
              }
            }}
            onImportExport={() => setIsImportExportOpen(true)}
          />
                </div>
              )}

              {/* ペルソナタブ */}
              {activeTab === 'personas' && (
                <div className="h-full flex flex-col">
                  <PersonaSelector
                    personas={userPersonas}
                    currentPersona={currentPersona}
                    onSelectPersona={(persona) => {
                      // デフォルトペルソナの場合はnullを設定
                      if (persona?.id === 'default-persona') {
                        setUserPersona(null);
                      } else {
                        setUserPersona(persona);
                      }
                    }}
                    onAddPersona={() => {
                      setEditingPersona(null);
                      setIsPersonaModalOpen(true);
                    }}
                    onEditPersona={(persona) => {
                      // デフォルトペルソナは編集できない
                      if (persona.id === 'default-persona') {
                        alert('デフォルトペルソナは編集できません');
                        return;
                      }
                      
                      setEditingPersona(persona);
                      setIsPersonaModalOpen(true);
                    }}
                    onDeletePersona={(persona) => {
                      // デフォルトペルソナは削除できない
                      if (persona.id === 'default-persona') {
                        alert('デフォルトペルソナは削除できません');
                        return;
                      }
                      
                      if (confirm(`「${persona.name}」を削除しますか？`)) {
                        deleteUserPersona(persona.id);
                      }
                    }}
                    onImportExport={() => setIsPersonaImportExportOpen(true)}
                  />
                </div>
              )}

              {/* 履歴タブ */}
              {activeTab === 'history' && (
                <div className="h-full flex flex-col">
                  {/* スクロール可能な履歴エリア */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 chat-history-scroll">
                    {sessions.slice(0, 50).map((session) => (
                      <div
                        key={session.id}
                        onClick={async () => {
                          try {
                            const loadedSession = await historyManager.loadSession(session.id);
                            if (loadedSession) {
                              setMessages(loadedSession.messages);
                              setCurrentSessionId(session.id);
                            }
                          } catch (error) {
                            console.error('セッション読み込みエラー:', error);
                          }
                        }}
                        className={`group bg-white/20 backdrop-blur-md rounded-lg p-3 cursor-pointer hover:bg-white/30 transition-all duration-200 relative ${
                          currentSessionId === session.id ? 'ring-2 ring-blue-400 bg-blue-400/30' : ''
                        } hover:shadow-lg hover:scale-[1.02]`}
                      >
                        {/* 削除ボタン */}
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/70 hover:text-red-400 hover:bg-red-500/30 rounded-full p-1"
                          title="履歴を削除"
                        >
                          <X size={12} />
                        </button>

                        <div className="text-white text-sm font-medium truncate mb-1 pr-6">
                          {session.title}
                        </div>
                        <div className="text-white/90 text-xs truncate mb-2 leading-relaxed">
                          {session.lastMessage}
                        </div>
                        <div className="text-white/70 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(session.updatedAt).toLocaleDateString('ja-JP', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {currentSessionId === session.id && (
                            <div className="text-blue-400 text-xs font-medium">
                              ● 現在
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* 履歴が多い場合の表示制限通知 */}
                    {sessions.length > 50 && (
                      <div className="text-white/40 text-xs text-center py-2 px-3 bg-white/5 rounded-lg">
                        最新50件を表示中 (全{sessions.length}件)
                      </div>
                    )}
                    
                    {sessions.length === 0 && (
                      <div className="text-white/80 text-sm text-center py-8">
                        <MessageSquare size={24} className="mx-auto mb-2 opacity-70" />
                        まだ履歴がありません
                        <p className="text-xs mt-1 text-white/60">
                          最初のメッセージを送信すると履歴が作成されます
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 設定タブ */}
              {activeTab === 'settings' && (
                <div className="h-full flex flex-col p-4 space-y-2">
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Cloud size={16} />
                    クラウド同期
                  </button>
                  <button 
                    onClick={() => setIsThemeModalOpen(true)}
                    className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Palette size={16} />
                    テーマ変更
                  </button>
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Settings size={16} />
                    設定
                  </button>
                  <button 
                    onClick={() => setIsCharacterGalleryOpen(true)}
                    className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <User size={16} />
                    キャラクターギャラリー
                  </button>
                  <button 
                    onClick={async () => {
                      console.log('🔄 キャラクターリスト更新開始...');
                      try {
                        const { CharacterLoader } = await import('../../lib/characterLoader');
                        const updatedCharacters = await CharacterLoader.forceReload();
                        setAllCharacters(updatedCharacters);
                        console.log('✅ キャラクターリスト更新完了:', updatedCharacters.length, '件');
                        alert(`キャラクターリストを更新しました（${updatedCharacters.length}件）`);
                      } catch (error) {
                        console.error('❌ キャラクターリスト更新エラー:', error);
                        alert('キャラクターリストの更新に失敗しました');
                      }
                    }}
                    className="w-full bg-green-500/20 backdrop-blur-sm text-green-200 py-3 px-4 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <RefreshCw size={16} />
                    キャラクターリスト更新
                  </button>
                  <button 
                    onClick={handleImageTest}
                    disabled={isGeneratingImage}
                    className="w-full bg-yellow-500/20 backdrop-blur-sm text-yellow-200 py-3 px-4 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    🖼️
                    画像生成テスト
                  </button>
                  <button 
                    onClick={() => {
                      // テスト用: 直接背景を設定
                      const testBg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2MzY2ZjE7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojOWZiMGY0O3N0b3Atb3BhY2l0eToxIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiIC8+PC9zdmc+';
                      console.log('🧪 背景テスト開始');
                      const bgElement = document.getElementById('dynamic-background');
                      if (bgElement) {
                        bgElement.style.background = `url(${testBg})`;
                        bgElement.style.backgroundSize = 'cover';
                        console.log('✅ テスト背景適用完了');
                      } else {
                        console.error('❌ 背景要素が見つかりません');
                      }
                    }}
                    className="w-full bg-blue-500/20 backdrop-blur-sm text-blue-200 py-3 px-4 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                  >
                    🧪
                    背景テスト
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* メインチャットエリア */}
        <div className="flex-1 flex flex-col w-full md:w-auto h-full max-h-screen">
          {/* ヘッダー - 固定 */}
          <div className="bg-transparent p-2 md:p-4 safe-area-top flex-shrink-0 fixed top-0 left-0 right-0 z-50 md:relative md:sticky">
            {/* メインヘッダー行 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('🍔 バーガーメニューがクリックされました。現在の状態:', isSidebarOpen, '→', !isSidebarOpen);
                  setIsSidebarOpen(!isSidebarOpen);
                }}
                className="touch-target theme-text-primary hover:bg-white/10 p-1.5 md:p-2 rounded-lg transition-colors"
                title={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
              >
                <Menu size={24} />
              </button>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center">
                {currentCharacter?.avatar_url ? (
                  <img
                    src={currentCharacter.avatar_url}
                    alt={currentCharacter.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-lg font-bold">
                    {currentCharacter?.name ? currentCharacter.name.charAt(0) : 'A'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => {
                    if (currentCharacter) {
                      setEditingCharacter(currentCharacter);
                      setIsCharacterModalOpen(true);
                    }
                  }}
                  className="text-left inline-block max-w-fit"
                >
                  <h3 className="text-white font-semibold truncate hover:text-blue-200 transition-colors text-sm md:text-base">
                    {currentCharacter?.name || 'キャラクター'}
                  </h3>
                  <p className="text-white/70 text-xs md:text-sm truncate">{currentCharacter?.tags[0] || '航海士'}</p>
                  {/* 現在のペルソナ表示 */}
                  {currentPersona && (
                    <p className="text-blue-300 text-xs truncate mt-1">
                      👤 {currentPersona.name}
                    </p>
                  )}
                </button>
                
                {/* デバッグ情報 */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-white/50 mt-1">
                    Debug: showTrackers={showTrackers.toString()}, hasTrackers={!!currentCharacter?.trackers}, hasSession={!!currentSessionId}
                  </div>
                )}
              </div>
              
              {/* キャラクター編集ボタン */}
              <button
                onClick={() => {
                  if (currentCharacter) {
                    setEditingCharacter(currentCharacter);
                    setIsCharacterModalOpen(true);
                  }
                }}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                title="キャラクター編集"
              >
                <Edit size={20} />
              </button>
              
              <div className="flex gap-2 shrink-0">
                {/* 🚨 画面右上5つのアイコン - 重要機能保護開始 🚨 */}
                {/* これらのアイコンは何度も消失しています。絶対に削除・変更しないでください！ */}
                {/* 1. トラッカートグルボタン (Activity) */}
                {/* 2. クイック設定 (Zap) */}
                {/* 3. チャット履歴 (MessageSquare) */}
                {/* 4. 詳細設定 (Settings) */}
                {/* 5. キャラクターギャラリー (User) */}
                
                {/* トラッカートグルボタン - 条件を緩和してデバッグ */}
                {(currentCharacter?.trackers || process.env.NODE_ENV === 'development') && (
                  <button
                    onClick={() => setShowTrackers(!showTrackers)}
                    className={`touch-target p-1.5 md:p-2 rounded-lg transition-all duration-200 ${
                      showTrackers 
                        ? 'text-blue-400 bg-blue-400/20 hover:bg-blue-400/30' 
                        : 'theme-text-primary hover:bg-white/10'
                    }`}
                    title={showTrackers ? 'トラッカーを非表示' : 'トラッカーを表示'}
                  >
                    <Activity size={16} className={showTrackers ? 'animate-pulse' : ''} />
                  </button>
                )}
                <button
                  onClick={() => setIsQuickSettingsOpen(true)}
                  className="touch-target text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 p-1.5 md:p-2 rounded-lg transition-all duration-200 shadow-sm"
                  title="クイック設定"
                >
                  <Zap size={20} />
                </button>
                <button
                  onClick={() => setIsChatHistoryOpen(true)}
                  className="touch-target text-green-400 hover:text-green-300 hover:bg-green-500/20 p-1.5 md:p-2 rounded-lg transition-all duration-200 shadow-sm"
                  title="チャット履歴"
                >
                  <MessageSquare size={20} />
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="touch-target text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 p-1.5 md:p-2 rounded-lg transition-all duration-200 shadow-sm"
                  title="詳細設定"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => setIsCharacterGalleryOpen(true)}
                  className="touch-target text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 p-1.5 md:p-2 rounded-lg transition-all duration-200 shadow-sm"
                  title="キャラクターギャラリー"
                >
                  <User size={16} />
                </button>
                {/* 🚨 画面右上5つのアイコン - 重要機能保護終了 🚨 */}
              </div>
            </div>
            
            {/* トラッカー表示（独立した行） */}
            {(() => {
              const hasTrackers = showTrackers && currentCharacter?.trackers && currentSessionId;
              const trackerValues = hasTrackers ? getTrackerValues(currentSessionId) || {} : {};
              
              // デバッグログ
              if (currentCharacter?.name === 'マーフィン・グレイス' || currentCharacter?.name.includes('マーフィン')) {
                console.log('🔍 マーフィン・グレイストラッカー表示条件チェック:', {
                  showTrackers,
                  hasCharacter: !!currentCharacter,
                  characterName: currentCharacter?.name,
                  hasTrackers: !!currentCharacter?.trackers,
                  trackerCount: currentCharacter?.trackers?.length || 0,
                  currentSessionId,
                  trackerValuesKeys: Object.keys(trackerValues),
                  willShow: hasTrackers
                });
              }
              
              return hasTrackers ? (
                <div className="mt-2 transition-all duration-300 ease-in-out relative z-0">
                  <CharacterTrackerDisplay
                    trackers={currentCharacter.trackers}
                    currentValues={trackerValues}
                    onChange={(name, value) => {
                      console.log('📊 手動トラッカー更新:', { sessionId: currentSessionId, name, value });
                      updateTrackerValue(currentSessionId, name, value, currentCharacter!);
                    }}
                    readOnly={false}
                    compact={true}
                  />
                </div>
              ) : null;
            })()}
          </div>

          {/* AI候補選択エリア */}
          {showInspiration && inspirationCandidates.length > 0 && (
            <div className="p-4 bg-blue-50/80 backdrop-blur-sm border-b border-blue-200">
              <div className="max-w-4xl mx-auto space-y-3">
                <div className="text-sm text-blue-700 font-medium flex items-center gap-2">
                  <span>🤖</span>
                  <span>AIが{inspirationCandidates.length}つの返答候補を生成しました。お選びください：</span>
                </div>
                <div className="space-y-2">
                  {inspirationCandidates.map((candidate, index) => {
                    // 候補が文字列でない場合は安全に変換
                    const candidateText = typeof candidate === 'string' ? candidate : String(candidate || '');
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          // 選択された候補をメッセージに追加
                          const aiResponse = {
                            id: crypto.randomUUID(),
                            role: 'assistant' as const,
                            content: candidateText,
                            timestamp: Date.now()
                          };
                          setMessages(prev => [...prev, aiResponse]);
                          setShowInspiration(false);
                          setInspirationCandidates([]);
                        }}
                        className="w-full text-left p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200 hover:bg-blue-100/80 transition-colors text-gray-700 text-sm leading-relaxed"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500 text-xs mt-1 font-medium">{index + 1}.</span>
                          <span className="flex-1">{candidateText}</span>
                        </div>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setShowInspiration(false);
                      setInspirationCandidates([]);
                    }}
                    className="w-full p-2 text-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ✕ 候補を閉じる
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* チャットメッセージエリア - スクロール可能 */}
          <div className="flex-1 p-2 md:p-4 space-y-4 md:space-y-6 overflow-y-auto pt-16 pb-40 md:pt-4 md:pb-32 min-h-0 scroll-smooth overscroll-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' ? (
                  <div className="max-w-2xl w-full">
                    {/* キャラクター画像 */}
                    {settings.enableImageGeneration && (msg.image || isGeneratingImage) && (
                      <div className="mb-3">
                        <div className="relative">
                          {msg.image && (
                            <Image
                              src={msg.image}
                              alt="Character"
                              width={512}
                              height={768}
                              className="w-full max-w-[85vw] sm:w-80 h-auto sm:h-96 rounded-lg shadow-2xl object-cover"
                            />
                          )}
                          {isGeneratingImage && !msg.image && (
                            <div className="w-full max-w-[85vw] sm:w-80 h-auto sm:h-96 bg-black/30 rounded-lg flex items-center justify-center">
                              <Loader className="animate-spin text-white" size={24} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* メッセージバブル */}
                    <div 
                      className="relative z-10 rounded-xl p-2 md:p-3 lg:p-4 shadow-lg bg-white/70 backdrop-blur-sm"
                    >
                       <div 
                         className="text-gray-800 leading-relaxed whitespace-pre-wrap font-cute text-xs md:text-sm lg:text-base"
                         onMouseUp={() => msg.role === 'user' ? handleTextSelection(msg.id) : undefined}
                         style={{ userSelect: 'text' }}
                       >
                         {/* 最新のAIメッセージのみタイプライター効果を適用 */}
                         {msg.role === 'assistant' && messages[messages.length - 1]?.id === msg.id ? (
                           <Typewriter 
                             text={typeof msg.content === 'string' ? msg.content : String(msg.content || '')} 
                             speed={settings.typewriterSpeed || 30}
                           />
                         ) : (
                           <FormattedText md={typeof msg.content === 'string' ? msg.content : String(msg.content || '')} />
                         )}
                       </div>
                       <div className="flex justify-end mt-2 gap-1 flex-wrap">
                         <VoiceControls
                           text={typeof msg.content === 'string' ? msg.content : String(msg.content || '')}
                           characterName={currentCharacter?.name}
                           settings={{
                             enabled: settings.voiceEnabled ?? true,
                             autoPlay: settings.voiceAutoPlay ?? false,
                             voiceId: settings.voiceId ?? 'pNInz6obpgDQGcFmaJgB',
                             stability: settings.voiceStability ?? 0.5,
                             similarityBoost: settings.voiceSimilarityBoost ?? 0.75,
                             style: settings.voiceStyle ?? 0,
                             useSpeakerBoost: settings.voiceUseSpeakerBoost ?? true,
                             speed: settings.voiceSpeed ?? 1.0,
                             volume: settings.voiceVolume ?? 0.8,
                           }}
                           appSettings={settings}
                           apiKey={settings.elevenLabsApiKey}
                         />
                         {/* デスクトップ用メモボタン */}
                         <div className="hidden md:block">
                           <MessageMemoButton 
                             messageId={msg.id}
                             messageContent={typeof msg.content === 'string' ? msg.content : String(msg.content || '')}
                             sessionId={currentSessionId || 'temp'}
                             characterId={currentCharacter?.name || 'unknown'}
                           />
                         </div>
                         {/* モバイル用メモボタン */}
                         <div className="md:hidden">
                           <MessageMemoButton 
                             messageId={msg.id}
                             messageContent={msg.content}
                             sessionId={currentSessionId || 'temp'}
                             characterId={currentCharacter?.name || 'unknown'}
                           />
                         </div>
                         <button 
                           onClick={() => handleRegenerate()}
                           disabled={isLoading}
                           className="touch-target text-gray-500 hover:text-gray-700 p-1 rounded disabled:opacity-50"
                           title="再生成"
                         >
                           <RefreshCw size={14} />
                         </button>
                         <button 
                           onClick={() => handleRollback(msg.id)}
                           disabled={isLoading}
                           className="touch-target text-gray-500 hover:text-gray-700 p-1 rounded disabled:opacity-50"
                           title="このメッセージまで戻す"
                         >
                           <CornerUpLeft size={14} />
                         </button>
                         <button
                          onClick={() => handleCopy(msg.content)}
                          className="touch-target text-gray-500 hover:text-gray-700 p-1 rounded"
                          title="コピー"
                         >
                          <Copy size={14} />
                         </button>
                         {/* アクションボタン（続き、リセット、要約、感想） */}
                         <button
                          onClick={handleContinue}
                          disabled={isLoading}
                          className="touch-target text-gray-500 hover:text-blue-600 p-1 rounded disabled:opacity-50"
                          title="続きを話す"
                         >
                          ▶
                         </button>
                         <button
                          onClick={handleReset}
                          className="touch-target text-gray-500 hover:text-cyan-600 p-1 rounded"
                          title="リセット"
                         >
                          🔄
                         </button>
                         <button
                          onClick={handleGenerateSummary}
                          disabled={isGeneratingSummary || messages.length < 3}
                          className="touch-target text-gray-500 hover:text-orange-600 p-1 rounded disabled:opacity-50"
                          title="要約"
                         >
                          📝
                         </button>
                         <button
                          onClick={handleGenerateEnhancedImpression}
                          disabled={isGeneratingImpression || messages.length < 3}
                          className="touch-target text-gray-500 hover:text-pink-600 p-1 rounded disabled:opacity-50"
                          title="感想"
                         >
                          ✨
                         </button>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl w-full flex justify-end">
                    <div 
                      className="relative z-10 rounded-xl p-2 md:p-3 lg:p-4 shadow-lg bg-blue-100/70 backdrop-blur-sm"
                    >
                      <div 
                        className="text-gray-800 leading-relaxed whitespace-pre-wrap font-cute text-xs md:text-sm lg:text-base"
                        onMouseUp={() => handleTextSelection(msg.id)}
                        style={{ userSelect: 'text' }}
                      >
                        <FormattedText md={typeof msg.content === 'string' ? msg.content : String(msg.content || '')} />
                      </div>
                      <div className="flex justify-end mt-2 gap-1">
                        <button
                          onClick={() => handleCopy(typeof msg.content === 'string' ? msg.content : String(msg.content || ''))}
                          className="touch-target text-gray-500 hover:text-gray-700 p-1 rounded"
                          title="コピー"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} className="h-16" />
          </div>

          {/* メッセージ入力フォーム - 下固定 */}
          <div className="p-2 md:p-4 safe-area-bottom flex-shrink-0 bg-transparent fixed bottom-0 left-0 right-0 z-40 md:relative md:sticky">
            <div className="max-w-4xl mx-auto">

              
              {/* 返答候補表示エリア */}
              {showInspirationCandidates && userInspirationCandidates.length > 0 && (
                <div className="mb-3 space-y-2">
                  <div className="text-sm text-gray-600 font-medium mb-2">💡 返答候補を選択してください：</div>
                  {userInspirationCandidates.map((candidate, index) => {
                    console.log(`🔍 表示時候補${index + 1}:`, candidate);
                    console.log(`🔍 表示時候補${index + 1} の型:`, typeof candidate);
                    console.log(`🔍 表示時候補${index + 1} の長さ:`, candidate?.length || 'undefined');
                    
                    // 候補が文字列でない場合は安全に変換
                    const candidateText = typeof candidate === 'string' ? candidate : String(candidate || '');
                    
                    return (
                      <button
                        key={index}
                        onClick={() => selectInspirationCandidate(candidateText)}
                        className="w-full text-left p-3 bg-gray-100/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-gray-200/80 transition-colors text-gray-700 text-sm leading-relaxed"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 text-xs mt-1">✏️</span>
                          <span className="flex-1">{candidateText}</span>
                        </div>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setShowInspirationCandidates(false);
                      setUserInspirationCandidates([]);
                    }}
                    className="w-full p-2 text-center text-gray-500 hover:text-gray-700 text-sm"
                  >
                    ✕ 候補を閉じる
                  </button>
                </div>
              )}
              
              {/* 入力エリア */}
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="メッセージを入力 (Ctrl+Enterで送信)"
                  className={`w-full p-3 md:p-4 pr-24 md:pr-32 rounded-full resize-none transition-all duration-300 
                    ${isInputExpanded ? 
                      'bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-xl border border-blue-300/50' : 
                      'bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-white/30 shadow-md'
                    }
                    text-gray-900 dark:text-white placeholder-gray-700 dark:placeholder-gray-400 
                    focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60
                    focus:bg-white/98 dark:focus:bg-gray-800/98 focus:shadow-xl
                    text-base md:text-base font-medium ${
                    isInputExpanded ? 'h-24 md:h-32' : 'h-12 md:h-16'
                  }`}
                  onFocus={() => setIsInputExpanded(true)}
                  onBlur={() => setIsInputExpanded(false)}
                />
                <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {/* 電球とキラキラボタンを縦に配置 */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={handleUserInspiration}
                      disabled={isLoadingUserInspiration}
                      className={`min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px] text-gray-500 hover:text-yellow-500 p-1.5 rounded-full hover:bg-yellow-100 transition-all duration-200 disabled:opacity-50 ${bulbButtonClicked ? 'scale-95 bg-yellow-100 text-yellow-600' : ''} ${!isLoadingUserInspiration ? 'animate-pulse hover:animate-none' : ''} shadow-sm hover:shadow-md`}
                      title="返信を提案"
                    >
                      {isLoadingUserInspiration ? <Loader className="animate-spin" size={14} /> : '💡'}
                    </button>
                    <button
                      onTouchStart={() => {
                        if (inputRef.current) {
                          const { selectionStart, selectionEnd, value } = inputRef.current;
                          if (selectionEnd > selectionStart) {
                            setPendingSelection(value.substring(selectionStart, selectionEnd));
                          } else {
                            setPendingSelection('');
                          }
                        }
                      }}
                      onMouseDown={() => {
                        if (inputRef.current) {
                          const { selectionStart, selectionEnd, value } = inputRef.current;
                          if (selectionEnd > selectionStart) {
                            setPendingSelection(value.substring(selectionStart, selectionEnd));
                          } else {
                            setPendingSelection('');
                          }
                        }
                      }}
                      onClick={handleUserTextEnhancement}
                      disabled={isEnhancingUserText}
                      className={`min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px] text-gray-500 hover:text-purple-500 p-1.5 rounded-full hover:bg-purple-100 transition-all duration-200 disabled:opacity-50 ${sparkleButtonClicked ? 'scale-95 bg-purple-100 text-purple-600' : ''} ${!isEnhancingUserText ? 'animate-bounce hover:animate-none' : ''} shadow-sm hover:shadow-md`}
                      title="文章を強化"
                    >
                      {isEnhancingUserText ? <Loader className="animate-spin" size={14} /> : '✨'}
                    </button>
                  </div>
                  {/* 送信ボタン */}
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className={`touch-target bg-blue-500 text-white w-10 h-10 md:w-12 md:h-12 rounded-full hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center ${sendButtonClicked ? 'scale-95 bg-blue-600' : ''} ${!isLoading && message.trim() ? 'animate-pulse hover:animate-none' : ''} shadow-lg hover:shadow-xl`}
                    title="送信 (Ctrl+Enter)"
                  >
                    {isLoading ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* モーダル群 */}
      {isCharacterModalOpen && (
        <CharacterModal
          isOpen={isCharacterModalOpen}
          onClose={() => {
            setIsCharacterModalOpen(false);
            setIsCharacterModalFromGallery(false); // フラグをリセット
            
            // ギャラリーから開いた場合はギャラリーに戻る
            if (isCharacterModalFromGallery) {
              setIsCharacterGalleryOpen(true);
            }
          }}
          character={editingCharacter}
          fromGallery={isCharacterModalFromGallery}
          onReturnToGallery={() => {
            setIsCharacterModalOpen(false);
            setIsCharacterModalFromGallery(false);
            setIsCharacterGalleryOpen(true); // ギャラリーを再表示
          }}
          onSave={async (updatedCharacter) => {
            CharacterLoader.addCharacter(updatedCharacter);
            const updatedCharacters = CharacterLoader.getAllCharacters();
            setAllCharacters(updatedCharacters);
            if (currentCharacter?.name === updatedCharacter.name) {
              setCurrentCharacter(updatedCharacter);
              setStoreCurrentCharacter(updatedCharacter);
            }
            setIsCharacterModalFromGallery(false); // フラグをリセット
            
            // ギャラリーから開いた場合はギャラリーに戻る（保存処理はCharacterModal内で実行）
            if (isCharacterModalFromGallery) {
              setIsCharacterGalleryOpen(true);
            }
            if (updatedCharacter.background) {
              BackgroundManager.saveCharacterBackground(updatedCharacter.name, updatedCharacter.background);
            }
            
            // Supabaseに保存（認証済みの場合のみ）
            try {
              // 認証状態をチェックしてからクラウド同期を実行
              const { supabase } = await import('../../lib/supabase');
              if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const result = await saveCharacterToCloud(updatedCharacter);
                  if (result.success) {
                    console.log('✅ キャラクターをSupabaseに保存しました:', updatedCharacter.name);
                  } else {
                    console.warn('⚠️ Supabase保存に失敗:', result.error);
                  }
                } else {
                  console.log('ℹ️ 未ログイン状態のため、ローカル保存のみ実行');
                }
              } else {
                console.log('ℹ️ Supabase未設定のため、ローカル保存のみ実行');
              }
            } catch (error) {
              console.error('❌ Supabase保存エラー:', error);
              // エラーが発生してもローカル保存は成功しているため、処理は継続
            }
          }}
        />
      )}
      
      {/* 🚨 画面右上5つのアイコン関連モーダル - 重要機能保護開始 🚨 */}
      {/* これらのモーダルは何度も消失しています。絶対に削除・変更しないでください！ */}
      
      {/* 1. 詳細設定モーダル (Settings) */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={updateSettings}
        />
      )}

      {/* 2. クイック設定モーダル (Zap) */}
      {isQuickSettingsOpen && (
        <QuickSettingsModal
          isOpen={isQuickSettingsOpen}
          onClose={() => setIsQuickSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
        />
      )}
      {isPersonaModalOpen && (
        <PersonaModal
          isOpen={isPersonaModalOpen}
          onClose={() => setIsPersonaModalOpen(false)}
          initialPersona={editingPersona}
          onSave={(savedPersona) => {
            if (editingPersona) {
              // 編集の場合
              updateUserPersona(savedPersona.id, savedPersona);
            } else {
              // 新規追加の場合
              addUserPersona(savedPersona);
            }
            setIsPersonaModalOpen(false);
          }}
        />
      )}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
      {isSummaryOpen && (
        <ChatSummaryModal
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          summary={currentSummary}
          isLoading={isGeneratingSummary}
          sessionTitle={currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || 'Untitled Session' : 'Untitled Session'}
          characterName={currentCharacter?.name || 'Unknown Character'}
        />
      )}
      {isEnhancedImpressionOpen && (
        // 型不一致回避のため、isOpen等のpropsは渡さずガードで囲む
        {/* 一時的にコメントアウト
        <EnhancedImpressionModal />
        */}
      )}
      
      {/* 5. キャラクターギャラリーモーダル (User) */}
      {isCharacterGalleryOpen && (
        <CharacterGallery
          characters={(() => {
            // 🚨 CharacterGallery に渡す直前のallCharactersをデバッグ 🚨
            const targetCharacters = allCharacters.filter(c => 
              c.name.includes('マーフィン') || c.name.includes('グレイス') || 
              c.name.includes('澪') || c.name.includes('ミオ') || 
              c.name.includes('アン')
            );
            if (targetCharacters.length > 0) {
              console.log('🔍🔍🔍 CharacterGallery渡し直前のallCharacters対象数:', targetCharacters.length);
              targetCharacters.forEach((c, index) => {
                console.log(`🔍🔍🔍 [${index}] ${c.name}:`, {
                  name: c.name,
                  systemPrompt: c.systemPrompt?.substring(0, 50) + '...',
                  appearanceNegativePrompt: c.appearanceNegativePrompt?.substring(0, 50) + '...',
                  first_message: c.first_message?.substring(0, 50) + '...',
                  nsfw_profile: typeof c.nsfw_profile === 'object' ? '[object]' : c.nsfw_profile?.substring(0, 50) + '...',
                  hasCharacterDefinition: !!c.character_definition,
                  allKeys: Object.keys(c)
                });
              });
            }
            return allCharacters;
          })()}
          currentCharacter={currentCharacter}
          onSelectCharacter={async (character) => {
            console.log('ギャラリーからキャラクター変更:', character.name);
            
            // 🚨 キャラクター選択時データ確認 🚨
            if (character.name.includes('マーフィン') || character.name.includes('グレイス') || 
                character.name.includes('澪') || character.name.includes('ミオ') ||
                character.name.includes('アン')) {
              console.log('🔍🔍🔍 キャラクター選択時データ:', {
                name: character.name,
                systemPrompt: character.systemPrompt,
                appearanceNegativePrompt: character.appearanceNegativePrompt, 
                first_message: character.first_message,
                nsfw_profile: character.nsfw_profile,
                hasCharacterDefinition: !!character.character_definition,
                allKeys: Object.keys(character)
              });
            }
            
            // 🚨 重要フィールドが空の場合は緊急修復処理 🚨
            if (!character.first_message || !character.systemPrompt || !character.appearanceNegativePrompt || !character.nsfw_profile) {
              console.log('⚠️ 重要フィールドが空のため修復処理を実行:', character.name);
              try {
                await CharacterLoader.repairAll();
                const updatedCharacters = CharacterLoader.getAllCharacters();
                const updatedCharacter = updatedCharacters.find(c => c.name === character.name);
                if (updatedCharacter) {
                  character = updatedCharacter;
                  console.log('✅ キャラクター修復完了:', character.name);
                }
              } catch (error) {
                console.error('❌ キャラクター修復エラー:', error);
              }
            }
            
            // 音声再生を停止
            VoiceManager.stopAudio();
            
            // 新しいセッションID生成（先に生成）
            const newSessionId = crypto.randomUUID();
            
            // キャラクターを設定
            setCurrentCharacter(character);
            
            // セッションIDを設定（Nullになる時間を最小化）
            setCurrentSessionId(newSessionId);
            
            // キャラクター個別の背景を適用
            loadCharacterBackground(character.name);
            
            // トラッカー初期化（デバッグログ追加）
            if (character.trackers && character.trackers.length > 0) {
              console.log(`🔧 ${character.name}のトラッカー初期化開始:`, character.trackers);
              initializeTrackersForSession(newSessionId, character);
              console.log(`✅ ${character.name}のトラッカー初期化完了`);
            } else {
              console.log(`⚠️ ${character.name}にはトラッカーが定義されていません`);
            }
            
            // 初回メッセージを設定
            setInitialMessage(character);
            setIsCharacterGalleryOpen(false);
          }}
          onAddCharacter={() => {
            setEditingCharacter(null);
            setIsCharacterModalOpen(true);
            setIsCharacterGalleryOpen(false);
          }}
          onEditCharacter={(character) => {
            // 🚨 CharacterModal開く直前のデータ確認 🚨
            if (character.name.includes('マーフィン') || character.name.includes('グレイス') || 
                character.name.includes('澪') || character.name.includes('ミオ') ||
                character.name.includes('アン')) {
              console.log('🔍🔍🔍 CharacterModal開く直前データ:', {
                name: character.name,
                systemPrompt: character.systemPrompt,
                appearanceNegativePrompt: character.appearanceNegativePrompt, 
                first_message: character.first_message,
                nsfw_profile: character.nsfw_profile,
                hasCharacterDefinition: !!character.character_definition,
                allKeys: Object.keys(character)
              });
            }
            
            setEditingCharacter(character);
            setIsCharacterModalFromGallery(true); // ギャラリーから開いたことを記録
            setIsCharacterGalleryOpen(false); // ギャラリーを閉じる
            setIsCharacterModalOpen(true);
          }}
          onDeleteCharacter={(character) => {
            if (confirm(`「${character.name}」を削除しますか？`)) {
              CharacterLoader.deleteCharacter(character.name);
              const updatedCharacters = CharacterLoader.getAllCharacters();
              setAllCharacters(updatedCharacters);
              
              if (currentCharacter?.name === character.name) {
                const firstCharacter = updatedCharacters[0];
                if (firstCharacter) {
                  // 新しいセッションID生成（先に生成）
                  const newSessionId = crypto.randomUUID();
                  
                  setCurrentCharacter(firstCharacter);
                  setCurrentSessionId(newSessionId);
                  loadCharacterBackground(firstCharacter.name);
                  
                  // トラッカー初期化（デバッグログ追加）
                  if (firstCharacter.trackers && firstCharacter.trackers.length > 0) {
                    console.log(`🔧 削除後の${firstCharacter.name}のトラッカー初期化開始:`, firstCharacter.trackers);
                    initializeTrackersForSession(newSessionId, firstCharacter);
                    console.log(`✅ 削除後の${firstCharacter.name}のトラッカー初期化完了`);
                  }
                  
                  setInitialMessage(firstCharacter);
                } else {
                  setCurrentCharacter(null);
                  setCurrentSessionId(null);
                  setMessages([]);
                  handleThemeChange('default', undefined);
                }
              }
            }
          }}
          onImportExport={() => {
            setIsImportExportOpen(true);
            setIsCharacterGalleryOpen(false);
          }}
          onManualLoad={async () => {
            console.log('🔄 手動キャラクター読み込み開始...');
            try {
              // CharacterLoaderを初期化
              CharacterLoader.initialize();
              
              // publicキャラクターを手動で読み込み
              await CharacterLoader.loadPublicCharacters();
              
              // 全キャラクターを取得して更新
              const updatedCharacters = CharacterLoader.getAllCharacters();
              setAllCharacters(updatedCharacters);
              
              console.log('✅ 手動キャラクター読み込み完了:', updatedCharacters.length, '件');
              console.log('📋 読み込まれたキャラクター:', updatedCharacters.map(c => c.name));
              
              alert(`キャラクター読み込み完了: ${updatedCharacters.length}件`);
            } catch (error) {
              console.error('❌ 手動キャラクター読み込みエラー:', error);
              alert('キャラクター読み込みに失敗しました');
            }
          }}
          onClose={() => setIsCharacterGalleryOpen(false)}
        />
      )}
      
      {/* 🚨 画面右上5つのアイコン関連モーダル - 重要機能保護終了 🚨 */}

      {/* ================================================
       * 【重要】キャラクターインポート/エクスポート機能 - 絶対に変更・削除禁止
       * 
       * この機能は4つのJSONフィールドの自動入力修正が適用されています：
       * - first_message
       * - nsfw_profile 
       * - systemPrompt
       * - appearanceNegativePrompt
       * 
       * 何度も修正を繰り返しているため、このコードは絶対に触らないでください。
       * ================================================ */}
      {/* キャラクターインポート/エクスポートモーダル */}
      {isImportExportOpen && (
        <CharacterImportExport
          isOpen={isImportExportOpen}
          allCharacters={allCharacters}
          onImport={(importedCharacters) => {
            importedCharacters.forEach(char => {
              CharacterLoader.addCharacter(char);
            });
            setAllCharacters(CharacterLoader.getAllCharacters());
            setIsImportExportOpen(false);
          }}
          onClose={() => setIsImportExportOpen(false)}
        />
      )}
      {/* ================================================ */}

      {/* チャット履歴ギャラリー */}
      {isChatHistoryOpen && (
        <ChatHistoryGallery
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={async (session) => {
            try {
              const loadedSession = await historyManager.loadSession(session.id);
              if (loadedSession && loadedSession.messages) {
                setMessages(loadedSession.messages);
                setCurrentSessionId(session.id);
              }
              setIsChatHistoryOpen(false);
            } catch (error) {
              console.error('❌ セッション読み込みエラー:', error);
            }
          }}
          onDeleteSession={async (sessionId) => {
            try {
              await historyManager.deleteSession(sessionId);
              // localStorageからも削除
              try {
                const listRaw = localStorage.getItem('ai-chat-sessions');
                if (listRaw) {
                  const list: SessionSummary[] = JSON.parse(listRaw);
                  const filtered = list.filter(s => s.id !== sessionId);
                  localStorage.setItem('ai-chat-sessions', JSON.stringify(filtered));
                }
                localStorage.removeItem(`ai-chat-messages:${sessionId}`);
              } catch (e) {
                console.warn('localStorage 履歴削除で警告:', e);
              }
              // 一覧再取得
              const updated = currentCharacter
                ? await historyManager.getSessionsByCharacter(currentCharacter.name)
                : await historyManager.getAllSessions();
              setSessions(updated);
              if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setMessages([]);
              }
            } catch (error) {
              console.error('セッション削除エラー:', error);
            }
          }}
          onClose={() => setIsChatHistoryOpen(false)}
        />
      )}

      {/* ================================================
       * 【重要】MessageEditorModal - 絶対に変更・削除禁止
       * 
       * このモーダルは返信提案機能と文章強化機能で使用されます。
       * 過去に何度も消失する問題が発生しているため、
       * このコードブロックは絶対に触らないでください。
       * 
       * 関連する状態変数:
       * - isMessageEditorOpen
       * - editorInitialText
       * - selectInspirationCandidate関数
       * - handleUserTextEnhancement関数
       * ================================================ */}
      {console.log('🔍 モーダル表示判定:', { isMessageEditorOpen, editorInitialText: editorInitialText?.substring(0, 100) })}
      {isMessageEditorOpen && (
        <MessageEditorModal 
          isOpen={isMessageEditorOpen}
          initialText={editorInitialText}
          onConfirm={(text: string) => {
            console.log('🔍 MessageEditorModal確定:', { text: text.substring(0, 100) });
            setMessage(text);
            setIsMessageEditorOpen(false);
            setEditorInitialText('');
          }}
          onClose={() => {
            console.log('🔍 MessageEditorModalクローズ');
            setIsMessageEditorOpen(false);
            setEditorInitialText('');
          }}
        />
      )}
      {/* ================================================ */}
    </>
  );
}
