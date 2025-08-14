import React from 'react';

interface ChatInputProps {
  message: string;
  setMessage: (msg: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ message, setMessage, onSend, isLoading }) => {
  return (
    <div className="chat-input">
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="メッセージを入力..."
        disabled={isLoading}
        className="w-full p-2 border rounded"
      />
      <button
        onClick={onSend}
        disabled={isLoading || !message.trim()}
        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        送信
      </button>
    </div>
  );
};

export default ChatInput;
