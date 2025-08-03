'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Square } from 'lucide-react';
import { VoiceManager, VoiceSettings } from '../lib/voiceManager';
import { VOICEVOXManager } from '../lib/voicevoxManager';
import { AppSettings } from '../types/app';

interface VoiceControlsProps {
  text: string;
  settings: VoiceSettings;
  appSettings: AppSettings; // AppSettings全体を追加
  className?: string;
  apiKey?: string; // APIキーを追加
}

export default function VoiceControls({ text, settings, appSettings, className = '', apiKey }: VoiceControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // 再生状態の監視（音声エンジンに関係なく）
    const checkPlayingState = () => {
      if (appSettings.voiceProvider === 'voicevox') {
        setIsPlaying(VOICEVOXManager.getIsPlaying());
      } else if (appSettings.voiceProvider === 'webspeech') {
        // Web Speech APIの場合、speechSynthesisで再生状態をチェック
        setIsPlaying(window.speechSynthesis?.speaking || false);
      } else {
        setIsPlaying(VoiceManager.getPlayingState());
      }
    };

    const interval = setInterval(checkPlayingState, 100);
    return () => clearInterval(interval);
  }, [appSettings.voiceProvider]);

  const handlePlay = async () => {
    if (!settings.enabled) {
      console.log('音声が無効のため再生をスキップ');
      return;
    }

    console.log('音声再生ボタンクリック:', { 
      text: text.substring(0, 50), 
      provider: appSettings.voiceProvider 
    });
    setIsGenerating(true);
    
    try {
      if (appSettings.voiceProvider === 'voicevox') {
        // VOICEVOX使用
        await VOICEVOXManager.speak(text, {
          enabled: settings.enabled,
          autoPlay: settings.autoPlay,
          speaker: appSettings.voicevoxSpeaker || 3,
          speed: appSettings.voicevoxSpeed || 1.0,
          pitch: appSettings.voicevoxPitch || 0.0,
          intonation: appSettings.voicevoxIntonation || 1.0,
          volume: appSettings.voicevoxVolume || 1.0,
          apiUrl: appSettings.voicevoxApiUrl || 'https://deprecatedapis.tts.quest/v2/voicevox'
        });
        console.log('✅ VOICEVOX音声再生成功');
        setIsPlaying(true);
      } else if (appSettings.voiceProvider === 'webspeech') {
        // Web Speech API使用
        if ('speechSynthesis' in window) {
          // 既存の音声を停止
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(text);
          
          // 日本語設定
          utterance.lang = 'ja-JP';
          utterance.rate = appSettings.voiceSpeed || 1.0;
          utterance.pitch = 1.0;
          utterance.volume = appSettings.voiceVolume || 0.8;
          
          // イベントリスナー設定
          utterance.onstart = () => {
            console.log('✅ Web Speech API音声再生開始');
            setIsPlaying(true);
          };
          
          utterance.onend = () => {
            console.log('✅ Web Speech API音声再生終了');
            setIsPlaying(false);
          };
          
          utterance.onerror = (event) => {
            console.error('❌ Web Speech API音声再生エラー:', event.error);
            setIsPlaying(false);
          };
          
          // 音声再生
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn('Web Speech APIはこのブラウザでサポートされていません');
        }
      } else {
        // ElevenLabs使用（既存の処理）
        const settingsWithApiKey = {
          ...settings,
          apiKey: apiKey
        };
        
        const success = await VoiceManager.playAudio(text, settingsWithApiKey);
        console.log('ElevenLabs音声再生結果:', success);
        if (success) {
          setIsPlaying(true);
        } else {
          console.warn('ElevenLabs音声再生が失敗しました');
        }
      }
    } catch (error) {
      console.error('音声再生エラー:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    if (appSettings.voiceProvider === 'voicevox') {
      VOICEVOXManager.stopCurrentAudio();
    } else if (appSettings.voiceProvider === 'webspeech') {
      // Web Speech API停止
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        console.log('Web Speech API音声停止');
      }
    } else {
      VoiceManager.stopAudio();
    }
    setIsPlaying(false);
  };

  if (!settings.enabled) {
    return null; // 音声が無効の場合は表示しない
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {!isPlaying ? (
        <button
          onClick={handlePlay}
          disabled={isGenerating}
          className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors disabled:opacity-50"
          title="音声で読み上げ"
        >
          {isGenerating ? (
            <div className="animate-spin">
              <Volume2 size={14} />
            </div>
          ) : (
            <Play size={14} />
          )}
        </button>
      ) : (
        <button
          onClick={handleStop}
          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
          title="音声を停止"
        >
          <Square size={14} />
        </button>
      )}
    </div>
  );
}

interface VoiceToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function VoiceToggle({ enabled, onToggle, className = '' }: VoiceToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
        enabled 
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      } ${className}`}
      title={enabled ? '音声を無効にする' : '音声を有効にする'}
    >
      {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      <span className="text-sm font-medium">
        {enabled ? '音声ON' : '音声OFF'}
      </span>
    </button>
  );
} 