'use client';

import { useEffect } from 'react';
import { AppSettings } from '../../types/app';
import { VoiceManager, ElevenLabsVoice } from '../../lib/voiceManager';

interface VoiceSettingsProps {
  formSettings: AppSettings;
  setFormSettings: (prev: (prevSettings: AppSettings) => AppSettings) => void;
  voiceList: ElevenLabsVoice[];
  setVoiceList: (voices: ElevenLabsVoice[]) => void;
  customVoices: ElevenLabsVoice[];
}

export default function VoiceSettings({ formSettings, setFormSettings, voiceList, setVoiceList, customVoices }: VoiceSettingsProps) {
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        if (formSettings.elevenLabsApiKey) {
          VoiceManager.setApiKey(formSettings.elevenLabsApiKey);
          const voices = await VoiceManager.getAvailableVoices();
          const merged = [...customVoices, ...voices.filter(v => !customVoices.some(c => c.voice_id === v.voice_id))];
          setVoiceList(merged);
        }
      } catch (e) {
        console.warn('音声リスト取得失敗:', e);
      }
    };
    
    // APIキーが変わった時のみ実行
    if (formSettings.elevenLabsApiKey) {
      fetchVoices();
    }
  }, [formSettings.elevenLabsApiKey]); // customVoicesとsetVoiceListを依存配列から除外

  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">音声設定</h3>
      <div className="space-y-4">
        {/* 音声有効化 */}
        <div className="flex items-center justify-between">
          <label htmlFor="voiceEnabled" className="block text-sm font-medium text-gray-700">
            音声読み上げを有効化
          </label>
          <input
            type="checkbox"
            id="voiceEnabled"
            checked={formSettings.voiceEnabled || false}
            onChange={(e) => setFormSettings(prev => ({ ...prev, voiceEnabled: e.target.checked }))}
            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </div>

        {/* 自動再生 */}
        {formSettings.voiceEnabled && (
          <div className="flex items-center justify-between">
            <label htmlFor="voiceAutoPlay" className="block text-sm font-medium text-gray-700">
              AI返信時に自動再生
            </label>
            <input
              type="checkbox"
              id="voiceAutoPlay"
              checked={formSettings.voiceAutoPlay || false}
              onChange={(e) => setFormSettings(prev => ({ ...prev, voiceAutoPlay: e.target.checked }))}
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 音声選択 */}
        {formSettings.voiceEnabled && (
          <div>
            <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700 mb-2">
              音声
            </label>
            <select
              id="voiceId"
              value={formSettings.voiceId || ''}
              onChange={(e) => setFormSettings(prev => ({ ...prev, voiceId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            >
              {voiceList.length === 0 && <option value="">Loading voices...</option>}
              {voiceList.map((voice) => (
                <option key={voice.voice_id} value={voice.voice_id}>
                  {voice.name} {voice.category === 'generated' && '(AI生成)'}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              ElevenLabsのAPIキーが必要です。
            </p>
          </div>
        )}

        {/* 安定性 */}
        {formSettings.voiceEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              安定性: {formSettings.voiceStability}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formSettings.voiceStability || 0}
              onChange={(e) => setFormSettings(prev => ({ ...prev, voiceStability: parseFloat(e.target.value) }))}
              className="w-full slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>変化</span>
              <span>安定</span>
            </div>
          </div>
        )}

        {/* 類似度ブースト */}
        {formSettings.voiceEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              類似度ブースト: {formSettings.voiceSimilarityBoost}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formSettings.voiceSimilarityBoost || 0}
              onChange={(e) => setFormSettings(prev => ({ ...prev, voiceSimilarityBoost: parseFloat(e.target.value) }))}
              className="w-full slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>忠実度低</span>
              <span>忠実度高</span>
            </div>
          </div>
        )}

        {/* スタイル */}
        {formSettings.voiceEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              スタイル: {formSettings.voiceStyle}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formSettings.voiceStyle || 0}
              onChange={(e) => setFormSettings(prev => ({ ...prev, voiceStyle: parseFloat(e.target.value) }))}
              className="w-full slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>抑えめ</span>
              <span>誇張</span>
            </div>
          </div>
        )}

        {/* スピーカーブースト */}
        {formSettings.voiceEnabled && (
          <div className="flex items-center justify-between">
            <label htmlFor="voiceUseSpeakerBoost" className="block text-sm font-medium text-gray-700">
              スピーカーブースト
            </label>
            <input
              type="checkbox"
              id="voiceUseSpeakerBoost"
              checked={formSettings.voiceUseSpeakerBoost || false}
              onChange={(e) => setFormSettings(prev => ({ ...prev, voiceUseSpeakerBoost: e.target.checked }))}
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 音声速度 */}
        {formSettings.voiceEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音声速度: {formSettings.voiceSpeed}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={formSettings.voiceSpeed || 1}
              onChange={(e) => setFormSettings(prev => ({ ...prev, voiceSpeed: parseFloat(e.target.value) }))}
              className="w-full slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>遅い</span>
              <span>速い</span>
            </div>
          </div>
        )}

        {/* 音量 */}
        {formSettings.voiceEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音量: {formSettings.voiceVolume}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formSettings.voiceVolume || 1}
              onChange={(e) => setFormSettings(prev => ({ ...prev, voiceVolume: parseFloat(e.target.value) }))}
              className="w-full slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>小</span>
              <span>大</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
} 