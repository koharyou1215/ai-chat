'use client';

import React from 'react';
import { X, Zap, Image, Volume2 } from 'lucide-react';
import { AppSettings } from '../types/app';

interface QuickSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

const QuickSettingsModal: React.FC<QuickSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const models = [
    'meta-llama/llama-3.2-3b-instruct',
    'meta-llama/llama-3.1-8b-instruct',
    'qwen/qwen-2.5-7b-instruct',
    'google/gemini-2.5-flash',
    'google/gemini-2.5-pro',
    'moonshotai/kimi-k2',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o-mini'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Zap size={20} className="text-blue-500" />
            クイック設定
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 設定項目 */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* AIモデル選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🤖 AIモデル
            </label>
            <select
              value={settings.selectedModel || models[0]}
              onChange={(e) => onUpdateSettings({ selectedModel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-800 bg-white"
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model.split('/').pop()?.replace(/[-_]/g, ' ') || model}
                </option>
              ))}
            </select>
          </div>

          {/* 画像生成オンオフ */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Image size={16} className="text-green-500" />
              画像生成
            </label>
            <button
              onClick={() => onUpdateSettings({ enableImageGeneration: !settings.enableImageGeneration })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.enableImageGeneration ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableImageGeneration ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 音声オンオフ */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Volume2 size={16} className="text-blue-500" />
              音声再生
            </label>
            <button
              onClick={() => onUpdateSettings({ voiceEnabled: !settings.voiceEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.voiceEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 通知音オンオフ */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              🔔
              通知音
            </label>
            <button
              onClick={() => onUpdateSettings({ chatNotificationSound: !settings.chatNotificationSound })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.chatNotificationSound ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.chatNotificationSound ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                onUpdateSettings({}); // 設定を保存
                onClose(); // モーダルを閉じる
              }}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              保存
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              閉じる
            </button>
          </div>
          <button
            onClick={() => {
              // 詳細設定を開く
              onClose();
              // ここで詳細設定モーダルを開く処理を追加可能
            }}
            className="w-full mt-2 text-blue-500 hover:text-blue-600 text-xs transition-colors"
          >
            詳細設定を開く →
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickSettingsModal;
