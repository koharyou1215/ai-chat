// 📋 モバイル専用メモリスト表示システム
// iPhone Safari最適化、スワイプアクション対応

'use client';

import { useState } from 'react';
import { 
  Trash2,
  Edit,
  Star,
  Search,
  Filter,
  ChevronDown,
  MessageSquare,
  BookOpen,
  Heart,
  Zap,
  FileText,
  Edit3,
  ChevronRight
} from 'lucide-react';

interface ChatMemo {
  id: string;
  messageId: string;
  sessionId: string;
  content: string;
  timestamp: number;
  category?: string;
  isImportant?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  characterName?: string;
}

interface MobileMemoListProps {
  memos: ChatMemo[];
  messages: ChatMessage[];
  onMemoEdit: (memoId: string, newContent: string) => void;
  onMemoDelete: (memoId: string) => void;
  onMemoToggleImportant: (memoId: string) => void;
  className?: string;
}

// 🎨 カテゴリアイコンマッピング
const categoryIcons = {
  '一般': { icon: FileText, color: 'bg-blue-500', textColor: 'text-blue-700' },
  '重要': { icon: Star, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  '感情': { icon: Heart, color: 'bg-pink-500', textColor: 'text-pink-700' },
  'アイデア': { icon: Zap, color: 'bg-purple-500', textColor: 'text-purple-700' },
  '設定': { icon: Edit3, color: 'bg-green-500', textColor: 'text-green-700' }
};

// 🔧 日時フォーマット関数
function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return '数分前';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}時間前`;
  } else if (diffInHours < 48) {
    return '昨日';
  } else {
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });
  }
}

// 📱 メモカード（スワイプアクション対応）
function MemoCard({ 
  memo, 
  relatedMessage, 
  onEdit, 
  onDelete, 
  onToggleImportant 
}: {
  memo: ChatMemo;
  relatedMessage?: ChatMessage;
  onEdit: () => void;
  onDelete: () => void;
  onToggleImportant: () => void;
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isActionVisible, setIsActionVisible] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const categoryInfo = categoryIcons[memo.category as keyof typeof categoryIcons] || categoryIcons['一般'];
  const IconComponent = categoryInfo.icon;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (diff > 0 && diff < 150) {
      setSwipeOffset(diff);
      setIsActionVisible(diff > 50);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 100) {
      setSwipeOffset(150);
      setIsActionVisible(true);
    } else {
      setSwipeOffset(0);
      setIsActionVisible(false);
    }
    setTouchStart(0);
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 mb-3">
      {/* 🌊 スワイプアクションボタン */}
      <div className={`absolute right-0 top-0 h-full flex items-center transition-opacity duration-200 ${isActionVisible ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={onEdit}
          className="h-full px-4 bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"
          style={{ minWidth: '48px' }}
        >
          <Edit size={16} />
        </button>
        <button
          onClick={onToggleImportant}
          className={`h-full px-4 text-white flex items-center justify-center transition-colors ${memo.isImportant ? 'bg-gray-500 hover:bg-gray-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          style={{ minWidth: '48px' }}
        >
          <Star size={16} className={memo.isImportant ? '' : 'fill-transparent'} />
        </button>
        <button
          onClick={onDelete}
          className="h-full px-4 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          style={{ minWidth: '48px' }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* 📄 メインコンテンツ */}
      <div
        className="relative transition-transform duration-200 ease-out p-4"
        style={{ 
          transform: `translateX(-${swipeOffset}px)`,
          touchAction: 'pan-y pinch-zoom'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        
        {/* ⭐ 重要マーク */}
        {memo.isImportant && (
          <div className="absolute top-2 right-2">
            <Star size={16} className="text-yellow-500 fill-current" />
          </div>
        )}

        {/* 🏷️ カテゴリとタイムスタンプ */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-full ${categoryInfo.color} flex items-center justify-center`}>
            <IconComponent size={12} className="text-white" />
          </div>
          <span className={`text-xs font-medium ${categoryInfo.textColor}`}>
            {memo.category || '一般'}
          </span>
          <span className="text-xs text-gray-500 ml-auto">
            {formatDateTime(memo.timestamp)}
          </span>
        </div>

        {/* 📝 メモ内容 */}
        <div className="mb-3">
          <p className="text-sm text-gray-800 leading-relaxed">
            {memo.content}
          </p>
        </div>

        {/* 💬 関連メッセージ */}
        {relatedMessage && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-gray-500" />
              <span className="text-xs text-gray-600">関連メッセージ</span>
            </div>
            <div className="bg-white rounded-md p-2 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">
                {relatedMessage.role === 'user' ? 'あなた' : relatedMessage.characterName || 'AI'}
              </div>
              <p className="text-xs text-gray-700 line-clamp-2">
                {relatedMessage.content}
              </p>
            </div>
          </div>
        )}

        {/* 💡 スワイプヒント */}
        {!isActionVisible && (
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-300">
            <ChevronRight size={16} />
          </div>
        )}
      </div>
    </div>
  );
}

// 🔍 フィルターパネル
function FilterPanel({ 
  categories, 
  selectedCategories, 
  onCategoryToggle, 
  showImportantOnly, 
  onImportantToggle,
  isOpen,
  onClose
}: {
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  showImportantOnly: boolean;
  onImportantToggle: () => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-end md:items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden animate-slide-up">
        
        {/* ヘッダー */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">🔍 フィルター</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* フィルターオプション */}
        <div className="p-4 space-y-4">
          
          {/* 重要なメモのみ */}
          <div>
            <button
              onClick={onImportantToggle}
              className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${showImportantOnly ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}
              style={{ minHeight: '48px' }}
            >
              <Star size={16} className={showImportantOnly ? 'text-yellow-500 fill-current' : 'text-gray-400'} />
              <span className={`font-medium ${showImportantOnly ? 'text-yellow-700' : 'text-gray-700'}`}>
                重要なメモのみ表示
              </span>
            </button>
          </div>

          {/* カテゴリフィルター */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">カテゴリ</h4>
            <div className="space-y-2">
              {categories.map(category => {
                const categoryInfo = categoryIcons[category as keyof typeof categoryIcons] || categoryIcons['一般'];
                const IconComponent = categoryInfo.icon;
                const isSelected = selectedCategories.includes(category);
                
                return (
                  <button
                    key={category}
                    onClick={() => onCategoryToggle(category)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${isSelected ? `border-blue-400 bg-blue-50` : 'border-gray-200 hover:border-gray-300'}`}
                    style={{ minHeight: '48px' }}
                  >
                    <div className={`w-6 h-6 rounded-full ${categoryInfo.color} flex items-center justify-center`}>
                      <IconComponent size={12} className="text-white" />
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                      {category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 📱 メインコンポーネント
export default function MobileMemoList({
  memos,
  messages,
  onMemoEdit,
  onMemoDelete,
  onMemoToggleImportant
}: MobileMemoListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showImportantOnly, setShowImportantOnly] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 🏷️ 利用可能なカテゴリを取得
  const availableCategories = Array.from(new Set(memos.map(memo => memo.category || '一般')));

  // 🔍 フィルタリングされたメモ
  const filteredMemos = memos.filter(memo => {
    // テキスト検索
    if (searchQuery && !memo.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // カテゴリフィルター
    if (selectedCategories.length > 0 && !selectedCategories.includes(memo.category || '一般')) {
      return false;
    }
    
    // 重要なメモフィルター
    if (showImportantOnly && !memo.isImportant) {
      return false;
    }
    
    return true;
  }).sort((a, b) => b.timestamp - a.timestamp); // 新しい順にソート

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // メッセージマップを作成（高速検索用）
  const messageMap = messages.reduce((map, message) => {
    map[message.id] = message;
    return map;
  }, {} as Record<string, ChatMessage>);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      
      {/* 🔍 検索・フィルターヘッダー */}
      <div className="bg-white border-b border-gray-200 p-4 space-y-3">
        
        {/* 検索バー */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="メモを検索..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            style={{ fontSize: '16px' }} // iPhone Safari ズーム防止
          />
        </div>

        {/* フィルターボタンとアクティブフィルター表示 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilterPanel(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            style={{ minHeight: '44px' }}
          >
            <Filter size={16} />
            <span className="text-sm font-medium">フィルター</span>
            {(selectedCategories.length > 0 || showImportantOnly) && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>

          <div className="text-sm text-gray-600">
            {filteredMemos.length}件のメモ
          </div>
        </div>

        {/* アクティブフィルター表示 */}
        {(selectedCategories.length > 0 || showImportantOnly) && (
          <div className="flex flex-wrap gap-2">
            {showImportantOnly && (
              <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                <Star size={12} className="fill-current" />
                重要
              </div>
            )}
            {selectedCategories.map(category => (
              <div key={category} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs">
                {category}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📋 メモリスト */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMemos.length > 0 ? (
          <div className="space-y-3">
            {filteredMemos.map(memo => (
              <MemoCard
                key={memo.id}
                memo={memo}
                relatedMessage={messageMap[memo.messageId]}
                onEdit={() => {
                  // TODO: 編集モーダルを開く
                  console.log('Edit memo:', memo.id);
                }}
                onDelete={() => onMemoDelete(memo.id)}
                onToggleImportant={() => onMemoToggleImportant(memo.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <BookOpen size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              {searchQuery || selectedCategories.length > 0 || showImportantOnly 
                ? 'メモが見つかりません' 
                : 'まだメモがありません'
              }
            </h3>
            <p className="text-sm text-gray-400">
              {searchQuery || selectedCategories.length > 0 || showImportantOnly
                ? 'フィルターを調整して再検索してください'
                : 'メモボタンから最初のメモを作成しましょう'
              }
            </p>
          </div>
        )}
      </div>

      {/* 🔍 フィルターパネル */}
      <FilterPanel
        categories={availableCategories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        showImportantOnly={showImportantOnly}
        onImportantToggle={() => setShowImportantOnly(!showImportantOnly)}
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
      />

      {/* CSS */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
