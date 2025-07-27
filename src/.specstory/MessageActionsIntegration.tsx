// 🔧 メッセージカードの編集・要約ボタン統合
// 既存のメッセージ表示に編集・要約機能を追加

'use client';

import { useState } from 'react';
import { Edit3, FileText, MoreHorizontal, Copy, Trash2, MessageSquare } from 'lucide-react';
import MessageEditSummarySystem from './MessageEditSummarySystem';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  characterName?: string;
}

interface MessageActionsProps {
  message: ChatMessage;
  onMessageUpdate: (messageId: string, newContent: string) => void;
  onMessageDelete?: (messageId: string) => void;
  currentCharacter?: any;
  isLast?: boolean;
}

// 🎯 メッセージアクションボタン群
export function MessageActions({
  message,
  onMessageUpdate,
  onMessageDelete,
  currentCharacter,
  isLast = false
}: MessageActionsProps) {
  const [showEditSummary, setShowEditSummary] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isUserMessage = message.role === 'user';

  // 📋 メッセージコピー
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      // TODO: トースト通知表示
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // 🗑️ メッセージ削除
  const handleDeleteMessage = () => {
    if (onMessageDelete && confirm('このメッセージを削除しますか？')) {
      onMessageDelete(message.id);
    }
  };

  return (
    <>
      {/* 🎨 アクションボタン */}
      <div className={`flex items-center gap-1 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
        
        {/* 📝 編集ボタン */}
        <button
          onClick={() => setShowEditSummary(true)}
          className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
            isUserMessage 
              ? 'bg-blue-100 hover:bg-blue-200 text-blue-600' 
              : 'bg-green-100 hover:bg-green-200 text-green-600'
          }`}
          title="メッセージを編集"
        >
          <Edit3 size={14} />
        </button>

        {/* 📊 要約ボタン */}
        <button
          onClick={() => {
            setShowEditSummary(true);
            // TODO: 要約タブを直接開く処理
          }}
          className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
            isUserMessage 
              ? 'bg-purple-100 hover:bg-purple-200 text-purple-600' 
              : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
          }`}
          title="メッセージを要約"
        >
          <FileText size={14} />
        </button>

        {/* 📋 その他アクションメニュー */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-full transition-all duration-200 hover:scale-110 bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="その他の操作"
          >
            <MoreHorizontal size={14} />
          </button>

          {/* ドロップダウンメニュー */}
          {showActions && (
            <div className={`absolute z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 ${
              isUserMessage ? 'right-0' : 'left-0'
            }`}>
              <button
                onClick={() => {
                  handleCopyMessage();
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <Copy size={12} />
                コピー
              </button>
              
              {onMessageDelete && (
                <button
                  onClick={() => {
                    handleDeleteMessage();
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600"
                >
                  <Trash2 size={12} />
                  削除
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 📱 編集・要約モーダル */}
      <MessageEditSummarySystem
        message={message}
        onMessageUpdate={onMessageUpdate}
        onClose={() => setShowEditSummary(false)}
        isOpen={showEditSummary}
        currentCharacter={currentCharacter}
      />

      {/* クリック外しでメニューを閉じる */}
      {showActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}
    </>
  );
}

// 🎨 既存メッセージカードの拡張版
interface EnhancedMessageCardProps {
  message: ChatMessage;
  onMessageUpdate: (messageId: string, newContent: string) => void;
  onMessageDelete?: (messageId: string) => void;
  currentCharacter?: any;
  isLast?: boolean;
  showActions?: boolean;
}

export function EnhancedMessageCard({
  message,
  onMessageUpdate,
  onMessageDelete,
  currentCharacter,
  isLast = false,
  showActions = true
}: EnhancedMessageCardProps) {
  const isUserMessage = message.role === 'user';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`group relative ${isUserMessage ? 'flex justify-end' : 'flex justify-start'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative max-w-[80%] ${isUserMessage ? 'order-2' : 'order-1'}`}>
        {/* 💬 メッセージバブル */}
        <div className={`p-4 rounded-2xl shadow-sm transition-all duration-200 ${
          isUserMessage 
            ? 'bg-blue-500 text-white ml-4' 
            : 'bg-white border border-gray-200 mr-4'
        } ${isHovered ? 'shadow-md transform scale-[1.02]' : ''}`}>
          
          {/* 👤 送信者情報（キャラクターメッセージの場合） */}
          {!isUserMessage && (
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
              <MessageSquare size={14} />
              <span className="font-medium">{message.characterName || currentCharacter?.name || 'AI'}</span>
            </div>
          )}

          {/* 📝 メッセージ内容 */}
          <div className={`${isUserMessage ? 'text-white' : 'text-gray-800'}`}>
            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* ⏰ タイムスタンプ */}
          <div className={`text-xs mt-2 ${
            isUserMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* 🎯 アクションボタン（ホバー時表示） */}
        {showActions && isHovered && (
          <div className={`absolute top-2 ${
            isUserMessage ? 'left-[-200px]' : 'right-[-200px]'
          } transition-all duration-200`}>
            <MessageActions
              message={message}
              onMessageUpdate={onMessageUpdate}
              onMessageDelete={onMessageDelete}
              currentCharacter={currentCharacter}
              isLast={isLast}
            />
          </div>
        )}

        {/* 📱 モバイル用アクションボタン */}
        {showActions && (
          <div className="md:hidden mt-2">
            <MessageActions
              message={message}
              onMessageUpdate={onMessageUpdate}
              onMessageDelete={onMessageDelete}
              currentCharacter={currentCharacter}
              isLast={isLast}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// 🔧 既存チャットに統合するためのラッパー
interface ChatMessageListProps {
  messages: ChatMessage[];
  onMessageUpdate: (messageId: string, newContent: string) => void;
  onMessageDelete?: (messageId: string) => void;
  currentCharacter?: any;
}

export function ChatMessageList({
  messages,
  onMessageUpdate,
  onMessageDelete,
  currentCharacter
}: ChatMessageListProps) {
  return (
    <div className="space-y-4 p-4">
      {messages.map((message, index) => (
        <EnhancedMessageCard
          key={message.id}
          message={message}
          onMessageUpdate={onMessageUpdate}
          onMessageDelete={onMessageDelete}
          currentCharacter={currentCharacter}
          isLast={index === messages.length - 1}
          showActions={true}
        />
      ))}
    </div>
  );
}

export default MessageActions;
