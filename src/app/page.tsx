'use client';

// @ts-nocheck

// crypto.randomUUID ポリフィル
import '../../lib/uuidPolyfill';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, MessageSquare, Loader, RefreshCw, CornerUpLeft, Clock, Plus, X, Palette, Menu, Cloud, ChevronDown, ChevronUp, Copy, Grid } from 'lucide-react';
import { CharacterLoader } from '../../lib/characterLoader';
import { Character, AppSettings, UserPersona } from '../../types/character';
import { historyManager, SessionSummary } from '../../lib/historyManager';
// ThemeManagerは削除 - シンプルなローカルストレージ管理に変更
import { VoiceManager } from '../../lib/voiceManager';
import SettingsModal from '../../components/SettingsModal';
import VoiceControls from '../../components/VoiceControls';
import CharacterModal from '../../components/CharacterModal';
import CharacterSelector from '../../components/CharacterSelector';
import PersonaModal from '../../components/PersonaModal';
import PersonaSelector from '../../components/PersonaSelector';
import { MessageMemoButton, MemoListButton } from '../../components/ChatMemoProvider';
import ChatSummaryModal from '../../components/ChatSummaryModal';
// ThemeModal削除 - インライン実装に変更
import AuthModal from '../../components/AuthModal';
import { useChatStore } from '../../stores/chatStore';
import FormattedText from '../../components/FormattedText';
import Image from 'next/image';
import { loadAllCharactersFromPublic, loadAllPersonasFromPublic } from '../../lib/autoLoader';
import { TouchGestureManager, isMobileDevice } from '../../lib/touchGestures';
import dynamic from 'next/dynamic';

// 画像圧縮関数
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
const ChatHistoryGallery = dynamic(() => import('../../components/ChatHistoryGallery'), { ssr: false });
const InspirationModal = dynamic(() => import('../../components/InspirationModal').then(m => m.InspirationModal), { ssr: false });
const UserInspirationModal = dynamic(() => import('../../components/UserInspirationModal').then(m => m.UserInspirationModal), { ssr: false });
const CharacterImportExport = dynamic(() => import('../../components/CharacterImportExport'), { ssr: false });
const PersonaImportExport = dynamic(() => import('../../components/PersonaImportExport'), { ssr: false });

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
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<ChatSummary | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);

  // インスピレーション関連
  const [showInspiration, setShowInspiration] = useState(false);
  const [inspirationCandidates, setInspirationCandidates] = useState<string[]>([]);
  const [showUserInspiration, setShowUserInspiration] = useState(false);
  const [userInspirationCandidates, setUserInspirationCandidates] = useState<string[]>([]);
  const [isLoadingUserInspiration, setIsLoadingUserInspiration] = useState(false);

  // ユーザー文章強化機能
  const [isEnhancingUserText, setIsEnhancingUserText] = useState(false);
  
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
  const [isPersonaImportExportOpen, setIsPersonaImportExportOpen] = useState(false);
  const [isCharacterGalleryOpen, setIsCharacterGalleryOpen] = useState(false);
  const [isEnhancedImpressionOpen, setIsEnhancedImpressionOpen] = useState(false);
  const [currentImpressions, setCurrentImpressions] = useState<ChatImpression[]>([]);
  const [isGeneratingImpression, setIsGeneratingImpression] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);

  // Zustandストアから設定を取得
  const { memos, settings, updateSettings } = useChatStore();

  // タッチジェスチャー管理
  const [touchGestureManager, setTouchGestureManager] = useState<TouchGestureManager | null>(null);

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
    } finally {
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

      // キャラクターを読み込み（従来 + 自動読み込み）
      const builtinCharacters = CharacterLoader.getAllCharacters();
      const publicCharacters = await loadAllCharactersFromPublic();
      const allCharacters = [...builtinCharacters, ...publicCharacters];
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
          conversation: [...messages, newMessage].slice(-(settings.historySize || 15))
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
          } else {
            aiContent = chatData.content;
          }
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

      if (aiContent) {
        
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
          aiResponse: aiContent,
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
            ? { ...msg, image: imageData.image }
            : msg
        ));
      }
    } catch (imageError) {
      console.error('Image generation failed:', imageError);
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
      const response = await fetch('/api/user-inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: currentCharacter,
          persona: currentPersona,
          conversation: messages.slice(-8), // 直近8件
          settings,
          variantCount: 1 // 1本モード
        })
      });
      
      const data = await response.json();
      console.log('インスピレーションAPI応答:', data);
      console.log('候補配列:', data.candidates);
      if (data.success && data.candidates.length > 0) {
        // 1本モードなので最初の候補を直接メッセージ欄に設定
        const candidate = data.candidates[0];
        console.log('候補をメッセージ欄に設定:', candidate);
        if (candidate && candidate.trim()) {
          setMessage(candidate);
        } else {
          console.error('候補が空です');
        }
      }
    } catch (error) {
      console.error('User inspiration error:', error);
    } finally {
      setIsLoadingUserInspiration(false);
    }
  };

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
    
    // 最後のAIメッセージを削除
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;
    
    const messagesWithoutLast = messages.slice(0, -1);
    setMessages(messagesWithoutLast);
    setIsLoading(true);
    if (settings.enableImageGeneration) setIsGeneratingImage(true);

    try {
      // 最後のユーザーメッセージを取得
      const lastUserMessage = messagesWithoutLast.filter(m => m.role === 'user').pop();
      if (!lastUserMessage) return;

      // 会話履歴から最後のユーザーメッセージを除外してコンテキストを作成
      const conversationContext = messagesWithoutLast
        .filter((m) => m.id !== lastUserMessage.id)
        .slice(-(settings.historySize || 15)); // 設定値に基づく制限

      // APIを呼び出して新しい応答を生成（重複送信を防止）
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

      let aiContent = '';
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiResponse]);

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
            setMessages(prev => prev.map(m => (m.id === aiResponse.id ? { ...m, content: aiContent } : m)));
          }
        }
      }

      setMessages(prev => prev.map(m => (m.id === aiResponse.id ? { ...m, content: aiContent } : m)));

      if (aiContent) {
        if (settings.chatNotificationSound) {
          VoiceManager.playNotificationSound(true, 0.3);
        }

        // 画像生成
        if (settings.enableImageGeneration) {
          handleImageGeneration(aiResponse, aiContent);
        }
      }
    } catch (error) {
      console.error('Regenerate error:', error);
    } finally {
      setIsLoading(false);
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

  // 高度な背景変更ハンドラー（画像・動画・圧縮対応）
  const handleThemeChange = (themeId: string, customBackground?: string) => {
    console.log('🎨 背景変更:', themeId, customBackground ? '背景あり' : '背景なし');
    
    if (customBackground) {
      // カスタム背景を適用
      localStorage.setItem('customBackground', customBackground);
      
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
      localStorage.removeItem('customBackground');
      
      const bgElement = document.getElementById('dynamic-background');
      if (bgElement) {
        bgElement.innerHTML = '';
        bgElement.style.background = '#ffffff';
        bgElement.style.backgroundSize = 'auto';
        console.log('⚪ 白背景を即座に適用');
      }
    }
    
    // 設定を保存
    const updatedSettings = {
      ...settings,
      customBackground: customBackground || undefined
    };
    updateSettings(updatedSettings);
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
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, image: imageData.image } : m));
      }
    } catch (e) {
      console.error('Image reroll error:', e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // チャットバブルのコピー処理
  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('コピーしました');
      });
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('コピーしました');
    }
  };

  return (
      <div 
        ref={mainContainerRef} 
        className="flex h-screen relative"
        style={{ background: '#ffffff' }}
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
        ${isSidebarOpen ? 'fixed md:relative z-50' : 'relative'}
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
                  onSelectPersona={setCurrentPersona}
                  onAddPersona={() => {
                    setEditingPersona(null);
                    setIsPersonaModalOpen(true);
                  }}
                  onEditPersona={(persona) => {
                    setEditingPersona(persona);
                    setIsPersonaModalOpen(true);
                  }}
                  onDeletePersona={(persona) => {
                    if (confirm(`「${persona.name}」を削除しますか？`)) {
                      const updatedPersonas = allPersonas.filter(p => p.id !== persona.id);
                      setAllPersonas(updatedPersonas);
                      localStorage.setItem('ai-chat-personas', JSON.stringify(updatedPersonas));
                      
                      if (currentPersona?.id === persona.id) {
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
              </div>
            )}
          </div>
        </div>

        {/* モバイル用クイック操作（設定・テーマ・同期） */}
        <div className="p-4 border-t border-white/30 flex-shrink-0 space-y-2 md:hidden">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="touch-target w-full bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Cloud size={16} />
            クラウド同期
          </button>
          <button 
            onClick={() => setIsThemeModalOpen(true)}
            className="touch-target w-full bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Palette size={16} />
            テーマ
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="touch-target w-full bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Settings size={16} />
            設定
          </button>
        </div>

        {/* チャット履歴 */}
        <div className="flex-1 flex flex-col min-h-0 safe-area-bottom">
          <div className="p-4 border-b border-white/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <MessageSquare size={20} />
                チャット履歴
                <span className="bg-white/30 text-white px-2 py-1 rounded-full text-xs">
                  {sessions.length}
                </span>
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsChatHistoryOpen(true)}
                  className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/20 transition-colors"
                  title="履歴ギャラリー"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => {
                    console.log('新しいチャット開始');
                    setCurrentSessionId(null);
                  
                  // 音声再生を停止
                  VoiceManager.stopAudio();
                  
                  if (currentCharacter) {
                    const firstMessage = Array.isArray(currentCharacter.first_message) 
                      ? currentCharacter.first_message.join('\n') 
                      : (currentCharacter.first_message || 'こんにちは！');
                    
                    console.log('新しいチャットの初回メッセージ:', firstMessage);
                    
                    setMessages([{
                      id: crypto.randomUUID(),
                      role: 'assistant',
                      content: firstMessage,
                      timestamp: Date.now()
                    }]);
                  } else {
                    setMessages([]);
                  }
                }}
                className="touch-target text-white/80 hover:text-white p-2 rounded hover:bg-white/20 transition-colors"
                title="新しいチャット"
              >
                <Plus size={16} />
              </button>
              </div>
            </div>
          </div>
          
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
      </div>

      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {/* ヘッダー */}
        <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4 safe-area-top">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="touch-target theme-text-primary hover:bg-white/10 p-2 rounded-lg transition-colors"
              title={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
            >
              <Menu size={20} />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center">
              <div className="text-white text-lg font-bold">
                {currentCharacter?.name ? currentCharacter.name.charAt(0) : 'A'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setIsCharacterGalleryOpen(true)}
                className="text-left w-full"
              >
                <h3 className="text-white font-semibold truncate hover:text-blue-200 transition-colors">
                  {currentCharacter?.name || 'キャラクター'}
                </h3>
                <p className="text-white/70 text-sm truncate">{currentCharacter?.tags[0] || '航海士'}</p>
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="touch-target theme-text-primary hover:bg-white/10 p-2 rounded-lg transition-colors md:hidden"
                title="設定"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={() => setIsThemeModalOpen(true)}
                className="touch-target theme-text-primary hover:bg-white/10 p-2 rounded-lg transition-colors md:hidden"
                title="テーマ"
              >
                <Palette size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* チャットメッセージエリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-touch">
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
                    className="relative z-10 rounded-2xl p-3 sm:p-4 shadow-lg"
                    style={{ backgroundColor: `rgba(255, 255, 255, ${settings.bubbleOpacity})` }}
                  >
                    <div 
                      className="absolute -top-2 left-6 w-4 h-4 rotate-45"
                      style={{ backgroundColor: `rgba(255, 255, 255, ${settings.bubbleOpacity})` }}
                    ></div>
                     <div 
                       className="text-gray-800 leading-relaxed whitespace-pre-wrap font-cute text-sm sm:text-base"
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
                         <RefreshCw size={16} />
                       </button>
                       <button 
                         onClick={() => handleRollback(msg.id)}
                         className="touch-target text-gray-500 hover:text-gray-700 p-1 rounded"
                         title="ここまで戻る"
                       >
                         <CornerUpLeft size={16} />
                       </button>
                       {settings.enableImageGeneration && (
                       <button
                         onClick={() => handleImageReroll(msg)}
                         className="touch-target text-yellow-500 hover:text-yellow-700 p-1 rounded"
                         title="画像をランダムシードで再生成"
                       >
                         🎲
                       </button>
                       )}
                       {/* コピー */}
                       <button
                         onClick={() => handleCopy(msg.content)}
                         className="touch-target text-gray-500 hover:text-blue-600 p-1 rounded"
                         title="コピー"
                       >
                         <Copy size={16} />
                       </button>
                     </div>
                   </div>
                </div>
              ) : (
                <div className="max-w-lg w-full">
                  <div
                    className={`relative z-10 rounded-2xl p-3 sm:p-4 shadow-lg ${settings.bubbleBlur ? 'backdrop-blur-sm' : ''}`}
                    style={{ backgroundColor: `rgba(59, 130, 246, ${settings.bubbleOpacity})` }}
                  >
                                          <div 
                        className="absolute -top-2 right-6 w-4 h-4 rotate-45"
                        style={{ backgroundColor: `rgba(59, 130, 246, ${settings.bubbleOpacity})` }}
                      ></div>
                    <div 
                      className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base"
                      onMouseUp={() => msg.role === 'user' ? handleTextSelection(msg.id) : undefined}
                      style={{ userSelect: 'text' }}
                    >
                      <FormattedText md={msg.content} />
                    </div>
                    {/* コピーとメモボタン */}
                    <div className="flex justify-end mt-2 gap-1 flex-wrap"> {/* gap-1 flex-wrap を追加してレイアウト調整 */}
                      {/* メモボタンをここに追加 */}
                      <MessageMemoButton 
                        messageId={msg.id}
                        messageContent={msg.content}
                        sessionId={currentSessionId || 'temp'}
                        characterId={currentCharacter?.name || 'unknown'}
                      />
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="touch-target text-white/80 hover:text-blue-200 p-1 rounded"
                        title="コピー"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="p-4 bg-black/30 backdrop-blur-sm border-t border-white/10 safe-area-bottom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              {/* アスタリスクボタン（入力枠の前方） */}
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const newValue = message.substring(0, start) + '*' + message.substring(end);
                    setMessage(newValue);
                    
                    // カーソル位置を更新
                    setTimeout(() => {
                      textarea.setSelectionRange(start + 1, start + 1);
                      textarea.focus();
                    }, 0);
                  }
                }}
                className="touch-target text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors text-white/70 hover:text-white"
                title="アスタリスクを追加"
              >
                *
              </button>
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="メッセージを入力..."
                className="flex-1 bg-transparent theme-text-primary placeholder-theme-text-secondary resize-none outline-none min-h-[44px] text-base"
                rows={isInputExpanded ? (window.innerWidth < 768 ? 8 : 4) : 1}
                style={{ 
                  fontSize: '16px',
                  maxHeight: isInputExpanded ? (window.innerWidth < 768 ? '320px' : '256px') : '44px',
                  transition: 'max-height 0.3s ease-in-out'
                }}
              />
              <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                <button
                  onClick={() => setIsInputExpanded(!isInputExpanded)}
                  className="touch-target text-gray-400 hover:text-white p-2 rounded-full transition-colors"
                  title={isInputExpanded ? '入力欄を縮小' : '入力欄を拡大'}
                >
                  {isInputExpanded ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
                </button>

                <button
                  onClick={handleSend}
                  disabled={!message.trim() || isLoading}
                  className="touch-target bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white p-3 rounded-full transition-colors"
                >
                  {isLoading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-center mt-2 gap-1">
              {/* 音声オン/オフ */}
              <button
                onClick={() => {
                  const newVoiceEnabled = !(settings.voiceEnabled ?? true); // 現在の値を反転
                  const newSettings = { ...settings, voiceEnabled: newVoiceEnabled };
                  updateSettings(newSettings);
                  
                  if (newVoiceEnabled && newSettings.elevenLabsApiKey) {
                    // VoiceManager.setApiKey(newSettings.elevenLabsApiKey); // 環境変数から取得するように変更したため削除
                  } else if (!newVoiceEnabled) {
                    VoiceManager.stopAudio(); // 音声がオフになったら再生を停止
                  }
                }}
                className={`text-lg p-2 rounded-full backdrop-blur-sm transition-colors ${settings.voiceEnabled ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-500 text-white/70 hover:bg-gray-600'}`}
                title={settings.voiceEnabled ? '音声OFF' : '音声ON'}
              >
                {settings.voiceEnabled ? '🔊' : '🔇'}
              </button>
              
              {/* 電球（インスピレーション）ボタン */}
              <button
                onClick={handleUserInspiration}
                disabled={isLoadingUserInspiration || !currentCharacter}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 text-white/70 hover:text-white"
                title="返信候補を提案"
              >
                💡
              </button>
              
              {/* キラキラ（文章強化）ボタン */}
              <button
                onClick={handleUserTextEnhancement}
                disabled={isEnhancingUserText || !message.trim() || !currentCharacter}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 text-white/70 hover:text-white"
                title="文章を強化"
              >
                ✨
              </button>

              {/* 画像生成 */}
              <button
                onClick={() => {
                  const newEnableImageGeneration = !(settings.enableImageGeneration ?? true); // 現在の値を反転
                  const newSettings = { ...settings, enableImageGeneration: newEnableImageGeneration };
                  updateSettings(newSettings);
                }}
                className={`text-lg p-2 rounded-full backdrop-blur-sm transition-colors ${settings.enableImageGeneration ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-500 text-white/70 hover:bg-gray-600'}`}
                title={settings.enableImageGeneration ? '画像生成OFF' : '画像生成ON'}
              >
                {settings.enableImageGeneration ? '🖼️' : '📷'}
              </button>
              
              {/* メモ一覧 */}
              <button
                onClick={() => {
                  // MemoListButtonの機能を直接実行
                  const memoListButton = document.querySelector('[data-memo-list-button]') as HTMLButtonElement;
                  if (memoListButton) memoListButton.click();
                }}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors text-white/70 hover:text-white"
                title="メモ一覧"
              >
                📝
              </button>
              
              {/* 要約 */}
              <button 
                onClick={handleGenerateSummary}
                disabled={isLoading || messages.length < 3}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 text-white/70 hover:text-white"
                title="会話要約を生成"
              >
                📋
              </button>
              
              {/* 強化インプレッション */}
              <button
                onClick={handleGenerateEnhancedImpression}
                disabled={isGeneratingImpression || messages.length < 3}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 text-pink-400 hover:text-pink-300"
                title="会話インプレッション（3視点）"
              >
                💖
              </button>
              
              {/* 再生成 */}
              <button 
                onClick={handleRegenerate}
                disabled={isLoading || messages.length === 0}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 text-white/70 hover:text-white"
                title="再生成"
              >
                🔄
              </button>
              
              {/* 会話リセット */}
              <button 
                onClick={handleReset}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors text-white/70 hover:text-white"
                title="会話リセット"
              >
                🗑️
              </button>
              
              {/* 続き */}
              <button 
                onClick={handleContinue}
                disabled={isLoading || messages.length === 0}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 text-white/70 hover:text-white"
                title="続きを生成"
              >
                ▶️
              </button>
              

              
              {/* 非表示のMemoListButton（機能用） */}
              <div className="hidden">
                <MemoListButton currentCharacterId={currentCharacter?.name} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 浮動強化ボタン */}
      {showEnhanceButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTextEnhancement();
          }}
          className="fixed z-50 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg shadow-lg text-sm flex items-center gap-2"
          style={{
            left: enhanceButtonPosition.x,
            top: enhanceButtonPosition.y
          }}
          disabled={isEnhancing}
        >
          {isEnhancing ? <Loader size={14} className="animate-spin" /> : '✨'}
          強化
        </button>
      )}

      {/* 文章強化結果モーダル */}
      {showEnhancementModal && enhancementResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ✨ 文章強化結果
              </h2>
              <button
                onClick={() => setShowEnhancementModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  元の文章
                </h3>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded border">
                  {enhancementResult?.originalText || ''}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  強化された文章
                </h3>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-700">
                  {enhancementResult?.enhancedText || ''}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEnhancementModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={applyEnhancement}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
              >
                適用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* キャラクターギャラリー */}
      {isCharacterGalleryOpen && (
        <CharacterGallery
          characters={allCharacters}
          currentCharacter={currentCharacter}
          onSelectCharacter={(character: Character) => {
            setCurrentCharacter(character);
            setIsCharacterGalleryOpen(false);
            // 新しいキャラクターでセッションを開始
            setCurrentSessionId(null);
            setMessages([{
              id: '1',
              role: 'assistant',
              content: Array.isArray(character.first_message) 
                ? character.first_message.join('\n') 
                : (character.first_message || 'こんにちは！'),
              timestamp: Date.now()
            }]);
          }}
          onAddCharacter={() => {
            setIsCharacterGalleryOpen(false);
            setIsCharacterModalOpen(true);
            setEditingCharacter(null);
          }}
          onEditCharacter={(character: Character) => {
            setIsCharacterGalleryOpen(false);
            setIsCharacterModalOpen(true);
            setEditingCharacter(character);
          }}
          onDeleteCharacter={(character: Character) => {
            if (confirm(`「${character.name}」を削除しますか？`)) {
              // 削除処理（実装予定）
              console.log('キャラクター削除:', character.name);
            }
          }}
          onImportExport={() => {
            setIsCharacterGalleryOpen(false);
            setIsImportExportOpen(true);
          }}
          onClose={() => setIsCharacterGalleryOpen(false)}
        />
      )}

      {/* チャット履歴ギャラリー */}
      {isChatHistoryOpen && (
        <ChatHistoryGallery
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(sessionId: string) => {
            if (sessionId === 'new') {
              setCurrentSessionId(null);
              if (currentCharacter) {
                const firstMessage = Array.isArray(currentCharacter.first_message) 
                  ? currentCharacter.first_message.join('\n') 
                  : (currentCharacter.first_message || 'こんにちは！');
                
                setMessages([{
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: firstMessage,
                  timestamp: Date.now()
                }]);
              }
            } else {
              historyManager.loadSession(sessionId).then(loadedSession => {
                if (loadedSession) {
                  setMessages(loadedSession.messages);
                  setCurrentSessionId(sessionId);
                }
              });
            }
            setIsChatHistoryOpen(false);
          }}
          onDeleteSession={handleDeleteSession}
          onClose={() => setIsChatHistoryOpen(false)}
        />
      )}

      {/* 強化されたインプレッションモーダル */}
      <EnhancedImpressionModal
        isOpen={isEnhancedImpressionOpen}
        onClose={() => setIsEnhancedImpressionOpen(false)}
        impressions={currentImpressions}
        isLoading={isGeneratingImpression}
        onRegenerate={handleGenerateEnhancedImpression}
        characterName={currentCharacter?.name}
      />

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          console.log('設定保存処理開始 - 新しい設定:', newSettings);
          
          const mergedSettings = { ...settings, ...newSettings } as AppSettings;
          console.log('設定保存処理 - マージ後の設定:', mergedSettings);

          // Zustandストアに保存
          updateSettings(mergedSettings);
          console.log('設定保存処理完了 - Zustandストアに保存済み');

          // ElevenLabs APIキーを即座に設定
          if (mergedSettings.elevenLabsApiKey) {
            // VoiceManager.setApiKey(mergedSettings.elevenLabsApiKey); // 環境変数から取得するように変更したため削除
          }
        }}
      />

      {/* キャラクターモーダル */}
      <CharacterModal
        isOpen={isCharacterModalOpen}
        onClose={() => {
          setIsCharacterModalOpen(false);
          setEditingCharacter(null);
        }}
        character={editingCharacter}
        onSave={(character) => {
          if (editingCharacter) {
            CharacterLoader.updateCharacter(character);
          } else {
            CharacterLoader.addCharacter(character);
          }
          
          // キャラクター一覧を更新
          const updatedCharacters = CharacterLoader.getAllCharacters();
          setAllCharacters(updatedCharacters);
          
          // 新規作成または編集中のキャラクターを選択
          setCurrentCharacter(character);
          setCurrentSessionId(null);
          
          const firstMessage = Array.isArray(character.first_message) 
            ? character.first_message.join('\n') 
            : (character.first_message || 'こんにちは！');
            
          console.log('保存後のキャラクター選択:', character.name, firstMessage);
          
          setMessages([{
            id: crypto.randomUUID(),
            role: 'assistant',
            content: firstMessage,
            timestamp: Date.now()
          }]);
        }}
      />

      {/* Personaモーダル */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => {
          setIsPersonaModalOpen(false);
          setEditingPersona(null);
        }}
        persona={editingPersona}
        onSave={(persona) => {
          let updatedPersonas;
          if (editingPersona) {
            updatedPersonas = allPersonas.map(p => p.id === persona.id ? persona : p);
          } else {
            updatedPersonas = [...allPersonas, persona];
          }
          
          setAllPersonas(updatedPersonas);
          localStorage.setItem('ai-chat-personas', JSON.stringify(updatedPersonas));
          
          // 新規作成または編集したPersonaを選択
          setCurrentPersona(persona);
        }}
      />

      {/* インポート/エクスポートモーダル */}
      <CharacterImportExport
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        allCharacters={allCharacters}
        onImport={(importedCharacters: Character[]) => {
          // インポートされたキャラクターを追加
          importedCharacters.forEach((character: Character) => {
            CharacterLoader.addCharacter(character);
          });          
          // キャラクター一覧を更新
          const updatedCharacters = CharacterLoader.getAllCharacters();
          setAllCharacters(updatedCharacters);
        }}
      />

      {/* 会話要約モーダル */}
      <ChatSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summary={currentSummary}
        isLoading={isGeneratingSummary}
        sessionTitle={currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || '新しいチャット' : '新しいチャット'}
        characterName={currentCharacter?.name || 'AI'}
        onSaveSummary={(summary) => {
          // 要約保存機能（後で実装可能）
          console.log('Summary saved:', summary);
        }}
      />

      {/* シンプル背景アップロードモーダル */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">背景設定</h2>
            
            <div className="space-y-4">
              {/* 現在の背景 */}
              {settings.customBackground && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">現在の背景:</p>
                  <div 
                    className="w-full h-32 rounded-lg bg-cover bg-center border"
                    style={{ backgroundImage: `url(${settings.customBackground})` }}
                  />
                </div>
              )}

              {/* 高度なアップロードボタン（圧縮・動画対応） */}
              <div>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log('📁 ファイル選択:', file.name, 'サイズ:', Math.round(file.size / 1024), 'KB');
                        
                        try {
                          let result: string;
                          
                          if (file.type.startsWith('video/')) {
                            // 動画ファイルの処理
                            console.log('🎥 動画ファイルを処理中...');
                            const reader = new FileReader();
                            reader.onload = () => {
                              const videoResult = reader.result as string;
                              console.log('✅ 動画アップロード完了');
                              handleThemeChange('custom', videoResult);
                              setIsThemeModalOpen(false);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            // 画像ファイルの自動圧縮処理
                            console.log('🖼️ 画像を圧縮中...');
                            result = await compressImage(file);
                            console.log('✅ 画像圧縮完了');
                            handleThemeChange('custom', result);
                            setIsThemeModalOpen(false);
                          }
                        } catch (error) {
                          console.error('❌ ファイル処理エラー:', error);
                          alert('ファイルの処理に失敗しました');
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-400 transition-colors">
                    <p className="text-gray-600">画像・動画をアップロード</p>
                    <p className="text-sm text-gray-400 mt-1">クリックして画像・動画を選択（自動圧縮）</p>
                  </div>
                </label>
              </div>

              {/* モバイル対応背景削除ボタン */}
              {settings.customBackground && (
                <button
                  onClick={() => {
                    handleThemeChange('white', undefined);
                    setIsThemeModalOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-base min-h-[44px] flex items-center justify-center"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  背景を削除（白背景に戻す）
                </button>
              )}
            </div>

            {/* モバイル対応ボタン行 */}
            <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-gray-200 sm:flex-row">
              <button
                onClick={() => setIsThemeModalOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-base min-h-[44px] flex items-center justify-center"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 認証・クラウド同期モーダル */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onDataSync={(syncedData) => {
          // 同期されたデータを反映
          setAllCharacters(syncedData.characters)
          setAllPersonas(syncedData.personas)
          // 設定をZustandストアに反映
          updateSettings(syncedData.settings)
          // メモデータも反映（chatStoreを使用）
          localStorage.setItem('ai-chat-characters', JSON.stringify(syncedData.characters))
          localStorage.setItem('ai-chat-personas', JSON.stringify(syncedData.personas))
        }}
      />

      {/* インスピレーション候補選択モーダル */}
      <InspirationModal
        isOpen={showInspiration}
        candidates={inspirationCandidates}
        onSelect={(selectedText: string) => {
          // 選択した候補をキャラクターの返信として確定
          const aiResponse: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: selectedText,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, aiResponse]);
          setShowInspiration(false);
          setInspirationCandidates([]);
          
          // 通知音を再生
          if (settings.chatNotificationSound) {
            VoiceManager.playNotificationSound(true, 0.3);
          }
          
          // 画像生成（必要な場合）
          if (settings.enableImageGeneration) {
            handleImageGeneration(aiResponse, selectedText);
          }
        }}
        onClose={() => {
          setShowInspiration(false);
          setInspirationCandidates([]);
        }}
      />

      {/* ユーザーインスピレーション候補選択モーダル */}
      <UserInspirationModal
        isOpen={showUserInspiration}
        candidates={userInspirationCandidates}
        onSelect={(selectedText: string) => {
          setMessage(selectedText);
          setShowUserInspiration(false);
          setUserInspirationCandidates([]);
        }}
        onClose={() => {
          setShowUserInspiration(false);
          setUserInspirationCandidates([]);
        }}
      />

      {/* Personaインポート/エクスポートモーダル */}
      <PersonaImportExport
        isOpen={isPersonaImportExportOpen}
        onClose={() => setIsPersonaImportExportOpen(false)}
        allPersonas={allPersonas}
        onImport={(importedPersonas: UserPersona[]) => {
          // インポートされたPersonaを追加
          const updatedPersonas = [...allPersonas];
          importedPersonas.forEach((importedPersona: UserPersona) => {
            // 既存のPersonaと重複チェック（IDまたは名前）
            const existingIndex = updatedPersonas.findIndex(p => p.id === importedPersona.id || p.name === importedPersona.name);
            if (existingIndex >= 0) {
              // 既存のPersonaを更新
              updatedPersonas[existingIndex] = importedPersona;
            } else {
              // 新しいPersonaを追加
              updatedPersonas.push(importedPersona);
            }
          });
          
          setAllPersonas(updatedPersonas);
          localStorage.setItem('ai-chat-personas', JSON.stringify(updatedPersonas));
        }}
      />
    </div>
  );
}
