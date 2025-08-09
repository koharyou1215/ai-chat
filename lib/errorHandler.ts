/**
 * エラーハンドリング共通ユーティリティ
 */

export interface ErrorInfo {
  message: string;
  type: 'network' | 'api' | 'validation' | 'storage' | 'unknown';
  code?: string | number;
  details?: unknown;
  timestamp: number;
}

export interface ErrorHandlerOptions {
  logToConsole?: boolean;
  showUserMessage?: boolean;
  userMessageSelector?: string;
  fallbackAction?: () => void;
  retryAction?: () => Promise<void>;
}

/**
 * 統一されたエラーハンドリング関数
 */
export function handleError(
  error: unknown,
  context: string,
  options: ErrorHandlerOptions = {}
): ErrorInfo {
  const {
    logToConsole = true,
    showUserMessage = false,
    userMessageSelector,
    fallbackAction,
  } = options;

  const errorInfo: ErrorInfo = {
    message: getErrorMessage(error),
    type: getErrorType(error),
    code: getErrorCode(error),
    details: error,
    timestamp: Date.now()
  };

  // コンソールログ
  if (logToConsole) {
    const prefix = `❌ [${context}] エラー:`;
    console.error(prefix, errorInfo.message);
    if (errorInfo.details) {
      console.error('詳細:', errorInfo.details);
    }
  }

  // ユーザー向けメッセージ表示
  if (showUserMessage && userMessageSelector) {
    showUserErrorMessage(errorInfo, userMessageSelector);
  }

  // フォールバックアクション実行
  if (fallbackAction) {
    try {
      fallbackAction();
    } catch (fallbackError) {
      console.warn('フォールバックアクション実行中にエラー:', fallbackError);
    }
  }

  return errorInfo;
}

/**
 * エラーメッセージを抽出
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const obj = error as any;
    return obj.message || obj.error || obj.statusText || JSON.stringify(error);
  }

  return 'Unknown error';
}

/**
 * エラータイプを判定
 */
function getErrorType(error: unknown): ErrorInfo['type'] {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return 'network';
    }
    
    if (message.includes('api') || message.includes('http') || message.includes('response')) {
      return 'api';
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }
    
    if (message.includes('storage') || message.includes('localstorage') || message.includes('sessionstorage')) {
      return 'storage';
    }
  }

  return 'unknown';
}

/**
 * エラーコードを抽出
 */
function getErrorCode(error: unknown): string | number | undefined {
  if (error && typeof error === 'object') {
    const obj = error as any;
    return obj.code || obj.status || obj.statusCode;
  }
  return undefined;
}

/**
 * ユーザー向けエラーメッセージを表示
 */
function showUserErrorMessage(errorInfo: ErrorInfo, selector: string): void {
  const element = document.querySelector(selector);
  if (!element) return;

  const userMessage = getUserFriendlyMessage(errorInfo);
  
  element.textContent = userMessage;
  element.className += ' error-message visible';
  
  // 5秒後に自動で隠す
  setTimeout(() => {
    element.className = element.className.replace(/\s?error-message\s?visible/g, '');
  }, 5000);
}

/**
 * ユーザーフレンドリーなメッセージに変換
 */
function getUserFriendlyMessage(errorInfo: ErrorInfo): string {
  const { type, message } = errorInfo;

  switch (type) {
    case 'network':
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    case 'api':
      if (message.includes('401') || message.includes('unauthorized')) {
        return 'APIキーが無効です。設定を確認してください。';
      }
      if (message.includes('403') || message.includes('forbidden')) {
        return 'アクセスが拒否されました。権限を確認してください。';
      }
      if (message.includes('404') || message.includes('not found')) {
        return '要求されたリソースが見つかりません。';
      }
      if (message.includes('429') || message.includes('rate limit')) {
        return '利用制限に達しました。しばらく時間をおいてください。';
      }
      if (message.includes('500') || message.includes('internal server')) {
        return 'サーバーエラーが発生しました。しばらく待ってからお試しください。';
      }
      return 'APIでエラーが発生しました。';
    case 'validation':
      return '入力内容に問題があります。確認してください。';
    case 'storage':
      return 'データの保存・読み込みに失敗しました。';
    default:
      return '予期しないエラーが発生しました。';
  }
}

/**
 * API固有のエラーハンドラー
 */
export const apiErrorHandlers = {
  openRouter: (error: unknown, context: string) => 
    handleError(error, `OpenRouter ${context}`, {
      logToConsole: true,
      showUserMessage: false,
      fallbackAction: () => {
        console.warn('⚠️ OpenRouterでエラーが発生しました。代替モデルの使用を検討してください。');
      }
    }),

  gemini: (error: unknown, context: string) =>
    handleError(error, `Gemini ${context}`, {
      logToConsole: true,
      showUserMessage: false
    }),

  elevenlabs: (error: unknown, context: string) =>
    handleError(error, `ElevenLabs ${context}`, {
      logToConsole: true,
      showUserMessage: false,
      fallbackAction: () => {
        console.warn('⚠️ ElevenLabsでエラーが発生しました。Web Speech APIにフォールバックします。');
      }
    }),

  runware: (error: unknown, context: string) =>
    handleError(error, `Runware ${context}`, {
      logToConsole: true,
      showUserMessage: false
    }),

  storage: (error: unknown, context: string) =>
    handleError(error, `Storage ${context}`, {
      logToConsole: true,
      showUserMessage: false,
      fallbackAction: () => {
        console.warn('⚠️ ストレージ操作でエラーが発生しました。データが保存されない可能性があります。');
      }
    })
};

/**
 * リトライ可能なエラー判定
 */
export function isRetryableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error);

  // ネットワークエラー
  if (message.includes('timeout') || message.includes('network') || message.includes('fetch')) {
    return true;
  }

  // 一時的なサーバーエラー
  if (code === 429 || code === 500 || code === 502 || code === 503 || code === 504) {
    return true;
  }

  return false;
}

/**
 * エラー詳細の構造化
 */
export function structureError(error: unknown, context?: string): {
  summary: string;
  technical: string;
  userMessage: string;
  suggestions: string[];
} {
  const errorInfo = handleError(error, context || 'Unknown', { logToConsole: false });

  const suggestions: string[] = [];

  switch (errorInfo.type) {
    case 'network':
      suggestions.push('インターネット接続を確認してください');
      suggestions.push('VPNを使用している場合は無効にしてください');
      break;
    case 'api':
      suggestions.push('APIキーが正しく設定されているか確認してください');
      suggestions.push('しばらく時間をおいてから再試行してください');
      break;
    case 'validation':
      suggestions.push('入力内容を確認してください');
      suggestions.push('必須フィールドが入力されているか確認してください');
      break;
    case 'storage':
      suggestions.push('ブラウザのストレージ容量を確認してください');
      suggestions.push('ブラウザのキャッシュをクリアしてください');
      break;
  }

  return {
    summary: errorInfo.message,
    technical: JSON.stringify(errorInfo.details),
    userMessage: getUserFriendlyMessage(errorInfo),
    suggestions
  };
}