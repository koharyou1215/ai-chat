// 📱 モバイルメモダッシュボード - 統合管理システム
// フローティングボタン + リスト表示 + 作成機能

'use client';

import { useState, useEffect } from 'react';
import { List, Plus, MessageSquare, X } from 'lucide-react';
import MobileMemoSystem from './MobileMemoSystem';
import MobileMemoList from './MobileMemoList';

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

interface MobileMemoDashboardProps {
  currentMessage?: ChatMessage;
  currentSession?: SessionData;
  messages: ChatMessage[];
  memos: ChatMemo[];
  onMemoSave: (memo: Omit<ChatMemo, 'id' | 'timestamp'>) => void;
  onMemoEdit: (memoId: string, newContent: string) => void;
  onMemoDelete: (memoId: string) => void;
  onMemoToggleImportant: (memoId: string) => void;
  className?: string;
}

// 🎯 フローティングアクションボタン（拡張版）
function ExpandableFloatingButton({ 
  onCreateMemo, 
  onShowList, 
  hasActiveMemo,
  memoCount 
}: { 
  onCreateMemo: () => void;
  onShowList: () => void;
  hasActiveMemo?: boolean;
  memoCount: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      
      {/* 📋 リスト表示ボタン（展開時） */}
      {isExpanded && (
        <button
          onClick={() => {
            onShowList();
            setIsExpanded(false);
          }}
          className="w-12 h-12 bg-white text-gray-700 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 border border-gray-200"
          style={{ minWidth: '48px', minHeight: '48px' }}
          title="メモリストを表示"
        >
          <div className="relative">
            <List size={18} />
            {memoCount > 0 && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {memoCount > 99 ? '99+' : memoCount}
              </div>
            )}
          </div>
        </button>
      )}

      {/* ➕ メモ作成ボタン（展開時） */}
      {isExpanded && (
        <button
          onClick={() => {
            onCreateMemo();
            setIsExpanded(false);
          }}
          className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          style={{ minWidth: '48px', minHeight: '48px' }}
          title="新しいメモを作成"
        >
          <Plus size={18} />
        </button>
      )}

      {/* 🎯 メインボタン */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-300 transform
          ${isExpanded 
            ? 'bg-gray-500 rotate-45' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-110'
          }
          ${hasActiveMemo ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''}
          text-white active:scale-95
        `}
        style={{ minWidth: '48px', minHeight: '48px' }}
        title={isExpanded ? '閉じる' : 'メモメニュー'}
      >
        {isExpanded ? (
          <X size={20} />
        ) : (
          <div className="relative">
            <MessageSquare size={20} />
            {hasActiveMemo && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            )}
            {memoCount > 0 && !hasActiveMemo && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {memoCount > 99 ? '99+' : memoCount}
              </div>
            )}
          </div>
        )}
      </button>

      {/* 💡 ヘルプテキスト（初回展開時） */}
      {isExpanded && (
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
          タップしてメニューを選択
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-black border-l-opacity-75 border-t-4 border-t-transparent border-b-4 border-b-transparent" />
        </div>
      )}
    </div>
  );
}

// 📋 フルスクリーンメモリストモーダル
function FullScreenMemoList({ 
  isOpen, 
  onClose, 
  memos, 
  messages,
  onMemoEdit,
  onMemoDelete,
  onMemoToggleImportant 
}: {
  isOpen: boolean;
  onClose: () => void;
  memos: ChatMemo[];
  messages: ChatMessage[];
  onMemoEdit: (memoId: string, newContent: string) => void;
  onMemoDelete: (memoId: string) => void;
  onMemoToggleImportant: (memoId: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      
      {/* 📱 ヘッダー */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">📋 メモリスト</h1>
            <p className="text-blue-100 text-sm">
              {memos.length}件のメモを管理
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

      {/* 📋 メモリスト */}
      <div className="flex-1 overflow-hidden">
        <MobileMemoList
          memos={memos}
          messages={messages}
          onMemoEdit={onMemoEdit}
          onMemoDelete={onMemoDelete}
          onMemoToggleImportant={onMemoToggleImportant}
        />
      </div>
    </div>
  );
}

// 📱 メインダッシュボード
export default function MobileMemoDashboard({
  currentMessage,
  currentSession,
  messages,
  memos,
  onMemoSave,
  onMemoEdit,
  onMemoDelete,
  onMemoToggleImportant
}: MobileMemoDashboardProps) {
  const [showMemoList, setShowMemoList] = useState(false);
  const [showMemoCreation, setShowMemoCreation] = useState(false);

  // メッセージに既存のメモがあるかチェック
  const hasExistingMemo = currentMessage 
    ? memos.some(memo => memo.messageId === currentMessage.id)
    : false;

  const handleMemoSave = (memo: Omit<ChatMemo, 'id' | 'timestamp'>) => {
    onMemoSave(memo);
    setShowMemoCreation(false);
  };

  return (
    <>
      {/* 🎯 フローティングアクションボタン */}
      <ExpandableFloatingButton
        onCreateMemo={() => setShowMemoCreation(true)}
        onShowList={() => setShowMemoList(true)}
        hasActiveMemo={hasExistingMemo}
        memoCount={memos.length}
      />

      {/* 📝 メモ作成システム */}
      {showMemoCreation && (
        <MobileMemoSystem
          currentMessage={currentMessage}
          currentSession={currentSession}
          onMemoSave={handleMemoSave}
          existingMemos={memos}
        />
      )}

      {/* 📋 フルスクリーンメモリスト */}
      <FullScreenMemoList
        isOpen={showMemoList}
        onClose={() => setShowMemoList(false)}
        memos={memos}
        messages={messages}
        onMemoEdit={onMemoEdit}
        onMemoDelete={onMemoDelete}
        onMemoToggleImportant={onMemoToggleImportant}
      />

      {/* CSS */}
      <style>{`
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  );
}
