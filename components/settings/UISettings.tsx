'use client';

import { AppSettings } from '../../types/app';

interface UISettingsProps {
  formSettings: AppSettings;
  setFormSettings: (prev: (prevSettings: AppSettings) => AppSettings) => void;
}

export default function UISettings({ formSettings, setFormSettings }: UISettingsProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">UI設定</h3>
      <div className="space-y-4">
        {/* 吹き出し透過率 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            吹き出し透過率: {Math.round((formSettings.bubbleOpacity ?? 1) * 100)}%
          </label>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.1"
            value={formSettings.bubbleOpacity ?? 1}
            onChange={(e) => setFormSettings(prev => ({ ...prev, bubbleOpacity: parseFloat(e.target.value) }))}
            className="w-full slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>透明</span>
            <span>不透明</span>
          </div>
        </div>

        {/* 吹き出しぼかし効果 */}
        <div className="flex items-center justify-between">
          <label htmlFor="bubbleBlur" className="block text-sm font-medium text-gray-700">
            吹き出しをぼかす (すりガラス)
          </label>
          <input
            type="checkbox"
            id="bubbleBlur"
            checked={formSettings.bubbleBlur || false}
            onChange={(e) => setFormSettings(prev => ({ ...prev, bubbleBlur: e.target.checked }))}
            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </div>

        {/* LORA設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LORA設定
          </label>
          <textarea
            value={formSettings.loraSettings || ''}
            onChange={(e) => setFormSettings(prev => ({ ...prev, loraSettings: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            rows={3}
            placeholder="例: <lora:character_name:0.8>"
          />
          <p className="text-xs text-gray-500 mt-1">
            Stable Diffusion用のLORA設定を入力してください
          </p>
        </div>

        {/* ネガティブプロンプト */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            追加ネガティブプロンプト
          </label>
          <textarea
            value={formSettings.negativePrompt || ''}
            onChange={(e) => setFormSettings(prev => ({ ...prev, negativePrompt: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            rows={2}
            placeholder="例: lowres, bad anatomy, blurry"
          />
          <p className="text-xs text-gray-500 mt-1">
            画像生成時に自動付与されるネガティブプロンプトに追加されます
          </p>
        </div>

        {/* 画像生成エンジン */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            画像生成エンジン
          </label>
          <select
            value={formSettings.imageEngine || ''}
            onChange={(e) => setFormSettings(prev => ({ ...prev, imageEngine: e.target.value as 'sd' | 'runware' }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
          >
            <option value="runware">Runware (クラウド)</option>
            <option value="sd">Stable Diffusion (ローカル/URL)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Runware は API キー必須、Stable Diffusion は環境変数 LOCAL_SD_URL を設定してください
          </p>
        </div>
      </div>
    </section>
  );
} 