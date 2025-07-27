// 🔧 既存のハートボタン統合パッチ
// ファイル: components/ChatInputArea.tsx (enhanced)

'use client';

import { useState } from 'react';
import { Heart, Send, Plus } from 'lucide-react';
import EnhancedImpressionModal from './EnhancedImpressionModal';
import InnerHeartModal from './InnerHeartModal';

interface InnerHeartImpression {
  title: string;
  content: string;
  perspective: string;
  emotionalDepth: number;
  hiddenEmotion: string;
  innerThought: string;
  wordCount: number;
}

interface ChatInputAreaProps {
  // 既存のprops...
  messages: any[];
  currentCharacter: any;
  sessionTitle: string;
}

export default function ChatInputArea({ 
  messages, 
  currentCharacter, 
  sessionTitle,
  // ...その他の既存props 
}: ChatInputAreaProps) {
  // 既存のstate...
  const [showImpressionModal, setShowImpressionModal] = useState(false);
  const [showInnerHeartModal, setShowInnerHeartModal] = useState(false);
  const [impressions, setImpressions] = useState([]);
  const [innerHeartImpressions, setInnerHeartImpressions] = useState<InnerHeartImpression[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInnerHeartLoading, setIsInnerHeartLoading] = useState(false);

  // 📝 既存のimpression生成（3視点分析）
  const generateImpressions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/enhanced-impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          characterName: currentCharacter?.name || '未設定',
          sessionTitle
        })
      });

      if (response.ok) {
        const data = await response.json();
        setImpressions(data.impressions);
        setShowImpressionModal(true);
      }
    } catch (error) {
      console.error('Impression generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 💝 新しい内心・本心分析
  const generateInnerHeartAnalysis = async () => {
    setIsInnerHeartLoading(true);
    try {
      const response = await fetch('/api/inner-heart-impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          characterName: currentCharacter?.name || '未設定',
          sessionTitle,
          characterProfile: currentCharacter?.description || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInnerHeartImpressions(data.innerHeartImpressions);
        setShowInnerHeartModal(true);
      }
    } catch (error) {
      console.error('Inner heart analysis error:', error);
    } finally {
      setIsInnerHeartLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* 既存のinput area... */}
      
      {/* 🎨 アクションボタンエリア（拡張版） */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-3">
          {/* 💖 通常のインプレッションボタン */}
          <button
            onClick={generateImpressions}
            disabled={isLoading || messages.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="3視点からの感情分析"
          >
            <Heart size={16} className={isLoading ? 'animate-pulse' : ''} />
            <span className="text-sm">インプレッション</span>
          </button>

          {/* 💝 内心・本心分析ボタン（新機能！） */}
          <button
            onClick={generateInnerHeartAnalysis}
            disabled={isInnerHeartLoading || messages.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            title="内心・本音の深層分析"
          >
            {/* ✨ 魔法エフェクト */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
            
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <Heart size={16} className={isInnerHeartLoading ? 'animate-pulse' : 'animate-heartbeat'} />
                {!isInnerHeartLoading && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                )}
              </div>
              <span className="text-sm font-medium">内心分析</span>
              {!isInnerHeartLoading && (
                <div className="text-xs bg-yellow-300 text-yellow-800 px-1.5 py-0.5 rounded-full font-bold animate-bounce">
                  NEW
                </div>
              )}
            </div>
          </button>
        </div>

        {/* 既存の送信ボタンなど... */}
        <button className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
          <Send size={16} />
          <span>送信</span>
        </button>
      </div>

      {/* 📱 既存のインプレッションモーダル */}
      <EnhancedImpressionModal
        isOpen={showImpressionModal}
        onClose={() => setShowImpressionModal(false)}
        impressions={impressions}
        isLoading={isLoading}
        onRegenerate={generateImpressions}
        characterName={currentCharacter?.name}
        sessionTitle={sessionTitle}
      />

      {/* 💝 新しい内心分析モーダル */}
      <InnerHeartModal
        isOpen={showInnerHeartModal}
        onClose={() => setShowInnerHeartModal(false)}
        impressions={innerHeartImpressions}
        isLoading={isInnerHeartLoading}
        onRegenerate={generateInnerHeartAnalysis}
        characterName={currentCharacter?.name}
        sessionTitle={sessionTitle}
      />
    </div>
  );
}

// 💓 CSS Animations (globals.css に追加)
const heartbeatAnimation = `
@keyframes heartbeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.animate-heartbeat {
  animation: heartbeat 1.5s ease-in-out infinite;
}
`;

export { heartbeatAnimation };
