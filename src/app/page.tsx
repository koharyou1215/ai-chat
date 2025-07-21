'use client';

// @ts-nocheck

// crypto.randomUUID 繝昴Μ繝輔ぅ繝ｫ
import '../../lib/uuidPolyfill';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, MessageSquare, User, Loader, RefreshCw, CornerUpLeft, Clock, Plus, X, Palette, Menu, Cloud, ChevronDown, ChevronUp, Copy, Grid } from 'lucide-react';
import { CharacterLoader } from '../../lib/characterLoader';
import { Character, AppSettings, UserPersona } from '../../types/character';
import { historyManager, SessionSummary } from '../../lib/historyManager';
import { ThemeManager, getThemeById, getDefaultTheme } from '../../lib/themes';
import { VoiceManager } from '../../lib/voiceManager';
import SettingsModal from '../../components/SettingsModal';
import VoiceControls from '../../components/VoiceControls';
import CharacterModal from '../../components/CharacterModal';
import CharacterSelector from '../../components/CharacterSelector';
import PersonaModal from '../../components/PersonaModal';
import PersonaSelector from '../../components/PersonaSelector';
import NavigationButtons from '../../components/NavigationButtons';
import { MessageMemoButton, MemoListButton } from '../../components/ChatMemoProvider';
import ChatSummaryModal from '../../components/ChatSummaryModal';
import ThemeModal from '../../components/ThemeModal';
import AuthModal from '../../components/AuthModal';
import { useChatStore } from '../../stores/chatStore';
import FormattedText from '../../components/FormattedText';
import Image from 'next/image';
import { loadAllCharactersFromPublic, loadAllPersonasFromPublic } from '../../lib/autoLoader';
import { TouchGestureManager, isMobileDevice } from '../../lib/touchGestures';
import dynamic from 'next/dynamic';

// 蜍慕噪繧､繝ｳ繝昴・繝茨ｼ亥・譛溘ヰ繝ｳ繝峨Ν蜑頑ｸ幢ｼ・const CharacterGallery = dynamic(() => import('../../components/CharacterGallery'), { ssr: false });
const EnhancedImpressionModal = dynamic(() => import('../../components/EnhancedImpressionModal'), { ssr: false });
const ChatHistoryGallery = dynamic(() => import('../../components/ChatHistoryGallery'), { ssr: false });
const InspirationModal = dynamic(() => import('../../components/InspirationModal').then(m => m.InspirationModal), { ssr: false });
const UserInspirationModal = dynamic(() => import('../../components/UserInspirationModal').then(m => m.UserInspirationModal), { ssr: false });
const CharacterImportExport = dynamic(() => import('../../components/CharacterImportExport'), { ssr: false });
const PersonaImportExport = dynamic(() => import('../../components/PersonaImportExport'), { ssr: false });

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

  // 繧､繝ｳ繧ｹ繝斐Ξ繝ｼ繧ｷ繝ｧ繝ｳ髢｢騾｣
  const [showInspiration, setShowInspiration] = useState(false);
  const [inspirationCandidates, setInspirationCandidates] = useState<string[]>([]);
  const [showUserInspiration, setShowUserInspiration] = useState(false);
  const [userInspirationCandidates, setUserInspirationCandidates] = useState<string[]>([]);
  const [isLoadingUserInspiration, setIsLoadingUserInspiration] = useState(false);

  // 繝ｦ繝ｼ繧ｶ繝ｼ譁・ｫ蠑ｷ蛹匁ｩ溯・
  const [isEnhancingUserText, setIsEnhancingUserText] = useState(false);
  
  // 繧ｿ繝也ｮ｡逅・  const [activeTab, setActiveTab] = useState<'characters' | 'personas' | 'settings'>('characters');

  // 譁・ｫ蠑ｷ蛹匁ｩ溯・
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

  // Persona繧､繝ｳ繝昴・繝・繧ｨ繧ｯ繧ｹ繝昴・繝・  const [isPersonaImportExportOpen, setIsPersonaImportExportOpen] = useState(false);
  const [isCharacterGalleryOpen, setIsCharacterGalleryOpen] = useState(false);
  const [isEnhancedImpressionOpen, setIsEnhancedImpressionOpen] = useState(false);
  const [currentImpressions, setCurrentImpressions] = useState<ChatImpression[]>([]);
  const [isGeneratingImpression, setIsGeneratingImpression] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);

  const { memos } = useChatStore();

  // 繧ｿ繝・メ繧ｸ繧ｧ繧ｹ繝√Ε繝ｼ邂｡逅・  const [touchGestureManager, setTouchGestureManager] = useState<TouchGestureManager | null>(null);

  // 莨夊ｩｱ隕∫ｴ・函謌・  const handleGenerateSummary = async () => {
    if (!currentCharacter || messages.length < 3) {
      alert('隕∫ｴ・☆繧九↓縺ｯ譛菴・縺､縺ｮ繝｡繝・そ繝ｼ繧ｸ縺悟ｿ・ｦ√〒縺・);
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
          sessionTitle: currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || '譁ｰ縺励＞繝√Ε繝・ヨ' : '譁ｰ縺励＞繝√Ε繝・ヨ'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSummary(data.summary);
      } else {
        alert('隕∫ｴ・・逕滓・縺ｫ螟ｱ謨励＠縺ｾ縺励◆: ' + data.error);
        setIsSummaryOpen(false);
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      alert('隕∫ｴ・・逕滓・荳ｭ縺ｫ繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆');
      setIsSummaryOpen(false);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 蠑ｷ蛹悶＆繧後◆繧､繝ｳ繝励Ξ繝・す繝ｧ繝ｳ逕滓・
  const handleGenerateEnhancedImpression = async () => {
    if (!currentCharacter || messages.length < 3) {
      alert('繧､繝ｳ繝励Ξ繝・す繝ｧ繝ｳ逕滓・縺ｫ縺ｯ譛菴・縺､縺ｮ繝｡繝・そ繝ｼ繧ｸ縺悟ｿ・ｦ√〒縺・);
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
          sessionTitle: currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || '譁ｰ縺励＞繝√Ε繝・ヨ' : '譁ｰ縺励＞繝√Ε繝・ヨ'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentImpressions(data.impressions);
      } else {
        alert('繧､繝ｳ繝励Ξ繝・す繝ｧ繝ｳ縺ｮ逕滓・縺ｫ螟ｱ謨励＠縺ｾ縺励◆: ' + data.error);
        setIsEnhancedImpressionOpen(false);
      }
    } catch (error) {
      console.error('Enhanced impression generation error:', error);
      alert('繧､繝ｳ繝励Ξ繝・す繝ｧ繝ｳ縺ｮ逕滓・荳ｭ縺ｫ繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆');
      setIsEnhancedImpressionOpen(false);
    } finally {
      setIsGeneratingImpression(false);
    }
  };
  const [settings, setSettings] = useState<AppSettings>({
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 1024,
    memorySize: 4000,
    historySize: 12,
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
    voiceEnabled: true,
    voiceAutoPlay: false,
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    voiceStability: 0.5,
    voiceSimilarityBoost: 0.75,
    voiceStyle: 0,
    voiceUseSpeakerBoost: true,
    voiceSpeed: 1.0,
    voiceVolume: 0.8,
    model: 'gemini-1.5-flash',
    enableImageGeneration: true,
    chatNotificationSound: true,
    imageEngine: 'replicate',
    bubbleBlur: true,
    provider: 'gemini',
    openRouterApiKey: '',
    candidateCount: 1,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // 蛻晄悄蛹・  useEffect(() => {
    const initializeApp = async () => {
      // 繧ｿ繝・メ繧ｸ繧ｧ繧ｹ繝√Ε繝ｼ蛻晄悄蛹厄ｼ医Δ繝舌う繝ｫ繝・ヰ繧､繧ｹ縺ｮ縺ｿ・・      if (isMobileDevice()) {
        const gestureManager = new TouchGestureManager(
          () => {
            // 蟾ｦ繧ｹ繝ｯ繧､繝・ 繧ｵ繧､繝峨ヰ繝ｼ繧帝幕縺・            setIsSidebarOpen(true);
          },
          () => {
            // 蜿ｳ繧ｹ繝ｯ繧､繝・ 繧ｵ繧､繝峨ヰ繝ｼ繧帝哩縺倥ｋ
            setIsSidebarOpen(false);
          },
          undefined,
          undefined,
          undefined
        );
        setTouchGestureManager(gestureManager);
      }

      // 險ｭ螳壹ｒ隱ｭ縺ｿ霎ｼ縺ｿ
      try {
        const savedSettings = localStorage.getItem('ai-chat-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsedSettings }));
          
          // 髻ｳ螢ｰAPI繧ｭ繝ｼ繧定ｨｭ螳・          if (parsedSettings.elevenLabsApiKey) {
            console.log('ElevenLabs API繧ｭ繝ｼ險ｭ螳・', parsedSettings.elevenLabsApiKey.substring(0, 10) + '...');
            VoiceManager.setApiKey(parsedSettings.elevenLabsApiKey);
          } else {
            console.log('ElevenLabs API繧ｭ繝ｼ縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ・・eb Speech API菴ｿ逕ｨ・・);
          }
        }
      } catch (error) {
        console.error('險ｭ螳夊ｪｭ縺ｿ霎ｼ縺ｿ繧ｨ繝ｩ繝ｼ:', error);
      }

      // 繝・・繝槭ｒ隱ｭ縺ｿ霎ｼ縺ｿ縺ｨ驕ｩ逕ｨ
      try {
        const themeData = ThemeManager.loadTheme();
        const theme = getThemeById(themeData.themeId) || getDefaultTheme();
        ThemeManager.applyTheme(theme, themeData.customBackground);
      } catch (error) {
        console.error('繝・・繝櫁ｪｭ縺ｿ霎ｼ縺ｿ繧ｨ繝ｩ繝ｼ:', error);
      }

      // 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧定ｪｭ縺ｿ霎ｼ縺ｿ・亥ｾ捺擂 + 閾ｪ蜍戊ｪｭ縺ｿ霎ｼ縺ｿ・・      const builtinCharacters = CharacterLoader.getAllCharacters();
      const publicCharacters = await loadAllCharactersFromPublic();
      const allCharacters = [...builtinCharacters, ...publicCharacters];
      setAllCharacters(allCharacters);
      
      // Persona繧定ｪｭ縺ｿ霎ｼ縺ｿ・井ｿ晏ｭ俶ｸ医∩ + 閾ｪ蜍戊ｪｭ縺ｿ霎ｼ縺ｿ・・      try {
        const savedPersonas = localStorage.getItem('ai-chat-personas');
        const localPersonas = savedPersonas ? JSON.parse(savedPersonas) : [];
        const publicPersonas = await loadAllPersonasFromPublic();
        const combinedPersonas = [...localPersonas, ...publicPersonas];
        setAllPersonas(combinedPersonas);
      } catch (error) {
        console.error('Persona隱ｭ縺ｿ霎ｼ縺ｿ繧ｨ繝ｩ繝ｼ:', error);
      }
      
      // 螻･豁ｴ繧定ｪｭ縺ｿ霎ｼ縺ｿ
      try {
        await historyManager.init();
        const allSessions = await historyManager.getAllSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error('螻･豁ｴ隱ｭ縺ｿ霎ｼ縺ｿ繧ｨ繝ｩ繝ｼ:', error);
      }

      // 譛蠕後・繧ｻ繝・す繝ｧ繝ｳ縺ｨ繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧貞ｾｩ蜈・      try {
        const lastSession = sessions[0]; // 譛譁ｰ縺ｮ繧ｻ繝・す繝ｧ繝ｳ
        if (lastSession) {
          // 螳悟・縺ｪ繧ｻ繝・す繝ｧ繝ｳ諠・ｱ繧貞叙蠕・          const fullSession = await historyManager.loadSession(lastSession.id);
          
          if (fullSession) {
            // 菫晏ｭ倥＆繧後◆繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ諠・ｱ繧貞━蜈井ｽｿ逕ｨ
            let lastCharacter = fullSession.character;
            
            // 菫晏ｭ倥＆繧後◆繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ諠・ｱ縺後↑縺・ｴ蜷医・縲∝錐蜑阪〒讀懃ｴ｢
            if (!lastCharacter) {
              lastCharacter = allCharacters.find(c => c.name === fullSession.characterId);
            }
            
            if (lastCharacter) {
              setCurrentCharacter(lastCharacter);
              setCurrentSessionId(fullSession.id);
              setMessages(fullSession.messages);
              console.log('譛蠕後・繧ｻ繝・す繝ｧ繝ｳ繧貞ｾｩ蜈・', fullSession.title, '繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ:', lastCharacter.name);
            } else {
              // 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ縺瑚ｦ九▽縺九ｉ縺ｪ縺・ｴ蜷医・繝・ヵ繧ｩ繝ｫ繝・              const defaultCharacter = CharacterLoader.getCharacterByName('繝翫Α');
              if (defaultCharacter) {
                setCurrentCharacter(defaultCharacter);
                setInitialMessage(defaultCharacter);
              }
            }
          } else {
            // 螳悟・縺ｪ繧ｻ繝・す繝ｧ繝ｳ諠・ｱ縺悟叙蠕励〒縺阪↑縺・ｴ蜷医・蜷榊燕縺ｧ讀懃ｴ｢
          const lastCharacter = allCharacters.find(c => c.name === lastSession.characterId);
          if (lastCharacter) {
            setCurrentCharacter(lastCharacter);
            setCurrentSessionId(lastSession.id);
            setMessages(lastSession.messages);
              console.log('譛蠕後・繧ｻ繝・す繝ｧ繝ｳ繧貞ｾｩ蜈・ｼ亥錐蜑肴､懃ｴ｢・・', lastSession.title, '繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ:', lastCharacter.name);
          } else {
            // 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ縺瑚ｦ九▽縺九ｉ縺ｪ縺・ｴ蜷医・繝・ヵ繧ｩ繝ｫ繝・            const defaultCharacter = CharacterLoader.getCharacterByName('繝翫Α');
            if (defaultCharacter) {
              setCurrentCharacter(defaultCharacter);
              setInitialMessage(defaultCharacter);
              }
            }
          }
        } else {
          // 繧ｻ繝・す繝ｧ繝ｳ縺後↑縺・ｴ蜷医・繝・ヵ繧ｩ繝ｫ繝医く繝｣繝ｩ繧ｯ繧ｿ繝ｼ
          const defaultCharacter = CharacterLoader.getCharacterByName('繝翫Α');
          if (defaultCharacter) {
            setCurrentCharacter(defaultCharacter);
            setInitialMessage(defaultCharacter);
          }
        }
      } catch (error) {
        console.error('繧ｻ繝・す繝ｧ繝ｳ蠕ｩ蜈・お繝ｩ繝ｼ:', error);
        // 繧ｨ繝ｩ繝ｼ譎ゅ・繝・ヵ繧ｩ繝ｫ繝医く繝｣繝ｩ繧ｯ繧ｿ繝ｼ
        const defaultCharacter = CharacterLoader.getCharacterByName('繝翫Α');
        if (defaultCharacter) {
          setCurrentCharacter(defaultCharacter);
          setInitialMessage(defaultCharacter);
        }
      }
    };
    
    initializeApp();
  }, []);

  // 蛻晄悄繝｡繝・そ繝ｼ繧ｸ險ｭ螳壹・繝倥Ν繝代・髢｢謨ｰ
  const setInitialMessage = (character: Character) => {
    const firstMessage = Array.isArray(character.first_message) 
      ? character.first_message.join('\n') 
      : (character.first_message || '縺薙ｓ縺ｫ縺｡縺ｯ・・);
      
    console.log('蛻晄悄繝｡繝・そ繝ｼ繧ｸ險ｭ螳・', firstMessage);
    
    setMessages([{
      id: '1',
      role: 'assistant',
      content: firstMessage,
      timestamp: Date.now()
    }]);
  };

  // 繧ｿ繝・メ繧ｸ繧ｧ繧ｹ繝√Ε繝ｼ繧奪OM隕∫ｴ縺ｫ繧｢繧ｿ繝・メ
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

  // 閾ｪ蜍穂ｿ晏ｭ俶ｩ溯・
  useEffect(() => {
    const saveCurrentSession = async () => {
      if (!currentCharacter || messages.length <= 1) return;
      
      try {
        const sessionId = currentSessionId || crypto.randomUUID();
        const title = historyManager.generateTitle(messages);
        
        const session = {
          id: sessionId,
          characterId: currentCharacter.name,
          character: currentCharacter, // 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ諠・ｱ蜈ｨ菴薙ｒ菫晏ｭ・          messages: messages,
          title: title,
          createdAt: currentSessionId ? Date.now() : Date.now(),
          updatedAt: Date.now()
        };
        
        await historyManager.saveSession(session);
        
        if (!currentSessionId) {
          setCurrentSessionId(sessionId);
        }
        
        // 螻･豁ｴ繝ｪ繧ｹ繝医ｒ譖ｴ譁ｰ
        const allSessions = await historyManager.getAllSessions();
        setSessions(allSessions);
        
      } catch (error) {
        console.error('繧ｻ繝・す繝ｧ繝ｳ菫晏ｭ倥お繝ｩ繝ｼ:', error);
      }
    };
    
    // 繝｡繝・そ繝ｼ繧ｸ縺悟､画峩縺輔ｌ縺溘ｉ3遘貞ｾ後↓菫晏ｭ・    const timer = setTimeout(saveCurrentSession, 3000);
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
      // Gemini API縺ｧ繝√Ε繝・ヨ蠢懃ｭ斐ｒ逕滓・・育ｰ｡蜊倡沿・・      const chatResponse = await fetch('/api/simple-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage.content,
          settings,
          persona: currentPersona,
          characterId: currentCharacter?.name,
          character: currentCharacter,
          memos,
          conversation: [...messages, newMessage].slice(-20)
        }),
      });

      let aiContent = '';
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiResponse]); // 蜈医↓霑ｽ蜉縺励※縺翫￥

      const contentType = chatResponse.headers.get('Content-Type') || '';

      if (contentType.includes('application/json')) {
        // JSON蠖｢蠑擾ｼ磯壼ｸｸ or 繧､繝ｳ繧ｹ繝斐Ξ繝ｼ繧ｷ繝ｧ繝ｳ・・        const chatData = await chatResponse.json();
        if (chatData.success) {
          if (chatData.candidates && chatData.candidates.length > 1) {
            // 繧､繝ｳ繧ｹ繝斐Ξ繝ｼ繧ｷ繝ｧ繝ｳ蛟呵｣懊′縺ゅｋ蝣ｴ蜷・            setInspirationCandidates(chatData.candidates);
            setShowInspiration(true);
            setIsLoading(false);
            // AI霑比ｿ｡縺ｯ霑ｽ蜉縺帙★縲∝呵｣憺∈謚槭ｒ蠕・▽
            setMessages(prev => prev.slice(0, -1)); // 霑ｽ蜉縺励◆遨ｺ縺ｮAI霑比ｿ｡繧貞炎髯､
            return;
          } else {
            aiContent = chatData.content;
          }
        }
      } else {
        // 繧ｹ繝医Μ繝ｼ繝隱ｭ縺ｿ蜿悶ｊ
        const reader = chatResponse.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            aiContent += decoder.decode(value, { stream: true });
            // 驛ｨ蛻・噪縺ｫ陦ｨ遉ｺ繧呈峩譁ｰ
            setMessages(prev => prev.map(m => (m.id === aiResponse.id ? { ...m, content: aiContent } : m)));
          }
        }
      }

      // 譛邨よ峩譁ｰ
      setMessages(prev => prev.map(m => (m.id === aiResponse.id ? { ...m, content: aiContent } : m)));

      if (aiContent) {
        
        // 騾夂衍髻ｳ
        if (settings.chatNotificationSound) {
          VoiceManager.playNotificationSound(true, 0.3);
        }

        // 逕ｻ蜒冗函謌舌ｒ髢句ｧ・        if (settings.enableImageGeneration) {
          setIsGeneratingImage(true);
        }
        
        // 逕ｻ蜒冗函謌撰ｼ磯撼蜷梧悄・・        if (settings.enableImageGeneration) {
          handleImageGeneration(aiResponse, aiContent);
        }
      } else {
        // 繧ｨ繝ｩ繝ｼ譎ゅ・繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '縺斐ａ繧薙↑縺輔＞縲∽ｻ翫■繧・▲縺ｨ隱ｿ蟄舌′謔ｪ縺・∩縺溘＞...繧ゅ≧荳蠎ｦ隧ｱ縺励°縺代※縺上ｌ繧具ｼ・,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆縲ゅｂ縺・ｸ蠎ｦ縺願ｩｦ縺励￥縺縺輔＞縲・,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // 逕ｻ蜒冗函謌仙・逅・ｒ蜈ｱ騾壼喧
  const handleImageGeneration = async (aiResponse: Message, aiContent: string) => {
    if (!settings.enableImageGeneration || !currentCharacter) return;
    
    try {
      setIsGeneratingImage(true);
      const recentMessages = messages.slice(-5).map(m => m.content);
      
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiResponse: aiContent,
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
  };

  // 繝ｦ繝ｼ繧ｶ繝ｼ繧､繝ｳ繧ｹ繝斐Ξ繝ｼ繧ｷ繝ｧ繝ｳ讖溯・
  const handleUserInspiration = async () => {
    if (!currentCharacter || isLoadingUserInspiration) return;
    
    console.log('髮ｻ逅・・繧ｿ繝ｳ縺梧款縺輔ｌ縺ｾ縺励◆');
    setIsLoadingUserInspiration(true);
    try {
      const response = await fetch('/api/user-inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: currentCharacter,
          persona: currentPersona,
          conversation: messages.slice(-8), // 逶ｴ霑・莉ｶ
          settings,
          variantCount: 1 // 1譛ｬ繝｢繝ｼ繝・        })
      });
      
      const data = await response.json();
      console.log('繧､繝ｳ繧ｹ繝斐Ξ繝ｼ繧ｷ繝ｧ繝ｳAPI蠢懃ｭ・', data);
      console.log('蛟呵｣憺・蛻・', data.candidates);
      if (data.success && data.candidates.length > 0) {
        // 1譛ｬ繝｢繝ｼ繝峨↑縺ｮ縺ｧ譛蛻昴・蛟呵｣懊ｒ逶ｴ謗･繝｡繝・そ繝ｼ繧ｸ谺・↓險ｭ螳・        const candidate = data.candidates[0];
        console.log('蛟呵｣懊ｒ繝｡繝・そ繝ｼ繧ｸ谺・↓險ｭ螳・', candidate);
        if (candidate && candidate.trim()) {
          setMessage(candidate);
        } else {
          console.error('蛟呵｣懊′遨ｺ縺ｧ縺・);
        }
      }
    } catch (error) {
      console.error('User inspiration error:', error);
    } finally {
      setIsLoadingUserInspiration(false);
    }
  };

  // 繝ｦ繝ｼ繧ｶ繝ｼ譁・ｫ蠑ｷ蛹門ｮ溯｡・  const handleUserTextEnhancement = async () => {
    if (!message.trim() || !currentCharacter) return;
    
    setIsEnhancingUserText(true);
    
    try {
      console.log('繧ｭ繝ｩ繧ｭ繝ｩ繝懊ち繝ｳ縺梧款縺輔ｌ縺ｾ縺励◆');
      console.log('險ｭ螳壹・API繧ｭ繝ｼ:', settings.geminiApiKey ? '險ｭ螳壽ｸ医∩' : '譛ｪ險ｭ螳・);
      const response = await fetch('/api/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          character: currentCharacter,
          context: messages.slice(-5),
          variantCount: 1, // 1譛ｬ繝｢繝ｼ繝・          settings: settings,
          isUserText: true // 繝ｦ繝ｼ繧ｶ繝ｼ繝・く繧ｹ繝亥ｼｷ蛹悶ヵ繝ｩ繧ｰ
        })
      });
      
      const data = await response.json();
      console.log('蠑ｷ蛹泡PI蠢懃ｭ・', data);
      if (data.success) {
        console.log('蠑ｷ蛹悶＆繧後◆繝・く繧ｹ繝・', data.enhancedText);
        setMessage(data.enhancedText);
      }
    } catch (error) {
      console.error('User text enhancement error:', error);
    } finally {
      setIsEnhancingUserText(false);
    }
  };

  // 譁・ｫ驕ｸ謚槭ワ繝ｳ繝峨Λ繝ｼ
  const handleTextSelection = (messageId: string) => {
    // AI繝｡繝・そ繝ｼ繧ｸ縺ｮ遽・峇驕ｸ謚樊凾縺ｯ蠑ｷ蛹悶・繧ｿ繝ｳ繧定｡ｨ遉ｺ縺励↑縺・ｼ医さ繝斐・髦ｻ螳ｳ髦ｲ豁｢・・    const targetMessage = messages.find(m => m.id === messageId);
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

    // 驕ｸ謚樔ｽ咲ｽｮ繧貞叙蠕・    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setSelectedText(selectedText);
    setSelectedMessageId(messageId);
    setEnhanceButtonPosition({
      x: rect.right + 10,
      y: rect.top + window.scrollY - 10
    });
    setShowEnhanceButton(true);
  };

  // 譁・ｫ蠑ｷ蛹門ｮ溯｡・  const handleTextEnhancement = async () => {
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
          variantCount: 1, // 1譛ｬ繝｢繝ｼ繝・          settings: settings
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setEnhancementResult({
          originalText: data.originalText,
          enhancedText: data.enhancedText,
          messageId: selectedMessageId
        });
        setShowEnhancementModal(true);
      }
    } catch (error) {
      console.error('Enhancement error:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  // 蠑ｷ蛹悶＆繧後◆譁・ｫ繧帝←逕ｨ
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

  // 驕ｸ謚櫁ｧ｣髯､繝上Φ繝峨Λ繝ｼ
  const handleDocumentClick = () => {
    setShowEnhanceButton(false);
  };

  // 繝峨く繝･繝｡繝ｳ繝医け繝ｪ繝・け繧､繝吶Φ繝育匳骭ｲ
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

  // 蜀咲函謌先ｩ溯・
  const handleRegenerate = async () => {
    if (!currentCharacter || isLoading || messages.length === 0) return;
    
    // 譛蠕後・AI繝｡繝・そ繝ｼ繧ｸ繧貞炎髯､
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;
    
    const messagesWithoutLast = messages.slice(0, -1);
    setMessages(messagesWithoutLast);
    setIsLoading(true);
    if (settings.enableImageGeneration) setIsGeneratingImage(true);

    try {
      // 譛蠕後・繝ｦ繝ｼ繧ｶ繝ｼ繝｡繝・そ繝ｼ繧ｸ繧貞叙蠕・      const lastUserMessage = messagesWithoutLast.filter(m => m.role === 'user').pop();
      if (!lastUserMessage) return;

      // 莨夊ｩｱ螻･豁ｴ縺九ｉ譛蠕後・繝ｦ繝ｼ繧ｶ繝ｼ繝｡繝・そ繝ｼ繧ｸ繧帝勁螟悶＠縺ｦ繧ｳ繝ｳ繝・く繧ｹ繝医ｒ菴懈・
      const conversationContext = messagesWithoutLast
        .filter((m) => m.id !== lastUserMessage.id)
        .slice(-20); // 逶ｴ霑・0莉ｶ

      // API繧貞他縺ｳ蜃ｺ縺励※譁ｰ縺励＞蠢懃ｭ斐ｒ逕滓・・磯㍾隍・∽ｿ｡繧帝亟豁｢・・      const chatResponse = await fetch('/api/simple-chat', {
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

        // 逕ｻ蜒冗函謌・        if (settings.enableImageGeneration) {
          handleImageGeneration(aiResponse, aiContent);
        }
      }
    } catch (error) {
      console.error('Regenerate error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 莨夊ｩｱ繝ｪ繧ｻ繝・ヨ讖溯・
  const handleReset = () => {
    if (!currentCharacter) return;
    
    console.log('莨夊ｩｱ繝ｪ繧ｻ繝・ヨ:', currentCharacter.name);
    
    // 髻ｳ螢ｰ蜀咲函繧貞●豁｢
    VoiceManager.stopAudio();
    
    const firstMessage = Array.isArray(currentCharacter.first_message) 
      ? currentCharacter.first_message.join('\n') 
      : (currentCharacter.first_message || '縺薙ｓ縺ｫ縺｡縺ｯ・・);
      
    console.log('繝ｪ繧ｻ繝・ヨ蠕後・蛻晏屓繝｡繝・そ繝ｼ繧ｸ:', firstMessage);
    
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: firstMessage,
      timestamp: Date.now()
    }]);
  };

  // 謖・ｮ壹Γ繝・そ繝ｼ繧ｸ縺ｾ縺ｧ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ
  const handleRollback = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    setMessages(messages.slice(0, messageIndex + 1));
  };

  // 螻･豁ｴ蜑企勁
  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // 螻･豁ｴ驕ｸ謚槭・繧ｯ繝ｪ繝・け繧､繝吶Φ繝医ｒ髦ｻ豁｢
    
    if (!confirm('縺薙・螻･豁ｴ繧貞炎髯､縺励∪縺吶°・・)) return;
    
    try {
      await historyManager.deleteSession(sessionId);
      const updatedSessions = await historyManager.getAllSessions();
      setSessions(updatedSessions);
      
      // 蜑企勁縺励◆螻･豁ｴ縺檎樟蝨ｨ驕ｸ謚樔ｸｭ縺ｮ蝣ｴ蜷医・繝ｪ繧ｻ繝・ヨ
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
      console.error('螻･豁ｴ蜑企勁繧ｨ繝ｩ繝ｼ:', error);
      alert('螻･豁ｴ縺ｮ蜑企勁縺ｫ螟ｱ謨励＠縺ｾ縺励◆');
    }
  };

  // 繝・・繝槫､画峩繝上Φ繝峨Λ繝ｼ
  const handleThemeChange = (themeId: string, customBackground?: string) => {
    const theme = getThemeById(themeId) || getDefaultTheme();
    ThemeManager.applyTheme(theme, customBackground);
    
    // 險ｭ螳壹↓菫晏ｭ・    const updatedSettings = {
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

  // 逕ｻ蜒上・縺ｿ蜀咲函謌撰ｼ医Λ繝ｳ繝繝繧ｷ繝ｼ繝会ｼ・  const handleImageReroll = async (msg: Message) => {
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

  // 繝√Ε繝・ヨ繝舌ヶ繝ｫ縺ｮ繧ｳ繝斐・蜃ｦ逅・  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('繧ｳ繝斐・縺励∪縺励◆');
      });
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('繧ｳ繝斐・縺励∪縺励◆');
    }
  };

  return (
      <div ref={mainContainerRef} className="flex h-screen theme-background relative">
      {/* 繝｢繝舌う繝ｫ逕ｨ繧ｪ繝ｼ繝舌・繝ｬ繧､ */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* 繧ｵ繧､繝峨ヰ繝ｼ */}
      <div className={`
        ${isSidebarOpen ? 'w-80' : 'w-0'} 
        theme-sidebar border-r border-white/10 flex flex-col h-screen transition-all duration-300 md:overflow-hidden overflow-y-auto scroll-touch
        ${isSidebarOpen ? 'fixed md:relative z-50' : 'relative'}
        ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}
      `}>
            {/* Navigation Buttons */}
            <div className="p-4 border-b border-white/10">
              <NavigationButtons />
            </div>
        <div className="min-w-80 flex flex-col h-full">
          {/* 繧ｿ繝悶リ繝薙ご繝ｼ繧ｷ繝ｧ繝ｳ */}
          <div className="flex-shrink-0 border-b border-white/10">
            <div className="flex">
              <button
                onClick={() => setActiveTab('characters')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'characters' 
                    ? 'theme-text-primary border-b-2 border-blue-400 bg-white/5' 
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-white/5'
                }`}
              >
                側 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ
              </button>
              <button
                onClick={() => setActiveTab('personas')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'personas' 
                    ? 'theme-text-primary border-b-2 border-blue-400 bg-white/5' 
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-white/5'
                }`}
              >
                鹿 繝壹Ν繧ｽ繝・              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'settings' 
                    ? 'theme-text-primary border-b-2 border-blue-400 bg-white/5' 
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-white/5'
                }`}
              >
                笞呻ｸ・險ｭ螳・              </button>
            </div>
        </div>

          {/* 繧ｿ繝悶さ繝ｳ繝・Φ繝・*/}
          <div className="flex-1 overflow-hidden">
            {/* 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧ｿ繝・*/}
            {activeTab === 'characters' && (
              <div className="h-full flex flex-col">
          <CharacterSelector
          characters={allCharacters}
          currentCharacter={currentCharacter}
          onSelectCharacter={(character: Character) => {
            console.log('繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ螟画峩:', character.name);
            
            // 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧定ｨｭ螳・            setCurrentCharacter(character);
            
            // 迴ｾ蝨ｨ縺ｮ繧ｻ繝・す繝ｧ繝ｳ繧偵け繝ｪ繧｢
            setCurrentSessionId(null);
            
            // 髻ｳ螢ｰ蜀咲函繧貞●豁｢
            VoiceManager.stopAudio();
            
            // 譁ｰ縺励＞繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ縺ｮ蛻晏屓繝｡繝・そ繝ｼ繧ｸ繧定ｨｭ螳・            const firstMessage = Array.isArray(character.first_message) 
              ? character.first_message.join('\n') 
              : (character.first_message || '縺薙ｓ縺ｫ縺｡縺ｯ・・);
              
            console.log('蛻晏屓繝｡繝・そ繝ｼ繧ｸ險ｭ螳・', firstMessage);
            
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
            if (confirm(`縲・{character.name}縲阪ｒ蜑企勁縺励∪縺吶°・歔)) {
              CharacterLoader.deleteCharacter(character.name);
              const updatedCharacters = CharacterLoader.getAllCharacters();
              setAllCharacters(updatedCharacters);
              
              // 蜑企勁縺励◆繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ縺檎樟蝨ｨ驕ｸ謚樔ｸｭ縺ｮ蝣ｴ蜷・              if (currentCharacter?.name === character.name) {
                const firstCharacter = updatedCharacters[0];
                if (firstCharacter) {
                  console.log('蜑企勁蠕後・莉｣譖ｿ繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ:', firstCharacter.name);
                  setCurrentCharacter(firstCharacter);
                  setCurrentSessionId(null);
                  
                  const firstMessage = Array.isArray(firstCharacter.first_message) 
                    ? firstCharacter.first_message.join('\n') 
                    : (firstCharacter.first_message || '縺薙ｓ縺ｫ縺｡縺ｯ・・);
                    
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

            {/* 繝壹Ν繧ｽ繝翫ち繝・*/}
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
                    if (confirm(`縲・{persona.name}縲阪ｒ蜑企勁縺励∪縺吶°・歔)) {
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

            {/* 險ｭ螳壹ち繝・*/}
            {activeTab === 'settings' && (
              <div className="h-full flex flex-col p-4 space-y-2">
                {/* 髮ｻ逅・ｼ医う繝ｳ繧ｹ繝斐Ξ繝ｼ繧ｷ繝ｧ繝ｳ・峨・繧ｿ繝ｳ */}
                <button
                  onClick={handleUserInspiration}
                  disabled={isLoadingUserInspiration || !currentCharacter}
                  className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-3 px-4 rounded-lg hover:bg-white/15 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  title="霑比ｿ｡蛟呵｣懊ｒ謠先｡・
                >
                  庁
                  繧､繝ｳ繧ｹ繝斐Ξ繝ｼ繧ｷ繝ｧ繝ｳ
                </button>
                
                {/* 繧ｭ繝ｩ繧ｭ繝ｩ・域枚遶蠑ｷ蛹厄ｼ峨・繧ｿ繝ｳ */}
                <button
                  onClick={handleUserTextEnhancement}
                  disabled={isEnhancingUserText || !message.trim() || !currentCharacter}
                  className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-3 px-4 rounded-lg hover:bg-white/15 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  title="譁・ｫ繧貞ｼｷ蛹・
                >
                  笨ｨ
                  譁・ｫ蠑ｷ蛹・                </button>
                
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-3 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
                >
                  <Cloud size={16} />
                  繧ｯ繝ｩ繧ｦ繝牙酔譛・                </button>
                <button 
                  onClick={() => setIsThemeModalOpen(true)}
                  className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-3 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
                >
                  <Palette size={16} />
                  繝・・繝槫､画峩
                </button>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full bg-white/10 backdrop-blur-sm theme-text-primary py-3 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings size={16} />
                  險ｭ螳・                </button>
              </div>
            )}
          </div>
        </div>

        {/* 繝｢繝舌う繝ｫ逕ｨ繧ｯ繧､繝・け謫堺ｽ懶ｼ郁ｨｭ螳壹・繝・・繝槭・蜷梧悄・・*/}
        <div className="p-4 border-t border-white/10 flex-shrink-0 space-y-2 md:hidden">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="touch-target w-full bg-white/10 backdrop-blur-sm theme-text-primary py-3 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <Cloud size={16} />
            繧ｯ繝ｩ繧ｦ繝牙酔譛・          </button>
          <button 
            onClick={() => setIsThemeModalOpen(true)}
            className="touch-target w-full bg-white/10 backdrop-blur-sm theme-text-primary py-3 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <Palette size={16} />
            繝・・繝・          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="touch-target w-full bg-white/10 backdrop-blur-sm theme-text-primary py-3 px-4 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <Settings size={16} />
            險ｭ螳・          </button>
        </div>

        {/* 繝√Ε繝・ヨ螻･豁ｴ */}
        <div className="flex-1 flex flex-col min-h-0 safe-area-bottom">
          <div className="p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="theme-text-primary font-semibold flex items-center gap-2">
                <MessageSquare size={20} />
                繝√Ε繝・ヨ螻･豁ｴ
                <span className="bg-white/20 text-white/80 px-2 py-1 rounded-full text-xs">
                  {sessions.length}
                </span>
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsChatHistoryOpen(true)}
                  className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="螻･豁ｴ繧ｮ繝｣繝ｩ繝ｪ繝ｼ"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => {
                    console.log('譁ｰ縺励＞繝√Ε繝・ヨ髢句ｧ・);
                    setCurrentSessionId(null);
                  
                  // 髻ｳ螢ｰ蜀咲函繧貞●豁｢
                  VoiceManager.stopAudio();
                  
                  if (currentCharacter) {
                    const firstMessage = Array.isArray(currentCharacter.first_message) 
                      ? currentCharacter.first_message.join('\n') 
                      : (currentCharacter.first_message || '縺薙ｓ縺ｫ縺｡縺ｯ・・);
                    
                    console.log('譁ｰ縺励＞繝√Ε繝・ヨ縺ｮ蛻晏屓繝｡繝・そ繝ｼ繧ｸ:', firstMessage);
                    
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
                className="touch-target theme-text-secondary hover:theme-text-primary p-2 rounded hover:bg-white/10 transition-colors"
                title="譁ｰ縺励＞繝√Ε繝・ヨ"
              >
                <Plus size={16} />
              </button>
              </div>
            </div>
          </div>
          
          {/* 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ蜿ｯ閭ｽ縺ｪ螻･豁ｴ繧ｨ繝ｪ繧｢ */}
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
                    console.error('繧ｻ繝・す繝ｧ繝ｳ隱ｭ縺ｿ霎ｼ縺ｿ繧ｨ繝ｩ繝ｼ:', error);
                  }
                }}
                className={`group bg-white/10 backdrop-blur-sm rounded-lg p-3 cursor-pointer hover:bg-white/15 transition-all duration-200 relative ${
                  currentSessionId === session.id ? 'ring-2 ring-blue-400 bg-blue-400/20' : ''
                } hover:shadow-lg hover:scale-[1.02]`}
              >
                {/* 蜑企勁繝懊ち繝ｳ */}
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/50 hover:text-red-400 hover:bg-red-500/20 rounded-full p-1"
                  title="螻･豁ｴ繧貞炎髯､"
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
                      笳・迴ｾ蝨ｨ
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* 螻･豁ｴ縺悟､壹＞蝣ｴ蜷医・陦ｨ遉ｺ蛻ｶ髯宣夂衍 */}
            {sessions.length > 50 && (
              <div className="text-white/40 text-xs text-center py-2 px-3 bg-white/5 rounded-lg">
                譛譁ｰ50莉ｶ繧定｡ｨ遉ｺ荳ｭ (蜈ｨ{sessions.length}莉ｶ)
              </div>
            )}
            
            {sessions.length === 0 && (
              <div className="text-white/50 text-sm text-center py-8">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                縺ｾ縺螻･豁ｴ縺後≠繧翫∪縺帙ｓ
                <p className="text-xs mt-1 text-white/40">
                  譛蛻昴・繝｡繝・そ繝ｼ繧ｸ繧帝∽ｿ｡縺吶ｋ縺ｨ螻･豁ｴ縺御ｽ懈・縺輔ｌ縺ｾ縺・                </p>
              </div>
            )}
        </div>
        </div>
      </div>

      {/* 繝｡繧､繝ｳ繝√Ε繝・ヨ繧ｨ繝ｪ繧｢ */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {/* 繝倥ャ繝繝ｼ */}
        <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4 safe-area-top">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="touch-target theme-text-primary hover:bg-white/10 p-2 rounded-lg transition-colors"
              title={isSidebarOpen ? '繧ｵ繧､繝峨ヰ繝ｼ繧帝哩縺倥ｋ' : '繧ｵ繧､繝峨ヰ繝ｼ繧帝幕縺・}
            >
              <Menu size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setIsCharacterGalleryOpen(true)}
                className="text-left w-full"
              >
                <h3 className="text-white font-semibold truncate hover:text-blue-200 transition-colors">
                  {currentCharacter?.name || '繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ'}
                </h3>
                <p className="text-white/70 text-sm truncate">{currentCharacter?.tags[0] || '闊ｪ豬ｷ螢ｫ'}</p>
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="touch-target theme-text-primary hover:bg-white/10 p-2 rounded-lg transition-colors md:hidden"
                title="險ｭ螳・
              >
                <Settings size={18} />
              </button>
              <button
                onClick={() => setIsThemeModalOpen(true)}
                className="touch-target theme-text-primary hover:bg-white/10 p-2 rounded-lg transition-colors md:hidden"
                title="繝・・繝・
              >
                <Palette size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 繝√Ε繝・ヨ繝｡繝・そ繝ｼ繧ｸ繧ｨ繝ｪ繧｢ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-touch">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' ? (
                <div className="max-w-2xl w-full">
                  {/* 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ逕ｻ蜒・*/}
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
                  
                  {/* 繝｡繝・そ繝ｼ繧ｸ繝舌ヶ繝ｫ */}
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
                       {/* 繝・せ繧ｯ繝医ャ繝礼畑繝｡繝｢繝懊ち繝ｳ */}
                       <div className="hidden md:block">
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
                         title="蜀咲函謌・
                       >
                         <RefreshCw size={16} />
                       </button>
                       <button 
                         onClick={() => handleRollback(msg.id)}
                         className="touch-target text-gray-500 hover:text-gray-700 p-1 rounded"
                         title="縺薙％縺ｾ縺ｧ謌ｻ繧・
                       >
                         <CornerUpLeft size={16} />
                       </button>
                       {settings.enableImageGeneration && (
                       <button
                         onClick={() => handleImageReroll(msg)}
                         className="touch-target text-yellow-500 hover:text-yellow-700 p-1 rounded"
                         title="逕ｻ蜒上ｒ繝ｩ繝ｳ繝繝繧ｷ繝ｼ繝峨〒蜀咲函謌・
                       >
                         軸
                       </button>
                       )}
                       {/* 繧ｳ繝斐・ */}
                       <button
                         onClick={() => handleCopy(msg.content)}
                         className="touch-target text-gray-500 hover:text-blue-600 p-1 rounded"
                         title="繧ｳ繝斐・"
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
                    <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>
                    {/* 繧ｳ繝斐・ */}
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="touch-target text-white/80 hover:text-blue-200 p-1 rounded"
                        title="繧ｳ繝斐・"
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

        {/* 蜈･蜉帙お繝ｪ繧｢ */}
        <div className="p-4 bg-black/30 backdrop-blur-sm border-t border-white/10 safe-area-bottom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              {/* 繧｢繧ｹ繧ｿ繝ｪ繧ｹ繧ｯ繝懊ち繝ｳ・亥・蜉帶棧縺ｮ蜑肴婿・・*/}
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const newValue = message.substring(0, start) + '*' + message.substring(end);
                    setMessage(newValue);
                    
                    // 繧ｫ繝ｼ繧ｽ繝ｫ菴咲ｽｮ繧呈峩譁ｰ
                    setTimeout(() => {
                      textarea.setSelectionRange(start + 1, start + 1);
                      textarea.focus();
                    }, 0);
                  }
                }}
                className="touch-target text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors text-white/70 hover:text-white"
                title="繧｢繧ｹ繧ｿ繝ｪ繧ｹ繧ｯ繧定ｿｽ蜉"
              >
                *
              </button>
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="繝｡繝・そ繝ｼ繧ｸ繧貞・蜉・.."
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
                  title={isInputExpanded ? '蜈･蜉帶ｬ・ｒ邵ｮ蟆・ : '蜈･蜉帶ｬ・ｒ諡｡螟ｧ'}
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
              {/* 髻ｳ螢ｰ繧ｪ繝ｳ/繧ｪ繝・*/}
              <button
                onClick={() => {
                  const newSettings = { ...settings, voiceEnabled: !settings.voiceEnabled };
                  setSettings(newSettings);
                  localStorage.setItem('ai-chat-settings', JSON.stringify(newSettings));
                  
                  if (newSettings.voiceEnabled && newSettings.elevenLabsApiKey) {
                    VoiceManager.setApiKey(newSettings.elevenLabsApiKey);
                  }
                }}
                className={`text-lg p-2 rounded-full backdrop-blur-sm transition-colors ${settings.voiceEnabled ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-500 text-white/70 hover:bg-gray-600'}`}
                title={settings.voiceEnabled ? '髻ｳ螢ｰOFF' : '髻ｳ螢ｰON'}
              >
                {settings.voiceEnabled ? '矧' : '這'}
              </button>
              
              {/* 逕ｻ蜒冗函謌・*/}
              <button
                onClick={() => {
                  const newSettings = { ...settings, enableImageGeneration: !settings.enableImageGeneration };
                  setSettings(newSettings);
                  localStorage.setItem('ai-chat-settings', JSON.stringify(newSettings));
                }}
                className={`text-lg p-2 rounded-full backdrop-blur-sm transition-colors ${settings.enableImageGeneration ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-500 text-white/70 hover:bg-gray-600'}`}
                title={settings.enableImageGeneration ? '逕ｻ蜒冗函謌唇FF' : '逕ｻ蜒冗函謌唇N'}
              >
                {settings.enableImageGeneration ? '名・・ : '胴'}
              </button>
              
              {/* 繝｡繝｢荳隕ｧ */}
              <button
                onClick={() => {
                  // MemoListButton縺ｮ讖溯・繧堤峩謗･螳溯｡・                  const memoListButton = document.querySelector('[data-memo-list-button]') as HTMLButtonElement;
                  if (memoListButton) memoListButton.click();
                }}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors text-white/70 hover:text-white"
                title="繝｡繝｢荳隕ｧ"
              >
                統
              </button>
              
              {/* 隕∫ｴ・*/}
              <button 
                onClick={handleGenerateSummary}
                disabled={isLoading || messages.length < 3}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 text-white/70 hover:text-white"
                title="莨夊ｩｱ隕∫ｴ・ｒ逕滓・"
              >
                搭
              </button>
              
              {/* 蠑ｷ蛹悶う繝ｳ繝励Ξ繝・す繝ｧ繝ｳ */}
              <button
                onClick={handleGenerateEnhancedImpression}
                disabled={isGeneratingImpression || messages.length < 3}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 text-pink-400 hover:text-pink-300"
                title="莨夊ｩｱ繧､繝ｳ繝励Ξ繝・す繝ｧ繝ｳ・・隕也せ・・
              >
                猪
              </button>
              
              {/* 蜀咲函謌・*/}
              <button 
                onClick={handleRegenerate}
                disabled={isLoading || messages.length === 0}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 text-white/70 hover:text-white"
                title="蜀咲函謌・
              >
                売
              </button>
              
              {/* 莨夊ｩｱ繝ｪ繧ｻ繝・ヨ */}
              <button 
                onClick={handleReset}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors text-white/70 hover:text-white"
                title="莨夊ｩｱ繝ｪ繧ｻ繝・ヨ"
              >
                卵・・              </button>
              
              {/* 邯壹″ */}
              <button 
                onClick={handleContinue}
                disabled={isLoading || messages.length === 0}
                className="text-lg p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50 text-white/70 hover:text-white"
                title="邯壹″繧堤函謌・
              >
                笆ｶ・・              </button>
              

              
              {/* 髱櫁｡ｨ遉ｺ縺ｮMemoListButton・域ｩ溯・逕ｨ・・*/}
              <div className="hidden">
                <MemoListButton currentCharacterId={currentCharacter?.name} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 豬ｮ蜍募ｼｷ蛹悶・繧ｿ繝ｳ */}
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
          {isEnhancing ? <Loader size={14} className="animate-spin" /> : '笨ｨ'}
          蠑ｷ蛹・        </button>
      )}

      {/* 譁・ｫ蠑ｷ蛹也ｵ先棡繝｢繝ｼ繝繝ｫ */}
      {showEnhancementModal && enhancementResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                笨ｨ 譁・ｫ蠑ｷ蛹也ｵ先棡
              </h2>
              <button
                onClick={() => setShowEnhancementModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                笨・              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  蜈・・譁・ｫ
                </h3>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded border">
                  {enhancementResult?.originalText || ''}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  蠑ｷ蛹悶＆繧後◆譁・ｫ
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
                繧ｭ繝｣繝ｳ繧ｻ繝ｫ
              </button>
              <button
                onClick={applyEnhancement}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
              >
                驕ｩ逕ｨ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧ｮ繝｣繝ｩ繝ｪ繝ｼ */}
      {isCharacterGalleryOpen && (
        <CharacterGallery
          characters={allCharacters}
          currentCharacter={currentCharacter}
          onSelectCharacter={(character: Character) => {
            setCurrentCharacter(character);
            setIsCharacterGalleryOpen(false);
            // 譁ｰ縺励＞繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ縺ｧ繧ｻ繝・す繝ｧ繝ｳ繧帝幕蟋・            setCurrentSessionId(null);
            setMessages([{
              id: '1',
              role: 'assistant',
              content: Array.isArray(character.first_message) 
                ? character.first_message.join('\n') 
                : (character.first_message || '縺薙ｓ縺ｫ縺｡縺ｯ・・),
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
            if (confirm(`縲・{character.name}縲阪ｒ蜑企勁縺励∪縺吶°・歔)) {
              // 蜑企勁蜃ｦ逅・ｼ亥ｮ溯｣・ｺ亥ｮ夲ｼ・              console.log('繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ蜑企勁:', character.name);
            }
          }}
          onImportExport={() => {
            setIsCharacterGalleryOpen(false);
            setIsImportExportOpen(true);
          }}
          onClose={() => setIsCharacterGalleryOpen(false)}
        />
      )}

      {/* 繝√Ε繝・ヨ螻･豁ｴ繧ｮ繝｣繝ｩ繝ｪ繝ｼ */}
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
                  : (currentCharacter.first_message || '縺薙ｓ縺ｫ縺｡縺ｯ・・);
                
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

      {/* 蠑ｷ蛹悶＆繧後◆繧､繝ｳ繝励Ξ繝・す繝ｧ繝ｳ繝｢繝ｼ繝繝ｫ */}
      <EnhancedImpressionModal
        isOpen={isEnhancedImpressionOpen}
        onClose={() => setIsEnhancedImpressionOpen(false)}
        impressions={currentImpressions}
        isLoading={isGeneratingImpression}
        onRegenerate={handleGenerateEnhancedImpression}
        characterName={currentCharacter?.name}
      />

      {/* 險ｭ螳壹Δ繝ｼ繝繝ｫ */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          // 荳崎ｶｳ縺励※縺・ｋ繝励Ο繝代ユ繧｣繧定｣懷ｮ後＠縺､縺､譖ｴ譁ｰ
          setSettings(prev => ({ ...prev, ...newSettings }));

          const mergedSettings = { ...settings, ...newSettings };

          // 繝ｭ繝ｼ繧ｫ繝ｫ繧ｹ繝医Ξ繝ｼ繧ｸ縺ｫ菫晏ｭ・          localStorage.setItem('ai-chat-settings', JSON.stringify(mergedSettings));

          // ElevenLabs API繧ｭ繝ｼ繧貞叉蠎ｧ縺ｫ險ｭ螳・          if (mergedSettings.elevenLabsApiKey) {
            VoiceManager.setApiKey(mergedSettings.elevenLabsApiKey);
          }
        }}
      />

      {/* 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繝｢繝ｼ繝繝ｫ */}
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
          
          // 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ荳隕ｧ繧呈峩譁ｰ
          const updatedCharacters = CharacterLoader.getAllCharacters();
          setAllCharacters(updatedCharacters);
          
          // 譁ｰ隕丈ｽ懈・縺ｾ縺溘・邱ｨ髮・ｸｭ縺ｮ繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧帝∈謚・          setCurrentCharacter(character);
          setCurrentSessionId(null);
          
          const firstMessage = Array.isArray(character.first_message) 
            ? character.first_message.join('\n') 
            : (character.first_message || '縺薙ｓ縺ｫ縺｡縺ｯ・・);
            
          console.log('菫晏ｭ伜ｾ後・繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ驕ｸ謚・', character.name, firstMessage);
          
          setMessages([{
            id: crypto.randomUUID(),
            role: 'assistant',
            content: firstMessage,
            timestamp: Date.now()
          }]);
        }}
      />

      {/* Persona繝｢繝ｼ繝繝ｫ */}
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
          
          // 譁ｰ隕丈ｽ懈・縺ｾ縺溘・邱ｨ髮・＠縺蘖ersona繧帝∈謚・          setCurrentPersona(persona);
        }}
      />

      {/* 繧､繝ｳ繝昴・繝・繧ｨ繧ｯ繧ｹ繝昴・繝医Δ繝ｼ繝繝ｫ */}
      <CharacterImportExport
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        allCharacters={allCharacters}
        onImport={(importedCharacters: Character[]) => {
          // 繧､繝ｳ繝昴・繝医＆繧後◆繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧定ｿｽ蜉
          importedCharacters.forEach((character: Character) => {
            CharacterLoader.addCharacter(character);
          });          
          // 繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ荳隕ｧ繧呈峩譁ｰ
          const updatedCharacters = CharacterLoader.getAllCharacters();
          setAllCharacters(updatedCharacters);
        }}
      />

      {/* 莨夊ｩｱ隕∫ｴ・Δ繝ｼ繝繝ｫ */}
      <ChatSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summary={currentSummary}
        isLoading={isGeneratingSummary}
        sessionTitle={currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || '譁ｰ縺励＞繝√Ε繝・ヨ' : '譁ｰ縺励＞繝√Ε繝・ヨ'}
        characterName={currentCharacter?.name || 'AI'}
        onSaveSummary={(summary) => {
          // 隕∫ｴ・ｿ晏ｭ俶ｩ溯・・亥ｾ後〒螳溯｣・庄閭ｽ・・          console.log('Summary saved:', summary);
        }}
      />

      {/* 繝・・繝槭Δ繝ｼ繝繝ｫ */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={settings.currentTheme}
        customBackground={settings.customBackground}
        onThemeChange={handleThemeChange}
      />

      {/* 隱崎ｨｼ繝ｻ繧ｯ繝ｩ繧ｦ繝牙酔譛溘Δ繝ｼ繝繝ｫ */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onDataSync={(syncedData) => {
          // 蜷梧悄縺輔ｌ縺溘ョ繝ｼ繧ｿ繧貞渚譏
          setAllCharacters(syncedData.characters)
          setAllPersonas(syncedData.personas)
          setSettings(syncedData.settings)
          // 繝｡繝｢繝・・繧ｿ繧ょ渚譏・・hatStore繧剃ｽｿ逕ｨ・・          localStorage.setItem('ai-chat-characters', JSON.stringify(syncedData.characters))
          localStorage.setItem('ai-chat-personas', JSON.stringify(syncedData.personas))
          localStorage.setItem('ai-chat-settings', JSON.stringify(syncedData.settings))
        }}
      />

      {/* 繧､繝ｳ繧ｹ繝斐Ξ繝ｼ繧ｷ繝ｧ繝ｳ蛟呵｣憺∈謚槭Δ繝ｼ繝繝ｫ */}
      <InspirationModal
        isOpen={showInspiration}
        candidates={inspirationCandidates}
        onSelect={(selectedText: string) => {
          // 驕ｸ謚槭＠縺溷呵｣懊ｒ繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ縺ｮ霑比ｿ｡縺ｨ縺励※遒ｺ螳・          const aiResponse: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: selectedText,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, aiResponse]);
          setShowInspiration(false);
          setInspirationCandidates([]);
          
          // 騾夂衍髻ｳ繧貞・逕・          if (settings.chatNotificationSound) {
            VoiceManager.playNotificationSound(true, 0.3);
          }
          
          // 逕ｻ蜒冗函謌撰ｼ亥ｿ・ｦ√↑蝣ｴ蜷茨ｼ・          if (settings.enableImageGeneration) {
            handleImageGeneration(aiResponse, selectedText);
          }
        }}
        onClose={() => {
          setShowInspiration(false);
          setInspirationCandidates([]);
        }}
      />

      {/* 繝ｦ繝ｼ繧ｶ繝ｼ繧､繝ｳ繧ｹ繝斐Ξ繝ｼ繧ｷ繝ｧ繝ｳ蛟呵｣憺∈謚槭Δ繝ｼ繝繝ｫ */}
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

      {/* Persona繧､繝ｳ繝昴・繝・繧ｨ繧ｯ繧ｹ繝昴・繝医Δ繝ｼ繝繝ｫ */}
      <PersonaImportExport
        isOpen={isPersonaImportExportOpen}
        onClose={() => setIsPersonaImportExportOpen(false)}
        allPersonas={allPersonas}
        onImport={(importedPersonas: UserPersona[]) => {
          // 繧､繝ｳ繝昴・繝医＆繧後◆Persona繧定ｿｽ蜉
          const updatedPersonas = [...allPersonas];
          importedPersonas.forEach((importedPersona: UserPersona) => {
            // 譌｢蟄倥・Persona縺ｨ驥崎､・メ繧ｧ繝・け・・D縺ｾ縺溘・蜷榊燕・・            const existingIndex = updatedPersonas.findIndex(p => p.id === importedPersona.id || p.name === importedPersona.name);
            if (existingIndex >= 0) {
              // 譌｢蟄倥・Persona繧呈峩譁ｰ
              updatedPersonas[existingIndex] = importedPersona;
            } else {
              // 譁ｰ縺励＞Persona繧定ｿｽ蜉
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


