export interface LoRASetting {
  id: string;
  name: string;
  weight: number;
  enabled: boolean;
}

export interface AppSettings {
  // 基本設定
  temperature: number;
  topP: number;
  maxTokens: number;
  memorySize: number;
  historySize: number;
  bubbleOpacity: number;
  bubbleCornerRadius?: number;
  bubbleShadow?: boolean;
  bubbleBlur?: boolean;
  autoScroll?: boolean;
  
  // APIキー（フロントエンドからの実際の送信名に合わせる）
  openRouterApiKey?: string;
  geminiApiKey?: string;
  runwareApiKey?: string;
  runwareModelId?: string;
  runwareLoraIds?: string[];
  runwareLoraSettings?: LoRASetting[];
  elevenLabsApiKey?: string;
  stableDiffusionApiKey?: string;
  
  // プロンプト設定
  loraSettings?: string;
  negativePrompt?: string;
  systemPrompt?: string;
  jailbreakPrompt?: string;
  responseFormat?: string;
  enableJailbreak?: boolean;
  enableSystemPrompt?: boolean;
  systemPromptEnabled?: boolean;
  inspirationPrompt?: string;
  enhancementPrompt?: string;
  inspirationMaxTokens?: number;
  
  // テーマ設定
  currentTheme?: string;
  customBackground?: string;
  
  // 音声設定
  voiceEnabled?: boolean;
  voiceAutoPlay?: boolean;
  voiceProvider?: 'elevenlabs' | 'voicevox' | 'webspeech'; // 音声エンジン選択
  
  // ElevenLabs設定
  voiceId?: string;
  voiceStability?: number;
  voiceSimilarityBoost?: number;
  voiceStyle?: number;
  voiceUseSpeakerBoost?: boolean;
  voiceSpeed?: number;
  voiceVolume?: number;
  
  // VOICEVOX設定
  voicevoxSpeaker?: number;
  voicevoxSpeed?: number;
  voicevoxPitch?: number;
  voicevoxIntonation?: number;
  voicevoxVolume?: number;
  voicevoxApiUrl?: string;
  
  // モデル設定
  model?: string;
  provider?: string;
  usedModel?: string;
  
  // 機能設定
  enableImageGeneration?: boolean;
  chatNotificationSound?: boolean;
  imageEngine?: string;
  candidateCount?: number;
  bubbleDesign?: 'default' | 'rounded' | 'sharp';
  jailbreakPromptEnabled?: boolean;
  typewriterSpeed?: number;

  // 画像生成設定
  imageSeed?: number;
  imageWidth?: number;
  imageHeight?: number;
  imageSteps?: number;
  imageCfgScale?: number;
  imageSampler?: string;
  
  // 画像生成詳細設定
  imageGenerationEnabled?: boolean;
  contextPromptWeight?: number;
  emotionDetectionSensitivity?: number;
  scenarioDetectionEnabled?: boolean;
  customQualityTags?: string;
  
  // 履歴関連設定
  autoLoadHistory?: boolean;
}
