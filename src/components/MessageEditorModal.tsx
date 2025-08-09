import React, { useState, useEffect, useRef } from 'react';

interface MessageEditorModalProps {
  isOpen: boolean;
  initialText: string;
  onConfirm: (text: string) => void;
  onClose: () => void;
}

export function MessageEditorModal({ isOpen, initialText, onConfirm, onClose }: MessageEditorModalProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // モーダルを開いたタイミングだけ初期テキストを流し込み、
  // ユーザー編集中は親の再レンダーで上書きしない
  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      // 自動フォーカス
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl mx-4 p-6">
        <header className="pointer-events-none flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">✏️ メッセージを編集</h2>
          <button onClick={onClose} className="pointer-events-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </header>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={(e) => {
            const el = e.target as HTMLTextAreaElement;
            // キャレットを末尾に移動し全選択を防止
            const len = el.value.length;
            el.setSelectionRange(len, len);
          }}
          className="w-full h-60 md:h-80 p-4 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" style={{color:'#111'}}
          placeholder="編集してください"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => onConfirm(text)}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            挿入する
          </button>
        </div>
      </div>
    </div>
  );
}