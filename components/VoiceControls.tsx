'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Square } from 'lucide-react';
import { VoiceManager, VoiceSettings } from '../lib/voiceManager';

interface VoiceControlsProps {
  text: string;
  settings: VoiceSettings;
  className?: string;
}

export default function VoiceControls({ text, settings, className = '' }: VoiceControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // 再生状態の監視
    const checkPlayingState = () => {
      setIsPlaying(VoiceManager.getPlayingState());
    };

    const interval = setInterval(checkPlayingState, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePlay = async () => {
    if (!settings.enabled) {
      console.log('音声が無効のため再生をスキップ');
      return;
    }

    console.log('音声再生ボタンクリック:', { text: text.substring(0, 50), settings });
    setIsGenerating(true);
    try {
      const success = await VoiceManager.playAudio(text, settings);
      console.log('音声再生結果:', success);
      if (success) {
        setIsPlaying(true);
      } else {
        console.warn('音声再生が失敗しました');
      }
    } catch (error) {
      console.error('音声再生エラー:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    VoiceManager.stopAudio();
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