import { createElevenLabsApi, validateApiKey } from './apiUtils';
import { apiErrorHandlers } from './errorHandler';
import { safeNumber, safeBoolean } from './dataTransforms';

export interface VoiceSettings {
  enabled: boolean;
  autoPlay: boolean;
  voiceId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  speed: number;
  volume: number;
  apiKey?: string; // APIキーを追加
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: { [key: string]: string };
  preview_url?: string;
}

export class VoiceManager {
  private static currentAudio: HTMLAudioElement | null = null;
  private static isPlaying: boolean = false;
  private static apiKey: string = '';
  private static isAudioUnlocked: boolean = false;

  /**
   * ユーザーのインタラクションでオーディオコンテキストをアンロックする
   * モバイルデバイスでの自動再生制限を回避するために一度だけ呼び出す
   */
  static unlockAudio() {
    if (this.isAudioUnlocked) return;
    try {
      const audio = new Audio();
      audio.volume = 0;
      audio.play().catch(() => {});
      this.isAudioUnlocked = true;
    } catch (error) {
      console.error('Failed to unlock audio context:', error);
    }
  }

  /**
   * APIキーを設定
   */
  static setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * 利用可能な音声リストを取得
   */
  static async getAvailableVoices(): Promise<ElevenLabsVoice[]> {
    const ELEVENLABS_API_KEY = this.apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!validateApiKey(ELEVENLABS_API_KEY, 'ElevenLabs')) {
      return [];
    }

    try {
      const elevenLabsApi = createElevenLabsApi(ELEVENLABS_API_KEY!);
      const result = await elevenLabsApi.getVoices();
      
      if (!result.success) {
        apiErrorHandlers.elevenlabs(new Error(result.error || 'Unknown error'), 'getVoices');
        return [];
      }
      
      const data = result.data as any;
      return data?.voices || [];
    } catch (error) {
      apiErrorHandlers.elevenlabs(error, 'getVoices');
      return [];
    }
  }

  /**
   * テキストを音声に変換
   */
  static async textToSpeech(
    text: string,
    settings: VoiceSettings
  ): Promise<ArrayBuffer | null> {
    const ELEVENLABS_API_KEY = settings.apiKey || this.apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs APIキーが設定されていません。');
      return null;
    }

    try {
      const requestBody = {
        text: text,
        model_id: 'eleven_multilingual_v2', // 日本語対応モデル
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarityBoost,
          style: settings.style,
          use_speaker_boost: settings.useSpeakerBoost,
        },
      };

      // ===== cache handling =====
      const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const key = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      const cache = 'caches' in self ? await caches.open('elevenlabs-tts') : null
      if (cache) {
        const cachedResp = await cache.match(key)
        if (cachedResp) {
          return await cachedResp.arrayBuffer()
        }
      }

      const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${settings.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const buf = await response.arrayBuffer()
    if (cache) {
      cache.put(key, new Response(buf, {
        headers: { 'Cache-Control': 'public,max-age=86400' }
      }))
    }
    return buf
    } catch (err) {
      console.error('ElevenLabs fetch/cache error:', err)
      return null
    }
  }

  /**
   * 音声を再生
   */
  static async playAudio(
    text: string,
    settings: VoiceSettings
  ): Promise<boolean> {
    if (!settings.enabled) return false;

    // モバイル版での自動再生制限対策を強化
    try {
      const win = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const AudioCtx = win.AudioContext || win.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          await ctx.resume();
          // すぐに閉じる（メモリリーク防止）
          ctx.close();
        }
      }
    } catch (e) {
      console.warn('AudioContext.resume() 失敗:', e);
    }

    // 既存の音声を停止
    this.stopAudio();

    try {
      
      // ElevenLabsのAPIキーがある場合はElevenLabsを試行
      const ELEVENLABS_API_KEY = settings.apiKey || this.apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
      if (ELEVENLABS_API_KEY) {
        const audioData = await this.textToSpeech(text, settings);
        if (audioData) {
          // ArrayBufferをBlobに変換
          const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);

          // Audio要素を作成して再生
          this.currentAudio = new Audio(audioUrl);
          
          // モバイル版での音声再生対策
          this.currentAudio.setAttribute('playsinline', 'true');
          this.currentAudio.setAttribute('webkit-playsinline', 'true');
          this.currentAudio.setAttribute('autoplay', 'true');
          this.currentAudio.setAttribute('preload', 'auto');
          this.currentAudio.volume = settings.volume;
          this.currentAudio.playbackRate = settings.speed;

          // モバイル版での音声再生イベントを追加
          this.currentAudio.oncanplaythrough = () => {
          };

          this.currentAudio.onloadeddata = () => {
          };

          this.currentAudio.onended = () => {
            this.isPlaying = false;
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
          };

          this.currentAudio.onerror = (error) => {
            console.error('音声再生エラー:', error);
            this.isPlaying = false;
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
          };

          this.isPlaying = true;
          try {
            // モバイル版での音声再生を確実にするため、ユーザーインタラクションを待つ
            const playPromise = this.currentAudio.play();
            if (playPromise !== undefined) {
              await playPromise;
            }
          } catch (playError) {
            console.error('[VoiceManager] audio.play() 失敗:', playError);
            // モバイル版での自動再生制限の場合、Web Speech APIにフォールバック
            this.speakWithWebAPI(text, settings);
            return true;
          }
          return true;
        }
      } else {
        console.warn('ElevenLabs APIキーが設定されていないため、ElevenLabs APIは使用できません。Web Speech APIにフォールバックします。');
      }
      
      // ElevenLabsが使えない場合やAPIキーがない場合はWeb Speech APIを使用
      this.speakWithWebAPI(text, settings);
      return true;
      
    } catch (error) {
      console.error('音声再生失敗:', error);
      // エラーが発生した場合もWeb Speech APIにフォールバック
      this.speakWithWebAPI(text, settings);
      return true;
    }
  }

  /**
   * 音声再生を停止
   */
  static stopAudio() {
    
    // ElevenLabs音声を停止
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    // Web Speech API音声を停止
    this.stopWebSpeech();
    
    this.isPlaying = false;
  }

  /**
   * 再生状態を取得
   */
  static getPlayingState(): boolean {
    return this.isPlaying;
  }

  /**
   * Web Speech API（フォールバック）
   */
  static speakWithWebAPI(text: string, settings: VoiceSettings) {
    if (!('speechSynthesis' in window)) {
      console.warn('ブラウザが音声合成をサポートしていません');
      return;
    }

    this.stopWebSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 安全な値の設定（NaN, undefined, nullをチェック）
    const safeRate = (typeof settings.speed === 'number' && !isNaN(settings.speed) && isFinite(settings.speed)) 
      ? Math.max(0.1, Math.min(10, settings.speed)) 
      : 1.0;
    const safeVolume = (typeof settings.volume === 'number' && !isNaN(settings.volume) && isFinite(settings.volume)) 
      ? Math.max(0, Math.min(1, settings.volume)) 
      : 0.8;
    const safePitch = 1.0; // 固定値
    
    
    utterance.rate = safeRate;
    utterance.volume = safeVolume;
    utterance.pitch = safePitch;

    // 音声読み込み完了を待つ
    const setVoiceAndSpeak = () => {
      const voices = speechSynthesis.getVoices();
      
      // 日本語音声を探す（優先順位順）
      const japaneseVoice = voices.find(voice => 
        voice.lang === 'ja-JP' || 
        voice.lang === 'ja' ||
        voice.name.includes('Japanese') ||
        voice.name.includes('Japan') ||
        voice.name.includes('日本')
      );
      
      if (japaneseVoice) {
        utterance.voice = japaneseVoice;
      } else {
      }

      // イベントリスナー追加
      utterance.onstart = () => {
        this.isPlaying = true;
      };
      
      utterance.onend = () => {
        this.isPlaying = false;
      };
      
      utterance.onerror = (event) => {
        // "interrupted"は正常な停止なのでエラーとして扱わない
        if (event.error === 'interrupted') {
          this.isPlaying = false;
          return;
        }
        
        console.error('Web Speech APIエラー:', event);
        console.error('エラー詳細:', {
          error: event.error,
          elapsedTime: event.elapsedTime,
          charIndex: event.charIndex,
          name: event.name
        });
        this.isPlaying = false;
        
        // エラーの種類に応じた対処
        if (event.error === 'not-allowed') {
          console.warn('音声再生が許可されていません。ブラウザの設定を確認してください。');
        } else if (event.error === 'network') {
          console.warn('ネットワークエラーが発生しました。');
        } else if (event.error === 'synthesis-failed') {
          console.warn('音声合成に失敗しました。');
        }
      };

      try {
        speechSynthesis.speak(utterance);
        // 即座にisPlayingをtrueに設定（onstartが呼ばれない場合のため）
        this.isPlaying = true;
      } catch (error) {
        console.error('[VoiceManager] Web Speech API再生失敗:', error);
        this.isPlaying = false;
      }
    };

    // 音声リストが読み込まれていない場合は待機
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
    } else {
      setVoiceAndSpeak();
    }
  }

  /**
   * Web Speech API停止
   */
  static stopWebSpeech() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      this.isPlaying = false;
    }
  }

  /**
   * 設定の検証（共通ユーティリティを使用）
   */
  static validateSettings(settings: Partial<VoiceSettings>): VoiceSettings {
    return {
      enabled: safeBoolean(settings.enabled, true),
      autoPlay: safeBoolean(settings.autoPlay, false),
      voiceId: settings.voiceId ?? '8EkOjt4xTPGMclNlh1pk',
      stability: Math.max(0, Math.min(1, safeNumber(settings.stability, 0.5))),
      similarityBoost: Math.max(0, Math.min(1, safeNumber(settings.similarityBoost, 0.75))),
      style: Math.max(0, Math.min(1, safeNumber(settings.style, 0))),
      useSpeakerBoost: safeBoolean(settings.useSpeakerBoost, true),
      speed: Math.max(0.25, Math.min(4, safeNumber(settings.speed, 1))),
      volume: Math.max(0, Math.min(1, safeNumber(settings.volume, 0.8)))
    };
  }

  /**
   * 音声プレビュー再生
   */
  static async playVoicePreview(voiceId: string, settings: VoiceSettings): Promise<boolean> {
    const previewText = "こんにちは！この音声でお話しします。";
    const previewSettings = { ...settings, voiceId };
    return await this.playAudio(previewText, previewSettings);
  }

  /**
   * 軽量なチャット完了通知音を再生
   * @param enabled 通知音が有効かどうか
   * @param volume 音量 (0.0 - 1.0)
   */
  static playNotificationSound(enabled: boolean = true, volume: number = 0.3): void {
    if (!enabled) return;

    try {
      // Web Audio APIで軽量なビープ音を生成
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio APIがサポートされていません');
        return;
      }
      
      const audioContext = new AudioContextClass();
      
      // 優しい2音のチャイム（Cメジャーコード）
      const frequencies = [523.25, 659.25]; // C5, E5
      const duration = 0.15; // 各音150ms
      const totalDuration = duration * frequencies.length + 0.1; // 少し間隔を開ける
      
      frequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // オシレーターの設定（サイン波で優しい音）
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // 音量とエンベロープ設定
        const startTime = audioContext.currentTime + (index * (duration + 0.05));
        const endTime = startTime + duration;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.8, startTime + 0.02); // 短いアタック
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime); // 緩やかなディケイ
        
        // 接続
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 再生
        oscillator.start(startTime);
        oscillator.stop(endTime);
      });
      
      // AudioContextを自動的にクリーンアップ
      setTimeout(() => {
        audioContext.close().catch(console.warn);
      }, totalDuration * 1000 + 100);
      
      
    } catch (error) {
      console.warn('通知音の再生に失敗しました:', error);
    }
  }
}

/**
 * デフォルト音声設定
 */
export const defaultVoiceSettings: VoiceSettings = {
  enabled: true, // デフォルトで有効に変更
  autoPlay: false,
      voiceId: '8EkOjt4xTPGMclNlh1pk', // ユーザー指定のデフォルト
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  useSpeakerBoost: true,
  speed: 1.0,
  volume: 0.8
};

/**
 * おすすめ音声設定（キャラクター別）
 */
export const characterVoicePresets: { [key: string]: Partial<VoiceSettings> } = {
  female_gentle: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
    stability: 0.3,
    similarityBoost: 0.8,
    style: 0.2
  },
  female_energetic: {
    voiceId: 'ThT5KcBeYPX3keUQqHPh', // Dorothy
    stability: 0.6,
    similarityBoost: 0.7,
    style: 0.4
  },
  male_calm: {
    voiceId: '8EkOjt4xTPGMclNlh1pk', // ユーザー指定のデフォルト
    stability: 0.4,
    similarityBoost: 0.8,
    style: 0.1
  }
}; 