'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AppSettings } from '../../types/app'; // AppSettingsのパスを修正

interface ApiSettingsProps {
  formSettings: AppSettings;
  setFormSettings: (prev: (prevSettings: AppSettings) => AppSettings) => void;
}

export default function ApiSettings({ formSettings, setFormSettings }: ApiSettingsProps) {
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showSDKey, setShowSDKey] = useState(false);
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showRunwareKey, setShowRunwareKey] = useState(false);

  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">API設定</h3>
      <div className="space-y-4">
        {/* Gemini API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API キー
            <span className="text-xs text-gray-500 ml-2">
              {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '（環境変数設定済み）' : '（環境変数未設定）'}
            </span>
          </label>
          <div className="relative">
            <input
              type={showGeminiKey ? 'text' : 'password'}
              value={formSettings.geminiApiKey || ''}
              onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, geminiApiKey: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-800"
              placeholder="AIzaSy..."
            />
            <button
              type="button"
              onClick={() => setShowGeminiKey(!showGeminiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showGeminiKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* OpenRouter API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenRouter API キー
            <span className="text-xs text-gray-500 ml-2">
              {process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? '（環境変数設定済み）' : '（環境変数未設定）'}
            </span>
          </label>
          <div className="relative">
            <input
              type={showOpenRouterKey ? 'text' : 'password'}
              value={formSettings.openRouterApiKey || ''}
              onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, openRouterApiKey: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-800"
              placeholder="sk-or-..."
            />
            <button
              type="button"
              onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showOpenRouterKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Stable Diffusion API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stable Diffusion API キー
          </label>
          <div className="relative">
            <input
              type={showSDKey ? 'text' : 'password'}
              value={formSettings.stableDiffusionApiKey || ''}
              onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, stableDiffusionApiKey: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-800"
              placeholder="ローカル実行の場合は空白でOK"
            />
            <button
              type="button"
              onClick={() => setShowSDKey(!showSDKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showSDKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* ElevenLabs API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ElevenLabs API キー
          </label>
          <div className="relative">
            <input
              type={showElevenLabsKey ? 'text' : 'password'}
              value={formSettings.elevenLabsApiKey || ''}
              onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, elevenLabsApiKey: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-800"
              placeholder="sk_..."
            />
            <button
              type="button"
              onClick={() => setShowElevenLabsKey(!showElevenLabsKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showElevenLabsKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            🎤 高品質音声合成用（月10,000文字まで無料）
          </p>
        </div>

        {/* Runware API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Runware API キー
          </label>
          <div className="relative">
            <input
              type={showRunwareKey ? 'text' : 'password'}
              value={formSettings.runwareApiKey || ''}
              onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, runwareApiKey: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-800"
              placeholder="run_..."
            />
            <button
              type="button"
              onClick={() => setShowRunwareKey(!showRunwareKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showRunwareKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            🖼️ Runware画像生成用APIキー
          </p>
        </div>

        {/* Runware Model ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Runware モデルID
          </label>
          <input
            type="text"
            value={formSettings.runwareModelId || ''}
            onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, runwareModelId: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            placeholder="例: model_xxxx"
          />
        </div>

        {/* Runware LORA IDs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Runware LORA ID (複数)
          </label>
          <textarea
            value={formSettings.runwareLoraIds?.join(', ') || ''}
            onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, runwareLoraIds: e.target.value.split(',').map(s => s.trim()) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            rows={2}
            placeholder="例: lora_yyyy, lora_zzzz"
          />
          <p className="text-xs text-gray-500 mt-1">
            カンマ区切りで複数指定できます。
          </p>
        </div>

        {/* 画像生成設定 */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">画像生成設定</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">デフォルトシード</label>
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  value={formSettings.imageSeed ?? ''}
                  onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, imageSeed: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
                  placeholder="ランダム"
                />
                <button
                  type="button"
                  onClick={() => setFormSettings((prev: AppSettings) => ({ ...prev, imageSeed: Math.floor(Math.random()*2**32) }))}
                  className="px-2 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  title="ランダム生成"
                >🎲</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">幅</label>
              <input 
                type="number" 
                value={formSettings.imageWidth || 512}
                onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, imageWidth: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">高さ</label>
              <input 
                type="number" 
                value={formSettings.imageHeight || 768}
                onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, imageHeight: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
              <input 
                type="number" 
                value={formSettings.imageSteps || 28}
                onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, imageSteps: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CFG Scale</label>
              <input 
                type="number" 
                value={formSettings.imageCfgScale || 8}
                onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, imageCfgScale: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sampler</label>
              <select 
                value={formSettings.imageSampler || 'DPM++ 2M Karras'}
                onChange={(e) => setFormSettings((prev: AppSettings) => ({ ...prev, imageSampler: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
              >
                {['DPM++ 2M Karras','Euler a','Euler','DDIM'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 