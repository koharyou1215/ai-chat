'use client';

import { useState } from 'react';
import { CharacterTracker } from '../types/character';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';

interface TrackerEditorProps {
  trackers: CharacterTracker[];
  onChange: (trackers: CharacterTracker[]) => void;
}

export default function TrackerEditor({ trackers, onChange }: TrackerEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempTracker, setTempTracker] = useState<CharacterTracker | null>(null);

  const addNewTracker = () => {
    const newTracker: CharacterTracker = {
      name: '',
      display_name: '',
      initial_value: 50,
      max_value: 100,
    };
    setTempTracker(newTracker);
    setEditingIndex(trackers.length);
  };

  const editTracker = (index: number) => {
    setTempTracker({ ...trackers[index] });
    setEditingIndex(index);
  };

  const saveTracker = () => {
    if (!tempTracker || editingIndex === null) return;
    
    // バリデーション
    if (!tempTracker.name.trim() || !tempTracker.display_name.trim()) {
      alert('名前と表示名は必須です');
      return;
    }

    // 内部名の重複チェック
    const isNameDuplicated = trackers.some((t, i) => 
      i !== editingIndex && t.name === tempTracker.name
    );
    
    if (isNameDuplicated) {
      alert('この内部名は既に使用されています');
      return;
    }

    const updatedTrackers = [...trackers];
    if (editingIndex < trackers.length) {
      updatedTrackers[editingIndex] = tempTracker;
    } else {
      updatedTrackers.push(tempTracker);
    }

    onChange(updatedTrackers);
    setEditingIndex(null);
    setTempTracker(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setTempTracker(null);
  };

  const deleteTracker = (index: number) => {
    if (confirm('このトラッカーを削除しますか？')) {
      const updatedTrackers = trackers.filter((_, i) => i !== index);
      onChange(updatedTrackers);
    }
  };

  const predefinedTrackers = [
    { name: 'affection', display_name: '好感度', initial_value: 50 },
    { name: 'trust', display_name: '信頼度', initial_value: 30 },
    { name: 'mood', display_name: '機嫌', initial_value: 70 },
    { name: 'arousal', display_name: '興奮度', initial_value: 0 },
    { name: 'submission', display_name: '従順度', initial_value: 20 },
    { name: 'intimacy', display_name: '親密度', initial_value: 10 },
  ];

  const addPredefinedTracker = (predefined: Partial<CharacterTracker>) => {
    const newTracker: CharacterTracker = {
      name: predefined.name || '',
      display_name: predefined.display_name || '',
      initial_value: predefined.initial_value || 50,
      max_value: 100,
    };
    setTempTracker(newTracker);
    setEditingIndex(trackers.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">パラメータトラッカー</h3>
        <button
          onClick={addNewTracker}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          追加
        </button>
      </div>

      {/* 定型トラッカーのクイック追加 */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">よく使われるパラメータ:</p>
        <div className="flex flex-wrap gap-2">
          {predefinedTrackers.map((predefined) => {
            const isAlreadyAdded = trackers.some(t => t.name === predefined.name);
            return (
              <button
                key={predefined.name}
                onClick={() => !isAlreadyAdded && addPredefinedTracker(predefined)}
                disabled={isAlreadyAdded}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                  isAlreadyAdded
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {predefined.display_name} {isAlreadyAdded && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* トラッカーリスト */}
      <div className="space-y-2">
        {trackers.map((tracker, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3">
            {editingIndex === index ? (
              // 編集モード
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      内部名 (英数字)
                    </label>
                    <input
                      type="text"
                      value={tempTracker?.name || ''}
                      onChange={(e) => setTempTracker(prev => prev ? {...prev, name: e.target.value} : null)}
                      placeholder="例: affection"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      表示名
                    </label>
                    <input
                      type="text"
                      value={tempTracker?.display_name || ''}
                      onChange={(e) => setTempTracker(prev => prev ? {...prev, display_name: e.target.value} : null)}
                      placeholder="例: 好感度"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      初期値
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={tempTracker?.max_value || 100}
                      value={tempTracker?.initial_value || 0}
                      onChange={(e) => setTempTracker(prev => prev ? {...prev, initial_value: parseInt(e.target.value) || 0} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最大値
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={tempTracker?.max_value || 100}
                      onChange={(e) => setTempTracker(prev => prev ? {...prev, max_value: parseInt(e.target.value) || 100} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveTracker}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              // 表示モード
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-800">{tracker.display_name}</span>
                    <span className="text-sm text-gray-500">({tracker.name})</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    初期値: {tracker.initial_value} / 最大値: {tracker.max_value || 100}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editTracker(index)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTracker(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 新規追加時の編集フォーム */}
        {editingIndex === trackers.length && tempTracker && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    内部名 (英数字)
                  </label>
                  <input
                    type="text"
                    value={tempTracker.name}
                    onChange={(e) => setTempTracker({...tempTracker, name: e.target.value})}
                    placeholder="例: affection"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    表示名
                  </label>
                  <input
                    type="text"
                    value={tempTracker.display_name}
                    onChange={(e) => setTempTracker({...tempTracker, display_name: e.target.value})}
                    placeholder="例: 好感度"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    初期値
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={tempTracker.max_value || 100}
                    value={tempTracker.initial_value}
                    onChange={(e) => setTempTracker({...tempTracker, initial_value: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大値
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tempTracker.max_value || 100}
                    onChange={(e) => setTempTracker({...tempTracker, max_value: parseInt(e.target.value) || 100})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveTracker}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {trackers.length === 0 && editingIndex === null && (
        <div className="text-center py-8 text-gray-500">
          <p>まだパラメータが設定されていません</p>
          <p className="text-sm">「追加」ボタンまたは定型パラメータから選択してください</p>
        </div>
      )}
    </div>
  );
}