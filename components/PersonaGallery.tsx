'use client';

import { useState } from 'react';
import { User, Plus, Edit, Trash2, Search, Brain, ArrowLeft, Grid, List, Package } from 'lucide-react';
import { UserPersona } from '../types/character';

interface PersonaGalleryProps {
  personas: UserPersona[];
  currentPersona: UserPersona | null;
  onSelectPersona: (persona: UserPersona) => void;
  onAddPersona: () => void;
  onEditPersona: (persona: UserPersona) => void;
  onDeletePersona: (persona: UserPersona) => void;
  onImportExport?: () => void;
  onClose: () => void;
}

export default function PersonaGallery({
  personas,
  currentPersona,
  onSelectPersona,
  onAddPersona,
  onEditPersona,
  onDeletePersona,
  onImportExport,
  onClose
}: PersonaGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular'>('name');

  // フィルタリングとソート
  const filteredPersonas = personas
    .filter(persona => {
      const matchesSearch = persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           persona.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           persona.role?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
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
              <Brain size={28} />
              ペルソナギャラリー
            </h2>
            <span className="text-gray-500">({filteredPersonas.length} / {personas.length})</span>
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
              onClick={onAddPersona}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
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
                  placeholder="ペルソナ名、説明、役割で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ソート・ビュー */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'recent' | 'popular')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                  viewMode === 'grid' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* ペルソナ一覧 */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPersonas.map((persona, idx) => (
                <PersonaCard
                  key={`${persona.name}-${idx}`}
                  persona={persona}
                  isSelected={currentPersona?.name === persona.name}
                  onSelect={onSelectPersona}
                  onEdit={onEditPersona}
                  onDelete={onDeletePersona}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPersonas.map((persona, idx) => (
                <PersonaListItem
                  key={`${persona.name}-${idx}`}
                  persona={persona}
                  isSelected={currentPersona?.name === persona.name}
                  onSelect={onSelectPersona}
                  onEdit={onEditPersona}
                  onDelete={onDeletePersona}
                />
              ))}
            </div>
          )}

          {filteredPersonas.length === 0 && (
            <div className="text-center py-12">
              <Brain size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                ペルソナが見つかりません
              </h3>
              <p className="text-gray-500">
                検索条件を変更するか、新しいペルソナを作成してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ペルソナカード（グリッド表示用）
function PersonaCard({ 
  persona, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete 
}: {
  persona: UserPersona;
  isSelected: boolean;
  onSelect: (persona: UserPersona) => void;
  onEdit: (persona: UserPersona) => void;
  onDelete: (persona: UserPersona) => void;
}) {
  return (
    <div
      onClick={() => onSelect(persona)}
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
        isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* ヘッダー */}
      <div className="relative h-32 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-t-xl overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <Brain size={48} className="text-white/80" />
        </div>
        
        {/* アクションボタン */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(persona);
            }}
            className="bg-white/90 hover:bg-white text-gray-700 p-1 rounded-full transition-colors"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(persona);
            }}
            className="bg-white/90 hover:bg-red-100 text-red-600 p-1 rounded-full transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* 選択状態 */}
        {isSelected && (
          <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs">
            選択中
          </div>
        )}
      </div>

      {/* 情報 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1 truncate">{persona.name}</h3>
        <p className="text-gray-600 text-sm mb-2 truncate">
          {persona.role || 'ペルソナ'}
        </p>
        
        {/* 説明の一部 */}
        {persona.description && (
          <p className="text-gray-500 text-xs mt-2 line-clamp-3">
            {persona.description}
          </p>
        )}

        {/* 特徴 */}
        {persona.traits && persona.traits.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {persona.traits.slice(0, 3).map((trait, idx) => (
              <span
                key={idx}
                className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
              >
                {trait}
              </span>
            ))}
            {persona.traits.length > 3 && (
              <span className="text-gray-400 text-xs px-2 py-1">+{persona.traits.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ペルソナリストアイテム（リスト表示用）
function PersonaListItem({ 
  persona, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete 
}: {
  persona: UserPersona;
  isSelected: boolean;
  onSelect: (persona: UserPersona) => void;
  onEdit: (persona: UserPersona) => void;
  onDelete: (persona: UserPersona) => void;
}) {
  return (
    <div
      onClick={() => onSelect(persona)}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border ${
        isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* アイコン */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center flex-shrink-0">
          <Brain size={32} className="text-white" />
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 truncate">{persona.name}</h3>
            {isSelected && (
              <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs">
                選択中
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-2">
            {persona.role || 'ペルソナ'}
          </p>
          
          {/* 特徴 */}
          {persona.traits && persona.traits.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {persona.traits.slice(0, 5).map((trait, idx) => (
                <span
                  key={idx}
                  className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
                >
                  {trait}
                </span>
              ))}
            </div>
          )}

          {/* 説明の一部 */}
          {persona.description && (
            <p className="text-gray-500 text-sm mt-2 line-clamp-1">
              {persona.description}
            </p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(persona);
            }}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(persona);
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