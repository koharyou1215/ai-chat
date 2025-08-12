'use client';

import { useState } from 'react';
import { Lightbulb, Zap, X, Sparkles, MessageCircle, Heart } from 'lucide-react';

interface InspirationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateInspiration: (text: string) => void;
  onGenerateEnhancedImpression: () => void;
  selectedText: string;
  setSelectedText: (text: string) => void;
  inspirationText: string;
  setInspirationText: (text: string) => void;
}

export default function InspirationPanel({
  isOpen,
  onClose,
  onGenerateInspiration,
  onGenerateEnhancedImpression,
  selectedText,
  setSelectedText,
  inspirationText,
  setInspirationText
}: InspirationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerateInspiration = async () => {
    if (!selectedText.trim()) return;
    
    setIsGenerating(true);
    try {
      await onGenerateInspiration(selectedText);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateEnhancedImpression = async () => {
    setIsGenerating(true);
    try {
      await onGenerateEnhancedImpression();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">インスピレーション & 文章強化</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 💡 インスピレーション機能 */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-yellow-200">💡 次の発言候補を生成</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  会話の文脈（選択したテキスト）
                </label>
                <textarea
                  value={selectedText}
                  onChange={(e) => setSelectedText(e.target.value)}
                  placeholder="会話の文脈や状況を入力してください..."
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50"
                  rows={3}
                />
              </div>
              
              <button
                onClick={handleGenerateInspiration}
                disabled={!selectedText.trim() || isGenerating}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>インスピレーション生成</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 💖 ハートマーク機能（インスピレーション） */}
          <div className="bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Heart className="w-6 h-6 text-pink-400" />
              <h3 className="text-lg font-semibold text-pink-200">💖 会話を3つの視点から分析</h3>
            </div>
            
            <p className="text-gray-300 text-sm mb-4">
              現在の会話を感情・論理・創造性の3つの視点から分析し、新しい視点を提供します。
            </p>
            
            <button
              onClick={handleGenerateEnhancedImpression}
              disabled={isGenerating}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  <span>会話分析</span>
                </>
              )}
            </button>
          </div>

          {/* 生成結果表示エリア */}
          {inspirationText && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-200">生成結果</h3>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="prose prose-invert max-w-none">
                  <div 
                    className="text-gray-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: inspirationText.replace(/\n/g, '<br>') }}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setInspirationText('')}
                  className="px-4 py-2 bg-gray-500/30 hover:bg-gray-500/40 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  クリア
                </button>
              </div>
            </div>
          )}

          {/* 使い方ガイド */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">💡 使い方</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <strong>インスピレーション機能</strong>: 会話の文脈を入力して、次の発言候補を3つ生成</li>
              <li>• <strong>ハートマーク機能</strong>: 現在の会話を多角的に分析して新しい視点を提供</li>
              <li>• 生成された内容は、チャットの参考として活用できます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
