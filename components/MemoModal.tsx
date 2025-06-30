'use client';

import { useState, useEffect } from 'react';
import { X, Save, Tag, Plus, MessageSquare, Brain, Star } from 'lucide-react';
import { ChatMemo } from '../types/character';
import { MemoryManager } from '../lib/memoryManager';

interface MemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  messageId: string;
  sessionId: string;
  characterId: string;
  existingMemo?: ChatMemo | null;
  onSave: (memo: ChatMemo) => void;
}

export default function MemoModal({
  isOpen,
  onClose,
  messageContent,
  messageId,
  sessionId,
  characterId,
  existingMemo,
  onSave
}: MemoModalProps) {
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAiMemory, setIsAiMemory] = useState(false);
  const [importance, setImportance] = useState(1);

  useEffect(() => {
    if (existingMemo) {
      setNote(existingMemo.note);
      setTags(existingMemo.tags);
      setIsAiMemory(existingMemo.isAiMemory || false);
      setImportance(existingMemo.importance || 1);
    } else {
      setNote('');
      setTags([]);
      setIsAiMemory(false);
      setImportance(1);
    }
    setNewTag('');
  }, [existingMemo, isOpen]);

  const handleSave = () => {
    if (!note.trim()) {
      alert('メモ内容を入力してください');
      return;
    }

    // 自動重要度計算（AIメモリの場合）
    const calculatedImportance = isAiMemory 
      ? MemoryManager.calculateImportance(note.trim(), tags)
      : importance;

    const memo: ChatMemo = {
      id: existingMemo?.id || crypto.randomUUID(),
      messageId,
      sessionId,
      characterId,
      content: messageContent,
      note: note.trim(),
      tags: tags,
      createdAt: existingMemo?.createdAt || Date.now(),
      updatedAt: Date.now(),
      isAiMemory,
      importance: calculatedImportance
    };

    onSave(memo);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <MessageSquare size={28} />
            {existingMemo ? 'メモ編集' : '新しいメモ'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* 元メッセージ */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">対象メッセージ</h3>
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {messageContent}
                </p>
              </div>
            </section>

            {/* メモ内容 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">メモ内容 *</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 resize-none"
                rows={6}
                placeholder="このメッセージについて覚えておきたいことを記録してください...

例：
- キャラクターの重要な設定情報
- ストーリーの転換点
- 感情的な重要なシーン
- 後で参照したい情報"
              />
              <p className="text-xs text-gray-500 mt-1">
                重要な会話内容や感想、後で思い出したいポイントを記録できます
              </p>
            </section>

            {/* タグ */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Tag size={20} />
                タグ
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    placeholder="タグを入力（例: 重要, 設定, 感情, ストーリー）"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    追加
                  </button>
                </div>

                {/* タグ表示 */}
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <div className="text-gray-500 text-sm py-2">
                      タグを追加して、メモを分類できます
                    </div>
                  )}
                </div>

                {/* よく使うタグ */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">よく使うタグ:</p>
                  <div className="flex flex-wrap gap-1">
                    {['重要', '設定', '感情', 'ストーリー', '性格', '関係性', '伏線', 'お気に入り'].map((suggestedTag) => (
                      <button
                        key={suggestedTag}
                        onClick={() => {
                          if (!tags.includes(suggestedTag)) {
                            setTags([...tags, suggestedTag]);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        disabled={tags.includes(suggestedTag)}
                      >
                        {suggestedTag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* AIメモリ設定 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Brain size={20} />
                AIメモリ設定
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isAiMemory"
                    checked={isAiMemory}
                    onChange={(e) => setIsAiMemory(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isAiMemory" className="text-gray-700 font-medium">
                    AIがこの情報を記憶として参照する
                  </label>
                </div>
                
                {isAiMemory && (
                  <div className="ml-7 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        重要度 <span className="text-gray-500">（自動計算されます）</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setImportance(level)}
                            className={`p-1 rounded ${
                              level <= (isAiMemory ? MemoryManager.calculateImportance(note, tags) : importance)
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                            disabled={isAiMemory}
                          >
                            <Star size={16} fill="currentColor" />
                          </button>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          {isAiMemory ? MemoryManager.calculateImportance(note, tags) : importance}/5
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>AIメモリとは？</strong><br />
                        AIがこの情報を今後の会話で参考にします。キャラクターの性格、好み、
                        過去の出来事などを記録することで、より一貫性のある会話が可能になります。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* プレビュー */}
            <section className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">プレビュー</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">メモ:</span>
                  <div className="text-gray-600 mt-1 whitespace-pre-wrap">
                    {note || '（メモが入力されていません）'}
                  </div>
                </div>
                {tags.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">タグ:</span>
                    <span className="text-gray-600 ml-2">
                      {tags.join(', ')}
                    </span>
                  </div>
                )}
                {isAiMemory && (
                  <div>
                    <span className="font-medium text-gray-700">AIメモリ:</span>
                    <span className="text-blue-600 ml-2">有効</span>
                    <span className="text-gray-600 ml-2">
                      (重要度: {isAiMemory ? MemoryManager.calculateImportance(note, tags) : importance}/5)
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {existingMemo ? '最終更新' : '作成'}: {new Date().toLocaleString()}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
} 