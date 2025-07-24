export interface CharacterPersonality {
  summary: string;
  external: string;
  internal: string;
  strengths: string[];
  weaknesses: string[];
}

export interface CharacterAppearance {
  description: string;
  hair: string;
  eyes: string;
  clothing: string;
  underwear: string;
  other_features: string;
}

export interface CharacterSpeakingStyle {
  base: string;
  first_person: string;
  second_person: string;
  quirks: string;
  nsfw_variation: string;
}

export interface CharacterScenario {
  worldview: string;
  initial_situation: string;
  relationship_with_user: string;
}

export interface NSFWProfile {
  persona: string;
  libido_level: string;
  limits: {
    hard: string[];
    soft: string[];
  };
  kinks: string[];
  involuntary_reactions: string;
  orgasm_details: string;
}

export interface CharacterDefinition {
  personality: CharacterPersonality;
  background: string;
  appearance: CharacterAppearance;
  speaking_style: CharacterSpeakingStyle;
  scenario: CharacterScenario;
  nsfw_profile?: NSFWProfile;
}

export interface CharacterTracker {
  name: string;
  display_name: string;
  initial_value: number;
  max_value: number;
}

export interface ExampleDialogue {
  user: string;
  char: string;
}

export interface Character {
  "file-name"?: string;
  name: string;
  tags: string[];
  first_message: string[];
  character_definition?: CharacterDefinition;
  trackers?: CharacterTracker[];
  example_dialogue?: ExampleDialogue[];
  // 簡易フィールド
  personality?: string;
  appearance?: string;
  speaking_style?: string;
  scenario?: string;
  nsfw_profile?: string;
  age?: string;
  occupation?: string;
  hobbies: string[];
  likes: string[];
  dislikes: string[];
  background?: string;
  avatar_url?: string;
  imageSeed?: number; // 画像生成用のデフォルトシード（未設定はランダム）
  imageWidth?: number;
  imageHeight?: number;
  imageSteps?: number;
  imageCfgScale?: number;
  imageSampler?: string;
}

export interface UserPersona {
  id: string;
  name: string;
  /** ペルソナの簡単な説明 */
  description?: string;
  /** ペルソナの役割・肩書き */
  role?: string;
  /** 特徴キーワード */
  traits?: string[];
  likes: string[];
  dislikes: string[];
  other_settings: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  characterId: string;
  character?: Character; // キャラクター情報全体を保存
  messages: ChatMessage[];
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMemo {
  id: string;
  messageId: string;
  sessionId: string;
  characterId: string;
  content: string;
  note: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isAiMemory?: boolean; // AIが参照用に使うかどうか
  importance?: number; // 1-5の重要度
}

export interface Theme {
  id: string;
  name: string;
  type: 'gradient' | 'image' | 'solid';
  background: string;
  sidebar: string;
  text: {
    primary: string;
    secondary: string;
    accent: string;
  };
  bubble: {
    user: string;
    ai: string;
    opacity: number;
  };
  preview: string;
}

export interface AppSettings {
  geminiApiKey: string;
  elevenLabsApiKey: string;
  voiceEnabled?: boolean; // オプショナルに変更
  voiceAutoPlay?: boolean; // オプショナルに変更
  voiceId?: string;
  voiceStability?: number;
  voiceSimilarityBoost?: number;
  voiceStyle?: number;
  voiceUseSpeakerBoost?: boolean;
  voiceSpeed?: number;
  voiceVolume?: number;
  enableImageGeneration?: boolean; // オプショナルに変更
  loraSettings?: string;
  negativePrompt?: string;
  imageEngine?: 'sd' | 'runware';
  chatNotificationSound?: boolean; // オプショナルに変更
  currentTheme?: string;
  customBackground?: string;
  bubbleOpacity?: number;
  bubbleBlur?: boolean;
  autoScroll?: boolean;
  stableDiffusionApiKey?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  memorySize?: number;
  historySize?: number;
  systemPrompt?: string;
  jailbreakPrompt?: string;
  responseFormat?: string;
  enableJailbreak?: boolean;
  enableSystemPrompt?: boolean;
  model?: string;
  provider?: string;
  openRouterApiKey?: string;
  candidateCount?: number;
  runwareModelId?: string;
  runwareLoraIds?: string[];
  runwareApiKey?: string; // Runware APIキーを追加
  inspirationPrompt?: string; // 追加
  enhancementPrompt?: string; // 追加
  inspirationMaxTokens?: number;
} 