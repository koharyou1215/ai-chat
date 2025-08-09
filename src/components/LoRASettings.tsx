'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import { LoRASetting } from '../types/app';

interface LoRASettingsProps {
  loras: LoRASetting[];
  onChange: (loras: LoRASetting[]) => void;
}

export default function LoRASettings({ loras, onChange }: LoRASettingsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempLora, setTempLora] = useState<LoRASetting | null>(null);

  const addNewLora = () => {
    const newLora: LoRASetting = {
      id: '',
      name: '',
      weight: 1.0,
      enabled: true,
    };
    setTempLora(newLora);
    setEditingIndex(loras.length);
  };

  const editLora = (index: number) => {
    setTempLora({ ...loras[index] });
    setEditingIndex(index);
  };

  const saveLora = () => {
    if (!tempLora || editingIndex === null) return;
    
    // バリデーション
    if (!tempLora.id.trim() || !tempLora.name.trim()) {
      alert('IDと名前は必須です');
      return;
    }

    // IDの重複チェック
    const isIdDuplicated = loras.some((l, i) => 
      i !== editingIndex && l.id === tempLora.id
    );
    
    if (isIdDuplicated) {
      alert('このIDは既に使用されています');
      return;
    }

    const updatedLoras = [...loras];
    if (editingIndex < loras.length) {
      updatedLoras[editingIndex] = tempLora;
    } else {
      updatedLoras.push(tempLora);
    }

    onChange(updatedLoras);
    setEditingIndex(null);
    setTempLora(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setTempLora(null);
  };

  const deleteLora = (index: number) => {
    if (confirm('このLoRAを削除しますか？')) {
      const updatedLoras = loras.filter((_, i) => i !== index);
      onChange(updatedLoras);
    }
  };

  const toggleEnabled = (index: number) => {
    const updatedLoras = [...loras];
    updatedLoras[index].enabled = !updatedLoras[index].enabled;
    onChange(updatedLoras);
  };

  const updateWeight = (index: number, weight: number) => {
    const updatedLoras = [...loras];
    updatedLoras[index].weight = Math.max(0, Math.min(2, weight));
    onChange(updatedLoras);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">LoRA設定</h3>
        <button
          onClick={addNewLora}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          追加
        </button>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <p>💡 <strong>LoRA（Low-Rank Adaptation）設定</strong></p>
        <p>• 各LoRAに個別の重み（0.0〜2.0）を設定できます</p>
        <p>• 重みが高いほどLoRAの効果が強くなります</p>
        <p>• 無効にしたLoRAは画像生成時に使用されません</p>
      </div>

      {/* LoRAリスト */}
      <div className="space-y-2">
        {loras.map((lora, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3">
            {editingIndex === index ? (
              // 編集モード
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LoRA ID
                    </label>
                    <input
                      type="text"
                      value={tempLora?.id || ''}
                      onChange={(e) => setTempLora(prev => prev ? {...prev, id: e.target.value} : null)}
                      placeholder="例: civitai:12345@1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      表示名
                    </label>
                    <input
                      type="text"
                      value={tempLora?.name || ''}
                      onChange={(e) => setTempLora(prev => prev ? {...prev, name: e.target.value} : null)}
                      placeholder="例: AnimeStyle V2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      重み (0.0〜2.0)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={tempLora?.weight || 1.0}
                      onChange={(e) => setTempLora(prev => prev ? {...prev, weight: parseFloat(e.target.value) || 1.0} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={tempLora?.enabled || false}
                        onChange={(e) => setTempLora(prev => prev ? {...prev, enabled: e.target.checked} : null)}
                        className="mr-2"
                      />
                      有効
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveLora}
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
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${lora.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                      {lora.name}
                    </span>
                    <span className="text-sm text-gray-500">({lora.id})</span>
                    <span className={`text-sm px-2 py-1 rounded ${lora.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {lora.enabled ? '有効' : '無効'}
                    </span>
                  </div>
                  
                  {/* 重みスライダー */}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-12">重み:</span>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={lora.weight}
                      onChange={(e) => updateWeight(index, parseFloat(e.target.value))}
                      disabled={!lora.enabled}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm font-medium w-8 text-center">
                      {lora.weight.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => toggleEnabled(index)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      lora.enabled 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {lora.enabled ? '無効化' : '有効化'}
                  </button>
                  <button
                    onClick={() => editLora(index)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteLora(index)}
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
        {editingIndex === loras.length && tempLora && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LoRA ID
                  </label>
                  <input
                    type="text"
                    value={tempLora.id}
                    onChange={(e) => setTempLora({...tempLora, id: e.target.value})}
                    placeholder="例: civitai:12345@1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    表示名
                  </label>
                  <input
                    type="text"
                    value={tempLora.name}
                    onChange={(e) => setTempLora({...tempLora, name: e.target.value})}
                    placeholder="例: AnimeStyle V2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    重み (0.0〜2.0)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={tempLora.weight}
                    onChange={(e) => setTempLora({...tempLora, weight: parseFloat(e.target.value) || 1.0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={tempLora.enabled}
                      onChange={(e) => setTempLora({...tempLora, enabled: e.target.checked})}
                      className="mr-2"
                    />
                    有効
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveLora}
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

      {loras.length === 0 && editingIndex === null && (
        <div className="text-center py-8 text-gray-500">
          <p>LoRAが設定されていません</p>
          <p className="text-sm">「追加」ボタンから新しいLoRAを追加してください</p>
        </div>
      )}
    </div>
  );
}