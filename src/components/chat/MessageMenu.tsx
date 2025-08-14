/**
 * メッセージアクションメニューコンポーネント
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  Copy, 
  RotateCcw, 
  ArrowRight, 
  FileText, 
  CornerDownLeft, 
  MoreHorizontal,
  Play
} from 'lucide-react';
import { ChatMessage } from '../../types';

interface MessageMenuProps {
  message: ChatMessage;
  isVisible: boolean;
  onRegenerate?: (messageId: string) => void;
  onContinue?: (messageId: string) => void;
  onAddMemo?: (messageId: string, content: string) => void;
  onReturnToPoint?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onPlayAudio?: (messageId: string, content: string) => void;
}

export default function MessageMenu({
  message,
  isVisible,
  onRegenerate,
  onContinue,
  onAddMemo,
  onReturnToPoint,
  onCopy,
  onPlayAudio
}: MessageMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [memoText, setMemoText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // メニューの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setShowMemoInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // メモ入力時にフォーカス
  useEffect(() => {
    if (showMemoInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showMemoInput]);

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    }
    setIsMenuOpen(false);
  };

  const handleMemoSave = () => {
    if (memoText.trim() && onAddMemo) {
      onAddMemo(message.id, memoText.trim());
      setMemoText('');
      setShowMemoInput(false);
      setIsMenuOpen(false);
    }
  };

  const handleMemoKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMemoSave();
    } else if (e.key === 'Escape') {
      setShowMemoInput(false);
      setMemoText('');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* メニュートリガー */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        title="メッセージメニュー"
      >
        <MoreHorizontal className="w-4 h-4 text-white/70" />
      </button>

      {/* ドロップダウンメニュー */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50">
          <div className="py-2">
            {/* コピー（全メッセージ共通） */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
            >
              <Copy className="w-4 h-4" />
              コピー
            </button>

            {/* アシスタントメッセージ専用メニュー */}
            {message.role === 'assistant' && (
              <>
                <div className="border-t border-white/10 my-1" />
                
                {/* 再生成 */}
                {onRegenerate && (
                  <button
                    onClick={() => {
                      onRegenerate(message.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    再生成
                  </button>
                )}

                {/* 続き */}
                {onContinue && (
                  <button
                    onClick={() => {
                      onContinue(message.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    続き
                  </button>
                )}

                {/* 音声再生 */}
                {onPlayAudio && (
                  <button
                    onClick={() => {
                      onPlayAudio(message.id, message.content);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    音声再生
                  </button>
                )}

                <div className="border-t border-white/10 my-1" />

                {/* メモ */}
                <button
                  onClick={() => setShowMemoInput(!showMemoInput)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  メモを追加
                </button>

                {/* リターン */}
                {onReturnToPoint && (
                  <button
                    onClick={() => {
                      onReturnToPoint(message.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                    この地点に戻る
                  </button>
                )}
              </>
            )}
          </div>

          {/* メモ入力エリア */}
          {showMemoInput && (
            <div className="border-t border-white/10 p-3">
              <div className="space-y-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  onKeyDown={handleMemoKeyPress}
                  placeholder="メモを入力..."
                  className="w-full px-3 py-2 bg-gray-700/50 border border-white/20 rounded text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowMemoInput(false);
                      setMemoText('');
                    }}
                    className="px-3 py-1 text-xs text-white/70 hover:text-white transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleMemoSave}
                    disabled={!memoText.trim()}
                    className="px-3 py-1 bg-blue-500/50 hover:bg-blue-500/70 disabled:bg-gray-600/50 disabled:text-white/50 text-xs rounded transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}