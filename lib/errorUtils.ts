/**
 * エラーハンドリングの共通ユーティリティ
 * 統一されたエラー処理とログ出力
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  context?: string;
  timestamp?: number;
  stack?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorHandler {
  onError?: (error: ErrorInfo) => void;
  onRetry?: (attempt: number, maxRetries: number) => void;
  shouldRetry?: (error: ErrorInfo) => boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * エラー情報を作成
 */
export function createErrorInfo(
  error: unknown,
  context?: string,
  code?: string,
  severity: ErrorInfo['severity'] = 'medium'
): ErrorInfo {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  return {
    message,
    code,
    context,
    timestamp: Date.now(),
    stack,
    severity
  };
}

/**
 * エラーを安全にログ出力
 */
export function logError(
  error: ErrorInfo,
  includeStack: boolean = process.env.NODE_ENV === 'development'
): void {
  const prefix = `[${error.severity?.toUpperCase() || 'ERROR'}]`;
  const contextStr = error.context ? ` (${error.context})` : '';
  const codeStr = error.code ? ` [${error.code}]` : '';
  
  const message = `${prefix}${contextStr}${codeStr}: ${error.message}`;

  switch (error.severity) {
    case 'critical':
      console.error(message);
      if (includeStack && error.stack) {
        console.error(error.stack);
      }
      break;
    case 'high':
      console.error(message);
      break;
    case 'medium':
      console.warn(message);
      break;
    case 'low':
      console.info(message);
      break;
    default:
      console.warn(message);
  }
}

/**
 * 非同期関数のエラーハンドリング付き実行
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  handler: ErrorHandler = {}
): Promise<{ success: true; data: T } | { success: false; error: ErrorInfo }> {
  const { maxRetries = 0, retryDelay = 1000, onError, onRetry, shouldRetry } = handler;

  let lastError: ErrorInfo | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      lastError = createErrorInfo(error, `Attempt ${attempt + 1}/${maxRetries + 1}`);
      
      if (onError) {
        onError(lastError);
      }

      // リトライ判定
      if (attempt < maxRetries && (shouldRetry ? shouldRetry(lastError) : true)) {
        if (onRetry) {
          onRetry(attempt + 1, maxRetries);
        }
        
        if (retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        continue;
      }

      break;
    }
  }

  return { success: false, error: lastError! };
}

/**
 * 同期関数のエラーハンドリング付き実行
 */
export function withErrorHandlingSync<T>(
  operation: () => T,
  onError?: (error: ErrorInfo) => void,
  context?: string
): { success: true; data: T } | { success: false; error: ErrorInfo } {
  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    const errorInfo = createErrorInfo(error, context);
    
    if (onError) {
      onError(errorInfo);
    } else {
      logError(errorInfo);
    }

    return { success: false, error: errorInfo };
  }
}

/**
 * Promise のエラーを安全にキャッチ
 */
export async function safePromise<T>(
  promise: Promise<T>,
  context?: string
): Promise<{ success: true; data: T } | { success: false; error: ErrorInfo }> {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (error) {
    const errorInfo = createErrorInfo(error, context);
    logError(errorInfo);
    return { success: false, error: errorInfo };
  }
}

/**
 * 複数の Promise を安全に実行
 */
export async function safePromiseAll<T>(
  promises: Promise<T>[],
  context?: string
): Promise<{
  success: boolean;
  results: Array<{ success: true; data: T } | { success: false; error: ErrorInfo }>;
  successCount: number;
  errorCount: number;
}> {
  const results = await Promise.allSettled(promises);
  
  const processedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return { success: true as const, data: result.value };
    } else {
      const errorInfo = createErrorInfo(
        result.reason,
        context ? `${context} (Promise ${index + 1})` : `Promise ${index + 1}`
      );
      logError(errorInfo);
      return { success: false as const, error: errorInfo };
    }
  });

  const successCount = processedResults.filter(r => r.success).length;
  const errorCount = processedResults.length - successCount;

  return {
    success: errorCount === 0,
    results: processedResults,
    successCount,
    errorCount
  };
}

/**
 * API エラーの判定
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  const errorString = String(error);
  return (
    errorString.includes('NetworkError') ||
    errorString.includes('ERR_NETWORK') ||
    errorString.includes('ERR_INTERNET_DISCONNECTED') ||
    errorString.includes('AbortError') ||
    errorString.includes('TimeoutError')
  );
}

/**
 * レート制限エラーの判定
 */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    if (errorObj.status === 429 || errorObj.code === 'rate_limit_exceeded') {
      return true;
    }
  }
  
  const errorString = String(error);
  return (
    errorString.includes('rate limit') ||
    errorString.includes('too many requests') ||
    errorString.includes('quota exceeded')
  );
}

/**
 * 認証エラーの判定
 */
export function isAuthError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    if (errorObj.status === 401 || errorObj.status === 403) {
      return true;
    }
  }
  
  const errorString = String(error);
  return (
    errorString.includes('unauthorized') ||
    errorString.includes('invalid token') ||
    errorString.includes('authentication failed')
  );
}

/**
 * エラー情報をユーザーフレンドリーなメッセージに変換
 */
export function getUserFriendlyMessage(error: ErrorInfo): string {
  const { message, context } = error;

  // ネットワークエラー
  if (isNetworkError(message)) {
    return 'インターネット接続を確認してください。';
  }

  // レート制限エラー
  if (isRateLimitError(message)) {
    return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
  }

  // 認証エラー
  if (isAuthError(message)) {
    return 'APIキーが無効です。設定を確認してください。';
  }

  // API固有のエラー
  if (context?.includes('OpenRouter')) {
    if (message.includes('insufficient_quota')) {
      return 'OpenRouterの残高が不足しています。';
    }
    if (message.includes('model_not_found')) {
      return '指定されたモデルが見つかりません。';
    }
  }

  if (context?.includes('ElevenLabs')) {
    if (message.includes('voice_not_found')) {
      return '指定された音声が見つかりません。';
    }
    if (message.includes('character_limit_exceeded')) {
      return 'テキストが長すぎます。短くしてください。';
    }
  }

  // 一般的なHTTPエラー
  if (message.includes('HTTP 500')) {
    return 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
  }
  
  if (message.includes('HTTP 400')) {
    return 'リクエストに問題があります。入力内容を確認してください。';
  }

  // デフォルトメッセージ
  return 'エラーが発生しました。しばらく待ってから再試行してください。';
}

/**
 * グローバルエラーハンドラーの設定
 */
export function setupGlobalErrorHandler(
  onError?: (error: ErrorInfo) => void
): void {
  // 未処理のPromise拒否をキャッチ
  window.addEventListener('unhandledrejection', (event) => {
    const errorInfo = createErrorInfo(
      event.reason,
      'Unhandled Promise Rejection',
      'UNHANDLED_PROMISE',
      'high'
    );
    
    if (onError) {
      onError(errorInfo);
    } else {
      logError(errorInfo, true);
    }

    // デフォルトのエラー表示を防ぐ
    event.preventDefault();
  });

  // 一般的なJavaScriptエラーをキャッチ
  window.addEventListener('error', (event) => {
    const errorInfo = createErrorInfo(
      event.error || event.message,
      'Global Error Handler',
      'GLOBAL_ERROR',
      'high'
    );
    
    if (onError) {
      onError(errorInfo);
    } else {
      logError(errorInfo, true);
    }
  });
}

/**
 * デバッグ用のエラー情報ダンプ
 */
export function dumpErrorInfo(error: ErrorInfo): string {
  return JSON.stringify({
    ...error,
    timestamp: new Date(error.timestamp || Date.now()).toISOString()
  }, null, 2);
}