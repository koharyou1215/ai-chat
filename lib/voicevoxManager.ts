export interface VOICEVOXSettings {
  enabled: boolean;
  autoPlay: boolean;
  speaker: number; // VOICEVOXの話者ID
  speed: number;   // 話速（0.5〜2.0）
  pitch: number;   // 音高（-0.15〜0.15）
  intonation: number; // 抑揚（0.0〜2.0）
  volume: number;  // 音量（0.0〜1.0）
  apiUrl: string;  // VOICEVOXエンジンのURL
}

export interface VOICEVOXSpeaker {
  id: number;
  name: string;
  speaker_uuid: string;
  styles: VOICEVOXStyle[];
  version: string;
}

export interface VOICEVOXStyle {
  id: number;
  name: string;
}

export interface AudioQuery {
  accent_phrases: AccentPhrase[];
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana: string;
}

export interface AccentPhrase {
  moras: Mora[];
  accent: number;
  pause_mora?: Mora;
  is_interrogative?: boolean;
}

export interface Mora {
  text: string;
  consonant?: string;
  consonant_length?: number;
  vowel: string;
  vowel_length: number;
  pitch: number;
}

export class VOICEVOXManager {
  private static currentAudio: HTMLAudioElement | null = null;
  private static isPlaying: boolean = false;

  // デフォルト設定
  private static defaultSettings: VOICEVOXSettings = {
    enabled: true,
    autoPlay: false,
    speaker: 3, // ずんだもん（ノーマル）
    speed: 1.0,
    pitch: 0.0,
    intonation: 1.0,
    volume: 1.0,
    apiUrl: 'https://deprecatedapis.tts.quest/v2/voicevox' // 公開API
  };

  /**
   * 利用可能な話者リストを取得（プロキシAPI経由）
   */
  static async getAvailableSpeakers(apiUrl?: string): Promise<VOICEVOXSpeaker[]> {
    try {
      const url = apiUrl || this.defaultSettings.apiUrl;
      const response = await fetch(`/api/voicevox?apiUrl=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error(`VOICEVOX プロキシAPI error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return result.speakers;
      } else {
        throw new Error(result.error || 'VOICEVOX話者リスト取得失敗');
      }
    } catch (error) {
      console.error('VOICEVOX話者リストの取得に失敗:', error);
      
      // フォールバック: よく使われる話者の静的リスト
      return [
        {
          id: 0,
          name: "四国めたん",
          speaker_uuid: "7ffcb7ce-00ec-4bdc-82cd-45a8889e43ff",
          styles: [
            { id: 0, name: "ノーマル" },
            { id: 6, name: "セクシー" },
            { id: 4, name: "ツンツン" },
            { id: 36, name: "ささやき" }
          ],
          version: "0.14.0"
        },
        {
          id: 1,
          name: "ずんだもん",
          speaker_uuid: "388f246b-8c41-4ac1-8e2d-5d79f3ff56d9",
          styles: [
            { id: 3, name: "ノーマル" },
            { id: 1, name: "あまあま" },
            { id: 7, name: "ツンツン" },
            { id: 37, name: "ささやき" }
          ],
          version: "0.14.0"
        },
        {
          id: 2,
          name: "春日部つむぎ",
          speaker_uuid: "35b2c544-660e-401e-b503-0e14c635303a",
          styles: [
            { id: 8, name: "ノーマル" }
          ],
          version: "0.14.0"
        },
        {
          id: 3,
          name: "雨晴はう",
          speaker_uuid: "3474ee95-c274-47f9-aa1a-8322163d96f1",
          styles: [
            { id: 10, name: "ノーマル" }
          ],
          version: "0.14.0"
        },
        {
          id: 4,
          name: "波音リツ",
          speaker_uuid: "b1a81618-b27b-40d2-b0ea-27a9ad408c4b",
          styles: [
            { id: 9, name: "ノーマル" }
          ],
          version: "0.14.0"
        },
        {
          id: 5,
          name: "玄野武宏",
          speaker_uuid: "c30dc15a-0992-4f8d-8bb8-ad3b314e6a6f",
          styles: [
            { id: 11, name: "ノーマル" },
            { id: 39, name: "喜び" },
            { id: 40, name: "ツンツン" },
            { id: 41, name: "悲しみ" }
          ],
          version: "0.14.0"
        },
        {
          id: 6,
          name: "白上虎太郎",
          speaker_uuid: "e5020595-5c5d-4e87-b849-270a518d0dcf",
          styles: [
            { id: 12, name: "ふつう" },
            { id: 32, name: "わーい" },
            { id: 33, name: "びくびく" },
            { id: 34, name: "おこ" },
            { id: 35, name: "びえーん" }
          ],
          version: "0.14.0"
        }
      ];
    }
  }

  /**
   * テキストから音声を合成（プロキシAPI経由）
   */
  static async synthesizeAudio(
    text: string, 
    speaker: number, 
    settings: Partial<VOICEVOXSettings> = {}
  ): Promise<ArrayBuffer> {
    const mergedSettings = { ...this.defaultSettings, ...settings };

    try {
      const response = await fetch('/api/voicevox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          speaker,
          apiUrl: mergedSettings.apiUrl
        }),
      });

      if (!response.ok) {
        throw new Error(`VOICEVOX プロキシAPI error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'VOICEVOX音声合成失敗');
      }

      // Base64をArrayBufferに変換
      const binaryString = atob(result.audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes.buffer;
    } catch (error) {
      console.error('VOICEVOX音声合成に失敗:', error);
      throw error;
    }
  }

  /**
   * テキストを音声に変換して再生
   */
  static async speak(
    text: string, 
    settings: Partial<VOICEVOXSettings> = {}
  ): Promise<void> {
    if (!text.trim()) return;

    try {
      console.log('🎵 VOICEVOX音声合成開始:', text);
      
      const mergedSettings = { ...this.defaultSettings, ...settings };
      
      // 音声を合成（プロキシAPI経由）
      const audioBuffer = await this.synthesizeAudio(text, mergedSettings.speaker, mergedSettings);
      
      // 音声を再生
      await this.playAudio(audioBuffer);
      
      console.log('✅ VOICEVOX音声再生完了');
    } catch (error) {
      console.error('❌ VOICEVOX音声再生エラー:', error);
      throw error;
    }
  }

  /**
   * 音声バッファを再生
   */
  private static async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 既存の音声を停止
        this.stopCurrentAudio();

        // ArrayBufferからBlobを作成
        const blob = new Blob([audioBuffer], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);

        // Audioオブジェクトを作成
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        this.isPlaying = true;

        audio.onended = () => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = (error) => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          console.error('音声再生エラー:', error);
          reject(new Error('音声再生に失敗しました'));
        };

        audio.play().catch(error => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          console.error('音声再生開始エラー:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 現在再生中の音声を停止
   */
  static stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  /**
   * 音声が再生中かどうか
   */
  static getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 音声合成のテスト
   */
  static async testVoice(settings: Partial<VOICEVOXSettings> = {}): Promise<boolean> {
    try {
      await this.speak('こんにちは、VOICEVOX音声合成のテストです。', settings);
      return true;
    } catch (error) {
      console.error('VOICEVOX音声テスト失敗:', error);
      return false;
    }
  }

  /**
   * デフォルト設定を取得
   */
  static getDefaultSettings(): VOICEVOXSettings {
    return { ...this.defaultSettings };
  }
}