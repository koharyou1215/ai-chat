// 📱 モバイル専用メモシステム - タッチ最適化版
// iPhone Safari完全対応、48px以上タッチターゲット

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare,
  Mic,
  Save,
  X,
  Heart,
  Star,
  Zap,
  FileText,
  Edit3
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  characterName?: string;
}

interface ChatMemo {
  id: string;
  messageId: string;
  sessionId: string;
  content: string;
  timestamp: number;
  category?: string;
  isImportant?: boolean;
}

interface SessionData {
  id: string;
  name?: string;
  characterId?: string;
}

interface MobileMemoSystemProps {
  currentMessage?: ChatMessage;
  currentSession?: SessionData;
  onMemoSave: (memo: Omit<ChatMemo, 'id' | 'timestamp'>) => void;
  existingMemos: ChatMemo[];
  className?: string;
}

// 🎯 フローティングメモボタン（常時表示）
export function FloatingMemoButton({ onClick, hasActiveMemo }: { 
  onClick: () => void; 
  hasActiveMemo?: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 md:w-12 md:h-12
        bg-gradient-to-r from-blue-500 to-purple-600
        text-white rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110 active:scale-95
        ${isPressed ? 'scale-95 shadow-sm' : 'shadow-lg'}
        ${hasActiveMemo ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''}
        safe-area-bottom
        touch-manipulation
      `}
      style={{
        minWidth: '48px',
        minHeight: '48px',
        WebkitTapHighlightColor: 'transparent'
      }}
      title="メモを作成"
    >
      <div className="relative">
        <MessageSquare size={20} />
        {hasActiveMemo && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </div>
    </button>
  );
}

// 📝 モバイル最適化メモ作成モーダル
export function MobileMemoCreationModal({
  isOpen,
  onClose,
  onSave,
  currentMessage,
  currentSession
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memo: Omit<ChatMemo, 'id' | 'timestamp'>) => void;
  currentMessage?: ChatMessage;
  currentSession?: SessionData;
}) {
  const [memoContent, setMemoContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('一般');
  const [isImportant, setIsImportant] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const categories = [
    { label: '一般', icon: FileText, color: 'bg-blue-500' },
    { label: '重要', icon: Star, color: 'bg-yellow-500' },
    { label: '感情', icon: Heart, color: 'bg-pink-500' },
    { label: 'アイデア', icon: Zap, color: 'bg-purple-500' },
    { label: '設定', icon: Edit3, color: 'bg-green-500' }
  ];

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!memoContent.trim()) return;

    onSave({
      messageId: currentMessage?.id || '',
      sessionId: currentSession?.id || '',
      content: memoContent.trim(),
      category: selectedCategory,
      isImportant
    });

    setMemoContent('');
    setIsImportant(false);
    onClose();
  };

  const startVoiceRecording = async () => {
    try {
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        const recognition = new (window as unknown as { 
          webkitSpeechRecognition: new() => {
            lang: string;
            continuous: boolean;
            interimResults: boolean;
            onstart: (() => void) | null;
            onend: (() => void) | null;
            onresult: ((event: { results: { [x: string]: { [x: string]: { transcript: string } } } }) => void) | null;
            start: () => void;
          }
        }).webkitSpeechRecognition();
        
        recognition.lang = 'ja-JP';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onresult = (event: { results: { [x: string]: { [x: string]: { transcript: string } } } }) => {
          const transcript = event.results[0][0].transcript;
          setMemoContent(prev => prev + (prev ? ' ' : '') + transcript);
        };
        
        recognition.start();
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center">
      {/* モバイル: 下からスライドアップ */}
      <div className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-slide-up">
        
        {/* 🎨 ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">💭 メモを作成</h2>
              <p className="text-blue-100 text-sm">
                {currentMessage ? '特定のメッセージ' : 'セッション全体'}についてのメモ
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              style={{ minWidth: '48px', minHeight: '48px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 📄 メインコンテンツ */}
        <div className="p-6 space-y-6">
          
          {/* 🏷️ カテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              カテゴリを選択
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.label}
                    onClick={() => setSelectedCategory(category.label)}
                    className={`
                      p-3 rounded-xl border-2 transition-all duration-200
                      flex flex-col items-center gap-1 text-xs font-medium
                      ${selectedCategory === category.label
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    style={{ minHeight: '48px' }}
                  >
                    <div className={`w-6 h-6 rounded-full ${category.color} flex items-center justify-center`}>
                      <IconComponent size={12} className="text-white" />
                    </div>
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ✍️ メモ入力エリア */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ内容
            </label>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
                placeholder="ここにメモを入力してください...&#10;&#10;例：&#10;・キャラクターの好きな食べ物&#10;・会話の重要なポイント&#10;・後で確認したいこと"
                className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                style={{ fontSize: '16px' }} // iPhone Safari ズーム防止
              />
              
              {/* 🎤 音声入力ボタン */}
              <button
                onClick={startVoiceRecording}
                disabled={isRecording}
                className={`
                  absolute bottom-3 right-3 w-10 h-10 rounded-full
                  flex items-center justify-center transition-all duration-200
                  ${isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
                style={{ minWidth: '48px', minHeight: '48px' }}
                title="音声入力"
              >
                <Mic size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>文字数: {memoContent.length}</span>
              {isRecording && <span className="text-red-500 animate-pulse">🔴 録音中...</span>}
            </div>
          </div>

          {/* ⭐ 重要マーク */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportant(!isImportant)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200
                ${isImportant
                  ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              style={{ minHeight: '48px' }}
            >
              <Star size={16} className={isImportant ? 'fill-current' : ''} />
              <span className="text-sm font-medium">重要なメモとしてマーク</span>
            </button>
          </div>

          {/* 📋 参照情報 */}
          {currentMessage && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                💬 関連メッセージ
              </h4>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">
                  {currentMessage.role === 'user' ? 'あなた' : currentMessage.characterName || 'AI'}
                </div>
                <p className="text-sm line-clamp-3">
                  {currentMessage.content}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 🔧 フッターアクション */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-400 transition-colors"
              style={{ minHeight: '48px' }}
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!memoContent.trim()}
              className="flex-2 py-3 px-6 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ minHeight: '48px' }}
            >
              <Save size={16} />
              メモを保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 📱 メインモバイルメモシステム
export default function MobileMemoSystem({
  currentMessage,
  currentSession,
  onMemoSave,
  existingMemos
}: MobileMemoSystemProps) {
  const [showMemoModal, setShowMemoModal] = useState(false);

  // メッセージに既存のメモがあるかチェック
  const hasExistingMemo = currentMessage 
    ? existingMemos.some(memo => memo.messageId === currentMessage.id)
    : false;

  const handleMemoSave = (memo: Omit<ChatMemo, 'id' | 'timestamp'>) => {
    onMemoSave(memo);
    // TODO: 成功フィードバック表示
  };

  return (
    <>
      {/* 🎯 フローティングメモボタン */}
      <FloatingMemoButton
        onClick={() => setShowMemoModal(true)}
        hasActiveMemo={hasExistingMemo}
      />

      {/* 📝 メモ作成モーダル */}
      <MobileMemoCreationModal
        isOpen={showMemoModal}
        onClose={() => setShowMemoModal(false)}
        onSave={handleMemoSave}
        currentMessage={currentMessage}
        currentSession={currentSession}
      />

      {/* CSS Animation */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </>
  );
}
