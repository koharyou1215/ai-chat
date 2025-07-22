// 文章強化機能に関する型定義

export interface EnhancementResult {
  originalText: string;
  enhancedText: string;
  messageId: string;
}

export interface EnhanceButtonPosition {
  x: number;
  y: number;
}

export interface EnhancementState {
  selectedText: string;
  selectedMessageId: string;
  showEnhanceButton: boolean;
  enhanceButtonPosition: EnhanceButtonPosition;
  isEnhancing: boolean;
  enhancementResult: EnhancementResult | null;
  showEnhancementModal: boolean;
  isEnhancingUserText: boolean;
}

// 基本的なメッセージ型（最小限）
export interface BasicMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// 基本的なキャラクター型（最小限）
export interface BasicCharacter {
  name: string;
  description?: string;
  personality?: string;
}

// 基本的な設定型（最小限）
export interface BasicSettings {
  enhancementStyle?: 'casual' | 'formal' | 'creative' | 'technical';
  maxTokens?: number;
  temperature?: number;
}

export interface EnhanceTextRequest {
  text: string;
  character: BasicCharacter;
  context: BasicMessage[];
  variantCount: number;
  settings: BasicSettings;
}

export interface EnhanceTextResponse {
  success: boolean;
  enhancedText?: string;
  error?: string;
}

// 文章強化関連のユーティリティ型
export type EnhancementMode = 'selection' | 'input' | 'auto';

export interface EnhancementConfig {
  mode: EnhancementMode;
  maxLength: number;
  minLength: number;
  enableAutoEnhancement: boolean;
  enhancementStyle: 'casual' | 'formal' | 'creative' | 'technical';
}
