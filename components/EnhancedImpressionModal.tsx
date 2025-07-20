'use client';

import { useState } from 'react';
import { X, RefreshCw, Heart, Brain, Star, Loader } from 'lucide-react';

interface Impression {
  title: string;
  content: string;
  perspective: string;
  wordCount: number;
}

interface EnhancedImpressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  impressions: Impression[];
  isLoading: boolean;
  onRegenerate: () => void;
  characterName?: string;
}

export default function EnhancedImpressionModal({
  isOpen,
  onClose,
  impressions,
  isLoading,
  onRegenerate,
  characterName
}: EnhancedImpressionModalProps) {
  const [selectedImpression, setSelectedImpression] = useState<number | null>(null);

  if (!isOpen) return null;

  const getPerspectiveIcon = (perspective: string) => {
    if (perspective.includes('感情') || perspective.includes('雰囲気')) {
      return <Heart size={20} className="text-red-500" />;
    } else if (perspective.includes('関係') || perspective.includes('成長')) {
      return <Brain size={20} className="text-blue-500" />;
    } else {
      return <Star size={20} className="text-yellow-500" />;
    }
  };

  const getPerspectiveColor = (perspective: string) => {
    if (perspective.includes('感情') || perspective.includes('雰囲気')) {
      return 'border-red-200 bg-red-50';
    } else if (perspective.includes('関係') || perspective.includes('成長')) {
      return 'border-blue-200 bg-blue-50';
    } else {
      return 'border-yellow-200 bg-yellow-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center">
              <Heart size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                会話インプレッション
              </h2>
              <p className="text-gray-600 text-sm">
                {characterName ? `${characterName}との会話を3つの視点から分析` : '会話を3つの視点から分析'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="再生成"
            >
              {isLoading ? <Loader size={20} className="animate-spin" /> : <RefreshCw size={20} />}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader size={48} className="animate-spin text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                インプレッションを生成中...
              </h3>
              <p className="text-gray-500 text-center">
                会話を分析して、3つの異なる視点からインプレッションを作成しています
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 概要 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Brain size={20} className="text-purple-600" />
                  分析結果
                </h3>
                <p className="text-gray-700">
                  この会話を3つの異なる視点から分析し、それぞれ200字程度のインプレッションを生成しました。
                  各視点は会話の異なる側面を捉えており、より深い理解を提供します。
                </p>
              </div>

              {/* インプレッション一覧 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {impressions.map((impression, index) => (
                  <div
                    key={index}
                    className={`relative rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                      selectedImpression === index 
                        ? 'border-purple-400 shadow-lg scale-105' 
                        : getPerspectiveColor(impression.perspective)
                    }`}
                    onClick={() => setSelectedImpression(selectedImpression === index ? null : index)}
                  >
                    {/* ヘッダー */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPerspectiveIcon(impression.perspective)}
                          <h4 className="font-semibold text-gray-800">
                            {impression.title}
                          </h4>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {impression.wordCount}字
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {impression.perspective}
                      </p>
                    </div>

                    {/* コンテンツ */}
                    <div className="p-4">
                      <p className="text-gray-700 leading-relaxed">
                        {impression.content}
                      </p>
                    </div>

                    {/* 選択状態インジケーター */}
                    {selectedImpression === index && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 詳細表示 */}
              {selectedImpression !== null && (
                <div className="mt-8 bg-white rounded-xl border-2 border-purple-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {getPerspectiveIcon(impressions[selectedImpression].perspective)}
                    <h3 className="text-xl font-semibold text-gray-800">
                      {impressions[selectedImpression].title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {impressions[selectedImpression].perspective}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {impressions[selectedImpression].content}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>文字数: {impressions[selectedImpression].wordCount}字</span>
                    <span>視点: {impressions[selectedImpression].perspective}</span>
                  </div>
                </div>
              )}

              {/* ヒント */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Star size={16} />
                  使い方のヒント
                </h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• 各インプレッションをクリックすると詳細表示されます</li>
                  <li>• 3つの異なる視点から会話を分析しています</li>
                  <li>• 再生成ボタンで新しい視点のインプレッションを生成できます</li>
                  <li>• 会話が長くなるほど、より詳細な分析が可能です</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 