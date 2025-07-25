'use client';

import { useState } from 'react';
import { User, Plus, Edit, Trash2, Search, Package, ArrowLeft, Grid, List } from 'lucide-react';
import { Character } from '../types/character';

interface CharacterGalleryProps {
  characters: Character[];
  currentCharacter: Character | null;
  onSelectCharacter: (character: Character) => void;
  onAddCharacter: () => void;
  onEditCharacter: (character: Character) => void;
  onDeleteCharacter: (character: Character) => void;
  onImportExport?: () => void;
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
  onClose,
}: CharacterGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular'>('name');

  // 全タグを取得（安全な処理）
  const allTags = Array.from(new Set((characters || []).flatMap(c => c.tags || [])));

  // フィルタリングとソート（安全な処理）
  const filteredCharacters = (characters || [])
    .filter(character => {
      const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           character.personality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           character.occupation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => character.tags?.includes(tag));
      
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          // 最近使用された順（仮実装）
          return 0;
        case 'popular':
          // 人気順（仮実装）
          return 0;
        default:
          return 0;
      }
    });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
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
              <User size={28} />
              キャラクターギャラリー
            </h2>
            <span className="text-gray-500">({(filteredCharacters || []).length} / {(characters || []).length})</span>
          </div>
          
          <div className="flex items-center gap-2">
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
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              新規作成
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
                  placeholder="キャラクター名、性格、職業で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* タグフィルター */}
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 8).map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev => 
                      prev.includes(tag) 
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {(allTags || []).length > 8 && (
                <span className="text-gray-500 text-sm px-3 py-1">
                  +{(allTags || []).length - 8} more
                </span>
              )}
            </div>
          </div>

          {/* ソート・ビュー */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'recent' | 'popular')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">名前順</option>
                <option value="recent">最近使用</option>
                <option value="popular">人気順</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* キャラクター一覧 */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
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
              onEdit(character);
            }}
            className="bg-white/90 hover:bg-white text-gray-700 p-1 rounded-full transition-colors"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character);
            }}
            className="bg-white/90 hover:bg-red-100 text-red-600 p-1 rounded-full transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* 選択状態 */}
        {isSelected && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
            選択中
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
        {character.personality && (
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
          {character.personality && (
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
              onEdit(character);
            }}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character);
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