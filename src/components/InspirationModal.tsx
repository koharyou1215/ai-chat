import React from 'react';

interface InspirationModalProps {
  isOpen: boolean;
  candidates: string[];
  onSelect: (text: string) => void;
  onClose: () => void;
}

export function InspirationModal({ isOpen, candidates, onSelect, onClose }: InspirationModalProps) {
  if (!isOpen) return null;

  const handleSelectCandidate = (candidate: string) => {
    onSelect(candidate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            返信候補を選択
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          {candidates.map((candidate, index) => (
            <button
              key={index}
              onClick={() => handleSelectCandidate(candidate)}
              className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg border transition-colors"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                候補 {index + 1}
              </div>
              <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {candidate}
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
} 