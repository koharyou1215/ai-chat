/**
 * 音声システム管理フック
 */
import { useCallback, useEffect, useState, useRef } from 'react';
import { VoiceSystem, VoiceSettings, VoiceProvider, VoiceVoxSpeaker } from '../lib/voiceSystem';
import { useSettingsStore } from '../stores/settingsStore';

export interface UseVoiceSystemReturn {
  voiceSystem: VoiceSystem | null;
  isInitialized: boolean;
  isPlaying: boolean;
  availableProviders: Record<VoiceProvider['id'], boolean>;
  voiceVoxSpeakers: VoiceVoxSpeaker[];
  elevenLabsVoices: any[];
  speak: (text: string) => Promise<void>;
  stop: () => void;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  initializeVoiceSystem: () => Promise<void>;
  checkProviders: () => Promise<void>;
}

export const useVoiceSystem = (): UseVoiceSystemReturn => {
  const { settings, updateSettings } = useSettingsStore();
  const [voiceSystem, setVoiceSystem] = useState<VoiceSystem | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<Record<VoiceProvider['id'], boolean>>({
    none: true,
    voicevox: false,
    elevenlabs: false,
  });
  const [voiceVoxSpeakers, setVoiceVoxSpeakers] = useState<VoiceVoxSpeaker[]>([]);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<any[]>([]);
  
  const playingCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // 音声システム初期化
  const initializeVoiceSystem = useCallback(async () => {
    try {
      const voiceSettings: VoiceSettings = {
        provider: settings.voiceProvider,
        speed: settings.voiceSpeed,
        volume: settings.voiceVolume,
        pitch: settings.voicePitch,
        voiceId: settings.elevenLabsVoiceId,
        speakerId: 3, // デフォルトのずんだもん
      };

      const system = new VoiceSystem(voiceSettings);
      setVoiceSystem(system);
      setIsInitialized(true);

      // プロバイダー可用性チェック
      await checkProviders();
    } catch (error) {
      console.error('音声システム初期化エラー:', error);
      setIsInitialized(false);
    }
  }, [settings.voiceProvider, settings.voiceSpeed, settings.voiceVolume, settings.voicePitch, settings.elevenLabsVoiceId]);

  // プロバイダー可用性チェック
  const checkProviders = useCallback(async () => {
    if (!voiceSystem) return;

    try {
      const providers = await voiceSystem.checkProviderAvailability();
      setAvailableProviders(providers);

      // VoiceVox話者リスト取得
      if (providers.voicevox) {
        const speakers = await voiceSystem.getVoiceVoxSpeakers();
        setVoiceVoxSpeakers(speakers);
      }

      // ElevenLabs声質リスト取得
      if (providers.elevenlabs) {
        const voices = await voiceSystem.getElevenLabsVoices();
        setElevenLabsVoices(voices);
      }
    } catch (error) {
      console.error('プロバイダーチェックエラー:', error);
    }
  }, [voiceSystem]);

  // 音声設定更新
  const updateVoiceSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    if (voiceSystem) {
      voiceSystem.updateSettings(newSettings);
      
      // グローバル設定も更新
      updateSettings({
        voiceProvider: newSettings.provider || settings.voiceProvider,
        voiceSpeed: newSettings.speed || settings.voiceSpeed,
        voiceVolume: newSettings.volume || settings.voiceVolume,
        voicePitch: newSettings.pitch || settings.voicePitch,
        elevenLabsVoiceId: newSettings.voiceId || settings.elevenLabsVoiceId,
      });
    }
  }, [voiceSystem, settings, updateSettings]);

  // 音声合成・再生
  const speak = useCallback(async (text: string) => {
    if (!voiceSystem || !isInitialized) {
      console.warn('音声システムが初期化されていません');
      return;
    }

    try {
      setIsPlaying(true);
      await voiceSystem.speak(text);
    } catch (error) {
      console.error('音声再生エラー:', error);
    } finally {
      setIsPlaying(false);
    }
  }, [voiceSystem, isInitialized]);

  // 音声停止
  const stop = useCallback(() => {
    if (voiceSystem) {
      voiceSystem.stop();
      setIsPlaying(false);
    }
  }, [voiceSystem]);

  // 再生状態の監視
  useEffect(() => {
    if (isPlaying && voiceSystem) {
      playingCheckInterval.current = setInterval(() => {
        if (!voiceSystem.isPlaying()) {
          setIsPlaying(false);
        }
      }, 100);
    } else {
      if (playingCheckInterval.current) {
        clearInterval(playingCheckInterval.current);
        playingCheckInterval.current = null;
      }
    }

    return () => {
      if (playingCheckInterval.current) {
        clearInterval(playingCheckInterval.current);
      }
    };
  }, [isPlaying, voiceSystem]);

  // 設定変更時の音声システム更新
  useEffect(() => {
    if (voiceSystem && isInitialized) {
      const voiceSettings: VoiceSettings = {
        provider: settings.voiceProvider,
        speed: settings.voiceSpeed,
        volume: settings.voiceVolume,
        pitch: settings.voicePitch,
        voiceId: settings.elevenLabsVoiceId,
        speakerId: 3,
      };
      
      voiceSystem.updateSettings(voiceSettings);
    }
  }, [
    voiceSystem,
    isInitialized,
    settings.voiceProvider,
    settings.voiceSpeed,
    settings.voiceVolume,
    settings.voicePitch,
    settings.elevenLabsVoiceId
  ]);

  // 初回初期化
  useEffect(() => {
    if (!isInitialized && !voiceSystem) {
      initializeVoiceSystem();
    }
  }, [initializeVoiceSystem, isInitialized, voiceSystem]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (voiceSystem) {
        voiceSystem.stop();
      }
      if (playingCheckInterval.current) {
        clearInterval(playingCheckInterval.current);
      }
    };
  }, [voiceSystem]);

  return {
    voiceSystem,
    isInitialized,
    isPlaying,
    availableProviders,
    voiceVoxSpeakers,
    elevenLabsVoices,
    speak,
    stop,
    updateVoiceSettings,
    initializeVoiceSystem,
    checkProviders,
  };
};