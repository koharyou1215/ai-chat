'use client';

import { useState } from 'react';
import { X, FileText, Users, MessageCircle, TrendingUp, Quote, BarChart3, Clock, Save } from 'lucide-react';

interface ChatSummary {
  overview: string;
  keyPoints: string[];
  characterInsights: string[];
  emotionalFlow: string;
  topics: string[];
  userEngagement: string;
  memorableQuotes: string[];
  stats: {
    messageCount: number;
    userMessageCount: number;
    aiMessageCount: number;
    wordCount: number;
    averageMessageLength: number;
    conversationDuration: number;
  };
  generatedAt: number;
}

interface ChatSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ChatSummary | null;
  isLoading: boolean;
  sessionTitle: string;
  characterName: string;
  onSaveSummary?: (summary: ChatSummary) => void;
}

export default function ChatSummaryModal({
  isOpen,
  onClose,
  summary,
  isLoading,
  sessionTitle,
  characterName,
  onSaveSummary
}: ChatSummaryModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'stats'>('overview');

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分`;
    } else {
      return '1分未満';
    }
  };

  const handleSave = () => {
    if (summary && onSaveSummary) {
      onSaveSummary(summary);
      alert('要約を保存しました！');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <FileText size={28} />
              会話要約
            </h2>
            <p className="text-gray-600 mt-1">
              {sessionTitle} - {characterName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {summary && onSaveSummary && (
              <button
                onClick={handleSave}
                className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"
                title="要約を保存"
              >
                <Save size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <MessageCircle size={16} className="inline mr-2" />
            概要・要点
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <TrendingUp size={16} className="inline mr-2" />
            分析・洞察
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <BarChart3 size={16} className="inline mr-2" />
            統計情報
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">会話を分析中...</p>
              <p className="text-gray-500 text-sm mt-2">AIが会話の内容を詳しく分析しています</p>
            </div>
          ) : summary ? (
            <>
              {/* 概要・要点タブ */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 全体概要 */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText size={20} />
                      会話の概要
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-gray-800 leading-relaxed">{summary.overview}</p>
                    </div>
                  </section>

                  {/* 重要ポイント */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <TrendingUp size={20} />
                      重要なポイント
                    </h3>
                    <div className="space-y-2">
                      {summary.keyPoints.map((point, index) => (
                        <div key={index} className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                          <p className="text-gray-800">{point}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 話題 */}
                  {summary.topics && summary.topics.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <MessageCircle size={20} />
                        話題
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {summary.topics.map((topic, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* 分析・洞察タブ */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {/* キャラクター洞察 */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Users size={20} />
                      キャラクター分析
                    </h3>
                    <div className="space-y-3">
                      {summary.characterInsights.map((insight, index) => (
                        <div key={index} className="bg-indigo-50 rounded-lg p-3 border-l-4 border-indigo-500">
                          <p className="text-gray-800">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 感情の流れ */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <TrendingUp size={20} />
                      感情の流れ
                    </h3>
                    <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                      <p className="text-gray-800 leading-relaxed">{summary.emotionalFlow}</p>
                    </div>
                  </section>

                  {/* ユーザーエンゲージメント */}
                  {summary.userEngagement && (
                    <section>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Users size={20} />
                        ユーザーエンゲージメント
                      </h3>
                      <div className="bg-pink-50 rounded-lg p-4 border-l-4 border-pink-500">
                        <p className="text-gray-800 leading-relaxed">{summary.userEngagement}</p>
                      </div>
                    </section>
                  )}

                  {/* 印象的な発言 */}
                  {summary.memorableQuotes && summary.memorableQuotes.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Quote size={20} />
                        印象的な発言
                      </h3>
                      <div className="space-y-3">
                        {summary.memorableQuotes.map((quote, index) => (
                          <div key={index} className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-500">
                            <p className="text-gray-800 italic">&quot;{quote}&quot;</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* 統計情報タブ */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">総メッセージ数</p>
                          <p className="text-2xl font-bold text-blue-800">{summary.stats.messageCount}</p>
                        </div>
                        <MessageCircle className="text-blue-500" size={24} />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">ユーザーメッセージ</p>
                          <p className="text-2xl font-bold text-green-800">{summary.stats.userMessageCount}</p>
                        </div>
                        <Users className="text-green-500" size={24} />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm font-medium">AIメッセージ</p>
                          <p className="text-2xl font-bold text-purple-800">{summary.stats.aiMessageCount}</p>
                        </div>
                        <FileText className="text-purple-500" size={24} />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 text-sm font-medium">総文字数</p>
                          <p className="text-2xl font-bold text-orange-800">
                            {summary.stats.wordCount.toLocaleString()}
                          </p>
                        </div>
                        <BarChart3 className="text-orange-500" size={24} />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-teal-600 text-sm font-medium">平均メッセージ長</p>
                          <p className="text-2xl font-bold text-teal-800">
                            {summary.stats.averageMessageLength}文字
                          </p>
                        </div>
                        <TrendingUp className="text-teal-500" size={24} />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-pink-600 text-sm font-medium">会話時間</p>
                          <p className="text-2xl font-bold text-pink-800">
                            {formatDuration(summary.stats.conversationDuration)}
                          </p>
                        </div>
                        <Clock className="text-pink-500" size={24} />
                      </div>
                    </div>
                  </div>

                  {/* 要約情報 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">要約情報</h3>
                    <div className="text-sm text-gray-600">
                      <p>生成日時: {new Date(summary.generatedAt).toLocaleString()}</p>
                      <p className="mt-1">この要約はAIによって自動生成されました</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="text-lg mb-2">要約を生成できませんでした</p>
              <p className="text-sm">しばらく時間をおいて再度お試しください</p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
} 