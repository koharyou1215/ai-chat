'use client';

import { useEffect, useState } from 'react';
import { AppSettings } from '../../types/app';
import { VoiceManager, ElevenLabsVoice } from '../../lib/voiceManager';
import { VOICEVOXManager, VOICEVOXSpeaker } from '../../lib/voicevoxManager';

interface VoiceSettingsProps {
  formSettings: AppSettings;
  setFormSettings: (prev: (prevSettings: AppSettings) => AppSettings) => void;
  voiceList: ElevenLabsVoice[];
  setVoiceList: (voices: ElevenLabsVoice[]) => void;
  customVoices: ElevenLabsVoice[];
}

export default function VoiceSettings({ formSettings, setFormSettings, voiceList, setVoiceList, customVoices }: VoiceSettingsProps) {
  const [voicevoxSpeakers, setVoicevoxSpeakers] = useState<VOICEVOXSpeaker[]>([]);
  const [voicevoxLoading, setVoicevoxLoading] = useState(false);
  // ElevenLabs音声リスト取得
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
        console.warn('ElevenLabs音声リスト取得失敗:', e);
      }
    };
    
    if (formSettings.elevenLabsApiKey) {
      fetchVoices();
    }
  }, [formSettings.elevenLabsApiKey]);

  // VOICEVOX話者リスト取得
  useEffect(() => {
    const fetchVoicevoxSpeakers = async () => {
      setVoicevoxLoading(true);
      try {
        const speakers = await VOICEVOXManager.getAvailableSpeakers(formSettings.voicevoxApiUrl);
        setVoicevoxSpeakers(speakers);
      } catch (e) {
        console.warn('VOICEVOX話者リスト取得失敗:', e);
        setVoicevoxSpeakers([]);
      } finally {
        setVoicevoxLoading(false);
      }
    };

    if (formSettings.voiceProvider === 'voicevox') {
      fetchVoicevoxSpeakers();
    }
  }, [formSettings.voiceProvider, formSettings.voicevoxApiUrl]);

  // 音声テスト
  const handleVoiceTest = async () => {
    try {
      if (formSettings.voiceProvider === 'voicevox') {
        await VOICEVOXManager.testVoice({
          speaker: formSettings.voicevoxSpeaker || 3,
          speed: formSettings.voicevoxSpeed || 1.0,
          pitch: formSettings.voicevoxPitch || 0.0,
          intonation: formSettings.voicevoxIntonation || 1.0,
          volume: formSettings.voicevoxVolume || 1.0,
          apiUrl: formSettings.voicevoxApiUrl || 'https://deprecatedapis.tts.quest/v2/voicevox'
        });
      } else if (formSettings.voiceProvider === 'webspeech') {
        // Web Speech APIテスト
        if ('speechSynthesis' in window) {
          // 既存の音声を停止
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance('Web Speech APIの音声テストです。こんにちは！');
          utterance.lang = 'ja-JP';
          utterance.rate = formSettings.voiceSpeed || 1.0;
          utterance.pitch = 1.0;
          utterance.volume = formSettings.voiceVolume || 0.8;
          
          utterance.onend = () => {
            alert('Web Speech API音声テスト成功！');
          };
          
          utterance.onerror = (event) => {
            console.error('Web Speech APIテストエラー:', event.error);
            alert(`Web Speech APIテストに失敗しました: ${event.error}`);
          };
          
          window.speechSynthesis.speak(utterance);
          return; // Web Speech APIの場合は非同期処理なのでここで終了
        } else {
          alert('Web Speech APIはこのブラウザでサポートされていません。');
          return;
        }
      } else {
        // ElevenLabsのテスト (既存の処理)
        await VoiceManager.testVoice(formSettings.voiceId || '', {
          stability: formSettings.voiceStability || 0.5,
          similarityBoost: formSettings.voiceSimilarityBoost || 0.5,
          style: formSettings.voiceStyle || 0,
          useSpeakerBoost: formSettings.voiceUseSpeakerBoost || false
        });
      }
      alert('音声テストが完了しました');
    } catch (error) {
      console.error('音声テストエラー:', error);
      alert('音声テストに失敗しました');
    }
  };

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

        {/* 音声エンジン選択 */}
        {formSettings.voiceEnabled && (
          <div>
            <label htmlFor="voiceProvider" className="block text-sm font-medium text-gray-700 mb-2">
              音声エンジン
            </label>
                        <select
              id="voiceProvider"
              value={formSettings.voiceProvider || 'webspeech'}
              onChange={(e) => {
                console.log('🎵 音声エンジン変更:', e.target.value);
                setFormSettings(prev => ({
                  ...prev,
                  voiceProvider: e.target.value as 'elevenlabs' | 'voicevox' | 'webspeech'
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
            >
              <option value="webspeech" className="text-gray-800 bg-white">Web Speech API (推奨・無料・標準)</option>
              <option value="voicevox" className="text-gray-800 bg-white">VOICEVOX (認証エラー・一時停止中)</option>
              <option value="elevenlabs" className="text-gray-800 bg-white">ElevenLabs (有料・多言語対応)</option>
            </select>
          </div>
        )}

        {/* デバッグ情報表示 */}
        {formSettings.voiceEnabled && (
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded space-y-1">
            <div>🔍 デバッグ情報:</div>
            <div>• voiceEnabled = {String(formSettings.voiceEnabled)}</div>
            <div>• voiceProvider = "{formSettings.voiceProvider || 'undefined'}"</div>
            <div>• voiceProvider === 'voicevox' = {String(formSettings.voiceProvider === 'voicevox')}</div>
            <div>• voicevoxSpeaker = {formSettings.voicevoxSpeaker || 'undefined'}</div>
            <div>• 条件チェック = {String(formSettings.voiceEnabled && formSettings.voiceProvider === 'voicevox')}</div>
          </div>
        )}

        {/* Web Speech API設定 */}
        {formSettings.voiceEnabled && formSettings.voiceProvider === 'webspeech' && (
          <>
            <div>
              <label htmlFor="webspeechSpeed" className="block text-sm font-medium text-gray-700 mb-2">
                音声速度
              </label>
              <input
                type="range"
                id="webspeechSpeed"
                min="0.5"
                max="2.0"
                step="0.1"
                value={formSettings.voiceSpeed || 1.0}
                onChange={(e) => setFormSettings(prev => ({ ...prev, voiceSpeed: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">
                現在の値: {formSettings.voiceSpeed || 1.0}
              </div>
            </div>

            <div>
              <label htmlFor="webspeechVolume" className="block text-sm font-medium text-gray-700 mb-2">
                音量
              </label>
              <input
                type="range"
                id="webspeechVolume"
                min="0.0"
                max="1.0"
                step="0.1"
                value={formSettings.voiceVolume || 0.8}
                onChange={(e) => setFormSettings(prev => ({ ...prev, voiceVolume: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">
                現在の値: {formSettings.voiceVolume || 0.8}
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                📢 Web Speech APIはブラウザ標準機能です。インターネット接続なしでも動作し、認証も不要です。
              </p>
            </div>
          </>
        )}

        {/* VOICEVOX設定 */}
        {formSettings.voiceEnabled && formSettings.voiceProvider === 'voicevox' && (
          <>
            {/* API URL設定 */}
            <div>
              <label htmlFor="voicevoxApiUrl" className="block text-sm font-medium text-gray-700 mb-2">
                VOICEVOX API URL
              </label>
              <input
                type="text"
                id="voicevoxApiUrl"
                value={formSettings.voicevoxApiUrl || 'https://deprecatedapis.tts.quest/v2/voicevox'}
                onChange={(e) => setFormSettings(prev => ({ ...prev, voicevoxApiUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
                placeholder="https://deprecatedapis.tts.quest/v2/voicevox"
              />
              <p className="text-xs text-gray-500 mt-1">
                デフォルトは無料の公開API。ローカルのVOICEVOXエンジンを使用する場合は http://localhost:50021 を指定
              </p>
            </div>

            {/* 話者選択 */}
            <div>
              <label htmlFor="voicevoxSpeaker" className="block text-sm font-medium text-gray-700 mb-2">
                話者選択
                {voicevoxLoading && <span className="text-sm text-blue-500"> (読み込み中...)</span>}
              </label>
              <select
                id="voicevoxSpeaker"
                value={formSettings.voicevoxSpeaker || 3}
                onChange={(e) => setFormSettings(prev => ({ ...prev, voicevoxSpeaker: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
                disabled={voicevoxLoading}
              >
                {voicevoxSpeakers.length > 0 ? (
                  voicevoxSpeakers.map(speaker => 
                    speaker.styles.map(style => (
                      <option key={style.id} value={style.id} className="text-gray-800 bg-white">
                        {speaker.name} ({style.name})
                      </option>
                    ))
                  )
                ) : (
                  <>
                    <option value={0} className="text-gray-800 bg-white">四国めたん (ノーマル)</option>
                    <option value={3} className="text-gray-800 bg-white">ずんだもん (ノーマル)</option>
                    <option value={1} className="text-gray-800 bg-white">ずんだもん (あまあま)</option>
                    <option value={8} className="text-gray-800 bg-white">春日部つむぎ (ノーマル)</option>
                    <option value={10} className="text-gray-800 bg-white">雨晴はう (ノーマル)</option>
                    <option value={9} className="text-gray-800 bg-white">波音リツ (ノーマル)</option>
                  </>
                )}
              </select>
            </div>

            {/* 話速設定 */}
            <div>
              <label htmlFor="voicevoxSpeed" className="block text-sm font-medium text-gray-700 mb-2">
                話速: {formSettings.voicevoxSpeed || 1.0}
              </label>
              <input
                type="range"
                id="voicevoxSpeed"
                min="0.5"
                max="2.0"
                step="0.1"
                value={formSettings.voicevoxSpeed || 1.0}
                onChange={(e) => setFormSettings(prev => ({ ...prev, voicevoxSpeed: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* 音高設定 */}
            <div>
              <label htmlFor="voicevoxPitch" className="block text-sm font-medium text-gray-700 mb-2">
                音高: {formSettings.voicevoxPitch || 0.0}
              </label>
              <input
                type="range"
                id="voicevoxPitch"
                min="-0.15"
                max="0.15"
                step="0.01"
                value={formSettings.voicevoxPitch || 0.0}
                onChange={(e) => setFormSettings(prev => ({ ...prev, voicevoxPitch: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* 抑揚設定 */}
            <div>
              <label htmlFor="voicevoxIntonation" className="block text-sm font-medium text-gray-700 mb-2">
                抑揚: {formSettings.voicevoxIntonation || 1.0}
              </label>
              <input
                type="range"
                id="voicevoxIntonation"
                min="0.0"
                max="2.0"
                step="0.1"
                value={formSettings.voicevoxIntonation || 1.0}
                onChange={(e) => setFormSettings(prev => ({ ...prev, voicevoxIntonation: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* 音量設定 */}
            <div>
              <label htmlFor="voicevoxVolume" className="block text-sm font-medium text-gray-700 mb-2">
                音量: {Math.round((formSettings.voicevoxVolume || 1.0) * 100)}%
              </label>
              <input
                type="range"
                id="voicevoxVolume"
                min="0.0"
                max="1.0"
                step="0.1"
                value={formSettings.voicevoxVolume || 1.0}
                onChange={(e) => setFormSettings(prev => ({ ...prev, voicevoxVolume: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* テストボタン */}
            <button
              onClick={handleVoiceTest}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              音声テスト
            </button>
          </>
        )}

        {/* ElevenLabs設定 */}
        {formSettings.voiceEnabled && formSettings.voiceProvider === 'elevenlabs' && (
          <>
            {/* 音声選択 */}
            <div>
            <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700 mb-2">
              音声
            </label>
            <select
              id="voiceId"
              value={formSettings.voiceId || ''}
              onChange={(e) => setFormSettings(prev => ({ ...prev, voiceId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
            >
              {voiceList.length === 0 && <option value="" className="text-gray-800 bg-white">Loading voices...</option>}
              {voiceList.map((voice) => (
                <option key={voice.voice_id} value={voice.voice_id} className="text-gray-800 bg-white">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音量: {formSettings.voiceVolume || 1.0}
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

            {/* ElevenLabsテストボタン */}
            <button
              onClick={handleVoiceTest}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              音声テスト
            </button>
          </>
        )}
      </div>
    </section>
  );
} 