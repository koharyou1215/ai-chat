/**
 * メッセージ表示エリアのコンポーネント
 */
import React from 'react';
import { Copy, User, Activity } from 'lucide-react';
import { Message } from '../../hooks/useChatState';
import { Character } from '../../../types/character';
import FormattedText from '../FormattedText';
import { MessageMemoButton } from '../ChatMemoProvider';
import Typewriter from '../Typewriter';

interface MessageAreaProps {
  messages: Message[];
  currentCharacter: Character | null;
  isLoading: boolean;
  showTrackers: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onTextSelection?: (text: string, messageId: string, position: { x: number; y: number }) => void;
  onCopyMessage?: (content: string) => void;
}

export default function MessageArea({
  messages,
  currentCharacter,
  isLoading,
  showTrackers,
  messagesEndRef,
  onTextSelection,
  onCopyMessage
}: MessageAreaProps) {
  const handleTextSelection = (messageId: string) => {
    if (!onTextSelection) return;

    const selection = window.getSelection();
    if (selection && selection.toString().trim() && selection.rangeCount > 0) {
      const selectedText = selection.toString();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      onTextSelection(selectedText, messageId, {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (onCopyMessage) {
        onCopyMessage(text);
      }
    } catch (err) {
      console.error('クリップボードへのコピーに失敗:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scroll-smooth">
      {messages.map((msg, index) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`
              max-w-[85%] rounded-2xl p-4 shadow-lg backdrop-blur-sm relative group
              ${msg.role === 'user'
                ? 'bg-blue-500/20 border border-blue-300/30 text-white'
                : 'bg-white/20 border border-white/30 text-white'
              }
            `}
            onMouseUp={() => handleTextSelection(msg.id)}
          >
            {/* キャラクターアバター */}
            {msg.role === 'assistant' && currentCharacter && (
              <div className="flex items-center gap-3 mb-3">
                {currentCharacter.avatar_url && (
                  <img
                    src={currentCharacter.avatar_url}
                    alt={currentCharacter.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
                  />
                )}
                <span className="font-semibold text-white/90">
                  {currentCharacter.name}
                </span>
              </div>
            )}

            {/* ユーザーアイコン */}
            {msg.role === 'user' && (
              <div className="flex items-center gap-3 mb-3 justify-end">
                <span className="font-semibold text-white/90">あなた</span>
                <User className="w-8 h-8 p-1 rounded-full bg-blue-500/50" />
              </div>
            )}

            {/* メッセージ内容 */}
            <div className="space-y-2">
              {msg.image && (
                <div className="mb-3">
                  <img
                    src={msg.image}
                    alt="Generated content"
                    className="rounded-lg max-w-full shadow-lg"
                  />
                </div>
              )}

              {/* 最後のメッセージかつ読み込み中の場合はタイプライター効果 */}
              {index === messages.length - 1 && isLoading && msg.role === 'assistant' ? (
                <Typewriter text={msg.content} speed={30} />
              ) : (
                <FormattedText text={msg.content} />
              )}
            </div>

            {/* メッセージアクション */}
            <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                {/* メモボタン */}
                <MessageMemoButton messageId={msg.id} />
                
                {/* トラッカー表示 */}
                {showTrackers && msg.role === 'assistant' && (
                  <Activity className="w-4 h-4 text-white/70" />
                )}
              </div>

              {/* コピーボタン */}
              <button
                onClick={() => copyToClipboard(msg.content)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                title="メッセージをコピー"
              >
                <Copy className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* タイムスタンプ */}
            <div className="text-xs text-white/50 mt-2 text-right">
              {new Date(msg.timestamp).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      ))}

      {/* ローディングインジケーター */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white/20 border border-white/30 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {currentCharacter?.avatar_url && (
                <img
                  src={currentCharacter.avatar_url}
                  alt={currentCharacter.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
                />
              )}
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* スクロール位置固定用 */}
      <div ref={messagesEndRef} />
    </div>
  );
}