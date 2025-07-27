// 💖 内心・本心分析専用モーダルコンポーネント
// ファイル: components/InnerHeartModal.tsx

'use client';

import { useState } from 'react';
import { X, RefreshCw, Heart, EyeOff, Sparkles, Brain, Users, Loader } from 'lucide-react';

interface InnerHeartImpression {
  title: string;
  content: string;
  perspective: string;
  emotionalDepth: number; // 1-10
  hiddenEmotion: string;
  innerThought: string;
  wordCount: number;
}

interface InnerHeartModalProps {
  isOpen: boolean;
  onClose: () => void;
  impressions: InnerHeartImpression[];
  isLoading: boolean;
  onRegenerate: () => void;
  characterName?: string;
  sessionTitle?: string;
}

export default function InnerHeartModal({
  isOpen,
  onClose,
  impressions,
  isLoading,
  onRegenerate,
  characterName,
  sessionTitle
}: InnerHeartModalProps) {
  const [selectedImpression, setSelectedImpression] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  if (!isOpen) return null;

  // 視点別アイコン取得
  const getPerspectiveIcon = (perspective: string) => {
    if (perspective.includes('内心') || perspective.includes('声')) {
      return <Brain size={20} className="text-pink-500" />;
    } else if (perspective.includes('隠れた') || perspective.includes('感情')) {
      return <Heart size={20} className="text-red-500" />;
    } else if (perspective.includes('潜在') || perspective.includes('本音')) {
      return <EyeOff size={20} className="text-purple-500" />;
    } else {
      return <Sparkles size={20} className="text-yellow-500" />;
    }
  };

  // 感情深度に応じた色取得
  const getDepthColor = (depth: number) => {
    if (depth >= 8) return 'from-purple-500 to-pink-600'; // 非常に深い
    if (depth >= 6) return 'from-pink-500 to-red-500';   // 深い
    if (depth >= 4) return 'from-red-400 to-pink-400';   // 中程度
    return 'from-pink-300 to-red-300';                   // 浅い
  };

  // 深度説明
  const getDepthDescription = (depth: number) => {
    if (depth >= 8) return '深層心理';
    if (depth >= 6) return '内面の奥';
    if (depth >= 4) return '心の中程';
    return '表層感情';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-pink-50 via-white to-purple-50 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border-2 border-pink-200">
        {/* ✨ 魔法的なヘッダー */}
        <div className="relative bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 p-6 text-white">
          {/* 背景エフェクト */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20"></div>
          <div className="absolute top-2 left-4">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-2 h-2 bg-white/30 rounded-full animate-pulse`} style={{animationDelay: `${i * 0.2}s`}}></div>
              ))}
            </div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Heart size={28} className="text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  💝 内心・本心分析
                  <Sparkles size={20} className="animate-spin" />
                </h2>
                <p className="text-pink-100">
                  {characterName}の心の奥を覗いてみましょう... 
                  <span className="text-white/70">({sessionTitle})</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onRegenerate}
                disabled={isLoading}
                className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                title="新しい内心を分析"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* 📱 タブナビゲーション */}
        <div className="border-b border-pink-200 bg-white/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-600 hover:text-pink-500'
              }`}
            >
              💖 概要分析
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-500'
              }`}
            >
              🔍 詳細分析
            </button>
          </div>
        </div>

        {/* 📄 メインコンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader size={48} className="animate-spin text-pink-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                💝 内心を分析中...
              </h3>
              <p className="text-gray-500 text-center">
                {characterName}の心の奥にある本当の気持ちを探っています...
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 🌟 分析サマリー */}
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Sparkles size={20} className="text-pink-600" />
                      内心分析結果
                    </h3>
                    <p className="text-gray-700">
                      {characterName}の心の3つの層から、隠された感情や本音を分析しました。
                      それぞれ異なる深度で、本当の気持ちが見えてきます。
                    </p>
                  </div>

                  {/* 💝 インプレッション一覧 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {impressions.map((impression, index) => (
                      <div
                        key={index}
                        className={`relative rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg transform hover:scale-105 ${
                          selectedImpression === index 
                            ? 'border-pink-400 shadow-xl scale-105' 
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                        onClick={() => setSelectedImpression(selectedImpression === index ? null : index)}
                      >
                        {/* グラデーション背景 */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${getDepthColor(impression.emotionalDepth)} opacity-10 rounded-xl`}></div>
                        
                        {/* ヘッダー */}
                        <div className="relative p-4 border-b border-gray-200">
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
                          <p className="text-sm text-gray-600 mb-2">
                            {impression.perspective}
                          </p>
                          {/* 感情深度メーター */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">深度:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full bg-gradient-to-r ${getDepthColor(impression.emotionalDepth)}`}
                                style={{ width: `${impression.emotionalDepth * 10}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-600 font-medium">{getDepthDescription(impression.emotionalDepth)}</span>
                          </div>
                        </div>

                        {/* コンテンツ */}
                        <div className="relative p-4">
                          <p className="text-gray-700 leading-relaxed mb-3">
                            {impression.content}
                          </p>
                          
                          {/* 💭 内心の声 */}
                          <div className="bg-pink-50 rounded-lg p-3 border-l-4 border-pink-300">
                            <p className="text-sm text-pink-700 italic">
                              💭 「{impression.innerThought}」
                            </p>
                            <p className="text-xs text-pink-500 mt-1">
                              隠れた感情: {impression.hiddenEmotion}
                            </p>
                          </div>
                        </div>

                        {/* 選択状態インジケーター */}
                        {selectedImpression === index && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                            <Heart size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'details' && selectedImpression !== null && (
                <div className="space-y-6">
                  {/* 詳細表示 */}
                  <div className="bg-white rounded-xl border-2 border-pink-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {getPerspectiveIcon(impressions[selectedImpression].perspective)}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {impressions[selectedImpression].title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {impressions[selectedImpression].perspective}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {impressions[selectedImpression].content}
                      </p>
                    </div>
                    
                    {/* 詳細情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-pink-50 rounded-lg p-4">
                        <h4 className="font-semibold text-pink-800 mb-2">💭 内心の声</h4>
                        <p className="text-pink-700 italic">「{impressions[selectedImpression].innerThought}」</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-800 mb-2">💝 隠れた感情</h4>
                        <p className="text-purple-700">{impressions[selectedImpression].hiddenEmotion}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <span>文字数: {impressions[selectedImpression].wordCount}字</span>
                      <span>感情深度: {impressions[selectedImpression].emotionalDepth}/10 ({getDepthDescription(impressions[selectedImpression].emotionalDepth)})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 🎯 使い方ガイド */}
              <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Users size={16} />
                  内心分析の読み方
                </h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• 💭 **内心の声**: キャラクターが心の中で思っていること</li>
                  <li>• 💝 **隠れた感情**: 表に出さない本当の気持ち</li>
                  <li>• 🔍 **感情深度**: 1-10で表す心理の深さ（10が最深）</li>
                  <li>• ✨ **カードをクリック**: 詳細な分析を表示</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
