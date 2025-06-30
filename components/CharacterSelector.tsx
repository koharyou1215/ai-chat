'use client';

import { useState } from 'react';
import { User, Plus, Edit, Trash2, Star, Package } from 'lucide-react';
import { Character } from '../types/character';

interface CharacterSelectorProps {
  characters: Character[];
  currentCharacter: Character | null;
  onSelectCharacter: (character: Character) => void;
  onAddCharacter: () => void;
  onEditCharacter: (character: Character) => void;
  onDeleteCharacter: (character: Character) => void;
  onImportExport?: () => void;
}

export default function CharacterSelector({
  characters,
  currentCharacter,
  onSelectCharacter,
  onAddCharacter,
  onEditCharacter,
  onDeleteCharacter,
  onImportExport
}: CharacterSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <User size={20} />
          キャラクター
        </h3>
        <div className="flex gap-1">
          {onImportExport && (
            <button
              onClick={onImportExport}
              className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="インポート/エクスポート"
            >
              <Package size={16} />
            </button>
          )}
          <button
            onClick={onAddCharacter}
            className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="キャラクター追加"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 現在のキャラクター */}
      {currentCharacter && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center">
              {currentCharacter.avatar_url ? (
                <img
                  src={currentCharacter.avatar_url}
                  alt={currentCharacter.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={24} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium">{currentCharacter.name}</h4>
              <p className="text-white/70 text-sm">
                {currentCharacter.tags[0] || currentCharacter.occupation || 'キャラクター'}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEditCharacter(currentCharacter)}
                className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="編集"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDeleteCharacter(currentCharacter)}
                className="text-white/70 hover:text-red-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* キャラクター一覧 */}
      <div className="space-y-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left text-white/70 hover:text-white text-sm font-medium transition-colors"
        >
          {isExpanded ? '▼' : '▶'} すべてのキャラクター ({characters.length})
        </button>

        {isExpanded && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {characters.map((character, idx) => {
              const isSelected = currentCharacter?.name === character.name;
              
              return (
                <div
                  key={`${character.name}-${idx}`}
                  onClick={() => onSelectCharacter(character)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-500/30 border border-blue-400/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                    {character.avatar_url ? (
                      <img
                        src={character.avatar_url}
                        alt={character.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-white font-medium truncate">{character.name}</h5>
                      {character.tags.includes('お気に入り') && (
                        <Star size={14} className="text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-white/60 text-xs truncate">
                      {character.occupation || character.tags[0] || 'キャラクター'}
                    </p>
                    
                    {/* タグ */}
                    {character.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {character.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="bg-white/20 text-white/70 px-2 py-0.5 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {character.tags.length > 2 && (
                          <span className="text-white/50 text-xs">
                            +{character.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCharacter(character);
                      }}
                      className="text-white/50 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                      title="編集"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCharacter(character);
                      }}
                      className="text-white/50 hover:text-red-300 p-1 rounded hover:bg-white/10 transition-colors"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {characters.length === 0 && (
              <div className="text-white/50 text-center py-4 text-sm">
                キャラクターがありません
              </div>
            )}
          </div>
        )}
      </div>

      {/* キャラクター追加ボタン */}
      <button
        onClick={onAddCharacter}
        className="w-full mt-4 py-3 border-2 border-dashed border-white/30 text-white/70 hover:border-white/50 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        新しいキャラクターを追加
      </button>
    </div>
  );
} 