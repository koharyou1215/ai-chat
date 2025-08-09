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
      type: 'numeric',
      initial_value: 50,
      max_value: 100,
      min_value: 0,
      category: 'status',
      persistent: true,
      description: ''
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>
                
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    トラッカー種類
                  </label>
                  <select
                    value={tempTracker?.type || 'numeric'}
                    onChange={(e) => {
                      const newType = e.target.value as 'numeric' | 'state' | 'boolean' | 'text';
                      if (!tempTracker) return;
                      
                      const updatedTracker: CharacterTracker = {
                        ...tempTracker,
                        type: newType,
                        // Reset type-specific fields
                        initial_value: newType === 'numeric' ? 50 : undefined,
                        max_value: newType === 'numeric' ? 100 : undefined,
                        min_value: newType === 'numeric' ? 0 : undefined,
                        initial_state: newType === 'state' ? '初期状態' : undefined,
                        possible_states: newType === 'state' ? ['初期状態', '状態1', '状態2'] : undefined,
                        initial_boolean: newType === 'boolean' ? false : undefined,
                        initial_text: newType === 'text' ? '' : undefined,
                      };
                      setTempTracker(updatedTracker);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    <option value="numeric">数値型</option>
                    <option value="state">状態型</option>
                    <option value="boolean">ブール型</option>
                    <option value="text">テキスト型</option>
                  </select>
                </div>

                {/* Type-specific fields */}
                {tempTracker?.type === 'numeric' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        初期値
                      </label>
                      <input
                        type="number"
                        value={tempTracker?.initial_value || 0}
                        onChange={(e) => setTempTracker(prev => prev ? {...prev, initial_value: parseInt(e.target.value) || 0} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        最小値
                      </label>
                      <input
                        type="number"
                        value={tempTracker?.min_value || 0}
                        onChange={(e) => setTempTracker(prev => prev ? {...prev, min_value: parseInt(e.target.value) || 0} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        最大値
                      </label>
                      <input
                        type="number"
                        value={tempTracker?.max_value || 100}
                        onChange={(e) => setTempTracker(prev => prev ? {...prev, max_value: parseInt(e.target.value) || 100} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                )}

                {tempTracker?.type === 'state' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        初期状態
                      </label>
                      <input
                        type="text"
                        value={tempTracker?.initial_state || ''}
                        onChange={(e) => setTempTracker(prev => prev ? {...prev, initial_state: e.target.value} : null)}
                        placeholder="例: 初対面"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        可能な状態（カンマ区切り）
                      </label>
                      <input
                        type="text"
                        value={tempTracker?.possible_states?.join(', ') || ''}
                        onChange={(e) => setTempTracker(prev => prev ? {...prev, possible_states: e.target.value.split(',').map(s => s.trim()).filter(s => s)} : null)}
                        placeholder="例: 初対面, 知り合い, 友人, 親友, 恋人"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                )}

                {tempTracker?.type === 'boolean' && (
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tempTracker?.initial_boolean || false}
                        onChange={(e) => setTempTracker(prev => prev ? {...prev, initial_boolean: e.target.checked} : null)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">初期値（有効/無効）</span>
                    </label>
                  </div>
                )}

                {tempTracker?.type === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      初期テキスト
                    </label>
                    <input
                      type="text"
                      value={tempTracker?.initial_text || ''}
                      onChange={(e) => setTempTracker(prev => prev ? {...prev, initial_text: e.target.value} : null)}
                      placeholder="例: 初期メモ"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                )}

                {/* Common fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ
                    </label>
                    <select
                      value={tempTracker?.category || 'status'}
                      onChange={(e) => setTempTracker(prev => prev ? {...prev, category: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="status">ステータス</option>
                      <option value="relationship">関係性</option>
                      <option value="condition">状態</option>
                      <option value="memory">記憶</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tempTracker?.persistent || true}
                        onChange={(e) => setTempTracker(prev => prev ? {...prev, persistent: e.target.checked} : null)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">永続化</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    value={tempTracker?.description || ''}
                    onChange={(e) => setTempTracker(prev => prev ? {...prev, description: e.target.value} : null)}
                    placeholder="トラッカーの説明を入力してください"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                    {tracker.type === 'numeric' && (
                      <>初期値: {tracker.initial_value} / 範囲: {tracker.min_value || 0} - {tracker.max_value || 100}</>
                    )}
                    {tracker.type === 'state' && (
                      <>初期状態: {tracker.initial_state} / 状態: [{tracker.possible_states?.join(', ') || ''}]</>
                    )}
                    {tracker.type === 'boolean' && (
                      <>初期値: {tracker.initial_boolean ? '有効' : '無効'}</>
                    )}
                    {tracker.type === 'text' && (
                      <>初期テキスト: {tracker.initial_text || '(空)'}</>
                    )}
                    {tracker.category && (
                      <> | カテゴリ: {tracker.category}</>
                    )}
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