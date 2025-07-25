export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterOptions {
  apiKey: string;
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * OpenRouter Chat Completion
 * https://openrouter.ai/docs#chat-completions
 */
export async function chatCompletion(options: OpenRouterOptions): Promise<string> {
  const {
    apiKey,
    model,
    messages,
    temperature = 0.7,
    maxTokens = 1024,
  } = options;

  // APIキーのデバッグログ
  console.log('OpenRouter API Key debug:', {
    keyLength: apiKey.length,
    keyStart: apiKey.substring(0, 10),
    keyEnd: apiKey.substring(apiKey.length - 10),
    isValidFormat: apiKey.startsWith('sk-or-v1-')
  });

  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  console.log('OpenRouter request details:', {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    authHeader: `Bearer ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`,
    model,
    messageCount: messages.length
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ai-chat-pby9shiay-kous-projects-ba188115.vercel.app',
      'X-Title': 'AI Chat App',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  // data.choices[0].message.content にテキストが入る形式 (OpenAI 互換)
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter 応答に content が含まれていません');
  }
  return content;
}
