'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { AppSettings } from '../types/app';
import { THEMES } from '../../lib/themes';

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

        {/* タイプライター速度 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            タイプライター速度: {formSettings.typewriterSpeed || 30}ms
          </label>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={formSettings.typewriterSpeed || 30}
            onChange={(e) => setFormSettings(prev => ({ ...prev, typewriterSpeed: parseInt(e.target.value) }))}
            className="w-full slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>高速 (10ms)</span>
            <span>低速 (200ms)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            文字が1文字ずつ表示される間隔を調整できます。数値が小さいほど高速になります。
          </p>
        </div>

        {/* LORA設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LORA設定（Stable Diffusion専用）
          </label>
          <textarea
            value={formSettings.loraSettings || ''}
            onChange={(e) => setFormSettings(prev => ({ ...prev, loraSettings: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            rows={3}
            placeholder="例: <lora:character_name:0.8>"
          />
          <p className="text-xs text-gray-500 mt-1">
            Stable Diffusion用のLORA設定。Runware使用時は無効です。
          </p>
        </div>

        {/* 注意書き */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
            ℹ️ 画像生成設定について
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• 品質タグ・ネガティブプロンプトは <strong>API設定</strong> の「画像生成詳細設定」で管理されています</p>
            <p>• キャラクター固有の外見は <strong>キャラクター編集</strong> の「外見プロンプト」で設定できます</p>
            <p>• LORA設定はStable Diffusionでのみ使用されます（Runwareでは無効）</p>
          </div>
        </div>

        {/* 画像生成オンオフ */}
        <div className="flex items-center justify-between">
          <label htmlFor="enableImageGeneration" className="block text-sm font-medium text-gray-700">
            画像生成を有効化
          </label>
          <input
            type="checkbox"
            id="enableImageGeneration"
            checked={formSettings.enableImageGeneration ?? true}
            onChange={(e) => setFormSettings(prev => ({ ...prev, enableImageGeneration: e.target.checked }))}
            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <p className="text-xs text-gray-500">
            チェックを外すとAIの応答に合わせた画像生成を停止します。
          </p>
        </div>

        {/* 画像生成エンジン */}
        {formSettings.enableImageGeneration && (
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
        )}
      </div>
    </section>
  );
} 