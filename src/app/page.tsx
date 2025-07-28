'use client';

// @ts-nocheck

// crypto.randomUUID ポリフィル
import '../../lib/uuidPolyfill';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, MessageSquare, Loader, RefreshCw, CornerUpLeft, Clock, X, Palette, Menu, Cloud, Copy, User, Edit, Undo2 } from 'lucide-react';
import { CharacterLoader } from '../../lib/characterLoader';
import { Character, UserPersona } from '../../types/character';
import { historyManager, SessionSummary } from '../../lib/historyManager';
// ThemeManagerは削除 - シンプルなローカルストレージ管理に変更
import { VoiceManager } from '../../lib/voiceManager';
import SettingsModal from '../../components/SettingsModal';
import VoiceControls from '../../components/VoiceControls';
import CharacterModal from '../../components/CharacterModal';
import CharacterSelector from '../../components/CharacterSelector';
import PersonaModal from '../../components/PersonaModal';
import PersonaSelector from '../../components/PersonaSelector';
import { MessageMemoButton } from '../../components/ChatMemoProvider';
import ChatSummaryModal from '../../components/ChatSummaryModal';
// ThemeModal削除 - インライン実装に変更
import AuthModal from '../../components/AuthModal';
import { useChatStore } from '../../stores/chatStore';
import FormattedText from '../../components/FormattedText';
import Image from 'next/image';
import { loadAllPersonasFromPublic } from '../../lib/autoLoader';
import { TouchGestureManager, isMobileDevice } from '../../lib/touchGestures';
import dynamic from 'next/dynamic';
import { BackgroundManager } from '../../lib/backgroundManager';

// 画像圧縮関数
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const compressImage = (file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');
    
    img.onload = () => {
      // 元のサイズを取得
      const { width, height } = img;
      
      // アスペクト比を保持しながらリサイズ
      let newWidth = width;
      let newHeight = height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        newWidth = width * ratio;
        newHeight = height * ratio;
      }
      
      // キャンバスサイズを設定
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // 画像を描画
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 圧縮されたデータURLを取得
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // 圧縮前後のサイズをログ出力
      const originalSize = Math.round(file.size / 1024);
      const compressedSize = Math.round(compressedDataUrl.length * 0.75 / 1024); // base64のサイズ概算
      console.log(`🗜️ 圧縮: ${originalSize}KB → ${compressedSize}KB (${Math.round(compressedSize / originalSize * 100)}%)`);
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

interface CharacterGalleryProps {
  characters: Character[];
  currentCharacter: Character | null;
  onSelectCharacter: (character: Character) => void;
  onAddCharacter: () => void;
  onEditCharacter: (character: Character) => void;
  onDeleteCharacter: (character: Character) => void;
  onImportExport?: () => void;
  onManualLoad?: () => void;
  onClose: () => void;
}

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

// 動的インポート（初期バンドル削減）
const CharacterGallery = dynamic(() => import('../../components/CharacterGallery').then(mod => mod.default as React.ComponentType<CharacterGalleryProps>), { ssr: false });
const EnhancedImpressionModal = dynamic(() => import('../../components/EnhancedImpressionModal'), { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ChatHistoryGallery = dynamic(() => import('../../components/ChatHistoryGallery'), { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const InspirationModal = dynamic(() => import('../../components/InspirationModal').then(m => m.InspirationModal), { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const UserInspirationModal = dynamic(() => import('../../components/UserInspirationModal').then(m => m.UserInspirationModal), { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CharacterImportExport = dynamic(() => import('../../components/CharacterImportExport'), { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PersonaImportExport = dynamic(() => import('../../components/PersonaImportExport'), { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-unused-vars

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<UserPersona | null>(null);
  const [allPersonas, setAllPersonas] = useState<UserPersona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<UserPersona | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<ChatSummary | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);

  // インスピレーション関連
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showInspiration, setShowInspiration] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [inspirationCandidates, setInspirationCandidates] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showUserInspiration, setShowUserInspiration] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userInspirationCandidates, setUserInspirationCandidates] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showInspirationCandidates, setShowInspirationCandidates] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingUserInspiration, setIsLoadingUserInspiration] = useState(false);

  // ユーザー文章強化機能
  const [isEnhancingUserText, setIsEnhancingUserText] = useState(false);
  
  // タブ管理
  const [activeTab, setActiveTab] = useState<'characters' | 'personas' | 'history' | 'settings'>('characters');

  // 文章強化機能
  const [selectedText, setSelectedText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showEnhanceButton, setShowEnhanceButton] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enhanceButtonPosition, setEnhanceButtonPosition] = useState({ x: 0, y: 0 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isEnhancing, setIsEnhancing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enhancementResult, setEnhancementResult] = useState<{
    originalText: string;
    enhancedText: string;
    messageId: string;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  // Personaインポート/エクスポート
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPersonaImportExportOpen, setIsPersonaImportExportOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isCharacterGalleryOpen, setIsCharacterGalleryOpen] = useState(false);
  const [isEnhancedImpressionOpen, setIsEnhancedImpressionOpen] = useState(false);
  const [currentImpressions, setCurrentImpressions] = useState<ChatImpression[]>([]);
  const [isGeneratingImpression, setIsGeneratingImpression] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  // Zustandストアから設定を取得
  const { memos, settings, updateSettings } = useChatStore();

  // タッチジェスチャー管理
  const [touchGestureManager, setTouchGestureManager] = useState<TouchGestureManager | null>(null);

  // キーボード開閉検出用の状態
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

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
    if (isInitialized) return; // 重複実行防止
    
    const initializeApp = async () => {
      // タッチジェスチャー初期化（モバイルデバイスのみ）
      if (isMobileDevice()) {
        const gestureManager = new TouchGestureManager(
          () => {
            // 左スワイプ: サイドバーを開く
            setIsSidebarOpen(true);
          },
          () => {
            // 右スワイプ: サイドバーを閉じる
            setIsSidebarOpen(false);
          },
          undefined,
          undefined,
          undefined
        );
        setTouchGestureManager(gestureManager);
      }

      // 設定はZustandストアから自動的に読み込まれるため、ここでの読み込みは不要

      // BackgroundManagerを初期化
      BackgroundManager.initializeBackgrounds();

      // 強制的に白背景でスタート（紫背景を完全に削除）
      try {
        // 古いテーマ設定を完全にクリア
        localStorage.removeItem('ai-chat-theme');
        localStorage.removeItem('theme-data');
        
        // CSS変数をリセット
        document.documentElement.style.removeProperty('--theme-background');
        document.documentElement.style.removeProperty('--theme-background-image');
        document.documentElement.style.removeProperty('--theme-background-size');
        
        // カスタム背景がある場合のみ適用
        const customBackground = localStorage.getItem('customBackground');
        if (customBackground) {
          document.documentElement.style.setProperty('--theme-background', `url(${customBackground})`, 'important');
          document.documentElement.style.setProperty('--theme-background-size', 'cover', 'important');
          document.documentElement.style.setProperty('--theme-background-position', 'center', 'important');
        } else {
          // 強制的に白背景
          document.documentElement.style.setProperty('--theme-background', '#ffffff', 'important');
          document.documentElement.style.setProperty('--theme-background-size', 'auto', 'important');
          document.body.style.background = '#ffffff';
        }
        
        // 背景要素の高度な動的更新（画像・動画対応）
        setTimeout(() => {
          const bgElement = document.getElementById('dynamic-background');
          if (bgElement) {
            const customBg = localStorage.getItem('customBackground');
            if (customBg) {
              // 動画かどうかを判定
              if (customBg.startsWith('data:video/')) {
                // 動画背景の場合
                bgElement.innerHTML = `
                  <video 
                    autoplay 
                    muted 
                    loop 
                    playsInline 
                    style="width: 100%; height: 100%; object-fit: cover;"
                    src="${customBg}"
                  ></video>
                `;
                console.log('🎥 動画背景を適用');
              } else {
                // 画像背景の場合
                bgElement.innerHTML = '';
                bgElement.style.background = `url(${customBg})`;
                bgElement.style.backgroundSize = 'cover';
                bgElement.style.backgroundPosition = 'center';
                console.log('🖼️ 画像背景を適用');
              }
            } else {
              // 背景なし（白背景）
              bgElement.innerHTML = '';
              bgElement.style.background = '#ffffff';
              bgElement.style.backgroundSize = 'auto';
              console.log('⚪ 白背景を適用');
            }
          }
        }, 100);
      } catch (error) {
        console.error('背景設定エラー:', error);
        // エラー時も強制的に白背景
        document.documentElement.style.setProperty('--theme-background', '#ffffff', 'important');
        document.body.style.background = '#ffffff';
      }

      // キャラクターを読み込み（CharacterLoaderで一元管理）
      console.log('🔄 キャラクター読み込み開始...');
      
      // CharacterLoaderを初期化（組み込みキャラクター + カスタムキャラクター）
      CharacterLoader.initialize();
      
      // publicキャラクターをCharacterLoaderに読み込ませる
      await CharacterLoader.loadPublicCharacters();
      
      // 全キャラクターを取得（組み込み + カスタム + public）
      const allCharacters = CharacterLoader.getAllCharacters();
      console.log('📊 総キャラクター数:', allCharacters.length);
      console.log('📋 読み込まれたキャラクター一覧:', allCharacters.map(c => c.name));
      setAllCharacters(allCharacters);
      
      // Personaを読み込み（保存済み + 自動読み込み）
      try {
        const savedPersonas = localStorage.getItem('ai-chat-personas');
        const localPersonas = savedPersonas ? JSON.parse(savedPersonas) : [];
        const publicPersonas = await loadAllPersonasFromPublic();
        const combinedPersonas = [...localPersonas, ...publicPersonas];
        setAllPersonas(combinedPersonas);
      } catch (error) {
        console.error('Persona読み込みエラー:', error);
      }
      
      // 履歴を読み込み
      try {
        await historyManager.init();
        const allSessions = await historyManager.getAllSessions();
        setSessions(allSessions);
        
        // 最後のセッションとキャラクターを復元
        if (allSessions.length > 0) {
          const lastSession = allSessions[0]; // 最新のセッション
          console.log('🔄 最後のセッションを復元中:', lastSession.title);
          
          // 完全なセッション情報を取得
          const fullSession = await historyManager.loadSession(lastSession.id);
          
          if (fullSession && fullSession.messages.length > 0) {
            // 保存されたキャラクター情報を優先使用
            let lastCharacter = fullSession.character;
            
            // 保存されたキャラクター情報がない場合は、名前で検索
            if (!lastCharacter) {
              lastCharacter = allCharacters.find(c => c.name === fullSession.characterId);
            }
            
            if (lastCharacter) {
              setCurrentCharacter(lastCharacter);
              setCurrentSessionId(fullSession.id);
              setMessages(fullSession.messages);
              console.log('✅ セッション復元完了:', fullSession.title, 'キャラクター:', lastCharacter.name);
            } else {
              console.log('❌ キャラクターが見つかりません:', fullSession.characterId);
              // デフォルトキャラクター設定
              const defaultCharacter = CharacterLoader.getCharacterByName('ナミ');
              if (defaultCharacter) {
                setCurrentCharacter(defaultCharacter);
                setInitialMessage(defaultCharacter);
              }
            }
          } else {
            console.log('💭 空のセッションまたはメッセージなし');
            // デフォルトキャラクター設定
            const defaultCharacter = CharacterLoader.getCharacterByName('ナミ');
            if (defaultCharacter) {
              setCurrentCharacter(defaultCharacter);
              setInitialMessage(defaultCharacter);
            }
          }
        } else {
          console.log('📝 セッション履歴なし - 新規開始');
          // デフォルトキャラクター設定
          const defaultCharacter = CharacterLoader.getCharacterByName('ナミ');
          if (defaultCharacter) {
            setCurrentCharacter(defaultCharacter);
            setInitialMessage(defaultCharacter);
          }
        }
      } catch (error) {
        console.error('履歴読み込みエラー:', error);
        // エラー時はデフォルトキャラクター設定
        const defaultCharacter = CharacterLoader.getCharacterByName('ナミ');
        if (defaultCharacter) {
          setCurrentCharacter(defaultCharacter);
          setInitialMessage(defaultCharacter);
        }
      }
      
      setIsInitialized(true); // 初期化完了フラグ
    };
    
    initializeApp();
  }, []);

  // 初期メッセージ設定のヘルパー関数
  const setInitialMessage = (character: Character) => {
    const firstMessage = Array.isArray(character.first_message) 
      ? character.first_message.join('\n') 
      : (character.first_message || 'こんにちは！');
      
    console.log('初期メッセージ設定:', firstMessage);
    
    setMessages([{
      id: '1',
      role: 'assistant',
      content: firstMessage,
      timestamp: Date.now()
    }]);
  };

  // タッチジェスチャーをDOM要素にアタッチ
  useEffect(() => {
    if (touchGestureManager && mainContainerRef.current) {
      touchGestureManager.attach(mainContainerRef.current);
      
      return () => {
        if (mainContainerRef.current) {
          touchGestureManager.detach(mainContainerRef.current);
        }
      };
    }
  }, [touchGestureManager]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 自動保存機能
  useEffect(() => {
    const saveCurrentSession = async () => {
      if (!currentCharacter || messages.length <= 1) return;
      
      try {
        const sessionId = currentSessionId || crypto.randomUUID();
        const title = historyManager.generateTitle(messages);
        
        const session = {
          id: sessionId,
          characterId: currentCharacter.name,
          character: currentCharacter, // キャラクター情報全体を保存
          messages: messages,
          title: title,
          createdAt: currentSessionId ? Date.now() : Date.now(),
          updatedAt: Date.now()
        };
        
        await historyManager.saveSession(session);
        
        if (!currentSessionId) {
          setCurrentSessionId(sessionId);
        }
        
        // 履歴リストを更新
        const allSessions = await historyManager.getAllSessions();
        setSessions(allSessions);
        
      } catch (error) {
        console.error('セッション保存エラー:', error);
      }
    };
    
    // メッセージが変更されたら3秒後に保存
    const timer = setTimeout(saveCurrentSession, 3000);
    return () => clearTimeout(timer);
  }, [messages, currentCharacter, currentSessionId]);

  const handleSend = async () => {
    if (!message.trim() || !currentCharacter || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsLoading(true);
    if (settings.enableImageGeneration) setIsGeneratingImage(true);

    try {
      // Gemini APIでチャット応答を生成（簡単版）
      const chatResponse = await fetch('/api/simple-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage.content,
          settings,
          persona: currentPersona,
          characterId: currentCharacter?.name,
          character: currentCharacter,
          memos,
          conversation: [...messages, newMessage].slice(-(settings.historySize || 8))
        }),
      });

      let aiContent = '';
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '', // Start with an empty message, content will be streamed
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiResponse]); // 先に追加しておく

      const contentType = chatResponse.headers.get('Content-Type') || '';

      if (contentType.includes('application/json')) {
        // JSON形式（通常 or インスピレーション）
        const chatData = await chatResponse.json();
        if (chatData.success) {
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
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            aiContent += decoder.decode(value, { stream: true });
            // 部分的に表示を更新
            setMessages(prev => prev.map(m => (m.id === aiResponse.id ? { ...m, content: aiContent } : m)));
          }
        }
      }

      // 最終更新
      setMessages(prev => prev.map(m => (m.id === aiResponse.id ? { ...m, content: aiContent } : m)));

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
      console.error('Chat error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorResponse]);
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
      const imagePromptResult = ImagePromptGenerator.generateImagePrompt(currentCharacter, aiContent, messages.slice(-5).map(m => m.content));
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
          // imageEngine: settings.imageEngine, // 個別ではなく settings オブジェクト全体を渡すため削除
          // Runware固有のモデルIDとLORA IDをsettingsから渡す
          // runwareModelId: settings.runwareModelId, // settings オブジェクトに含まれているため削除
          // runwareLoraIds: settings.runwareLoraIds, // settings オブジェクトに含まれているため削除
          settings: settings, // settings オブジェクト全体を渡す
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
          loraSettings: settings.loraSettings,
          negativePrompt: settings.negativePrompt,
          width: currentCharacter?.imageWidth || 512,
          height: currentCharacter?.imageHeight || 768,
          steps: currentCharacter?.imageSteps || 20,
          cfg_scale: currentCharacter?.imageCfgScale || 7,
          sampler: currentCharacter?.imageSampler || 'DPM++ 2M Karras',
          settings: settings,
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

  // ユーザーインスピレーション機能
  const handleUserInspiration = async () => {
    if (!currentCharacter || isLoadingUserInspiration) return;
    
    console.log('電球ボタンが押されました');
    setIsLoadingUserInspiration(true);
    try {
      // 最新の会話履歴を文字列として結合
      const conversationText = messages.slice(-8).map(msg => 
        `${msg.role === 'user' ? 'ユーザー' : currentCharacter.name}: ${msg.content}`
      ).join('\n\n');
      
      const response = await fetch('/api/user-inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: conversationText,
          settings,
          character: currentCharacter
        })
      });
      
      const data = await response.json();
      console.log('インスピレーションAPI応答:', data);
      console.log('候補配列:', data.candidates);
      if (data.candidates && data.candidates.length > 0) {
        // 最大3つの候補を表示
        const candidates = data.candidates.slice(0, 3);
        setUserInspirationCandidates(candidates);
        setShowInspirationCandidates(true);
        console.log('返答候補を表示:', candidates);
      } else {
        console.error('ユーザー返信候補が取得できませんでした:', data);
      }
    } catch (error) {
      console.error('User inspiration error:', error);
    } finally {
      setIsLoadingUserInspiration(false);
    }
  };

  // 返答候補を選択する関数
  // const selectInspirationCandidate = (candidate: string) => {
  //   setMessage(candidate);
  //   setShowInspirationCandidates(false);
  //   setUserInspirationCandidates([]);
  // };

  // ユーザー文章強化実行
  const handleUserTextEnhancement = async () => {
    if (!message.trim() || !currentCharacter) return;
    
    setIsEnhancingUserText(true);
    
    try {
      console.log('キラキラボタンが押されました');
      console.log('設定のAPIキー:', settings.geminiApiKey ? '設定済み' : '未設定');
      const response = await fetch('/api/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          character: currentCharacter,
          context: messages.slice(-5),
          variantCount: 1, // 1本モード
          settings: settings,
          isUserText: true // ユーザーテキスト強化フラグ
        })
      });
      
      const data = await response.json();
      console.log('強化API応答:', data);
      if (data.success) {
        console.log('強化されたテキスト:', data.enhancedText);
        setMessage(data.enhancedText);
      }
    } catch (error) {
      console.error('User text enhancement error:', error);
    } finally {
      setIsEnhancingUserText(false);
    }
  };

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          character: currentCharacter,
          context: messages.slice(-5),
          variantCount: 1, // 1本モード
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          conversation: conversationContext
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
    
    const firstMessage = Array.isArray(currentCharacter.first_message) 
      ? currentCharacter.first_message.join('\n') 
      : (currentCharacter.first_message || 'こんにちは！');
      
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
      const updatedSessions = await historyManager.getAllSessions();
      setSessions(updatedSessions);
      
      // 削除した履歴が現在選択中の場合はリセット
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages(currentCharacter ? [{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: currentCharacter.first_message.join('\n'),
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
      // キャラクター固有の背景設定を確認
      const characterBackground = BackgroundManager.getCharacterBackground(characterName);
      
      // グローバル背景設定も確認
      const globalBackground = localStorage.getItem('customBackground');
      
      // 優先順位: キャラクター固有 > グローバル > デフォルト
      const background = characterBackground || globalBackground;
      
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
          conversation: messages.slice(-(settings.historySize || 15))
        })
      });

      let aiContent = '';
      const aiMsg: Message = { id: Date.now().toString(), role: 'assistant', content: '', timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);

      const contentType = chatResponse.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        const json = await chatResponse.json();
        if (json.success) aiContent = json.content;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          settings: settings, // settings オブジェクト全体を渡す
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
            background: '#ffffff',
            backgroundSize: 'auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        {/* モバイル用オーバーレイ */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* サイドバー */}
        <div className={`
          ${isSidebarOpen ? 'w-80' : 'w-0'} 
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
            <div className="flex-shrink-0 border-b border-white/30">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('characters')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'characters' 
                      ? 'text-white border-b-2 border-blue-400 bg-white/10' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  👤 キャラクター
                </button>
                <button
                  onClick={() => setActiveTab('personas')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'personas' 
                      ? 'text-white border-b-2 border-blue-400 bg-white/10' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🎭 ペルソナ
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'history' 
                      ? 'text-white border-b-2 border-blue-400 bg-white/10' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  📚 履歴
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'settings' 
                      ? 'text-white border-b-2 border-blue-400 bg-white/10' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
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
            onSelectCharacter={(character) => {
              setCurrentCharacter(character);
              setCurrentSessionId(null);
              VoiceManager.stopAudio();
              // handleThemeChange('default', undefined, character.name); // キャラクター切り替え時に背景を適用
              setInitialMessage(character);
            }}
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
                
                if (currentCharacter?.name === character.name) {
                  const firstCharacter = updatedCharacters[0];
                  if (firstCharacter) {
                    setCurrentCharacter(firstCharacter);
                    setCurrentSessionId(null);
                    // handleThemeChange('default', undefined, firstCharacter.name); // 代替キャラクターの背景を適用
                    setInitialMessage(firstCharacter);
                  } else {
                    setCurrentCharacter(null);
                    setMessages([]);
                    // handleThemeChange('default', undefined); // キャラクターがなくなった場合はデフォルトテーマを適用
                  }
                }
              }
            }}
            onImportExport={() => setIsImportExportOpen(true)}
            onManualLoad={async () => {
              console.log('🔄 手動キャラクター読み込み開始...');
              try {
                CharacterLoader.initialize();
                await CharacterLoader.loadPublicCharacters();
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
          />
                </div>
              )}

              {/* ペルソナタブ */}
              {activeTab === 'personas' && (
                <div className="h-full flex flex-col">
                  <PersonaSelector
                    personas={allPersonas}
                    currentPersona={currentPersona}
                    onSelectPersona={(persona) => {
                      // デフォルトペルソナの場合はnullを設定
                      if (persona?.id === 'default-persona') {
                        setCurrentPersona(null);
                      } else {
                        setCurrentPersona(persona);
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
                        const updatedPersonas = allPersonas.filter(p => p.id !== persona.id);
                        setAllPersonas(updatedPersonas);
                        localStorage.setItem('ai-chat-personas', JSON.stringify(updatedPersonas));
                        
                        if (currentPersona?.id === persona.id) {
                          setCurrentPersona(null);
                        }
                      }
                    }}
                  />
                </div>
              )}

              {/* 履歴タブ */}
              {activeTab === 'history' && (
                <div className="h-full flex flex-col">
                  <ChatHistoryGallery
                    sessions={sessions}
                    characters={allCharacters}
                    onSelectSession={(session) => { // sessionオブジェクト全体を受け取るように変更
                      setCurrentSessionId(session.id);
                      setCurrentCharacter(session.character);
                      setMessages(session.messages);
                      // handleThemeChange('default', undefined, session.character.name); // セッション切り替え時にも背景を適用
                      setIsSidebarOpen(false); // サイドバーを閉じる
                    }}
                    onDeleteSession={handleDeleteSession}
                  />
                </div>
              )}

              {/* 設定タブ */}
              {activeTab === 'settings' && (
                <div className="h-full flex flex-col">
                  <SettingsModal
                    isOpen={true} // SettingsModalは常に開いている状態を維持
                    onClose={() => setActiveTab('characters')} // 設定タブを閉じるとキャラクタータブに戻る
                    onSave={handleSaveSettings}
                    initialSettings={settings}
                  />
                </div>
              )}
            </div>
          </div>

          {/* メインチャットエリア */}
          <div className="flex-1 flex flex-col w-full md:w-auto overflow-hidden">
            
            {/* ヘッダー */}
            <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-2 md:p-4 safe-area-top flex-shrink-0 sticky top-0 z-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="touch-target theme-text-primary hover:bg-white/10 p-1.5 md:p-2 rounded-lg transition-colors"
                  title={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
                >
                  <Menu size={18} />
                </button>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center">
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
                    className="text-left w-full"
                  >
                    <h3 className="text-white font-semibold truncate hover:text-blue-200 transition-colors text-sm md:text-base">
                      {currentCharacter?.name || 'キャラクター'}
                    </h3>
                    <p className="text-white/70 text-xs md:text-sm truncate">{currentCharacter?.tags[0] || '航海士'}</p>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="touch-target theme-text-primary hover:bg-white/10 p-1.5 md:p-2 rounded-lg transition-colors md:hidden"
                    title="設定"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => setIsThemeModalOpen(true)}
                    className="touch-target theme-text-primary hover:bg-white/10 p-1.5 md:p-2 rounded-lg transition-colors md:hidden"
                    title="テーマ"
                  >
                    <Palette size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat message area */}
            <div className="flex-1 p-2 md:p-4 space-y-4 md:space-y-6 overflow-y-auto pb-safe">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="max-w-2xl w-full">
                      {/* Character image */}
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
                      
                      {/* Message bubble */}
                      <div 
                        className="relative z-10 rounded-xl p-2 md:p-3 lg:p-4 shadow-lg bg-white/70 backdrop-blur-sm"
                        // style={{ backgroundColor: `rgba(255, 255, 255, ${settings.bubbleOpacity})`, borderRadius: `${settings.bubbleCornerRadius}px` }}
                      >
                        <FormattedText text={msg.content} />
                      </div>
                      {/* Copy button */}
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="ml-auto mt-2 text-xs text-gray-500 hover:text-gray-700 block"
                      >
                        コピー
                      </button>
                      {/* Quick actions */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.role === 'assistant' && messages[messages.length - 1]?.id === msg.id && (
                          <button
                            onClick={handleRegenerate}
                            disabled={isLoading}
                            className="flex items-center gap-1 bg-gray-200/50 hover:bg-gray-300/50 text-gray-700 text-xs px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={12} />
                            再生成
                          </button>
                        )}
                        {msg.role === 'user' && (
                          <button
                            onClick={() => handleTextSelection(msg.id)}
                            className="flex items-center gap-1 bg-gray-200/50 hover:bg-gray-300/50 text-gray-700 text-xs px-2 py-1 rounded-full transition-colors"
                          >
                            <Edit size={12} />
                            編集
                          </button>
                        )}
                        <button
                          onClick={() => handleRollback(msg.id)}
                          className="flex items-center gap-1 bg-gray-200/50 hover:bg-gray-300/50 text-gray-700 text-xs px-2 py-1 rounded-full transition-colors"
                        >
                          <Undo2 size={12} />
                          ロールバック
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-2xl w-full">
                      <div
                        className="rounded-xl p-2 md:p-3 lg:p-4 shadow-lg bg-blue-500/70 backdrop-blur-sm text-white"
                        // style={{ backgroundColor: `rgba(66, 153, 225, ${settings.bubbleOpacity})`, borderRadius: `${settings.bubbleCornerRadius}px` }}
                      >
                        <FormattedText text={msg.content} />
                      </div>
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-700 block"
                      >
                        コピー
                      </button>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          onClick={() => handleRollback(msg.id)}
                          className="flex items-center gap-1 bg-gray-200/50 hover:bg-gray-300/50 text-gray-700 text-xs px-2 py-1 rounded-full transition-colors"
                        >
                          <Undo2 size={12} />
                          ロールバック
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input form */}
            <div className="p-2 md:p-4 safe-area-bottom flex-shrink-0 bg-white/80 backdrop-blur-sm sticky bottom-0 z-40">
              <div className="max-w-4xl mx-auto">
                {/* Action buttons */}
                <div className="flex gap-1 md:gap-2 mb-2 flex-wrap">
                  <button
                    onClick={handleContinue}
                    disabled={isLoading}
                    className="touch-target flex-1 bg-white/50 text-gray-700 px-2 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50 text-xs md:text-sm"
                  >
                    ▶ 続きを話す
                  </button>
                  <button
                    onClick={handleReset}
                    className="touch-target flex-1 bg-white/50 text-gray-700 px-2 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-white/80 transition-colors text-xs md:text-sm"
                  >
                    🔄 リセット
                  </button>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary || messages.length < 3}
                    className="touch-target flex-1 bg-white/50 text-gray-700 px-2 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50 text-xs md:text-sm"
                  >
                    {isGeneratingSummary ? '生成中...' : '📝 要約'}
                  </button>
                  <button
                    onClick={handleGenerateEnhancedImpression}
                    disabled={isGeneratingImpression || messages.length < 3}
                    className="touch-target flex-1 bg-white/50 text-gray-700 px-2 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50 text-xs md:text-sm"
                  >
                    {isGeneratingImpression ? '生成中...' : '✨ 感想'}
                  </button>
                </div>
                
                {/* Inspiration candidates area */}
                {showInspirationCandidates && userInspirationCandidates.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <div className="text-sm text-gray-600 font-medium mb-2">💡 返答候補を選択してください：</div>
                    {userInspirationCandidates.map((candidate, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setMessage(candidate);
                          setShowInspirationCandidates(false);
                          setUserInspirationCandidates([]);
                        }}
                        className="w-full text-left p-3 bg-gray-100/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-gray-200/80 transition-colors text-gray-700 text-sm leading-relaxed"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 text-xs mt-1">✏️</span>
                          <span className="flex-1">{(candidate)}</span> {/* ここを修正 */}
                        </div>
                      </button>
                    ))}
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
                
                {/* Input area */}
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="メッセージを入力 (Ctrl+Enterで送信)"
                    className={`w-full p-3 md:p-4 pr-20 md:pr-28 shadow-md rounded-full resize-none transition-all duration-200 bg-white/70 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-0 border-0 text-sm md:text-base ${
                      isInputExpanded ? 'h-24 md:h-32' : 'h-12 md:h-16'
                    }`}
                    onFocus={() => setIsInputExpanded(true)}
                    onBlur={() => setIsInputExpanded(false)}
                  />
                  <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={handleUserInspiration}
                      disabled={isLoadingUserInspiration}
                      className="touch-target text-gray-500 hover:text-yellow-500 p-1.5 md:p-2 rounded-full hover:bg-yellow-100 transition-colors disabled:opacity-50"
                      title="返信を提案"
                    >
                      {isLoadingUserInspiration ? <Loader className="animate-spin" size={16} /> : '💡'}
                    </button>
                    <button
                      onClick={handleUserTextEnhancement}
                      disabled={isEnhancingUserText}
                      className="touch-target text-gray-500 hover:text-purple-500 p-1.5 md:p-2 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
                      title="文章を強化"
                    >
                      {isEnhancingUserText ? <Loader className="animate-spin" size={16} /> : '✨'}
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={isLoading || message.trim() === ''}
                      className="touch-target bg-blue-500 hover:bg-blue-600 text-white p-1.5 md:p-2 rounded-full transition-colors disabled:opacity-50"
                      title="送信"
                    >
                      {isLoading ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modals */}
            <AuthModal 
              isOpen={isAuthModalOpen} 
              onClose={() => setIsAuthModalOpen(false)} 
            />
            <SettingsModal 
              isOpen={isSettingsOpen} 
              onClose={() => setIsSettingsOpen(false)} 
              onSave={handleSaveSettings}
              initialSettings={settings}
            />
            <ThemeModal 
              isOpen={isThemeModalOpen} 
              onClose={() => setIsThemeModalOpen(false)} 
            />
            <CharacterModal 
              isOpen={isCharacterModalOpen} 
              onClose={() => setIsCharacterModalOpen(false)} 
              onSave={handleSaveCharacter}
              initialCharacter={editingCharacter}
            />
            <PersonaModal 
              isOpen={isPersonaModalOpen} 
              onClose={() => setIsPersonaModalOpen(false)} 
              onSave={handleSavePersona}
              initialPersona={editingPersona}
            />
            <ChatSummaryModal 
              isOpen={isSummaryOpen} 
              onClose={() => setIsSummaryOpen(false)} 
              summary={currentSummary}
              sessionTitle={currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || 'Untitled Session' : 'Untitled Session'}
              characterName={currentCharacter?.name || 'Unknown Character'}
            />
            <EnhancedImpressionModal 
              isOpen={isEnhancedImpressionModalOpen} 
              onClose={() => setIsEnhancedImpressionModalOpen(false)} 
              impression={currentImpressions}
              onRegenerate={handleGenerateEnhancedImpression}
              characterName={currentCharacter?.name}
            />
            <MemoModal
              isOpen={isMemoModalOpen}
              onClose={() => setIsMemoModalOpen(false)}
              onSave={handleSaveMemo}
              initialMemo={editingMemo}
            />
            <MemoListModal
              isOpen={isMemoListModalOpen}
              onClose={() => setIsMemoListModalOpen(false)}
              memos={memos}
              onSelectMemo={(memo) => {
                setEditingMemo(memo);
                setIsMemoModalOpen(true);
              }}
              onDeleteMemo={handleDeleteMemo}
            />
            <UserInspirationModal
              isOpen={isUserInspirationModalOpen}
              onClose={() => setIsUserInspirationModalOpen(false)}
              onSubmit={(text) => setMessage(text)}
              currentText={message}
            />
            <CharacterImportExport
              isOpen={isImportExportOpen}
              onClose={() => setIsImportExportOpen(false)}
              characters={allCharacters}
              personas={allPersonas}
            />
          </div>
        </div>
      </div>
    </>
  );
}