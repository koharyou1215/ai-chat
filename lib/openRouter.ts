import { apiRequest, createOpenRouterApi, validateApiKey, extractContent, replacePlaceholders } from './apiUtils';
import { apiErrorHandlers } from './errorHandler';

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

  // APIキーの検証
  if (!validateApiKey(apiKey, 'OpenRouter')) {
    throw new Error('OpenRouter APIキーが設定されていません');
  }

  console.log('🌐 OpenRouter API呼び出し開始:', {
    model,
    messageCount: messages.length,
    temperature,
    maxTokens
  });

  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  // 統一されたAPI呼び出しを使用
  const openRouterApi = createOpenRouterApi(apiKey);
  const result = await openRouterApi.chatCompletion(requestBody);

  if (!result.success) {
    // lynn/soliloquy-v3の特別処理
    if (model === 'lynn/soliloquy-v3' && result.status === 404) {
      console.warn('⚠️ lynn/soliloquy-v3 が一時的に利用できません。代替モデルで処理します。');
      
      const fallbackModel = 'openai/gpt-4o-mini';
      console.log(`🔄 代替モデル ${fallbackModel} で再試行中...`);
      
      const fallbackRequestBody = { ...requestBody, model: fallbackModel };
      const fallbackResult = await openRouterApi.chatCompletion(fallbackRequestBody);
      
      if (fallbackResult.success) {
        const content = extractContent(fallbackResult.data, [
          'choices.0.message.content',
          'choices.0.message.reasoning'
        ]);
        
        if (content) {
          console.log('✅ 代替モデルでの処理が成功しました');
          return content;
        }
      }
    }

    // エラーハンドリング
    apiErrorHandlers.openRouter(new Error(result.error || 'Unknown error'), 'chatCompletion');
    throw new Error(result.error || 'OpenRouter API request failed');
  }

  const data = result.data;
  console.log('📋 OpenRouter API レスポンス受信完了');
  
  // 統一されたコンテンツ抽出を使用
  let content = extractContent(data, [
    'choices.0.message.content',
    'choices.0.message.reasoning'
  ]);

  // thinking系モデルのreasoningから回答を抽出
  const reasoning = extractContent(data, ['choices.0.message.reasoning']);
  if (!content && reasoning) {
    console.log('🧠 thinking系モデルのreasoningから回答を抽出');
    content = extractThinkingResponse(reasoning);
  }

  if (!content) {
    console.error('❌ OpenRouter 応答にコンテンツが含まれていません');
    throw new Error('OpenRouter 応答が空です。プロンプトまたはモデル設定を確認してください。');
  }

  console.log('✅ OpenRouter 応答取得完了:', content.substring(0, 100) + '...');
  return content;
}

/**
 * thinking系モデルのreasoningから実際の回答を抽出
 */
function extractThinkingResponse(reasoning: string): string {
  // 1. 強化された文章や最終回答パターンを探す
  const patterns = [
    /(?:強化されたテキスト|強化版|改善版|詳細版)[:：]\s*[「"'"`]?([^「"'"`\n]{30,300})[」"'"`]?/,
    /(?:最終的?な?(?:回答|返信)|最適な返信|推奨する返信|一番良い返信)[:：]?\s*[「"'"`]?([^「"'"`\n]{20,300})[」"'"`]?/,
    /(?:結果|答え|output)[:：]\s*[「"'"`]?([^「"'"`\n]{20,300})[」"'"`]?/i
  ];
  
  for (const pattern of patterns) {
    const match = reasoning.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim().replace(/\([0-9]+\)/g, '').trim();
      if (extracted.length >= 20 && /[ひらがなカタカナ]/.test(extracted) && 
          !extracted.includes('thinking') && !extracted.includes('analysis')) {
        console.log('✅ パターンマッチから抽出:', extracted.substring(0, 50) + '...');
        return extracted;
      }
    }
  }
  
  // 2. 引用符内の日本語文章を探す（最も長いものを選択）
  const quoteMatches = reasoning.match(/[「"'"`]([^「"'"`]{30,300})[」"'"`]/g);
  if (quoteMatches && quoteMatches.length > 0) {
    let longestMatch = '';
    for (const match of quoteMatches) {
      const extracted = match.replace(/[「"'"`]/g, '').trim();
      if (extracted.length > longestMatch.length && 
          /[ひらがなカタカナ]/.test(extracted) && 
          !extracted.includes('example') && !extracted.includes('option') &&
          !extracted.includes('thinking') && !extracted.includes('analysis')) {
        longestMatch = extracted;
      }
    }
    if (longestMatch.length >= 30) {
      console.log('✅ 最長引用符から抽出:', longestMatch.substring(0, 50) + '...');
      return longestMatch;
    }
  }
  
  // 3. 最後の行から数字パターンを除去して抽出
  const lines = reasoning.trim().split('\n');
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 3); i--) {
    const line = lines[i].trim();
    const cleanLine = line
      .replace(/\([0-9]+\)/g, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/^[-*]\s*/, '')
      .replace(/thinking|analysis|example|option|let me|i think|actually|wait/gi, '')
      .trim();
    
    if (cleanLine.length >= 30 && /[ひらがなカタカナ]/.test(cleanLine) && 
        cleanLine.split('').filter(c => /[ひらがなカタカナ一-龯]/.test(c)).length >= 15) {
      console.log('✅ 改良数字除去後から抽出:', cleanLine.substring(0, 50) + '...');
      return cleanLine;
    }
  }
  
  console.warn('⚠️ reasoning から適切な回答を抽出できませんでした');
  return 'すみません、適切な回答を生成できませんでした。もう一度お試しください。';
}
