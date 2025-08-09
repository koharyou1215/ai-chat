/**
 * チャットヘッダーのコンポーネント
 */
import React from 'react';
import { Settings, MessageSquare, Clock, Palette, Menu, Cloud, Activity } from 'lucide-react';
import { Character, UserPersona } from '../../../types/character';
import CharacterSelector from '../CharacterSelector';
import PersonaSelector from '../PersonaSelector';
import VoiceControls from '../VoiceControls';
import CharacterTrackerDisplay from '../CharacterTracker';

interface ChatHeaderProps {
  currentCharacter: Character | null;
  currentPersona: UserPersona | null;
  allCharacters: Character[];
  showTrackers: boolean;
  isSidebarOpen: boolean;
  onSelectCharacter: (character: Character) => void;
  onOpenCharacterModal: (character?: Character) => void;
  onOpenPersonaModal: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenQuickSettings: () => void;
  onOpenChatHistory: () => void;
  onOpenCharacterGallery: () => void;
  onToggleTrackers: () => void;
}

export default function ChatHeader({
  currentCharacter,
  currentPersona,
  allCharacters,
  showTrackers,
  isSidebarOpen,
  onSelectCharacter,
  onOpenCharacterModal,
  onOpenPersonaModal,
  onToggleSidebar,
  onOpenSettings,
  onOpenQuickSettings,
  onOpenChatHistory,
  onOpenCharacterGallery,
  onToggleTrackers
}: ChatHeaderProps) {
  return (
    <header className="border-b border-white/20 bg-black/30 backdrop-blur-md">
      <div className="flex items-center justify-between p-4">
        {/* 左側: メニューボタン */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors"
          title="サイドバーを開く"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* 中央: キャラクター情報 */}
        <div className="flex-1 flex items-center justify-center gap-4">
          {/* キャラクター選択 */}
          <CharacterSelector
            characters={allCharacters}
            currentCharacter={currentCharacter}
            onSelect={onSelectCharacter}
            onEditCharacter={onOpenCharacterModal}
          />

          {/* Persona選択 */}
          <PersonaSelector
            currentPersona={currentPersona}
            onSelectPersona={() => {}} // PersonaSelectorで内部処理
            onEditPersona={onOpenPersonaModal}
          />

          {/* 音声コントロール */}
          {currentCharacter && (
            <VoiceControls character={currentCharacter} />
          )}
        </div>

        {/* 右側: アクションボタン群 */}
        <div className="flex items-center gap-2">
          {/* 🚨 画面右上5つのアイコン関連 - 重要機能保護開始 🚨 */}
          
          {/* 1. 詳細設定 */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors"
            title="詳細設定"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* 2. クイック設定 */}
          <button
            onClick={onOpenQuickSettings}
            className="p-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors"
            title="クイック設定"
          >
            <Palette className="w-5 h-5" />
          </button>

          {/* 3. チャット履歴 */}
          <button
            onClick={onOpenChatHistory}
            className="p-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors"
            title="チャット履歴"
          >
            <Clock className="w-5 h-5" />
          </button>

          {/* 4. キャラクターギャラリー */}
          <button
            onClick={onOpenCharacterGallery}
            className="p-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors"
            title="キャラクターギャラリー"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* 5. トラッカー表示制御 */}
          <button
            onClick={onToggleTrackers}
            className={`
              p-2 rounded-lg border border-white/30 text-white transition-colors
              ${showTrackers ? 'bg-green-500/30 hover:bg-green-500/40' : 'bg-white/10 hover:bg-white/20'}
            `}
            title="トラッカー表示切替"
          >
            <Activity className="w-5 h-5" />
          </button>

          {/* 🚨 画面右上5つのアイコン関連 - 重要機能保護終了 🚨 */}
        </div>
      </div>

      {/* キャラクタートラッカー表示 */}
      {showTrackers && currentCharacter && (
        <div className="border-t border-white/10 bg-black/20 p-2">
          <CharacterTrackerDisplay 
            character={currentCharacter}
            compact={true}
          />
        </div>
      )}
    </header>
  );
}