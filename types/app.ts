export interface AppSettings {
  provider: string;
  openRouterApikey?: string; // APIに合わせる
  openRouterModel?: string;
  geminiApikey?: string; // APIに合わせる
  geminiModel?: string;
  runwareApikey?: string; // APIに合わせる
  runwaremodelid?: string; // APIに合わせる
  elevenlabsApikey?: string; // APIに合わせる
  voiceId?: string;
  useStream?: boolean;
  useTextToSpeech?: boolean;
  useImageGeneration?: boolean;
  useImageUnderstanding?: boolean;
  useAutoChatHistorySave?: boolean;
  useMemo?: boolean;
  enableTouchGestures?: boolean;
  isMobile?: boolean;
  theme?: string;
  accentColor?: string;
  stableDiffusionApikey?: string; // APIに合わせる
  runwareLoraIds?: string[]; // Runware LORA IDを追加
  [key: string]: any; // その他の未知のプロパティを許可
} 