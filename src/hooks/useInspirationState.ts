/**
 * インスピレーション機能の状態管理フック
 */
import { useState } from 'react';
import { ChatImpression } from './useChatState';

export function useInspirationState() {
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

  // Enhanced Impression関連
  const [isEnhancedImpressionOpen, setIsEnhancedImpressionOpen] = useState(false);
  const [currentImpressions, setCurrentImpressions] = useState<ChatImpression[]>([]);
  const [isGeneratingImpression, setIsGeneratingImpression] = useState(false);

  return {
    // インスピレーション
    showInspiration,
    setShowInspiration,
    inspirationCandidates,
    setInspirationCandidates,
    showUserInspiration,
    setShowUserInspiration,
    userInspirationCandidates,
    setUserInspirationCandidates,
    showInspirationCandidates,
    setShowInspirationCandidates,
    isLoadingUserInspiration,
    setIsLoadingUserInspiration,

    // 文章強化
    isEnhancingUserText,
    setIsEnhancingUserText,
    selectedText,
    setSelectedText,
    selectedMessageId,
    setSelectedMessageId,
    showEnhanceButton,
    setShowEnhanceButton,
    enhanceButtonPosition,
    setEnhanceButtonPosition,
    isEnhancing,
    setIsEnhancing,
    enhancementResult,
    setEnhancementResult,
    showEnhancementModal,
    setShowEnhancementModal,

    // アニメーション
    sendButtonClicked,
    setSendButtonClicked,
    bulbButtonClicked,
    setBulbButtonClicked,
    sparkleButtonClicked,
    setSparkleButtonClicked,

    // Enhanced Impression
    isEnhancedImpressionOpen,
    setIsEnhancedImpressionOpen,
    currentImpressions,
    setCurrentImpressions,
    isGeneratingImpression,
    setIsGeneratingImpression
  };
}