'use client';

// crypto.randomUUID ポリフィル
import '../../lib/uuidPolyfill';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, MessageSquare, Loader, RefreshCw, CornerUpLeft, Clock, X, Palette, Menu, Cloud, Copy, User } from 'lucide-react';
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
import { TouchGestureManager } from '../../lib/touchGestures';
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

const MessageEditorModal = dynamic(() => import('../../components/MessageEditorModal').then(m => m.MessageEditorModal), { ssr: false });

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
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [pendingSelection, setPendingSelection] = useState('');

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
      if (false /* スワイプでサイドバーを開かない */) {
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
      
      // デフォルトキャラクターの設定確認
      const defaultCharacter = CharacterLoader.getCharacterByName('ナミ');
      console.log('🎭 デフォルトキャラクター確認:', defaultCharacter ? defaultCharacter.name : 'なし');
      
      // キャラクターが一つもない場合の警告
      if (allCharacters.length === 0) {
        console.warn('⚠️ キャラクターが一つも読み込まれていません！');
      }
      
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
    
    // キャラクターが選択されていない場合は、デフォルトキャラクターを設定
    if (!currentCharacter) {
      console.log('⚠️ キャラクターが選択されていません。デフォルトキャラクターを設定します。');
      const defaultCharacter = CharacterLoader.getCharacterByName('ナミ');
      if (defaultCharacter) {
        setCurrentCharacter(defaultCharacter);
      } else {
        alert('キャラクターが選択されていません。サイドバーからキャラクターを選択してください。');
        return;
      }
    }

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
    const targetText = pendingSelection || message;
    setPendingSelection('');
    
    setIsEnhancingUserText(true);
    
    try {
      console.log('キラキラボタンが押されました');
      console.log('設定のAPIキー:', settings.geminiApiKey ? '設定済み' : '未設定');
      const response = await fetch('/api/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
          text: targetText,
          character: currentCharacter,
          context: [], // 入力中テキストのみを強化
          variantCount: 1, // 1本モード
          settings: settings,
          isUserText: true // ユーザーテキスト強化フラグ
        })
      });
      
      const data = await response.json();
      console.log('強化API応答:', data);
      if (data.success) {
        console.log('強化されたテキスト:', data.enhancedText);
        setEditorInitialText(data.enhancedText);
        setIsMessageEditorOpen(true);
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

  // メッセージ編集モーダル
  const [isMessageEditorOpen, setIsMessageEditorOpen] = useState(false);
  // const [messageDraft, setMessageDraft] = useState('');
  const [editorInitialText, setEditorInitialText] = useState('');

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
            onSelectCharacter={(character: Character) => {
              console.log('キャラクター変更:', character.name);
              
              // キャラクターを設定
              setCurrentCharacter(character);
              
              // 現在のセッションをクリア
              setCurrentSessionId(null);
              
              // 音声再生を停止
              VoiceManager.stopAudio();
              
              // キャラクター個別の背景を適用
              loadCharacterBackground(character.name);
              
              // 新しいキャラクターの初回メッセージを設定
              const firstMessage = Array.isArray(character.first_message) 
                ? character.first_message.join('\n') 
                : (character.first_message || 'こんにちは！');
                
              console.log('初回メッセージ設定:', firstMessage);
              
              setMessages([{
                id: crypto.randomUUID(),
                role: 'assistant',
                content: firstMessage,
                timestamp: Date.now()
              }]);
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
                
                // 削除したキャラクターが現在選択中の場合
                if (currentCharacter?.name === character.name) {
                  const firstCharacter = updatedCharacters[0];
                  if (firstCharacter) {
                    console.log('削除後の代替キャラクター:', firstCharacter.name);
                    setCurrentCharacter(firstCharacter);
                    setCurrentSessionId(null);
                    
                    // 代替キャラクターの背景を適用
                    loadCharacterBackground(firstCharacter.name);
                    
                    const firstMessage = Array.isArray(firstCharacter.first_message) 
                      ? firstCharacter.first_message.join('\n') 
                      : (firstCharacter.first_message || 'こんにちは！');
                      
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
                          // 削除されたペルソナが現在選択中の場合は、デフォルトペルソナに戻す
                          setCurrentPersona(null);
                        }
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
                    onClick={handleImageTest}
                    disabled={isGeneratingImage}
                    className="w-full bg-yellow-500/20 backdrop-blur-sm text-yellow-200 py-3 px-4 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    🖼️
                    画像生成テスト
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* メインチャットエリア */}
        <div className="flex-1 flex flex-col w-full md:w-auto h-full">
          {/* ヘッダー - 固定 */}
          <div className="pointer-events-none bg-transparent p-2 md:p-4 safe-area-top flex-shrink-0 fixed top-0 left-0 right-0 z-50 md:relative md:sticky">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('🍔 バーガーメニューがクリックされました。現在の状態:', isSidebarOpen, '→', !isSidebarOpen);
                  setIsSidebarOpen(!isSidebarOpen);
                }}
                className="pointer-events-auto touch-target theme-text-primary hover:bg-white/10 p-1.5 md:p-2 rounded-lg transition-colors"
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
                  className="pointer-events-auto text-left w-full"
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

          {/* チャットメッセージエリア - スクロール可能 */}
          <div className="flex-1 p-2 md:p-4 space-y-4 md:space-y-6 overflow-y-auto pt-16 pb-20 md:pt-4 md:pb-4">
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
                      // style={{ backgroundColor: `rgba(255, 255, 255, ${settings.bubbleOpacity})`, borderRadius: `${settings.bubbleCornerRadius}px` }}
                    >
                      {/* <div 
                        className="absolute -top-2 left-6 w-4 h-4 rotate-45"
                        style={{ backgroundColor: `rgba(255, 255, 255, ${settings.bubbleOpacity})` }}
                      ></div> */}
                       <div 
                         className="text-gray-800 leading-relaxed whitespace-pre-wrap font-cute text-xs md:text-sm lg:text-base"
                         onMouseUp={() => msg.role === 'user' ? handleTextSelection(msg.id) : undefined}
                         style={{ userSelect: 'text' }}
                       >
                         <FormattedText md={msg.content} />
                       </div>
                       <div className="flex justify-end mt-2 gap-1 flex-wrap">
                         <VoiceControls
                           text={msg.content}
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
                           apiKey={settings.elevenLabsApiKey}
                         />
                         {/* デスクトップ用メモボタン */}
                         <div className="hidden md:block">
                           <MessageMemoButton 
                             messageId={msg.id}
                             messageContent={msg.content}
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
                      // style={{ backgroundColor: `rgba(210, 230, 255, ${settings.bubbleOpacity})`, borderRadius: `${settings.bubbleCornerRadius}px` }}
                    >
                      {/* <div 
                        className="absolute -top-2 right-6 w-4 h-4 rotate-45"
                        style={{ backgroundColor: `rgba(210, 230, 255, ${settings.bubbleOpacity})` }}
                      ></div> */}
                      <div 
                        className="text-gray-800 leading-relaxed whitespace-pre-wrap font-cute text-xs md:text-sm lg:text-base"
                        onMouseUp={() => handleTextSelection(msg.id)}
                        style={{ userSelect: 'text' }}
                      >
                        <FormattedText md={msg.content} />
                      </div>
                      <div className="flex justify-end mt-2 gap-1">
                        <button
                          onClick={() => handleCopy(msg.content)}
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
            <div ref={messagesEndRef} />
          </div>

          {/* メッセージ入力フォーム - 下固定 */}
          <div className="p-2 md:p-4 safe-area-bottom flex-shrink-0 bg-transparent fixed bottom-0 left-0 right-0 z-40 md:relative md:sticky">
            <div className="max-w-4xl mx-auto">

              
              {/* 返答候補表示エリア */}
              {showInspirationCandidates && userInspirationCandidates.length > 0 && (
                <div className="mb-3 space-y-2">
                  <div className="text-sm text-gray-600 font-medium mb-2">💡 返答候補を選択してください：</div>
                  {userInspirationCandidates.map((candidate, index) => (
                    <button
                      key={index}
                      onClick={() => {
                              setEditorInitialText(candidate);
      setShowInspirationCandidates(false);
      setUserInspirationCandidates([]);
      // モーダルを開く（state反映後の次フレームで実行）
      setTimeout(() => setIsMessageEditorOpen(true), 0);
          }}
                      className="w-full text-left p-3 bg-gray-100/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-gray-200/80 transition-colors text-gray-700 text-sm leading-relaxed"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 text-xs mt-1">✏️</span>
                        <span className="flex-1">{candidate}</span>
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
              
              {/* 入力エリア */}
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="メッセージを入力 (Ctrl+Enterで送信)"
                  className={`w-full p-3 md:p-4 pr-20 md:pr-28 rounded-full resize-none transition-all duration-200 bg-transparent text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-0 border-0 text-sm md:text-base ${
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
                    className="touch-target text-gray-500 hover:text-purple-500 p-1.5 md:p-2 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
                    title="文章を強化"
                  >
                    {isEnhancingUserText ? <Loader className="animate-spin" size={16} /> : '✨'}
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="touch-target bg-blue-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                    title="送信 (Ctrl+Enter)"
                  >
                    {isLoading ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
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
          onClose={() => setIsCharacterModalOpen(false)}
          character={editingCharacter}
          onSave={(updatedCharacter) => {
            CharacterLoader.addCharacter(updatedCharacter);
            const updatedCharacters = CharacterLoader.getAllCharacters();
            setAllCharacters(updatedCharacters);
            if (currentCharacter?.name === updatedCharacter.name) {
              setCurrentCharacter(updatedCharacter);
            }
            setIsCharacterModalOpen(false);
            if (updatedCharacter.background) {
              BackgroundManager.saveCharacterBackground(updatedCharacter.name, updatedCharacter.background);
            }
          }}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={updateSettings}
        />
      )}
      {isPersonaModalOpen && (
        <PersonaModal
          isOpen={isPersonaModalOpen}
          onClose={() => setIsPersonaModalOpen(false)}
          initialPersona={editingPersona}
          onSave={(savedPersona) => {
            const newPersonas = editingPersona
              ? allPersonas.map(p => p.id === savedPersona.id ? savedPersona : p)
              : [...allPersonas, savedPersona];
            setAllPersonas(newPersonas);
            localStorage.setItem('ai-chat-personas', JSON.stringify(newPersonas));
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
        <EnhancedImpressionModal
          isOpen={isEnhancedImpressionOpen}
          onClose={() => setIsEnhancedImpressionOpen(false)}
          impressions={currentImpressions}
          isLoading={isGeneratingImpression}
          onRegenerate={handleGenerateEnhancedImpression}
          characterName={currentCharacter?.name}
        />
      )}
      {isCharacterGalleryOpen && (
        <CharacterGallery
          characters={allCharacters}
          currentCharacter={currentCharacter}
          onSelectCharacter={(character) => {
            setCurrentCharacter(character);
            setCurrentSessionId(null);
            VoiceManager.stopAudio();
            loadCharacterBackground(character.name);
            setInitialMessage(character);
            setIsCharacterGalleryOpen(false);
          }}
          onAddCharacter={() => {
            setEditingCharacter(null);
            setIsCharacterModalOpen(true);
            setIsCharacterGalleryOpen(false);
          }}
          onEditCharacter={(character) => {
            setEditingCharacter(character);
            setIsCharacterModalOpen(true);
            setIsCharacterGalleryOpen(false);
          }}
          onDeleteCharacter={(character) => {
            if (confirm(`「${character.name}」を削除しますか？`)) {
              CharacterLoader.deleteCharacter(character.name);
              const updatedCharacters = CharacterLoader.getAllCharacters();
              setAllCharacters(updatedCharacters);
              
              if (currentCharacter?.name === character.name) {
                const firstCharacter = updatedCharacters[0];
                if (firstCharacter) {
                  setCurrentCharacter(firstCharacter);
                  setCurrentSessionId(null);
                  loadCharacterBackground(firstCharacter.name);
                  setInitialMessage(firstCharacter);
                } else {
                  setCurrentCharacter(null);
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

      {/* キャラクターインポート/エクスポートモーダル */}
      {isImportExportOpen && (
        <CharacterImportExport
          isOpen={isImportExportOpen}
          onClose={() => setIsImportExportOpen(false)}
          onImport={(characters) => {
            characters.forEach(character => {
              CharacterLoader.addCharacter(character);
            });
            const updatedCharacters = CharacterLoader.getAllCharacters();
            setAllCharacters(updatedCharacters);
            setIsImportExportOpen(false);
            alert(`${characters.length}件のキャラクターをインポートしました`);
          }}
          allCharacters={allCharacters}
        />
      )}
      {isMessageEditorOpen && (
        <MessageEditorModal
          isOpen={isMessageEditorOpen}
          initialText={editorInitialText}
          onConfirm={(text) => {
            setMessage(text);
            setIsMessageEditorOpen(false);
            setIsInputExpanded(true);
            setEditorInitialText('');
          }}
          onClose={() => setIsMessageEditorOpen(false)}
        />
      )}
    </>
  );
}