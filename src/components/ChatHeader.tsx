import { MessageCircle, Settings, Users, Lightbulb } from 'lucide-react';

interface Character {
  name: string;
}

interface Persona {
  name: string;
}

interface ChatHeaderProps {
  currentCharacter: Character | null;
  currentPersona: Persona | null;
  onOpenCharacterGallery: () => void;
  onOpenInspiration: () => void;
  onOpenSettings: () => void;
}

const ChatHeader = ({
  currentCharacter,
  currentPersona,
  onOpenCharacterGallery,
  onOpenInspiration,
  onOpenSettings,
}: ChatHeaderProps) => {
  return (
    <header className="px-3 py-2 animate-fade-in flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-blue-400 animate-pulse-icon" />
          <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Chat ✨
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* キャラクター選択ボタン（AI側） */}
          <div className="text-center">
            <button
              onClick={onOpenCharacterGallery}
              className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
            >
              <Users className="h-5 w-5 text-blue-400" />
            </button>
            <p className="text-xs text-gray-300 mt-1 max-w-[60px] truncate">AI: {currentCharacter?.name || '読み込み中...'}</p>
          </div>
          {/* 現在のペルソナ表示（ユーザー側） */}
          <div className="text-center px-2">
            <div className="text-xs text-gray-300">User:</div>
            <div className="text-sm text-white font-medium max-w-[80px] truncate">
              {currentPersona?.name || '読み込み中...'}
            </div>
          </div>
          {/* インスピレーションボタン */}
          <button
            onClick={onOpenInspiration}
            className="p-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm border border-yellow-400/30 rounded-full hover:from-yellow-400/30 hover:to-orange-400/30 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg animate-sparkle"
          >
            <Lightbulb className="h-5 w-5 text-yellow-400" />
          </button>
          {/* 設定ボタン */}
          <button
            onClick={onOpenSettings}
            className="p-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
          >
            <Settings className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
