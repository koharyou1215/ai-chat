'use client';

import { useState } from 'react';
import { User, Plus, Edit, Trash2, Search, Package, ArrowLeft, Grid, List, RefreshCw, Layers, Bot, ArrowUpDown } from 'lucide-react';
import { Character } from '../types/character';

interface CharacterGalleryProps {
  characters: Character[];
  currentCharacter: Character | null;
  onSelectCharacter: (character: Character) => void;
  onAddCharacter: () => void;
  onEditCharacter: (character: Character) => void;
  onDeleteCharacter: (character: Character) => void;
  onImportExport?: () => void;
  onManualLoad?: () => void;
  onClose: () => void;
}

export default function CharacterGallery({
  characters,
  currentCharacter,
  onSelectCharacter,
  onAddCharacter,
  onEditCharacter,
  onDeleteCharacter,
  onImportExport,
  onManualLoad,
  onClose,
}: CharacterGalleryProps) {
  // ローカルストレージからソート設定を復元
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('character-gallery-view-mode') as 'grid' | 'list' || 'grid';
    }
    return 'grid';
  });
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular' | 'created' | 'updated'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('character-gallery-sort-by') as 'name' | 'recent' | 'popular' | 'created' | 'updated' || 'name';
    }
    return 'name';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('character-gallery-sort-order') as 'asc' | 'desc' || 'asc';
    }
    return 'asc';
  });
  const [showVariations, setShowVariations] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('character-gallery-show-variations') === 'true';
    }
    return false;
  });
  const [selectedBaseCharacter, setSelectedBaseCharacter] = useState<string | null>(null);

  // 設定変更時にローカルストレージに保存
  const handleSortByChange = (newSortBy: 'name' | 'recent' | 'popular' | 'created' | 'updated') => {
    setSortBy(newSortBy);
    localStorage.setItem('character-gallery-sort-by', newSortBy);
  };

  const handleSortOrderChange = (newSortOrder: 'asc' | 'desc') => {
    setSortOrder(newSortOrder);
    localStorage.setItem('character-gallery-sort-order', newSortOrder);
  };

  const handleViewModeChange = (newViewMode: 'grid' | 'list') => {
    setViewMode(newViewMode);
    localStorage.setItem('character-gallery-view-mode', newViewMode);
  };

  const handleShowVariationsChange = (newShowVariations: boolean) => {
    setShowVariations(newShowVariations);
    localStorage.setItem('character-gallery-show-variations', newShowVariations.toString());
  };

  // 全タグを取得（安全な処理）
  const allTags = Array.from(new Set((characters || []).flatMap(c => c.tags || [])));

  // バリエーション管理のヘルパー関数
  const getDisplayCharacters = () => {
    if (showVariations) {
      return characters || [];
    } else {
      // バリエーションでないキャラクターのみ表示
      return (characters || []).filter(character => !character.isVariation);
    }
  };

  // 特定のベースキャラクターのバリエーションを取得
  const getVariationsForCharacter = (baseName: string) => {
    return (characters || []).filter(character => 
      character.baseCharacterName === baseName || 
      (character.name === baseName && !character.isVariation)
    );
  };

  // フィルタリングとソート（安全な処理）
  const filteredCharacters = getDisplayCharacters()
    .filter(character => {
      const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           character.personality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           character.occupation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => character.tags?.includes(tag));
      
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'recent':
          // 最近使用された順（仮実装）
          comparison = 0;
          break;
        case 'popular':
          // 人気順（仮実装）
          comparison = 0;
          break;
        case 'created':
          // 登録順
          const aCreated = a.createdAt || 0;
          const bCreated = b.createdAt || 0;
          comparison = aCreated - bCreated;
          break;
        case 'updated':
          // 更新順
          const aUpdated = a.updatedAt || a.createdAt || 0;
          const bUpdated = b.updatedAt || b.createdAt || 0;
          comparison = aUpdated - bUpdated;
          break;
        default:
          comparison = 0;
      }
      
      // 昇順/降順の反転
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-3 md:p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
              <User size={20} className="md:w-7 md:h-7" />
              <span className="hidden sm:inline">キャラクターギャラリー</span>
              <span className="sm:hidden">ギャラリー</span>
            </h2>
            <span className="text-gray-500 text-sm md:text-base">({(filteredCharacters || []).length} / {(characters || []).length})</span>
          </div>
          
          <div className="flex items-center gap-2">
            {onManualLoad && (
              <button
                onClick={onManualLoad}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="手動でキャラクターを読み込み"
              >
                <RefreshCw size={20} />
              </button>
            )}
            {onImportExport && (
              <button
                onClick={onImportExport}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="インポート/エクスポート"
              >
                <Package size={20} />
              </button>
            )}
            <button
              onClick={onAddCharacter}
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 md:px-4 py-2 rounded-lg transition-colors flex items-center gap-1 md:gap-2"
            >
              <Plus size={16} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">新規作成</span>
              <span className="sm:hidden">作成</span>
            </button>
          </div>
        </div>

        {/* コンパクトなツールバー */}
        <div className="p-2 md:p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* 検索バー */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="検索（名前・職業・性格）"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                />
              </div>
            </div>

            {/* コントロール（1行に収める） */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* ソート */}
              <select
                value={sortBy}
                onChange={(e) => handleSortByChange(e.target.value as 'name' | 'recent' | 'popular' | 'created' | 'updated')}
                className="px-2 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white min-w-0 w-20 sm:w-auto"
              >
                <option value="name">名前</option>
                <option value="created">作成</option>
                <option value="updated">更新</option>
              </select>
              
              {/* 昇順/降順 */}
              <button
                onClick={() => handleSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-2 rounded-lg transition-colors ${
                  sortOrder === 'desc' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
                title={sortOrder === 'asc' ? '降順' : '昇順'}
              >
                <ArrowUpDown size={14} />
              </button>

              {/* ビューモード */}
              <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                  title="グリッド表示"
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                  title="リスト表示"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* タグフィルター（折りたたみ可能） */}
          {allTags.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex flex-wrap gap-1">
                {allTags.slice(0, 6).map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {allTags.length > 6 && (
                  <span className="text-gray-500 text-xs px-2 py-1">
                    +{allTags.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* キャラクター一覧（表示領域最大化） */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 min-h-0">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
              {filteredCharacters.map((character, idx) => (
                <CharacterCard
                  key={`${character.name}-${idx}`}
                  character={character}
                  isSelected={currentCharacter?.name === character.name}
                  onSelect={onSelectCharacter}
                  onEdit={onEditCharacter}
                  onDelete={onDeleteCharacter}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCharacters.map((character, idx) => (
                <CharacterListItem
                  key={`${character.name}-${idx}`}
                  character={character}
                  isSelected={currentCharacter?.name === character.name}
                  onSelect={onSelectCharacter}
                  onEdit={onEditCharacter}
                  onDelete={onDeleteCharacter}
                />
              ))}
            </div>
          )}

          {(filteredCharacters || []).length === 0 && (
            <div className="text-center py-12">
              <User size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                キャラクターが見つかりません
              </h3>
              <p className="text-gray-500">
                検索条件を変更するか、新しいキャラクターを作成してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// キャラクターカード（グリッド表示用）
function CharacterCard({ 
  character, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete 
}: {
  character: Character;
  isSelected: boolean;
  onSelect: (character: Character) => void;
  onEdit: (character: Character) => void;
  onDelete: (character: Character) => void;
}) {
  return (
    <div
      onClick={() => onSelect(character)}
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* アバター */}
      <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400 rounded-t-xl overflow-hidden">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={64} className="text-white/80" />
          </div>
        )}
        
        {/* アクションボタン */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔧 グリッド編集ボタンクリック:', character.name);
              onEdit(character);
            }}
            className="bg-white/80 hover:bg-white text-gray-600 hover:text-blue-600 p-1 rounded shadow transition-all"
            title="編集"
          >
            <Edit size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character);
            }}
            className="bg-white/80 hover:bg-white text-gray-600 hover:text-red-600 p-1 rounded shadow transition-all"
            title="削除"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* 選択状態 */}
        {isSelected && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
            選択中
          </div>
        )}

        {/* AIモデルバッジ */}
        {character.aiModel && (
          <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
            character.aiModel === 'gemini' ? 'bg-blue-500 text-white' :
            character.aiModel === 'claude' ? 'bg-orange-500 text-white' :
            character.aiModel === 'grok' ? 'bg-green-500 text-white' :
            'bg-gray-500 text-white'
          }`}>
            {character.aiModel.toUpperCase()}
          </div>
        )}
      </div>

      {/* 情報 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1 truncate">{character.name}</h3>
        <p className="text-gray-600 text-sm mb-2 truncate">
          {character.occupation || character.tags?.[0] || 'キャラクター'}
        </p>
        
        {/* タグ */}
        <div className="flex flex-wrap gap-1">
          {character.tags?.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
          {character.tags && character.tags.length > 3 && (
            <span className="text-gray-400 text-xs px-2 py-1">+{character.tags.length - 3}</span>
          )}
        </div>

        {/* 性格の一部 */}
        {character.personality && typeof character.personality === 'string' && (
          <p className="text-gray-500 text-xs mt-2 line-clamp-2">
            {character.personality}
          </p>
        )}
      </div>
    </div>
  );
}

// キャラクターリストアイテム（リスト表示用）
function CharacterListItem({ 
  character, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete 
}: {
  character: Character;
  isSelected: boolean;
  onSelect: (character: Character) => void;
  onEdit: (character: Character) => void;
  onDelete: (character: Character) => void;
}) {
  return (
    <div
      onClick={() => onSelect(character)}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* アバター */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
          {character.avatar_url ? (
            <img
              src={character.avatar_url}
              alt={character.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={32} className="text-white" />
          )}
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 truncate">{character.name}</h3>
            {isSelected && (
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                選択中
              </span>
            )}
            {/* AIモデルバッジ */}
            {character.aiModel && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                character.aiModel === 'gemini' ? 'bg-blue-500 text-white' :
                character.aiModel === 'claude' ? 'bg-orange-500 text-white' :
                character.aiModel === 'grok' ? 'bg-green-500 text-white' :
                'bg-gray-500 text-white'
              }`}>
                {character.aiModel.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-2">
            {character.occupation || character.tags?.[0] || 'キャラクター'}
          </p>
          
          {/* タグ */}
          <div className="flex flex-wrap gap-1">
            {character.tags?.slice(0, 5).map((tag, idx) => (
              <span
                key={idx}
                className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 性格の一部 */}
          {character.personality && typeof character.personality === 'string' && (
            <p className="text-gray-500 text-sm mt-2 line-clamp-1">
              {character.personality}
            </p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔧 リスト編集ボタンクリック:', character.name);
              onEdit(character);
            }}
            className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-all"
            title="編集"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character);
            }}
            className="text-gray-500 hover:text-red-600 p-1 rounded hover:bg-gray-100 transition-all"
            title="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
} 