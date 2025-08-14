import { Lightbulb, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

interface Character {
  name: string;
  tags?: string[];
  customIconUrl?: string;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  currentCharacter: Character | null;
}

const ChatMessageList = ({ messages, isLoading, currentCharacter }: ChatMessageListProps) => {
  return (
    <div className="flex-1 px-2 py-2 overflow-y-auto min-h-0 relative">
      <div className="space-y-2 relative z-10">
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <Lightbulb className="h-12 w-12 text-yellow-400 mx-auto mb-3 animate-bounce-dot" />
            <p className="text-gray-300">何か話しかけてみてください！</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up gap-3 items-end`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* AIメッセージの場合、左側にキャラクターアイコン */}
            {msg.sender === 'ai' && (
              <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex-shrink-0">
                {currentCharacter?.customIconUrl ? (
                  <img 
                    src={currentCharacter.customIconUrl} 
                    alt="Character Icon" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg">
                    {currentCharacter?.tags?.includes('狼娘') ? '🐺' :
                     currentCharacter?.tags?.includes('魔王') ? '👑' :
                     currentCharacter?.tags?.includes('盗賊') ? '🗡️' :
                     currentCharacter?.tags?.includes('探偵') ? '🔍' :
                     '🤖'}
                  </span>
                )}
              </div>
            )}
            <div
              className={`max-w-[60%] p-4 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
              }`}
            >
              <p className="text-sm opacity-75 mb-1">
                {msg.sender === 'user' ? 'あなた' : (currentCharacter?.name || 'AI')}
              </p>
              <p>{msg.text}</p>
            </div>
            {/* ユーザーメッセージの場合、右側にユーザーアイコン */}
            {msg.sender === 'user' && (
              <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-500/20 to-blue-500/20 flex-shrink-0">
                <User className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-slide-up">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-gray-300 text-sm">AIが考えています...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageList;
