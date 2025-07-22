// AI ChatアプリでのOpenRouterモデル設定（ユーザー指定版）
// OpenRouter一本化、指定された9種類のモデルのみ

export const OPENROUTER_MODELS = {
  // Qwen系
  QWEN_3_235B: 'qwen/qwen3-235b-a22b-07-25:free',
  
  // xAI Grok系
  GROK_4: 'x-ai/grok-4',
  
  // Google Gemini 2.5系
  GEMINI_2_5_FLASH: 'google/gemini-2.5-flash',
  GEMINI_2_5_PRO: 'google/gemini-2.5-pro',
  
  // DeepSeek系
  DEEPSEEK_R1: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
  DEEPSEEK_V3: 'deepseek/deepseek-chat-v3-0324:free',
  
  // Anthropic Claude系
  CLAUDE_OPUS_4: 'anthropic/claude-opus-4',
  CLAUDE_SONNET_4: 'anthropic/claude-sonnet-4',
  CLAUDE_3_7_SONNET: 'anthropic/claude-3.7-sonnet:thinking'
};

export const MODEL_DISPLAY_NAMES = {
  [OPENROUTER_MODELS.QWEN_3_235B]: 'Qwen 3 235B (Free)',
  [OPENROUTER_MODELS.GROK_4]: 'Grok-4',
  [OPENROUTER_MODELS.GEMINI_2_5_FLASH]: 'Gemini 2.5 Flash',
  [OPENROUTER_MODELS.GEMINI_2_5_PRO]: 'Gemini 2.5 Pro',
  [OPENROUTER_MODELS.DEEPSEEK_R1]: 'DeepSeek R1 (Free)',
  [OPENROUTER_MODELS.DEEPSEEK_V3]: 'DeepSeek V3 (Free)',
  [OPENROUTER_MODELS.CLAUDE_OPUS_4]: 'Claude Opus 4',
  [OPENROUTER_MODELS.CLAUDE_SONNET_4]: 'Claude Sonnet 4',
  [OPENROUTER_MODELS.CLAUDE_3_7_SONNET]: 'Claude 3.7 Sonnet (Thinking)'
};

// デフォルトモデル（Gemini 2.5 Pro）
export const DEFAULT_MODELS = {
  OPENROUTER: OPENROUTER_MODELS.GEMINI_2_5_PRO,
  FALLBACK: OPENROUTER_MODELS.GEMINI_2_5_FLASH
};

// プロバイダー別デフォルトモデル（OpenRouter一本化）
export const PROVIDER_DEFAULTS = {
  openrouter: DEFAULT_MODELS.OPENROUTER
};
