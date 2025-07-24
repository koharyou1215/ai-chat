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
    if (!ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs APIキーが設定されていません。');
      return [];
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('音声リスト取得エラー:', error);
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
        console.log('[VoiceManager] AudioContext state:', ctx.state);
        if (ctx.state === 'suspended') {
          console.log('[VoiceManager] AudioContextが中断されているため、再開を試みます。');
          await ctx.resume();
          console.log('[VoiceManager] AudioContext再開完了。');
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
      console.log('音声再生開始:', { text: text.substring(0, 50), settings });
      
      // ElevenLabsのAPIキーがある場合はElevenLabsを試行
      const ELEVENLABS_API_KEY = settings.apiKey || this.apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
      if (ELEVENLABS_API_KEY) {
        console.log('ElevenLabs APIを使用します');
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
            console.log('[VoiceManager] Audio can play through');
          };

          this.currentAudio.onloadeddata = () => {
            console.log('[VoiceManager] Audio data loaded');
          };

          this.currentAudio.onended = () => {
            this.isPlaying = false;
            URL.revokeObjectURL(audioUrl);
          };

          this.currentAudio.onerror = (error) => {
            console.error('音声再生エラー:', error);
            this.isPlaying = false;
          };

          this.isPlaying = true;
          try {
            console.log('[VoiceManager] Audio要素のplay()を呼び出します。');
            // モバイル版での音声再生を確実にするため、ユーザーインタラクションを待つ
            const playPromise = this.currentAudio.play();
            if (playPromise !== undefined) {
              await playPromise;
              console.log('[VoiceManager] Audio要素のplay()成功。');
            }
          } catch (playError) {
            console.error('[VoiceManager] audio.play() 失敗:', playError);
            // モバイル版での自動再生制限の場合、Web Speech APIにフォールバック
            console.log('モバイル版での自動再生制限のため、Web Speech APIにフォールバック');
            this.speakWithWebAPI(text, settings);
            return true;
          }
          console.log('ElevenLabs音声再生成功');
          return true;
        }
      } else {
        console.warn('ElevenLabs APIキーが設定されていないため、ElevenLabs APIは使用できません。');
      }
      
      // ElevenLabsが使えない場合やAPIキーがない場合はWeb Speech APIを使用
      console.log('Web Speech APIを使用します');
      this.speakWithWebAPI(text, settings);
      return true;
      
    } catch (error) {
      console.error('音声再生失敗:', error);
      // エラーが発生した場合もWeb Speech APIにフォールバック
      console.log('エラーのためWeb Speech APIにフォールバック');
      this.speakWithWebAPI(text, settings);
      return true;
    }
  }

  /**
   * 音声再生を停止
   */
  static stopAudio() {
    console.log('音声停止処理開始');
    
    // ElevenLabs音声を停止
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      console.log('ElevenLabs音声停止完了');
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

    console.log('Web Speech API使用開始:', text.substring(0, 50));
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
    
    console.log('音声設定値:', { speed: settings.speed, volume: settings.volume, safeRate, safeVolume });
    
    utterance.rate = safeRate;
    utterance.volume = safeVolume;
    utterance.pitch = safePitch;

    // 音声読み込み完了を待つ
    const setVoiceAndSpeak = () => {
      const voices = speechSynthesis.getVoices();
      console.log('利用可能な音声数:', voices.length);
      
      // 日本語音声を探す（優先順位順）
      const japaneseVoice = voices.find(voice => 
        voice.lang === 'ja-JP' || 
        voice.lang === 'ja' ||
        voice.name.includes('Japanese') ||
        voice.name.includes('Japan') ||
        voice.name.includes('日本')
      );
      
      if (japaneseVoice) {
        console.log('日本語音声を使用:', japaneseVoice.name);
        utterance.voice = japaneseVoice;
      } else {
        console.log('日本語音声が見つかりません。デフォルト音声を使用');
      }

      // イベントリスナー追加
      utterance.onstart = () => {
        console.log('Web Speech API音声再生開始');
        this.isPlaying = true;
      };
      
      utterance.onend = () => {
        console.log('Web Speech API音声再生終了');
        this.isPlaying = false;
      };
      
      utterance.onerror = (event) => {
        console.error('Web Speech APIエラー:', event);
        this.isPlaying = false;
      };

      try {
        console.log('[VoiceManager] Web Speech APIのspeak()を呼び出します。');
        speechSynthesis.speak(utterance);
        console.log('[VoiceManager] Web Speech APIのspeak()成功。');
        // 即座にisPlayingをtrueに設定（onstartが呼ばれない場合のため）
        this.isPlaying = true;
      } catch (error) {
        console.error('[VoiceManager] Web Speech API再生失敗:', error);
        this.isPlaying = false;
      }
    };

    // 音声リストが読み込まれていない場合は待機
    if (speechSynthesis.getVoices().length === 0) {
      console.log('音声リスト読み込み待機中...');
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
      console.log('Web Speech API停止');
      speechSynthesis.cancel();
      this.isPlaying = false;
    }
  }

  /**
   * 設定の検証
   */
  static validateSettings(settings: Partial<VoiceSettings>): VoiceSettings {
    return {
      enabled: settings.enabled ?? true,
      autoPlay: settings.autoPlay ?? false,
      voiceId: settings.voiceId ?? '8EkOjt4xTPGMclNlh1pk', // ユーザー指定のデフォルト
      stability: Math.max(0, Math.min(1, settings.stability ?? 0.5)),
      similarityBoost: Math.max(0, Math.min(1, settings.similarityBoost ?? 0.75)),
      style: Math.max(0, Math.min(1, settings.style ?? 0)),
      useSpeakerBoost: settings.useSpeakerBoost ?? true,
      speed: Math.max(0.25, Math.min(4, settings.speed ?? 1)),
      volume: Math.max(0, Math.min(1, settings.volume ?? 0.8))
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
      
      console.log('チャット完了通知音を再生しました');
      
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