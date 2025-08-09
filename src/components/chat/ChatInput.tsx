/**
 * チャット入力エリアのコンポーネント
 */
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, RefreshCw, Zap } from 'lucide-react';
import { Character } from '../../../types/character';

interface ChatInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onRegenerateLastMessage: () => void;
  onUserInspiration: () => void;
  onUserTextEnhancement: () => void;
  isLoading: boolean;
  isLoadingUserInspiration: boolean;
  isEnhancingUserText: boolean;
  currentCharacter: Character | null;
  isInputExpanded: boolean;
  onInputExpandedChange: (expanded: boolean) => void;
  sendButtonClicked: boolean;
  bulbButtonClicked: boolean;
  sparkleButtonClicked: boolean;
  onSendButtonClick: () => void;
  onBulbButtonClick: () => void;
  onSparkleButtonClick: () => void;
}

export default function ChatInput({
  message,
  onMessageChange,
  onSendMessage,
  onRegenerateLastMessage,
  onUserInspiration,
  onUserTextEnhancement,
  isLoading,
  isLoadingUserInspiration,
  isEnhancingUserText,
  currentCharacter,
  isInputExpanded,
  onInputExpandedChange,
  sendButtonClicked,
  bulbButtonClicked,
  sparkleButtonClicked,
  onSendButtonClick,
  onBulbButtonClick,
  onSparkleButtonClick
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // テキストエリアの高さを動的調整
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = isInputExpanded ? 200 : 100;
      inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message, isInputExpanded]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enterで改行
        return;
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl+Enter（またはCmd+Enter）でインスピレーション
        e.preventDefault();
        if (!isLoadingUserInspiration && message.trim()) {
          onUserInspiration();
        }
      } else {
        // Enterで送信
        e.preventDefault();
        if (message.trim() && !isLoading) {
          onSendMessage();
        }
      }
    }
  };

  const handleFocus = () => {
    onInputExpandedChange(true);
  };

  const handleBlur = () => {
    if (!message.trim()) {
      onInputExpandedChange(false);
    }
  };

  return (
    <div className="border-t border-white/20 bg-black/30 backdrop-blur-md p-4">
      <div className="max-w-4xl mx-auto">
        {/* キャラクター情報 */}
        {currentCharacter && (
          <div className="flex items-center gap-3 mb-3 text-white/80">
            {currentCharacter.avatar_url && (
              <img
                src={currentCharacter.avatar_url}
                alt={currentCharacter.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            <span className="text-sm">
              {currentCharacter.name} と会話中
            </span>
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* テキスト入力エリア */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={
                currentCharacter
                  ? `${currentCharacter.name}にメッセージを送信...`
                  : 'キャラクターを選択してください...'
              }
              disabled={!currentCharacter || isLoading}
              className={`
                w-full resize-none rounded-2xl px-4 py-3 pr-12
                bg-white/10 border border-white/30 text-white placeholder-white/50
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                transition-all duration-200
                ${isInputExpanded ? 'min-h-[100px]' : 'min-h-[50px]'}
                ${!currentCharacter ? 'cursor-not-allowed opacity-50' : ''}
              `}
              style={{
                maxHeight: isInputExpanded ? '200px' : '100px',
                overflowY: 'auto'
              }}
            />

            {/* 文字数カウンター */}
            {message && (
              <div className="absolute bottom-2 right-2 text-xs text-white/50">
                {message.length}
              </div>
            )}
          </div>

          {/* アクションボタン群 */}
          <div className="flex gap-2">
            {/* 再生成ボタン */}
            <button
              onClick={onRegenerateLastMessage}
              disabled={isLoading || !currentCharacter}
              className="p-3 rounded-xl bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="最後の返答を再生成"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* インスピレーションボタン */}
            <button
              onClick={() => {
                onBulbButtonClick();
                onUserInspiration();
              }}
              disabled={isLoadingUserInspiration || !message.trim() || !currentCharacter}
              className={`
                p-3 rounded-xl border border-white/30 text-white transition-all duration-200
                ${bulbButtonClicked ? 'bg-yellow-500/30 scale-95' : 'bg-white/10 hover:bg-white/20'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title="インスピレーションを取得 (Ctrl+Enter)"
            >
              {isLoadingUserInspiration ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <div className="relative">
                  💡
                  {bulbButtonClicked && (
                    <div className="absolute inset-0 bg-yellow-400/30 rounded-full animate-ping" />
                  )}
                </div>
              )}
            </button>

            {/* 文章強化ボタン */}
            <button
              onClick={() => {
                onSparkleButtonClick();
                onUserTextEnhancement();
              }}
              disabled={isEnhancingUserText || !message.trim() || !currentCharacter}
              className={`
                p-3 rounded-xl border border-white/30 text-white transition-all duration-200
                ${sparkleButtonClicked ? 'bg-purple-500/30 scale-95' : 'bg-white/10 hover:bg-white/20'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title="文章を強化"
            >
              {isEnhancingUserText ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <div className="relative">
                  <Zap className="w-5 h-5" />
                  {sparkleButtonClicked && (
                    <div className="absolute inset-0 bg-purple-400/30 rounded-full animate-ping" />
                  )}
                </div>
              )}
            </button>

            {/* 送信ボタン */}
            <button
              onClick={() => {
                onSendButtonClick();
                onSendMessage();
              }}
              disabled={!message.trim() || isLoading || !currentCharacter}
              className={`
                p-3 rounded-xl border border-white/30 text-white transition-all duration-200
                ${sendButtonClicked ? 'bg-blue-500/30 scale-95' : 'bg-blue-500/20 hover:bg-blue-500/30'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title="メッセージを送信 (Enter)"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <div className="relative">
                  <Send className="w-5 h-5" />
                  {sendButtonClicked && (
                    <div className="absolute inset-0 bg-blue-400/30 rounded-full animate-ping" />
                  )}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* ヘルプテキスト */}
        <div className="mt-2 text-xs text-white/50 text-center">
          Enter: 送信 | Shift+Enter: 改行 | Ctrl+Enter: インスピレーション
        </div>
      </div>
    </div>
  );
}