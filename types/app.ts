export interface AppSettings {
  provider: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  runwareApiKey?: string;
  runwareImageModelId?: string;
  elevenlabsApiKey?: string;
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
  [key: string]: any; // その他の未知のプロパティを許可
} 