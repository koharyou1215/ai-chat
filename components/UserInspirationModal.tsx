import React, { useEffect, useRef } from 'react';

interface UserInspirationModalProps {
  isOpen: boolean;
  candidates: string[];
  onSelect: (text: string) => void;
  onClose: () => void;
}

export function UserInspirationModal({ isOpen, candidates, onSelect, onClose }: UserInspirationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // モーダルが開いたときに最初のボタンにフォーカスを当てる
      setTimeout(() => {
        firstButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectCandidate = (candidate: string) => {
    onSelect(candidate);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2"
      onKeyDown={handleKeyDown}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-2xl w-full max-h-[90vh] shadow-2xl focus:outline-none"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* スクロール可能なコンテナ */}
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h2 
              id="modal-title"
              className="text-lg md:text-xl font-bold text-gray-900 dark:text-white"
            >
              ✨ 文章強化候補を選択
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="モーダルを閉じる"
            >
              ✕
            </button>
          </div>
          
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-4 px-2 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            会話の流れに合った文章強化候補です。選択後に編集できます。
          </p>
          
          <div className="space-y-3 pb-4">
            {candidates.map((candidate, index) => (
              <button
                key={index}
                ref={index === 0 ? firstButtonRef : undefined}
                onClick={() => handleSelectCandidate(candidate)}
                className="w-full p-3 md:p-4 text-left bg-gray-50 hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-blue-900/30 rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-700 transition-colors min-h-[3rem] flex items-start focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 dark:focus:bg-blue-900/30"
              >
                <div className="w-full">
                  <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                    ✨ 候補 {index + 1}
                  </div>
                  <div className="text-sm md:text-base text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                    {candidate}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 text-center sticky bottom-0 bg-white dark:bg-gray-800 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// デフォルトエクスポートと名前付きエクスポートの両方をサポート
export default UserInspirationModal;
