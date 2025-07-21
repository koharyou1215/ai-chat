'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Trash2, Search, Clock, ArrowLeft, Grid, List, Calendar, Star } from 'lucide-react';
import { SessionSummary } from '../lib/historyManager';

interface ChatHistoryGalleryProps {
  sessions: SessionSummary[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onClose: () => void;
}

export default function ChatHistoryGallery({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onClose
}: ChatHistoryGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'duration' | 'messages'>('recent');

  // フィルタリングとソート（安全な処理）
  const filteredSessions = (sessions || [])
    .filter(session => {
      const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.characterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.updatedAt - a.updatedAt;
        case 'name':
          return a.title.localeCompare(b.title);
        case 'duration':
          // 会話時間は updatedAt - createdAt で計算
          const durationA = (a.updatedAt || 0) - (a.createdAt || 0);
          const durationB = (b.updatedAt || 0) - (b.createdAt || 0);
          return durationB - durationA;
        case 'messages':
          return (b.messageCount || 0) - (a.messageCount || 0);
        default:
          return 0;
      }
    });

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <MessageSquare size={28} />
              チャット履歴
            </h2>
            <span className="text-gray-500">({filteredSessions.length} / {sessions.length})</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectSession('new')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              新規チャット
            </button>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 検索 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="タイトル、キャラクター名、メッセージで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ソート・ビュー */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'duration' | 'messages')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="recent">最近の活動</option>
                <option value="name">タイトル順</option>
                <option value="duration">会話時間</option>
                <option value="messages">メッセージ数</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* チャット履歴一覧 */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {filteredSessions.map((session) => (
                <ChatHistoryCard
                  key={session.id}
                  session={session}
                  isSelected={currentSessionId === session.id}
                  onSelect={onSelectSession}
                  onDelete={onDeleteSession}
                  formatDuration={formatDuration}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <ChatHistoryListItem
                  key={session.id}
                  session={session}
                  isSelected={currentSessionId === session.id}
                  onSelect={onSelectSession}
                  onDelete={onDeleteSession}
                  formatDuration={formatDuration}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                チャット履歴が見つかりません
              </h3>
              <p className="text-gray-500">
                検索条件を変更するか、新しいチャットを開始してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// チャット履歴カード（グリッド表示用）
function ChatHistoryCard({ 
  session, 
  isSelected, 
  onSelect, 
  onDelete,
  formatDuration,
  formatDate
}: {
  session: SessionSummary;
  isSelected: boolean;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  formatDuration: (minutes: number) => string;
  formatDate: (timestamp?: number) => string;
}) {
  return (
    <div
      onClick={() => onSelect(session.id)}
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
        isSelected ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* ヘッダー */}
      <div className="relative h-32 bg-gradient-to-br from-green-400 to-blue-400 rounded-t-xl overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <MessageSquare size={48} className="text-white/80" />
        </div>
        
        {/* アクションボタン */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            className="bg-white/90 hover:bg-red-100 text-red-600 p-1 rounded-full transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* 選択状態 */}
        {isSelected && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
            現在のセッション
          </div>
        )}
      </div>

      {/* 情報 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1 truncate">{session.title}</h3>
        <p className="text-gray-600 text-sm mb-2 truncate">
          {session.characterName || 'キャラクター'}
        </p>
        
        {/* 統計情報 */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            {session.messageCount || 0}件
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {session.duration ? formatDuration(session.duration) : '--'}
          </span>
        </div>

        {/* 最終メッセージ */}
        {session.lastMessage && (
          <p className="text-gray-500 text-xs mt-2 line-clamp-2">
            {session.lastMessage}
          </p>
        )}

        {/* 最終活動時間 */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{formatDate(session.lastActivity)}</span>
          {session.favorite && <Star size={12} className="text-yellow-500" />}
        </div>
      </div>
    </div>
  );
}

// チャット履歴リストアイテム（リスト表示用）
function ChatHistoryListItem({ 
  session, 
  isSelected, 
  onSelect, 
  onDelete,
  formatDuration,
  formatDate
}: {
  session: SessionSummary;
  isSelected: boolean;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  formatDuration: (minutes: number) => string;
  formatDate: (timestamp?: number) => string;
}) {
  return (
    <div
      onClick={() => onSelect(session.id)}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border ${
        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* アイコン */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={32} className="text-white" />
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 truncate">{session.title}</h3>
            {isSelected && (
              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                現在のセッション
              </span>
            )}
            {session.favorite && <Star size={16} className="text-yellow-500" />}
          </div>
          <p className="text-gray-600 text-sm mb-2">
            {session.characterName || 'キャラクター'}
          </p>
          
          {/* 統計情報 */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <MessageSquare size={14} />
              {session.messageCount || 0}件
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {session.duration ? formatDuration(session.duration) : '--'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(session.lastActivity)}
            </span>
          </div>

          {/* 最終メッセージ */}
          {session.lastMessage && (
            <p className="text-gray-500 text-sm mt-2 line-clamp-1">
              {session.lastMessage}
            </p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
} 