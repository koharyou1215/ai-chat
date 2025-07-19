import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

if (!GEMINI_API_KEY) {
  console.warn('[summarize-chat] GEMINI_API_KEY が設定されていません');
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Chat summarization API called');
    
    const { messages, characterName, sessionTitle } = await request.json();
    console.log('Messages count:', messages?.length);
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'メッセージが見つかりません'
      }, { status: 400 });
    }

    // メッセージが少なすぎる場合
    if (messages.length < 3) {
      return NextResponse.json({
        success: true,
        summary: {
          overview: '会話がまだ短いため、要約するには十分な内容がありません。',
          keyPoints: ['会話を続けてより多くの内容を蓄積してください。'],
          characterInsights: [],
          emotionalFlow: '会話開始',
          wordCount: messages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0)
        }
      });
    }
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3, // 要約には低い温度で一貫性を重視
        topP: 0.8,
        maxOutputTokens: 1500,
      }
    });

    // 会話履歴を整理
    const conversationText = messages
      .map((msg: ChatMessage) => `${msg.role === 'user' ? 'ユーザー' : characterName || 'キャラクター'}: ${msg.content}`)
      .join('\n\n');

    const prompt = `以下の会話を詳細に分析して、構造化された要約を作成してください。

【会話タイトル】: ${sessionTitle || '新しいチャット'}
【キャラクター】: ${characterName || 'AI'}

【会話内容】:
${conversationText}

【要求する要約形式】:
以下のJSON形式で応答してください：

{
  "overview": "会話全体の概要（150文字以内）",
  "keyPoints": [
    "重要なポイント1",
    "重要なポイント2",
    "重要なポイント3"
  ],
  "characterInsights": [
    "キャラクターの性格や行動に関する洞察1",
    "キャラクターの性格や行動に関する洞察2"
  ],
  "emotionalFlow": "会話の感情的な流れの説明",
  "topics": [
    "話題1",
    "話題2",
    "話題3"
  ],
  "userEngagement": "ユーザーの関与度や興味のポイント",
  "memorableQuotes": [
    "印象的な発言やフレーズ1",
    "印象的な発言やフレーズ2"
  ]
}

重要な点：
- 客観的で正確な要約を心がける
- キャラクターの個性や特徴を捉える
- 会話の流れと感情の変化を記録
- ユーザーとキャラクターの関係性に注目
- 今後の会話に役立つ情報を抽出

JSON形式以外は出力しないでください。`;

    console.log('Sending summarization request to Gemini');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini response:', text);

    try {
      // JSONパースを試行
      const summary = JSON.parse(text);
      
      // 統計情報を追加
      const stats = {
        messageCount: messages.length,
        userMessageCount: messages.filter((msg: ChatMessage) => msg.role === 'user').length,
        aiMessageCount: messages.filter((msg: ChatMessage) => msg.role === 'assistant').length,
        wordCount: messages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0),
        averageMessageLength: Math.round(
          messages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0) / messages.length
        ),
        conversationDuration: messages.length > 1 
          ? messages[messages.length - 1].timestamp - messages[0].timestamp
          : 0
      };

      return NextResponse.json({
        success: true,
        summary: {
          ...summary,
          stats,
          generatedAt: Date.now()
        }
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      
      // フォールバック: 簡単な要約を生成
      return NextResponse.json({
        success: true,
        summary: {
          overview: 'AIによる会話の要約です。',
          keyPoints: ['会話の詳細な要約の生成中にエラーが発生しました。'],
          characterInsights: ['キャラクターの分析は後ほど再試行してください。'],
          emotionalFlow: '分析中',
          topics: ['一般的な会話'],
          userEngagement: '分析中',
          memorableQuotes: [],
          stats: {
            messageCount: messages.length,
            userMessageCount: messages.filter((msg: ChatMessage) => msg.role === 'user').length,
            aiMessageCount: messages.filter((msg: ChatMessage) => msg.role === 'assistant').length,
            wordCount: messages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0)
          },
          generatedAt: Date.now()
        }
      });
    }
    
  } catch (error) {
    console.error('Chat summarization API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 