'use client';

import { useState, useEffect } from 'react';
import { X, Save, Tag, Plus, MessageSquare, Brain, Star, Sparkles } from 'lucide-react';
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
  // 案B: メモ内容欄は廃止し、AI要約テキストを編集可能フィールドで保持
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAiMemory, setIsAiMemory] = useState(false);
  const [importance, setImportance] = useState(1);

  useEffect(() => {
    if (existingMemo) {
      setSummary(existingMemo.note || '');
      setContent(existingMemo.content || '');
      setTags(existingMemo.tags);
      setIsAiMemory(existingMemo.isAiMemory || false);
      setImportance(existingMemo.importance || 1);
    } else {
      setSummary('');
      setContent(messageContent || '');
      setTags([]);
      setIsAiMemory(false);
      setImportance(1);
    }
    setNewTag('');
  }, [existingMemo, isOpen, messageContent]);

  const handleSave = () => {
    if (!summary.trim()) {
      alert('要約テキストが空です。「AIで要約」ボタンで作成するか、手入力してください。');
      return;
    }
    if (!content.trim()) {
      alert('メモ本文が空です。本文を入力してください。');
      return;
    }

    // 自動重要度計算（AIメモリの場合）
    const calculatedImportance = isAiMemory
      ? MemoryManager.calculateImportance(summary.trim(), tags)
      : importance;

    const memo: ChatMemo = {
      id: existingMemo?.id || crypto.randomUUID(),
      messageId,
      sessionId,
      characterId,
      content: content.trim(),
      note: summary.trim(), // 保存するのは要約テキスト
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

  // AIで要約（/api/generate-memo-title）呼び出し
  const generateSummary = async () => {
    try {
      const res = await fetch('/api/generate-memo-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          current: summary || '',
          maxLen: 30
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.title) {
        throw new Error(data?.error || '要約生成に失敗しました');
      }
      setSummary(data.title);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`要約生成に失敗しました: ${msg}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-[91]">
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] pb-32">
          <div className="space-y-6">
            {/* 対象メッセージ + 要約生成 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">対象メッセージ</h3>
                <button
                  type="button"
                  onClick={generateSummary}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1"
                  title="AIで要約（20〜30文字程度）"
                >
                  <Sparkles size={16} />
                  AIで要約
                </button>
              </div>

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メモ本文（編集可）*
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 min-h-[60px]"
                  placeholder="メモしたい本文を入力（例：AIの発言や重要な内容など）"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  保存時はこの本文がメモとして記録されます（最大500文字）
                </p>
              </div>

              {/* 生成結果（編集可） */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生成結果（編集可）*
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  placeholder="AI要約または手入力（例：緊張が高まる対峙シーン）"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  保存時はこのテキストがメモとして記録されます（最大60文字推奨）
                </p>
              </div>
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
                              level <= (isAiMemory ? MemoryManager.calculateImportance(summary, tags) : importance)
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                            disabled={isAiMemory}
                          >
                            <Star size={16} fill="currentColor" />
                          </button>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          {isAiMemory ? MemoryManager.calculateImportance(summary, tags) : importance}/5
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

            {/* プレビュー削除（案B） */}
          </div>
        </div>

        {/* フッター（モバイルでも常に最前面） */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[96] w-full max-w-2xl flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50/95 backdrop-blur-md">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="relative z-[97] px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
