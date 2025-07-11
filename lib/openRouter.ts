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

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // OpenRouter の利用規約に基づき、Referer と X-Title を送付します
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://example.com',
      'X-Title': process.env.OPENROUTER_TITLE || 'AI Chat App',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
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