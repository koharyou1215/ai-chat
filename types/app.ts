export interface AppSettings {
  // 基本設定
  temperature: number;
  topP: number;
  maxTokens: number;
  memorySize: number;
  historySize: number;
  bubbleOpacity: number;
  
  // APIキー（フロントエンドからの実際の送信名に合わせる）
  OpenRouterApikey?: string;
  geminiApiKey?: string;
  Runwareapikey?: string;
  runwaremodelid?: string;
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
  
  // テーマ設定
  currentTheme?: string;
  customBackground?: string;
  
  // 音声設定
  voiceEnabled?: boolean;
  voiceAutoPlay?: boolean;
  voiceId?: string;
  voiceStability?: number;
  voiceSimilarityBoost?: number;
  voiceStyle?: number;
  voiceUseSpeakerBoost?: boolean;
  voiceSpeed?: number;
  voiceVolume?: number;
  
  // モデル設定
  model?: string;
  provider?: string;
  
  // 機能設定
  enableImageGeneration?: boolean;
  chatNotificationSound?: boolean;
  imageEngine?: string;
  bubbleBlur?: boolean;
  candidateCount?: number;
  
  // Runware設定
  runwareLoraIds?: string[];
  allowNsfw?: boolean;
  
  // インスピレーション設定
  inspirationPrompt?: string;
  enhancementPrompt?: string;
  inspirationMaxTokens?: number;
  
  // その他
  [key: string]: unknown;
}
