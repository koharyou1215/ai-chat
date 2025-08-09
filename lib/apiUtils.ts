/**
 * API共通ユーティリティ関数
 * 各種API呼び出しの重複パターンを共通化
 */

export interface ApiRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  statusText?: string;
}

export interface FetchConfig {
  baseHeaders?: Record<string, string>;
  defaultTimeout?: number;
  defaultRetryCount?: number;
  defaultRetryDelay?: number;
}

/**
 * 統一されたAPI呼び出し関数
 */
export async function apiRequest<T = unknown>(
  options: ApiRequestOptions,
  config?: FetchConfig
): Promise<ApiResponse<T>> {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    timeout = config?.defaultTimeout ?? 30000,
    retryCount = config?.defaultRetryCount ?? 1,
    retryDelay = config?.defaultRetryDelay ?? 1000
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...config?.baseHeaders,
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || response.statusText;
        } catch {
          try {
            errorMessage = await response.text();
          } catch {
            errorMessage = response.statusText || 'Unknown error';
          }
        }

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorMessage}`,
          status: response.status,
          statusText: response.statusText
        };
      }

      let data: T;
      try {
        data = await response.json();
      } catch {
        // JSONでない場合はテキストとして扱う
        data = (await response.text()) as unknown as T;
      }

      return {
        success: true,
        data,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === retryCount) {
        break;
      }

      // リトライ前に待機
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  return {
    success: false,
    error: `Request failed after ${retryCount + 1} attempts: ${lastError?.message || 'Unknown error'}`
  };
}

/**
 * OpenRouter用の設定済みAPI呼び出し
 */
export function createOpenRouterApi(apiKey: string) {
  const config: FetchConfig = {
    baseHeaders: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'https://ai-chat-6ntorx1qj-kous-projects-ba188115.vercel.app',
      'X-Title': process.env.OPENROUTER_TITLE || 'AI Chat App'
    },
    defaultTimeout: 60000,
    defaultRetryCount: 1,
    defaultRetryDelay: 2000
  };

  return {
    chatCompletion: async (body: unknown) => 
      apiRequest({
        url: 'https://openrouter.ai/api/v1/chat/completions',
        method: 'POST',
        body
      }, config)
  };
}

/**
 * ElevenLabs用の設定済みAPI呼び出し
 */
export function createElevenLabsApi(apiKey: string) {
  const config: FetchConfig = {
    baseHeaders: {
      'xi-api-key': apiKey
    },
    defaultTimeout: 30000,
    defaultRetryCount: 2,
    defaultRetryDelay: 1000
  };

  return {
    getVoices: async () =>
      apiRequest({
        url: 'https://api.elevenlabs.io/v1/voices'
      }, config),
    
    textToSpeech: async (voiceId: string, body: unknown) =>
      apiRequest({
        url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        method: 'POST',
        headers: { 'Accept': 'audio/mpeg' },
        body
      }, config)
  };
}

/**
 * Runware用の設定済みAPI呼び出し
 */
export function createRunwareApi(apiKey: string) {
  const config: FetchConfig = {
    baseHeaders: {
      'Authorization': `Bearer ${apiKey}`
    },
    defaultTimeout: 120000,
    defaultRetryCount: 2,
    defaultRetryDelay: 2000
  };

  return {
    generateImage: async (body: unknown) =>
      apiRequest({
        url: 'https://api.runware.ai/v1',
        method: 'POST',
        body
      }, config)
  };
}

/**
 * APIキーの検証
 */
export function validateApiKey(apiKey: string | undefined, service: string): boolean {
  if (!apiKey) {
    console.warn(`${service} APIキーが設定されていません`);
    return false;
  }
  return true;
}

/**
 * レスポンスからコンテンツを安全に抽出
 */
export function extractContent(response: unknown, paths: string[]): string {
  if (!response || typeof response !== 'object') {
    return '';
  }

  for (const path of paths) {
    const keys = path.split('.');
    let current: any = response;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        current = null;
        break;
      }
    }

    if (typeof current === 'string' && current.trim()) {
      return current;
    }
  }

  return '';
}

/**
 * プレースホルダーを置換
 */
export function replacePlaceholders(
  text: string, 
  replacements: Record<string, string>
): string {
  let result = text;
  for (const [placeholder, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
    result = result.replace(regex, replacement);
  }
  return result;
}