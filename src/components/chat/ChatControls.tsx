'use client';

import { useState } from 'react';
import { Send, Sparkles, MessageCircle, Settings, X, Users, User, Lightbulb, Zap, BarChart3, Heart, Shield, TrendingUp, Eye, Upload, Image, Palette, Save, Edit } from 'lucide-react';

interface ChatControlsProps {
  message: string;
  setMessage: (message: string) => void;
  isLoading: boolean;
  onSendMessage: () => void;
  onOpenSettings: () => void;
  onOpenCharacterGallery: () => void;
  onOpenPersonaSelector: () => void;
  onOpenInspiration: () => void;
  onOpenTextEnhancement: () => void;
  onOpenTrackerPanel: () => void;
  showTrackerPanel: boolean;
  currentCharacter: any;
  currentPersona: any;
}

export default function ChatControls({
  message,
  setMessage,
  isLoading,
  onSendMessage,
  onOpenSettings,
  onOpenCharacterGallery,
  onOpenPersonaSelector,
  onOpenInspiration,
  onOpenTextEnhancement,
  onOpenTrackerPanel,
  showTrackerPanel,
  currentCharacter,
  currentPersona
}: ChatControlsProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && message.trim()) {
        onSendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
      {/* 上部コントロールバー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCharacterGallery}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              {currentCharacter?.name || 'キャラクター選択'}
            </span>
          </button>
          
          <button
            onClick={onOpenPersonaSelector}
            className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">
              {currentPersona?.name || 'ペルソナ選択'}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTrackerPanel}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showTrackerPanel 
                ? 'bg-purple-500/30 text-purple-200' 
                : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
            }`}
            title="トラッカーパネル"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          
          <button
            onClick={onOpenInspiration}
            className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-lg transition-all duration-200 hover:scale-105"
            title="インスピレーション"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
          
          <button
            onClick={onOpenTextEnhancement}
            className="p-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 rounded-lg transition-all duration-200 hover:scale-105"
            title="文章強化"
          >
            <Zap className="w-4 h-4" />
          </button>
          
          <button
            onClick={onOpenSettings}
            className="p-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-all duration-200 hover:scale-105"
            title="設定"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* チャット入力エリア */}
      <div className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力してください..."
            className="w-full p-3 pr-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            rows={3}
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2 flex items-center space-x-1">
            {isLoading && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce-dot"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={onSendMessage}
          disabled={isLoading || !message.trim()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>送信</span>
        </button>
      </div>
    </div>
  );
}
