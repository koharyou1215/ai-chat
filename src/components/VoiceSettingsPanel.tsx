/**
 * 新しい音声システム用設定パネル
 */
import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Play, Square, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useVoiceSystem } from '../hooks/useVoiceSystem';
import { useSettingsStore } from '../stores/settingsStore';
import { VoiceProvider } from '../lib/voiceSystem';

interface VoiceSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const VOICE_PROVIDERS: { id: VoiceProvider['id']; name: string; description: string }[] = [
  {
    id: 'none',
    name: '音声なし',
    description: '音声機能を無効化'
  },
  {
    id: 'voicevox',
    name: 'VoiceVox',
    description: '高品質な日本語音声合成（無料・ローカル）'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: '多言語対応・高品質音声（有料API）'
  }
];

export default function VoiceSettingsPanel({ isOpen, onClose }: VoiceSettingsPanelProps) {
  const { settings, updateSettings } = useSettingsStore();
  const {
    voiceSystem,
    isInitialized,
    isPlaying,
    availableProviders,
    voiceVoxSpeakers,
    elevenLabsVoices,
    speak,
    stop,
    updateVoiceSettings,
    checkProviders
  } = useVoiceSystem();

  const [testText, setTestText] = useState('こんにちは！音声テストです。');
  const [isChecking, setIsChecking] = useState(false);

  // プロバイダー可用性チェック
  useEffect(() => {
    if (isOpen && isInitialized) {
      setIsChecking(true);
      checkProviders().finally(() => setIsChecking(false));
    }
  }, [isOpen, isInitialized, checkProviders]);

  // 音声テスト
  const handleVoiceTest = async () => {
    if (!testText.trim()) return;
    
    try {
      await speak(testText);
    } catch (error) {
      console.error('音声テスト失敗:', error);
      alert('音声テストに失敗しました: ' + (error as Error).message);
    }
  };

  // プロバイダー変更
  const handleProviderChange = (provider: VoiceProvider['id']) => {
    updateSettings({ voiceProvider: provider });
    updateVoiceSettings({ provider });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Volume2 className="w-6 h-6" />
              音声設定
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <XCircle className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 音声プロバイダー選択 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">音声エンジン</h3>
            <div className="space-y-3">
              {VOICE_PROVIDERS.map((provider) => (
                <div
                  key={provider.id}
                  className={`
                    p-4 border-2 rounded-xl cursor-pointer transition-all
                    ${settings.voiceProvider === provider.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                  onClick={() => handleProviderChange(provider.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {provider.name}
                        {isChecking ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : availableProviders[provider.id] ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {provider.description}
                      </div>
                      {!availableProviders[provider.id] && provider.id !== 'none' && (
                        <div className="text-xs text-red-600 mt-1">
                          利用できません
                        </div>
                      )}
                    </div>
                    <div className={`
                      w-5 h-5 rounded-full border-2
                      ${settings.voiceProvider === provider.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                      }
                    `}>
                      {settings.voiceProvider === provider.id && (
                        <div className="w-full h-full rounded-full bg-white scale-[0.4]" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 基本音声設定 */}
          {settings.voiceProvider !== 'none' && (
            <div className="space-y-6">
              {/* 音声速度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音声速度: {settings.voiceSpeed.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.voiceSpeed}
                  onChange={(e) => {
                    const speed = parseFloat(e.target.value);
                    updateSettings({ voiceSpeed: speed });
                    updateVoiceSettings({ speed });
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>遅い</span>
                  <span>速い</span>
                </div>
              </div>

              {/* 音量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音量: {Math.round(settings.voiceVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={settings.voiceVolume}
                  onChange={(e) => {
                    const volume = parseFloat(e.target.value);
                    updateSettings({ voiceVolume: volume });
                    updateVoiceSettings({ volume });
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* 音程 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音程: {settings.voicePitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={settings.voicePitch}
                  onChange={(e) => {
                    const pitch = parseFloat(e.target.value);
                    updateSettings({ voicePitch: pitch });
                    updateVoiceSettings({ pitch });
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>低い</span>
                  <span>高い</span>
                </div>
              </div>
            </div>
          )}

          {/* VoiceVox専用設定 */}
          {settings.voiceProvider === 'voicevox' && availableProviders.voicevox && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">VoiceVox設定</h3>
              
              {/* 話者選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  話者
                </label>
                <select
                  value={3} // デフォルトのずんだもん
                  onChange={(e) => {
                    const speakerId = parseInt(e.target.value);
                    updateVoiceSettings({ speakerId });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
                >
                  {voiceVoxSpeakers.length > 0 ? (
                    voiceVoxSpeakers.map(speaker =>
                      speaker.styles.map(style => (
                        <option key={style.id} value={style.id}>
                          {speaker.name} ({style.name})
                        </option>
                      ))
                    )
                  ) : (
                    <>
                      <option value={3}>ずんだもん (ノーマル)</option>
                      <option value={1}>ずんだもん (あまあま)</option>
                      <option value={8}>春日部つむぎ (ノーマル)</option>
                      <option value={0}>四国めたん (ノーマル)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* ElevenLabs専用設定 */}
          {settings.voiceProvider === 'elevenlabs' && availableProviders.elevenlabs && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ElevenLabs設定</h3>
              
              {/* 声質選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  声質
                </label>
                <select
                  value={settings.elevenLabsVoiceId}
                  onChange={(e) => {
                    const voiceId = e.target.value;
                    updateSettings({ elevenLabsVoiceId: voiceId });
                    updateVoiceSettings({ voiceId });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
                >
                  {elevenLabsVoices.length > 0 ? (
                    elevenLabsVoices.map((voice) => (
                      <option key={voice.voice_id} value={voice.voice_id}>
                        {voice.name}
                      </option>
                    ))
                  ) : (
                    <option value="">声質を読み込み中...</option>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* 音声テスト */}
          {settings.voiceProvider !== 'none' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">音声テスト</h3>
              
              <div className="space-y-3">
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="テスト用のテキストを入力..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={handleVoiceTest}
                    disabled={isPlaying || !testText.trim() || !isInitialized}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        再生中...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        テスト再生
                      </>
                    )}
                  </button>
                  
                  {isPlaying && (
                    <button
                      onClick={stop}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      停止
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 音声プロバイダー使用方法 */}
          {settings.voiceProvider === 'voicevox' && !availableProviders.voicevox && (
            <div className="border-t pt-6">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">VoiceVoxの設定方法</h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li><a href="https://voicevox.hiroshiba.jp/" target="_blank" rel="noopener noreferrer" className="underline">公式サイト</a>からVoiceVoxをダウンロード・インストール</li>
                  <li>VoiceVoxアプリケーションを起動</li>
                  <li>設定でAPIサーバー機能を有効化</li>
                  <li>このページをリロードして再試行</li>
                </ol>
              </div>
            </div>
          )}

          {settings.voiceProvider === 'elevenlabs' && !availableProviders.elevenlabs && (
            <div className="border-t pt-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">ElevenLabsの設定方法</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>1. <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="underline">ElevenLabs</a>でアカウントを作成</p>
                  <p>2. APIキーを取得</p>
                  <p>3. 環境変数 <code className="bg-blue-100 px-1 py-0.5 rounded">NEXT_PUBLIC_ELEVENLABS_API_KEY</code> に設定</p>
                  <p>4. このページをリロードして再試行</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}