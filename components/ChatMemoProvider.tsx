'use client';

import { useState } from 'react';
import { StickyNote, BookOpen } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { ChatMemo } from '../types/character';
import MemoModal from './MemoModal';
import MemoListModal from './MemoListModal';

interface ChatMemoProviderProps {
  currentSessionId: string | null;
  children: React.ReactNode;
}

interface MessageMemoButtonProps {
  messageId: string;
  messageContent: string;
  sessionId: string;
  characterId: string;
}

export function MessageMemoButton({ messageId, messageContent, sessionId, characterId }: MessageMemoButtonProps) {
  const { addMemo, updateMemo, getMemoByMessage } = useChatStore();
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  
  const existingMemo = getMemoByMessage(messageId);
  const hasMemo = !!existingMemo;

  const handleSaveMemo = (memo: ChatMemo) => {
    if (existingMemo) {
      updateMemo(memo);
    } else {
      addMemo(memo);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsMemoModalOpen(true)}
        className={`p-1 rounded transition-colors ${
          hasMemo 
            ? 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
        title={hasMemo ? 'メモを編集' : 'メモを追加'}
      >
        <StickyNote size={16} />
      </button>

      <MemoModal
        isOpen={isMemoModalOpen}
        onClose={() => setIsMemoModalOpen(false)}
        messageContent={messageContent}
        messageId={messageId}
        sessionId={sessionId}
        characterId={characterId}
        existingMemo={existingMemo}
        onSave={handleSaveMemo}
      />
    </>
  );
}

export function MemoListButton({ currentCharacterId }: { currentCharacterId?: string }) {
  const { memos, deleteMemo } = useChatStore();
  const [isMemoListOpen, setIsMemoListOpen] = useState(false);

  const handleEditMemo = () => {
    // 編集機能は既存のメモボタンから実行されるため、ここでは何もしない
    // 実際の編集は各メッセージのMemoButtonから行う
    setIsMemoListOpen(false);
  };

  const handleJumpToMessage = (sessionId: string, messageId: string) => {
    // メッセージにジャンプする機能
    // 現在はアラートで対応（将来的には履歴読み込み + スクロール実装）
    alert(`セッション: ${sessionId}\nメッセージ: ${messageId}\n\n※ この機能は今後実装予定です`);
    setIsMemoListOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsMemoListOpen(true)}
        className="text-white/70 hover:text-white text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm transition-colors flex items-center gap-1"
        title="メモ一覧"
      >
        <BookOpen size={12} />
        メモ一覧 ({memos.length})
      </button>

      <MemoListModal
        isOpen={isMemoListOpen}
        onClose={() => setIsMemoListOpen(false)}
        memos={memos}
        currentCharacterId={currentCharacterId}
        onEditMemo={handleEditMemo}
        onDeleteMemo={deleteMemo}
        onJumpToMessage={handleJumpToMessage}
      />
    </>
  );
}

export default function ChatMemoProvider({ children }: ChatMemoProviderProps) {
  return (
    <>
      {children}
    </>
  );
} 