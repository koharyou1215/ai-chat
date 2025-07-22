'use client';
import { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import BackupControls from './BackupControls';
import { AppSettings } from '../types/character';
import { VoiceManager, ElevenLabsVoice } from '../lib/voiceManager';
import { OPENROUTER_MODELS, MODEL_DISPLAY_NAMES, DEFAULT_MODELS } from '../src/config/model-config';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [formSettings, setFormSettings] = useState<AppSettings>(settings);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showSDKey, setShowSDKey] = useState(false);
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [voiceList, setVoiceList] = useState<ElevenLabsVoice[]>([]);

  // ユーザー設定のカスタム音声プリセット
  const customVoices: ElevenLabsVoice[] = [
    { voice_id: '4lOQ7A2l7HPuG7UIHiKA', name: 'アニメ2', category: 'custom' },
    { voice_id: '8EkOjt4xTPGMclNlh1pk', name: 'アニメ1', category: 'custom' },
    { voice_id: 'rbsFyUZnrPQVns8cpVRF', name: '親しみやすく穏やかみのある日本人男性', category: 'custom' },
    { voice_id: 'XMdATmXVAFIlBM5jzss7', name: '種声の美るい', category: 'custom' },
    { voice_id: 'U4ogK8bgSusDpge7RLA2', name: 'morioki', category: 'custom' },
    { voice_id: 'mtbZa13Y8veKZNZ2Qixj', name: 'kyoko', category: 'custom' },
  ];

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  // ElevenLabsの音声リストを取得
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        if (formSettings.elevenLabsApiKey) {
          VoiceManager.setApiKey(formSettings.elevenLabsApiKey);
          const voices = await VoiceManager.getAvailableVoices();
          // APIから取得した音声とカスタムをマージ（重複回避）
          const merged = [...customVoices, ...voices.filter(v => !customVoices.some(c => c.voice_id === v.voice_id))];
          setVoiceList(merged);
        }
      } catch (e) {
        console.warn('音声リスト取得失敗:', e);
        setVoiceList(customVoices);
      }
    };

    fetchVoices();
  }, [formSettings.elevenLabsApiKey]);

  const handleSave = () => {
    localStorage.setItem('ai-chat-settings', JSON.stringify(formSettings));
    onSave(formSettings);
    onClose();
  };

  if (!isOpen) return null;

  // OpenRouterモデルのリスト
  const openRouterModels = Object.values(OPENROUTER_MODELS);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">設定</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 設定内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            {/* API設定 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">API設定</h3>
              <div className="space-y-4">
                {/* OpenRouter API Key (メイン) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenRouter API キー（推奨）
                  </label>
                  <div className="relative">
                    <input
                      type={showOpenRouterKey ? 'text' : 'password'}
                      value={formSettings.openRouterApiKey}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, openRouterApiKey: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-800"
                      placeholder="sk-or-v1-..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showOpenRouterKey ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    複数のAIモデルを一つのAPIで利用可能（Gemini 2.5 Pro、Grok-4、Claude等）
                  </p>
                </div>

                {/* Gemini API Key (バックアップ用) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gemini API キー（バックアップ用）
                  </label>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      value={formSettings.geminiApiKey}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
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
              </div>
            </section>

            {/* モデル設定 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">モデル設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Provider Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プロバイダー
                  </label>
                  <select
                    value={formSettings.provider}
                    onChange={(e) => {
                      const provider = e.target.value as 'gemini' | 'openrouter';
                      const defaultModel = provider === 'openrouter' ? DEFAULT_MODELS.OPENROUTER : 'gemini-2.5-flash';
                      setFormSettings(prev => ({ ...prev, provider, model: defaultModel }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  >
                    <option value="openrouter">OpenRouter（推奨）</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </div>

                {/* Model Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    使用モデル
                  </label>
                  <select
                    value={formSettings.model}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  >
                    {(formSettings.provider === 'openrouter'
                      ? openRouterModels
                      : ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite-preview-06-17']
                    ).map(modelId => (
                      <option key={modelId} value={modelId}>
                        {formSettings.provider === 'openrouter' 
                          ? MODEL_DISPLAY_NAMES[modelId] || modelId
                          : modelId
                        }
                      </option>
                    ))}
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

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大トークン数: {formSettings.maxTokens}
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="8192"
                    step="100"
                    value={formSettings.maxTokens}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="w-full slider mb-2"
                  />
                  <input
                    type="number"
                    min="100"
                    max="8192"
                    value={formSettings.maxTokens}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 100 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  />
                </div>
              </div>
            </section>

            {/* 続きの設定（省略） */}
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50/80">
          <BackupControls />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Save size={20} />
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
