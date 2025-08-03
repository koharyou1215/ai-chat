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
    isValidFormat: apiKey.startsWith('sk-or-v1-'),
    fullKey: apiKey // 完全なAPIキーを表示（デバッグ用）
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
    fullAuthHeader: `Bearer ${apiKey}`, // 完全な認証ヘッダーを表示（デバッグ用）
    model,
    messageCount: messages.length,
    headers: {
      'Authorization': `Bearer ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ai-chat-6ntorx1qj-kous-projects-ba188115.vercel.app',
      'X-Title': process.env.OPENROUTER_TITLE || 'AI Chat App',
    }
  });

  console.log('🌐 OpenRouter API呼び出し開始');
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ai-chat-6ntorx1qj-kous-projects-ba188115.vercel.app',
      'X-Title': process.env.OPENROUTER_TITLE || 'AI Chat App',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('📡 OpenRouter APIレスポンス:', response.status, response.statusText);

      if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch {
        errorText = 'レスポンステキストの読み取りに失敗';
      }
    
    console.error('❌ OpenRouter API エラー:', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText,
      url: response.url
    });
    
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('📋 OpenRouter API レスポンス:', {
    hasData: !!data,
    hasChoices: !!data?.choices,
    choicesLength: data?.choices?.length || 0,
    firstChoice: data?.choices?.[0],
    hasMessage: !!data?.choices?.[0]?.message,
    hasContent: !!data?.choices?.[0]?.message?.content,
    contentLength: data?.choices?.[0]?.message?.content?.length || 0,
    fullResponse: JSON.stringify(data, null, 2)
  });
  
  // data.choices[0].message.content にテキストが入る形式 (OpenAI 互換)
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  const reasoning: string | undefined = data?.choices?.[0]?.message?.reasoning;
  
  console.log('🔍 レスポンス詳細チェック:', {
    hasContent: !!content,
    hasReasoning: !!reasoning,
    contentLength: content?.length || 0,
    reasoningLength: reasoning?.length || 0,
    contentPreview: content?.substring(0, 100) + '...',
    reasoningPreview: reasoning?.substring(0, 100) + '...'
  });
  
  // content または reasoning のいずれかがあれば OK
  if ((!content || content.trim() === '') && (!reasoning || reasoning.trim() === '')) {
    console.error('❌ OpenRouter 応答に content も reasoning も含まれていません:', data);
    
    // エラーハンドリング強化: より詳細なエラー情報を提供
    if (data?.error) {
      throw new Error(`OpenRouter API エラー: ${data.error.message || data.error}`);
    }
    
    if (!data?.choices || data.choices.length === 0) {
      throw new Error('OpenRouter 応答に choices が含まれていません。APIキーまたはモデル設定を確認してください。');
    }
    
    if (!data.choices[0]?.message) {
      throw new Error('OpenRouter 応答の形式が正しくありません。modelが対応していない可能性があります。');
    }
    
    throw new Error('OpenRouter 応答が空です。プロンプトまたはモデル設定を確認してください。');
  }
  
  // content が空でreasoning があるthinking系モデルの場合
  if ((!content || content.trim() === '') && reasoning && reasoning.trim() !== '') {
    console.log('🧠 thinking系モデルのreasoningから回答を抽出');
    
    // reasoningから実際の日本語回答を抽出する改良版
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
    
    // 3. 最後の行から数字パターンを除去して抽出（より厳密に）
    const lines = reasoning.trim().split('\n');
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 3); i--) {
      const line = lines[i].trim();
      // 数字パターン、英語フレーズを除去
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
  
  // 通常のcontent応答
  const result = content || reasoning || '';
  console.log('✅ OpenRouter 応答取得完了:', result.substring(0, 100) + '...');
  return result;
}
