'use client';

import { useState, useMemo } from 'react';
import { X, Search, Tag, Edit, Trash2, MessageSquare, Clock, StickyNote, User, Brain } from 'lucide-react';
import { ChatMemo } from '../types/character';

interface MemoListModalProps {
  isOpen: boolean;
  onClose: () => void;
  memos: ChatMemo[];
  currentCharacterId?: string;
  onEditMemo: (memo: ChatMemo) => void;
  onDeleteMemo: (memoId: string) => void;
  onJumpToMessage: (sessionId: string, messageId: string) => void;
}

export default function MemoListModal({
  isOpen,
  onClose,
  memos,
  currentCharacterId,
  onEditMemo,
  onDeleteMemo,
  onJumpToMessage
}: MemoListModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'tag'>('date');
  const [showAiMemoryOnly, setShowAiMemoryOnly] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState(currentCharacterId || '');

  // 全タグの取得
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    memos.forEach(memo => {
      memo.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [memos]);

  // 全キャラクターのリストを取得
  const allCharacterIds = useMemo(() => {
    const ids = new Set<string>();
    memos.forEach(memo => {
      if (memo.characterId) ids.add(memo.characterId);
    });
    return Array.from(ids).sort();
  }, [memos]);

  // フィルタ・検索されたメモ
  const filteredMemos = useMemo(() => {
    const filtered = memos.filter(memo => {
      const matchesSearch = !searchQuery || 
        memo.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = !selectedTag || memo.tags.includes(selectedTag);
      
      const matchesCharacter = !selectedCharacterId || memo.characterId === selectedCharacterId;
      
      const matchesAiMemory = !showAiMemoryOnly || memo.isAiMemory === true;
      
      return matchesSearch && matchesTag && matchesCharacter && matchesAiMemory;
    });

    // ソート
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return b.updatedAt - a.updatedAt;
      } else {
        const aTagString = a.tags.join(',');
        const bTagString = b.tags.join(',');
        return aTagString.localeCompare(bTagString);
      }
    });

    return filtered;
  }, [memos, searchQuery, selectedTag, sortBy]);

  const handleDeleteMemo = (memo: ChatMemo) => {
    if (confirm(`「${memo.note.slice(0, 50)}...」のメモを削除しますか？`)) {
      onDeleteMemo(memo.id);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const memoDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (memoDate.getTime() === today.getTime()) {
      return `今日 ${date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (memoDate.getTime() === yesterday.getTime()) {
      return `昨日 ${date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('ja-JP', { 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <StickyNote size={28} />
            メモ一覧
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-base font-normal">
              {filteredMemos.length}件
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 検索・フィルタ */}
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 検索 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                placeholder="メモを検索..."
              />
            </div>

                         {/* キャラクターフィルタ */}
             <div className="flex items-center gap-2">
               <User size={18} className="text-gray-500" />
               <select
                 value={selectedCharacterId}
                 onChange={(e) => setSelectedCharacterId(e.target.value)}
                 className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
               >
                 <option value="">全キャラクター</option>
                 {allCharacterIds.map(characterId => (
                   <option key={characterId} value={characterId}>{characterId}</option>
                 ))}
               </select>
             </div>

             {/* タグフィルタ */}
             <div className="flex items-center gap-2">
               <Tag size={18} className="text-gray-500" />
               <select
                 value={selectedTag}
                 onChange={(e) => setSelectedTag(e.target.value)}
                 className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
               >
                 <option value="">全てのタグ</option>
                 {allTags.map(tag => (
                   <option key={tag} value={tag}>{tag}</option>
                 ))}
               </select>
             </div>

             {/* AIメモリフィルタ */}
             <div className="flex items-center gap-2">
               <input
                 type="checkbox"
                 id="aiMemoryFilter"
                 checked={showAiMemoryOnly}
                 onChange={(e) => setShowAiMemoryOnly(e.target.checked)}
                 className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
               />
               <label htmlFor="aiMemoryFilter" className="text-sm text-gray-700">
                 AIメモリのみ
               </label>
             </div>

            {/* ソート */}
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'tag')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              >
                <option value="date">更新日順</option>
                <option value="tag">タグ順</option>
              </select>
            </div>
          </div>
        </div>

        {/* メモリスト */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {filteredMemos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <StickyNote size={48} className="mb-4 opacity-50" />
              <p className="text-lg mb-2">
                {searchQuery || selectedTag ? '条件に一致するメモが見つかりません' : 'まだメモがありません'}
              </p>
              <p className="text-sm">
                {searchQuery || selectedTag ? '検索条件を変更してみてください' : '重要な会話にメモを追加してみましょう'}
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredMemos.map((memo) => (
                <div key={memo.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={16} className="text-blue-500" />
                        <span className="text-sm text-gray-500">
                          {formatDate(memo.updatedAt)}
                        </span>
                        {memo.createdAt !== memo.updatedAt && (
                          <span className="text-xs text-gray-400">(編集済み)</span>
                        )}
                      </div>

                                             {/* タグとAIメモリ表示 */}
                       <div className="flex flex-wrap gap-1 mb-3">
                         {memo.isAiMemory && (
                           <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                             <Brain size={12} />
                             AIメモリ (重要度:{memo.importance || 1})
                           </span>
                         )}
                         {memo.tags.map((tag, index) => (
                           <span
                             key={index}
                             className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                           >
                             {tag}
                           </span>
                         ))}
                       </div>
                    </div>

                    {/* アクション */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onJumpToMessage(memo.sessionId, memo.messageId)}
                        className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="元メッセージにジャンプ"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={() => onEditMemo(memo)}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-50 transition-colors"
                        title="編集"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMemo(memo)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* メモ内容 */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {memo.note}
                    </p>
                  </div>

                  {/* 元メッセージ（省略表示） */}
                  <div className="border-l-4 border-gray-300 pl-3 py-1">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {memo.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50/50">
          <div className="text-sm text-gray-600">
            {memos.length > 0 && (
              <>
                全{memos.length}件のメモ
                {(searchQuery || selectedTag) && ` • ${filteredMemos.length}件を表示`}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
} 