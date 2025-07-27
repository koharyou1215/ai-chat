'use client';

import { AppSettings } from '../../types/app';

interface ModelSettingsProps {
  formSettings: AppSettings;
  setFormSettings: (prev: (prevSettings: AppSettings) => AppSettings) => void;
}

export default function ModelSettings({ formSettings, setFormSettings }: ModelSettingsProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">モデル設定</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Provider Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            プロバイダ
          </label>
          <select
            value={formSettings.provider || ''}
            onChange={(e) => {
              const provider = e.target.value as 'gemini' | 'openrouter';
              const defaultModel = provider === 'gemini' ? 'gemini-2.5-flash' : 'openai/gpt-4o-mini';
              // モデルがリスト内にない場合はデフォルトに切替
              setFormSettings(prev => ({ ...prev, provider, model: defaultModel }));
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
          >
            <option value="gemini">Gemini</option>
            <option value="openrouter">OpenRouter</option>
          </select>
        </div>
        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature: {formSettings.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={formSettings.temperature}
            onChange={(e) => setFormSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>保守的</span>
            <span>創造的</span>
          </div>
        </div>

        {/* Top-p */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Top-p: {formSettings.topP}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={formSettings.topP}
            onChange={(e) => setFormSettings(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
            className="w-full slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>控えめ</span>
            <span>多様性</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Tokens: {formSettings.maxTokens}
          </label>
          <input
            type="range"
            min="100"
            max="4000"
            step="100"
            value={formSettings.maxTokens}
            onChange={(e) => setFormSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
            className="w-full slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>短い</span>
            <span>長い</span>
          </div>
        </div>

        {/* Model Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            モデル
          </label>
          <select
            value={formSettings.model || ''}
            onChange={(e) => setFormSettings(prev => ({ ...prev, model: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
          >
            {[ // OpenRouter Models
              'qwen/qwen3-235b-a22b-07-25:free',
              'qwen/qwen3-235b-a22b-thinking-2507',
              'moonshotai/kimi-k2:free',
              'moonshotai/kimi-k2',
              'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
              'x-ai/grok-4',
              'google/gemini-2.5-flash',
              'google/gemini-2.5-pro',
              'deepseek/deepseek-r1-0528-qwen3-8b:free',
              'deepseek/deepseek-chat-v3-0324:free',
              'anthropic/claude-opus-4',
              'anthropic/claude-sonnet-4',
              'anthropic/claude-3.7-sonnet:thinking',
            ].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            <strong>:free</strong> - 無料版（制限あり）、<strong>:thinking</strong> - 思考プロセス版、<strong>なし</strong> - 有料版（高品質）
          </p>
        </div>
      </div>
    </section>
  );
} 