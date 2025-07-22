import React from 'react';
import { X, Plus, Clock, MessageSquare } from 'lucide-react';
import { SessionSummary } from '../../lib/historyManager'; // SessionSummary をインポート

interface ChatHistoryGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionSummary[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string, e?: React.MouseEvent) => void;
}

export default function ChatHistoryGallery({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
}: ChatHistoryGalleryProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
              <MessageSquare size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">チャット履歴ギャラリー</h2>
              <p className="text-gray-600 text-sm">過去の会話履歴を閲覧・管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectSession('new')} // 新しいチャットを開始
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="新しいチャット"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content - Session Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4" />
              <p className="text-lg">まだ履歴がありません。</p>
              <p className="text-sm">最初のメッセージを送信すると、ここに履歴が作成されます。</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-200 relative border-2 ${
                  currentSessionId === session.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full p-1"
                  title="履歴を削除"
                >
                  <X size={14} />
                </button>
                <h3 className="font-semibold text-gray-800 text-lg mb-1 truncate pr-8">
                  {session.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {session.lastMessage}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock size={12} className="mr-1" />
                  {new Date(session.updatedAt).toLocaleDateString('ja-JP', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
