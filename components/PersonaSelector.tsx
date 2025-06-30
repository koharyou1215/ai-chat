'use client';

import { useState } from 'react';
import { User, Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { UserPersona } from '../types/character';

interface PersonaSelectorProps {
  personas: UserPersona[];
  currentPersona: UserPersona | null;
  onSelectPersona: (persona: UserPersona | null) => void;
  onAddPersona: () => void;
  onEditPersona: (persona: UserPersona) => void;
  onDeletePersona: (persona: UserPersona) => void;
}

export default function PersonaSelector({
  personas,
  currentPersona,
  onSelectPersona,
  onAddPersona,
  onEditPersona,
  onDeletePersona
}: PersonaSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-white font-semibold hover:text-white/80 transition-colors"
        >
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <User size={18} />
          Persona設定
        </button>
        <button
          onClick={onAddPersona}
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Persona追加"
        >
          <Plus size={16} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* 現在のPersona */}
          <div className="space-y-2">
            <div className="text-white/70 text-sm font-medium">現在のPersona:</div>
            
            {/* なしオプション */}
            <div
              onClick={() => onSelectPersona(null)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                !currentPersona
                  ? 'bg-blue-500/30 border border-blue-400/50'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">設定なし</div>
                <div className="text-white/60 text-xs">デフォルトのAI動作</div>
              </div>
            </div>

            {/* Persona一覧 */}
            {personas.map((persona) => {
              const isSelected = currentPersona?.id === persona.id;
              
              return (
                <div
                  key={persona.id}
                  onClick={() => onSelectPersona(persona)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-500/30 border border-blue-400/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{persona.name}</div>
                    <div className="text-white/60 text-xs truncate">
                      {persona.likes.length > 0 && (
                        <span>好き: {persona.likes.slice(0, 2).join(', ')}</span>
                      )}
                      {persona.likes.length > 2 && <span> +{persona.likes.length - 2}</span>}
                      {persona.likes.length === 0 && <span>設定なし</span>}
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPersona(persona);
                      }}
                      className="text-white/50 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                      title="編集"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePersona(persona);
                      }}
                      className="text-white/50 hover:text-red-300 p-1 rounded hover:bg-white/10 transition-colors"
                      title="削除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Persona追加ボタン */}
          <button
            onClick={onAddPersona}
            className="w-full py-2 border border-dashed border-white/30 text-white/70 hover:border-white/50 hover:text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            新しいPersonaを追加
          </button>

          {/* 現在のPersona詳細 */}
          {currentPersona && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mt-3">
              <div className="text-white/70 text-xs font-medium mb-2">現在選択中:</div>
              <div className="space-y-1 text-xs">
                <div className="text-white font-medium">{currentPersona.name}</div>
                {currentPersona.likes.length > 0 && (
                  <div className="text-white/70">
                    <span className="text-green-300">好き:</span> {currentPersona.likes.join(', ')}
                  </div>
                )}
                {currentPersona.dislikes.length > 0 && (
                  <div className="text-white/70">
                    <span className="text-red-300">嫌い:</span> {currentPersona.dislikes.join(', ')}
                  </div>
                )}
                {currentPersona.other_settings && (
                  <div className="text-white/70 mt-2 text-xs">
                    <div className="bg-white/10 rounded p-2 max-h-20 overflow-y-auto">
                      {currentPersona.other_settings}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {personas.length === 0 && (
            <div className="text-white/50 text-center py-4 text-sm">
              Personaがまだ設定されていません
            </div>
          )}
        </div>
      )}
    </div>
  );
} 