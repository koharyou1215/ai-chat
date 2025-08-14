/**
 * 統合音声システム
 * VoiceVox と ElevenLabs API を統合管理
 */

export interface VoiceProvider {
  id: 'voicevox' | 'elevenlabs' | 'none';
  name: string;
  enabled: boolean;
}

export interface VoiceSettings {
  provider: VoiceProvider['id'];
  speed: number;
  volume: number;
  pitch: number;
  voiceId?: string; // ElevenLabs用
  speakerId?: number; // VoiceVox用
}

export interface VoiceVoxSpeaker {
  id: number;
  name: string;
  styles: { id: number; name: string; }[];
}

// VoiceVox デフォルト話者リスト
export const DEFAULT_VOICEVOX_SPEAKERS: VoiceVoxSpeaker[] = [
  {
    id: 3,
    name: 'ずんだもん',
    styles: [
      { id: 3, name: 'ノーマル' },
      { id: 1, name: 'あまあま' },
      { id: 7, name: 'ツンツン' },
      { id: 5, name: 'セクシー' }
    ]
  },
  {
    id: 1,
    name: 'みじんあんうの',
    styles: [
      { id: 2, name: 'ノーマル' },
      { id: 0, name: 'あまあま' },
      { id: 6, name: 'ツンツン' },
      { id: 4, name: 'セクシー' }
    ]
  },
  {
    id: 8,
    name: '春日部つむぎ',
    styles: [{ id: 8, name: 'ノーマル' }]
  },
  {
    id: 2,
    name: '雨晴はう',
    styles: [{ id: 10, name: 'ノーマル' }]
  }
];

export class VoiceSystem {
  private audioContext?: AudioContext;
  private currentAudio?: HTMLAudioElement;
  private settings: VoiceSettings;

  constructor(initialSettings: VoiceSettings) {
    this.settings = initialSettings;
  }

  // 設定更新
  updateSettings(newSettings: Partial<VoiceSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  // 現在の設定を取得
  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  // 音声合成実行
  async speak(text: string): Promise<void> {
    if (this.settings.provider === 'none') {
      return;
    }

    try {
      // 現在再生中の音声を停止
      this.stop();

      let audioBlob: Blob;

      switch (this.settings.provider) {
        case 'voicevox':
          audioBlob = await this.synthesizeWithVoiceVox(text);
          break;
        case 'elevenlabs':
          audioBlob = await this.synthesizeWithElevenLabs(text);
          break;
        default:
          throw new Error(`未対応のプロバイダー: ${this.settings.provider}`);
      }

      await this.playAudio(audioBlob);
    } catch (error) {
      console.error('音声合成エラー:', error);
      throw error;
    }
  }

  // VoiceVoxで音声合成
  private async synthesizeWithVoiceVox(text: string): Promise<Blob> {
    const speakerId = this.settings.speakerId || 3; // デフォルトはずんだもん
    const speed = this.settings.speed || 1.0;
    const pitch = this.settings.pitch || 1.0;

    try {
      // 1. 音声クエリ作成
      const queryResponse = await fetch(`http://localhost:50021/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!queryResponse.ok) {
        throw new Error(`VoiceVox音声クエリエラー: ${queryResponse.status}`);
      }

      const audioQuery = await queryResponse.json();
      
      // 速度とピッチを調整
      audioQuery.speedScale = speed;
      audioQuery.pitchScale = pitch;
      audioQuery.volumeScale = this.settings.volume;

      // 2. 音声合成実行
      const synthesisResponse = await fetch(`http://localhost:50021/synthesis?speaker=${speakerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audioQuery)
      });

      if (!synthesisResponse.ok) {
        throw new Error(`VoiceVox音声合成エラー: ${synthesisResponse.status}`);
      }

      return await synthesisResponse.blob();
    } catch (error) {
      // VoiceVoxが利用できない場合のフォールバック
      console.warn('VoiceVoxが利用できません:', error);
      return this.synthesizeWithWebSpeech(text);
    }
  }

  // ElevenLabs APIで音声合成
  private async synthesizeWithElevenLabs(text: string): Promise<Blob> {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    const voiceId = this.settings.voiceId || process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      throw new Error('ElevenLabs API設定が不完全です');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true,
            speaking_rate: this.settings.speed,
            pitch_scale: this.settings.pitch,
            volume_scale: this.settings.volume,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs APIエラー: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('ElevenLabs音声合成エラー:', error);
      // フォールバックとしてWebSpeechAPIを使用
      return this.synthesizeWithWebSpeech(text);
    }
  }

  // WebSpeech APIでフォールバック音声合成
  private async synthesizeWithWebSpeech(text: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('WebSpeech APIが利用できません'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = this.settings.speed;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;

      utterance.onend = () => {
        // WebSpeech APIは直接Blobを返さないため、空のBlobを返す
        resolve(new Blob());
      };

      utterance.onerror = (event) => {
        reject(new Error(`WebSpeech APIエラー: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // 音声再生
  private async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      this.currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = undefined;
        resolve();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = undefined;
        reject(new Error('音声再生エラー'));
      };

      audio.play().catch(reject);
    });
  }

  // 音声停止
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = undefined;
    }

    // WebSpeech APIの音声も停止
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // 再生中かどうか
  isPlaying(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : false;
  }

  // VoiceVox話者リスト取得
  async getVoiceVoxSpeakers(): Promise<VoiceVoxSpeaker[]> {
    try {
      const response = await fetch('http://localhost:50021/speakers');
      if (!response.ok) {
        throw new Error('VoiceVoxサーバーに接続できません');
      }
      return await response.json();
    } catch (error) {
      console.warn('VoiceVox話者リスト取得エラー:', error);
      return DEFAULT_VOICEVOX_SPEAKERS;
    }
  }

  // ElevenLabs声質リスト取得
  async getElevenLabsVoices(): Promise<any[]> {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    if (!apiKey) {
      return [];
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('ElevenLabs APIエラー');
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('ElevenLabs声質リスト取得エラー:', error);
      return [];
    }
  }

  // 音声プロバイダーの利用可能性チェック
  async checkProviderAvailability(): Promise<Record<VoiceProvider['id'], boolean>> {
    const availability: Record<VoiceProvider['id'], boolean> = {
      none: true,
      voicevox: false,
      elevenlabs: false,
    };

    // VoiceVoxチェック
    try {
      const response = await fetch('http://localhost:50021/speakers', {
        signal: AbortSignal.timeout(3000), // 3秒でタイムアウト
      });
      availability.voicevox = response.ok;
    } catch {
      availability.voicevox = false;
    }

    // ElevenLabsチェック
    const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    if (elevenLabsApiKey) {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': elevenLabsApiKey },
          signal: AbortSignal.timeout(5000), // 5秒でタイムアウト
        });
        availability.elevenlabs = response.ok;
      } catch {
        availability.elevenlabs = false;
      }
    }

    return availability;
  }
}