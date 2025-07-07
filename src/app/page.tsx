'use client';

// crypto.randomUUID ポリフィル
import '../../lib/uuidPolyfill';

import { useState, useEffect, useRef } from 'react';
import { Send, Settings, MessageSquare, User, Loader, RefreshCw, Trash2, CornerUpLeft, Clock, Plus, X, FileText, Palette, Menu, Play, Cloud, ChevronDown, ChevronUp } from 'lucide-react';
import { CharacterLoader } from '../../lib/characterLoader';
import { Character, AppSettings, UserPersona } from '../../types/character';
import { historyManager, SessionSummary } from '../../lib/historyManager';
import { ThemeManager, getThemeById, getDefaultTheme } from '../../lib/themes';
import { VoiceManager } from '../../lib/voiceManager';
import SettingsModal from '../../components/SettingsModal';
import VoiceControls, { VoiceToggle } from '../../components/VoiceControls';
import CharacterModal from '../../components/CharacterModal';
import CharacterSelector from '../../components/CharacterSelector';
import PersonaModal from '../../components/PersonaModal';
import PersonaSelector from '../../components/PersonaSelector';
import CharacterImportExport from '../../components/CharacterImportExport';
import { MessageMemoButton, MemoListButton } from '../../components/ChatMemoProvider';
import ChatSummaryModal from '../../components/ChatSummaryModal';
import ThemeModal from '../../components/ThemeModal';
import AuthModal from '../../components/AuthModal';
import { useChatStore } from '../../stores/chatStore';
import FormattedText from '../../components/FormattedText';
import Image from 'next/image';

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

  const { memos } = useChatStore();

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
  const [settings, setSettings] = useState<AppSettings>({
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 2048,
    memorySize: 4000,
    bubbleOpacity: 0.9,
    geminiApiKey: 'AIzaSyB6swTTIlDM3pgyALHjZDFTUIQf2fhzLAE',
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
    voiceEnabled: true,
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
    chatNotificationSound: true,
    imageEngine: 'replicate',
    bubbleBlur: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初期化
  useEffect(() => {
    const initializeApp = async () => {
      // 設定を読み込み
      try {
        const savedSettings = localStorage.getItem('ai-chat-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsedSettings }));
          
          // 音声APIキーを設定
          if (parsedSettings.elevenLabsApiKey) {
            console.log('ElevenLabs APIキー設定:', parsedSettings.elevenLabsApiKey.substring(0, 10) + '...');
            VoiceManager.setApiKey(parsedSettings.elevenLabsApiKey);
          } else {
            console.log('ElevenLabs APIキーが設定されていません（Web Speech API使用）');
          }
        }
      } catch (error) {
        console.error('設定読み込みエラー:', error);
      }

      // テーマを読み込みと適用
      try {
        const themeData = ThemeManager.loadTheme();
        const theme = getThemeById(themeData.themeId) || getDefaultTheme();
        ThemeManager.applyTheme(theme, themeData.customBackground);
      } catch (error) {
        console.error('テーマ読み込みエラー:', error);
      }

      // キャラクターを読み込み
      const characters = CharacterLoader.getAllCharacters();
      setAllCharacters(characters);
      
      // Personaを読み込み
      try {
        const savedPersonas = localStorage.getItem('ai-chat-personas');
        if (savedPersonas) {
          setAllPersonas(JSON.parse(savedPersonas));
        }
      } catch (error) {
        console.error('Persona読み込みエラー:', error);
      }
      
      const character = CharacterLoader.getCharacterByName('ナミ');
      if (character) {
        setCurrentCharacter(character);
        
        // 履歴を読み込み
        try {
          await historyManager.init();
          const allSessions = await historyManager.getAllSessions();
          setSessions(allSessions);
        } catch (error) {
          console.error('履歴読み込みエラー:', error);
        }
        
        // 初期メッセージを設定
        const firstMessage = Array.isArray(character.first_message) 
          ? character.first_message.join('\n') 
          : (character.first_message || 'こんにちは！');
          
        console.log('初回メッセージ設定:', firstMessage);
        
        setMessages([{
          id: '1',
          role: 'assistant',
          content: firstMessage,
          timestamp: Date.now()
        }]);
      }
    };
    
    initializeApp();
  }, []);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.content,
          settings: settings,
          persona: currentPersona,
          characterId: currentCharacter?.name,
          character: currentCharacter,
          memos: memos,
          conversation: [...messages, newMessage].slice(-20) // 直近20件
        }),
      });

      const chatData = await chatResponse.json();

      if (chatData.success) {
        // 画像生成を開始
        if (settings.enableImageGeneration) {
          setIsGeneratingImage(true);
        }
        
        // まずテキストレスポンスを表示
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: chatData.content,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, aiResponse]);

        // チャット完了通知音を再生
        if (settings.chatNotificationSound) {
          VoiceManager.playNotificationSound(true, 0.3);
        }

        // 自動音声再生
        if (settings.voiceEnabled && settings.voiceAutoPlay) {
          const voiceSettings = {
            enabled: settings.voiceEnabled,
            autoPlay: settings.voiceAutoPlay,
            voiceId: settings.voiceId,
            stability: settings.voiceStability,
            similarityBoost: settings.voiceSimilarityBoost,
            style: settings.voiceStyle,
            useSpeakerBoost: settings.voiceUseSpeakerBoost,
            speed: settings.voiceSpeed,
            volume: settings.voiceVolume,
          };
          VoiceManager.playAudio(chatData.content, voiceSettings);
        }

        // 画像生成（非同期）
        if (settings.enableImageGeneration) {
        try {
          // 過去数回の会話を文脈として提供
          const recentMessages = messages.slice(-5).map(m => m.content);
          
          const imageResponse = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              aiResponse: chatData.content,
              character: currentCharacter,
              conversationContext: recentMessages,
              loraSettings: settings.loraSettings,
              negativePrompt: settings.negativePrompt,
              seed: currentCharacter?.imageSeed,
              width: currentCharacter?.imageWidth,
              height: currentCharacter?.imageHeight,
              steps: currentCharacter?.imageSteps,
              cfg_scale: currentCharacter?.imageCfgScale,
              sampler: currentCharacter?.imageSampler,
              imageEngine: settings.imageEngine,
            }),
          });

          const imageData = await imageResponse.json();
          
          if (imageData.success) {
            // 画像を追加
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
        .slice(-20); // 直近20件

      // APIを呼び出して新しい応答を生成（重複送信を防止）
      const chatResponse = await fetch('/api/simple-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: lastUserMessage.content,
          settings: settings,
          persona: currentPersona,
          characterId: currentCharacter?.name,
          character: currentCharacter,
          memos: memos,
          conversation: conversationContext
        }),
      });

      const chatData = await chatResponse.json();

      if (chatData.success) {
        const aiResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: chatData.content,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, aiResponse]);

        // チャット完了通知音を再生
        if (settings.chatNotificationSound) {
          VoiceManager.playNotificationSound(true, 0.3);
        }

        // 画像生成
        if (settings.enableImageGeneration) {
        try {
          // 過去数回の会話を文脈として提供
          const recentMessages = messagesWithoutLast.slice(-5).map(m => m.content);
          
          const imageResponse = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              aiResponse: chatData.content,
              character: currentCharacter,
              conversationContext: recentMessages,
              loraSettings: settings.loraSettings,
              negativePrompt: settings.negativePrompt,
              seed: currentCharacter?.imageSeed,
              width: currentCharacter?.imageWidth,
              height: currentCharacter?.imageHeight,
              steps: currentCharacter?.imageSteps,
              cfg_scale: currentCharacter?.imageCfgScale,
              sampler: currentCharacter?.imageSampler,
              imageEngine: settings.imageEngine,
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
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 履歴選択のクリックイベントを阻止
    
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

  // テーマ変更ハンドラー
  const handleThemeChange = (themeId: string, customBackground?: string) => {
    const theme = getThemeById(themeId) || getDefaultTheme();
    ThemeManager.applyTheme(theme, customBackground);
    
    // 設定に保存
    const updatedSettings = {
      ...settings,
      currentTheme: themeId,
      customBackground: customBackground
    };
    setSettings(updatedSettings);
    localStorage.setItem('ai-chat-settings', JSON.stringify(updatedSettings));
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
          conversation: messages.slice(-20)
        })
      });
      const data = await chatResponse.json();
      if (data.success) {
        const aiMsg: Message = { id: Date.now().toString(), role: 'assistant', content: data.content, timestamp: Date.now() };
        setMessages(prev => [...prev, aiMsg]);

        // チャット完了通知音を再生
        if (settings.chatNotificationSound) {
          VoiceManager.playNotificationSound(true, 0.3);
        }
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

      const imageResponse = await fetch('/api/generate-image', {
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
          imageEngine: settings.imageEngine,
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

  return (
    <div className="flex h-screen theme-background relative">
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
        theme-sidebar border-r border-white/10 flex flex-col h-screen transition-all duration-300 md:overflow-hidden overflow-y-auto
        ${isSidebarOpen ? 'fixed md:relative z-50' : 'relative'}
      `}>
        <div className="min-w-80 flex flex-col h-full">
          {/* Persona選択 */}
          <div className="flex-shrink-0">
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
        />
        </div>

        {/* キャラクター選択 */}
        <div className="flex-shrink-0">
          <CharacterSelector
          characters={allCharacters}
          currentCharacter={currentCharacter}
          onSelectCharacter={(character) => {
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
          onEditCharacter={(character) => {
            setEditingCharacter(character);
            setIsCharacterModalOpen(true);
          }}
          onDeleteCharacter={(character) => {
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

        {/* モバイル用クイック操作（設定・テーマ・同期） */}
        <div className="p-4 border-t border-white/10 flex-shrink-0 space-y-2 md:hidden">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-2 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <Cloud size={16} />
            クラウド同期
          </button>
          <button 
            onClick={() => setIsThemeModalOpen(true)}
            className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-2 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <Palette size={16} />
            テーマ
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-2 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <Settings size={16} />
            設定
          </button>
        </div>

        {/* チャット履歴 */}
        <div className="flex-1 flex flex-col min-h-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="theme-text-primary font-semibold flex items-center gap-2">
                <MessageSquare size={20} />
                チャット履歴
                <span className="bg-white/20 text-white/80 px-2 py-1 rounded-full text-xs">
                  {sessions.length}
                </span>
              </h2>
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
                className="theme-text-secondary hover:theme-text-primary p-1 rounded hover:bg-white/10 transition-colors"
                title="新しいチャット"
              >
                <Plus size={16} />
              </button>
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
                className={`group bg-white/10 backdrop-blur-sm rounded-lg p-3 cursor-pointer hover:bg-white/15 transition-all duration-200 relative ${
                  currentSessionId === session.id ? 'ring-2 ring-blue-400 bg-blue-400/20' : ''
                } hover:shadow-lg hover:scale-[1.02]`}
              >
                {/* 削除ボタン */}
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/50 hover:text-red-400 hover:bg-red-500/20 rounded-full p-1"
                  title="履歴を削除"
                >
                  <X size={12} />
                </button>

                <div className="text-white text-sm font-medium truncate mb-1 pr-6">
                  {session.title}
                </div>
                <div className="text-white/70 text-xs truncate mb-2 leading-relaxed">
                  {session.lastMessage}
                </div>
                <div className="text-white/50 text-xs flex items-center justify-between">
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
              <div className="text-white/50 text-sm text-center py-8">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                まだ履歴がありません
                <p className="text-xs mt-1 text-white/40">
                  最初のメッセージを送信すると履歴が作成されます
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 flex-shrink-0 space-y-2 hidden md:block">
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-2 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
            >
              <Cloud size={16} />
              クラウド同期
            </button>
            <button 
              onClick={() => setIsThemeModalOpen(true)}
              className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-2 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
            >
              <Palette size={16} />
              テーマ変更
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-2 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
            >
              <Settings size={16} />
              設定
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {/* ヘッダー */}
        <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="theme-text-primary hover:bg-white/10 p-2 rounded-lg transition-colors"
              title={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
            >
              <Menu size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{currentCharacter?.name || 'キャラクター'}</h3>
              <p className="text-white/70 text-sm">{currentCharacter?.tags[0] || '航海士'}</p>
            </div>
          </div>
        </div>

        {/* チャットメッセージエリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' ? (
                <div className="max-w-2xl">
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
                            className="w-full max-w-[80vw] sm:w-80 h-auto sm:h-96 rounded-lg shadow-2xl object-cover"
                          />
                        )}
                        {isGeneratingImage && !msg.image && (
                          <div className="w-full max-w-[80vw] sm:w-80 h-auto sm:h-96 bg-black/30 rounded-lg flex items-center justify-center">
                            <Loader className="animate-spin text-white" size={24} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* メッセージバブル */}
                  <div 
                    className="relative z-10 rounded-2xl p-4 shadow-lg"
                    style={{ backgroundColor: `rgba(255, 255, 255, ${settings.bubbleOpacity})` }}
                  >
                    <div 
                      className="absolute -top-2 left-6 w-4 h-4 rotate-45"
                      style={{ backgroundColor: `rgba(255, 255, 255, ${settings.bubbleOpacity})` }}
                    ></div>
                     <div className="text-gray-800 leading-relaxed whitespace-pre-wrap font-cute">
                       <FormattedText md={msg.content} />
                     </div>
                     <div className="flex justify-end mt-2 gap-1">
                       <VoiceControls
                         text={msg.content}
                         settings={{
                           enabled: settings.voiceEnabled,
                           autoPlay: settings.voiceAutoPlay,
                           voiceId: settings.voiceId,
                           stability: settings.voiceStability,
                           similarityBoost: settings.voiceSimilarityBoost,
                           style: settings.voiceStyle,
                           useSpeakerBoost: settings.voiceUseSpeakerBoost,
                           speed: settings.voiceSpeed,
                           volume: settings.voiceVolume,
                         }}
                       />
                       <MessageMemoButton 
                         messageId={msg.id}
                         messageContent={msg.content}
                         sessionId={currentSessionId || 'temp'}
                         characterId={currentCharacter?.name || 'unknown'}
                       />
                       <button 
                         onClick={() => handleRegenerate()}
                         disabled={isLoading}
                         className="text-gray-500 hover:text-gray-700 p-1 rounded disabled:opacity-50"
                         title="再生成"
                       >
                         <RefreshCw size={16} />
                       </button>
                       <button 
                         onClick={() => handleRollback(msg.id)}
                         className="text-gray-500 hover:text-gray-700 p-1 rounded"
                         title="ここまで戻る"
                       >
                         <CornerUpLeft size={16} />
                       </button>
                       {settings.enableImageGeneration && (
                       <button
                         onClick={() => handleImageReroll(msg)}
                         className="text-yellow-500 hover:text-yellow-700 p-1 rounded"
                         title="画像をランダムシードで再生成"
                       >
                         🎲
                       </button>
                       )}
                     </div>
                   </div>
                </div>
              ) : (
                <div className="max-w-lg">
                  <div
                    className={`relative z-10 rounded-2xl p-4 shadow-lg ${settings.bubbleBlur ? 'backdrop-blur-sm' : ''}`}
                    style={{ backgroundColor: `rgba(59, 130, 246, ${settings.bubbleOpacity})` }}
                  >
                                          <div 
                        className="absolute -top-2 right-6 w-4 h-4 rotate-45"
                        style={{ backgroundColor: `rgba(59, 130, 246, ${settings.bubbleOpacity})` }}
                      ></div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="p-4 bg-black/30 backdrop-blur-sm border-t border-white/10" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="メッセージを入力..."
                className="flex-1 bg-transparent theme-text-primary placeholder-theme-text-secondary resize-none outline-none min-h-[40px] max-h-64"
                rows={isInputExpanded ? 4 : 1}
              />
              <button
                onClick={() => setIsInputExpanded(!isInputExpanded)}
                className="text-gray-400 hover:text-white p-2 rounded-full transition-colors"
                title={isInputExpanded ? '入力欄を縮小' : '入力欄を拡大'}
              >
                {isInputExpanded ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white p-3 rounded-full transition-colors"
              >
                {isLoading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            
            <div className="flex justify-center mt-2 gap-2">
              <VoiceToggle
                enabled={settings.voiceEnabled}
                onToggle={(enabled) => {
                  const newSettings = { ...settings, voiceEnabled: enabled };
                  setSettings(newSettings);
                  localStorage.setItem('ai-chat-settings', JSON.stringify(newSettings));
                  
                  // APIキーを設定
                  if (enabled && newSettings.elevenLabsApiKey) {
                    VoiceManager.setApiKey(newSettings.elevenLabsApiKey);
                  }
                }}
              />
              <button
                onClick={() => {
                  const newSettings = { ...settings, enableImageGeneration: !settings.enableImageGeneration };
                  setSettings(newSettings);
                  localStorage.setItem('ai-chat-settings', JSON.stringify(newSettings));
                }}
                className={`text-xs px-3 py-1 rounded-full backdrop-blur-sm transition-colors ${settings.enableImageGeneration ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-500 text-white/70 hover:bg-gray-600'}`}
                title={settings.enableImageGeneration ? '画像生成を無効化' : '画像生成を有効化'}
              >
                🖼 {settings.enableImageGeneration ? '画像ON' : '画像OFF'}
              </button>
              <MemoListButton currentCharacterId={currentCharacter?.name} />
              <button 
                onClick={handleGenerateSummary}
                disabled={isLoading || messages.length < 3}
                className="text-white/70 hover:text-white text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                title="会話要約を生成"
              >
                <FileText size={12} />
                要約
              </button>
              <button 
                onClick={handleRegenerate}
                disabled={isLoading || messages.length === 0}
                className="text-white/70 hover:text-white text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw size={12} />
                再生成
              </button>
              <button 
                onClick={handleReset}
                className="text-white/70 hover:text-white text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} />
                会話リセット
              </button>
              <button 
                onClick={handleContinue}
                disabled={isLoading || messages.length === 0}
                className="text-white/70 hover:text-white text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                title="続きを生成"
              >
                <Play size={12} />
                続き
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          // 不足しているプロパティを補完しつつ更新
          setSettings(prev => ({ ...prev, ...newSettings }));

          const mergedSettings = { ...settings, ...newSettings };

          // ローカルストレージに保存
          localStorage.setItem('ai-chat-settings', JSON.stringify(mergedSettings));

          // ElevenLabs APIキーを即座に設定
          if (mergedSettings.elevenLabsApiKey) {
            VoiceManager.setApiKey(mergedSettings.elevenLabsApiKey);
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
        onImport={(importedCharacters) => {
          // インポートされたキャラクターを追加
          importedCharacters.forEach(character => {
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

      {/* テーマモーダル */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={settings.currentTheme}
        customBackground={settings.customBackground}
        onThemeChange={handleThemeChange}
      />

      {/* 認証・クラウド同期モーダル */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onDataSync={(syncedData) => {
          // 同期されたデータを反映
          setAllCharacters(syncedData.characters)
          setAllPersonas(syncedData.personas)
          setSettings(syncedData.settings)
          // メモデータも反映（chatStoreを使用）
          localStorage.setItem('ai-chat-characters', JSON.stringify(syncedData.characters))
          localStorage.setItem('ai-chat-personas', JSON.stringify(syncedData.personas))
          localStorage.setItem('ai-chat-settings', JSON.stringify(syncedData.settings))
        }}
      />
    </div>
  );
}
