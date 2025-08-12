'use client';

import { useState } from 'react';
import { TrendingUp, X, Edit, Save, BarChart3 } from 'lucide-react';

interface TrackerItem {
  name: string;
  display_name: string;
  type: 'numeric' | 'state' | 'boolean';
  initial_value?: number;
  max_value?: number;
  min_value?: number;
  initial_state?: string;
  possible_states?: string[];
  initial_boolean?: boolean;
  category: 'relationship' | 'condition' | 'status';
  persistent: boolean;
  description: string;
}

interface TrackerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  trackers: TrackerItem[];
  currentValues: { [key: string]: any };
  onUpdateTracker: (name: string, value: any) => void;
  character: any;
}

export default function TrackerPanel({
  isOpen,
  onClose,
  trackers,
  currentValues,
  onUpdateTracker,
  character
}: TrackerPanelProps) {
  const [editingTracker, setEditingTracker] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  if (!isOpen) return null;

  const handleEdit = (tracker: TrackerItem) => {
    setEditingTracker(tracker.name);
    setEditValue(currentValues[tracker.name] || '');
  };

  const handleSave = (trackerName: string) => {
    onUpdateTracker(trackerName, editValue);
    setEditingTracker(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingTracker(null);
    setEditValue('');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'relationship': return 'bg-pink-500/20 text-pink-200 border-pink-500/30';
      case 'condition': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'status': return 'bg-green-500/20 text-green-200 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
    }
  };

  const getTrackerIcon = (type: string) => {
    switch (type) {
      case 'numeric': return '🔢';
      case 'state': return '🏷️';
      case 'boolean': return '✅';
      default: return '📊';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">
              {character?.name || 'キャラクター'} のトラッカー
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* トラッカー一覧 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {trackers.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">トラッカーが設定されていません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trackers.map((tracker) => (
                <div
                  key={tracker.name}
                  className={`p-4 rounded-lg border ${getCategoryColor(tracker.category)} backdrop-blur-sm`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTrackerIcon(tracker.type)}</span>
                      <div>
                        <h3 className="font-semibold text-white">{tracker.display_name}</h3>
                        <p className="text-xs opacity-80">{tracker.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(tracker)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  {/* トラッカー値の表示・編集 */}
                  {editingTracker === tracker.name ? (
                    <div className="space-y-2">
                      {tracker.type === 'numeric' && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            min={tracker.min_value}
                            max={tracker.max_value}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                          />
                          <button
                            onClick={() => handleSave(tracker.name)}
                            className="p-2 bg-green-500/30 hover:bg-green-500/40 rounded transition-colors"
                          >
                            <Save className="w-4 h-4 text-green-300" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 bg-red-500/30 hover:bg-red-500/40 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-red-300" />
                          </button>
                        </div>
                      )}

                      {tracker.type === 'state' && (
                        <div className="space-y-2">
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                          >
                            {tracker.possible_states?.map((state) => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSave(tracker.name)}
                              className="flex-1 py-2 bg-green-500/30 hover:bg-green-500/40 rounded transition-colors text-sm"
                            >
                              保存
                            </button>
                            <button
                              onClick={handleCancel}
                              className="flex-1 py-2 bg-red-500/30 hover:bg-red-500/40 rounded transition-colors text-sm"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      )}

                      {tracker.type === 'boolean' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editValue}
                              onChange={(e) => setEditValue(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{editValue ? 'ON' : 'OFF'}</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSave(tracker.name)}
                              className="flex-1 py-2 bg-green-500/30 hover:bg-green-500/40 rounded transition-colors text-sm"
                            >
                              保存
                            </button>
                            <button
                              onClick={handleCancel}
                              className="flex-1 py-2 bg-red-500/30 hover:bg-red-500/40 rounded transition-colors text-sm"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* 現在値の表示 */}
                      {tracker.type === 'numeric' && (
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-white">
                            {currentValues[tracker.name] || 0}
                          </span>
                          {tracker.max_value && (
                            <div className="text-xs opacity-70">
                              / {tracker.max_value}
                            </div>
                          )}
                        </div>
                      )}

                      {tracker.type === 'state' && (
                        <div className="px-3 py-2 bg-white/20 rounded text-center">
                          <span className="text-white font-medium">
                            {currentValues[tracker.name] || tracker.initial_state || '未設定'}
                          </span>
                        </div>
                      )}

                      {tracker.type === 'boolean' && (
                        <div className="flex items-center justify-center">
                          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                            currentValues[tracker.name] 
                              ? 'bg-green-500/30 text-green-200' 
                              : 'bg-red-500/30 text-red-200'
                          }`}>
                            {currentValues[tracker.name] ? 'ON' : 'OFF'}
                          </div>
                        </div>
                      )}

                      {/* プログレスバー（数値型のみ） */}
                      {tracker.type === 'numeric' && tracker.max_value && (
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, ((currentValues[tracker.name] || 0) / tracker.max_value) * 100)}%`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
