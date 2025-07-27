// 📊 メッセージ要約専用APIエンドポイント
// ファイル: /api/summarize-message/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SummarizeMessageRequest {
  content: string;
  role: 'user' | 'assistant';
  summaryType: 'concise' | 'detailed' | 'emotional';
  characterName?: string;
  contextualInfo?: {
    messageLength: number;
    wordCount: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { 
      content, 
      role, 
      summaryType, 
      characterName,
      contextualInfo 
    }: SummarizeMessageRequest = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '要約するメッセージ内容が必要です' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 🎯 要約タイプ別のプロンプト生成
    const generatePrompt = () => {
      const isUserMessage = role === 'user';
      const senderName = isUserMessage ? 'ユーザー' : (characterName || 'AI');
      
      const baseContext = `
【要約対象】
送信者: ${senderName}
メッセージ内容:
「${content}」

文字数: ${contextualInfo?.messageLength || content.length}
単語数: ${contextualInfo?.wordCount || content.split(/\s+/).length}
`;

      switch (summaryType) {
        case 'concise':
          return `${baseContext}

【要約タイプ: 簡潔要約】
上記のメッセージを**50-80文字程度**で簡潔に要約してください。

【要件】
- 核心的な内容のみを抽出
- 重要なキーワードは保持
- 読みやすい自然な文章
- 感情や意図は最小限に

【出力形式】
要約文のみを出力してください（説明や補足は不要）。`;

        case 'detailed':
          return `${baseContext}

【要約タイプ: 詳細要約】
上記のメッセージを**120-200文字程度**で構造化して要約してください。

【要件】
- 主要ポイントを整理して提示
- 論理的な構造を維持
- 具体的な内容と抽象的な意図を区別
- 重要な詳細情報を保持

【出力形式】
「【要点】○○について△△。【詳細】××の理由で□□を提案。」
のような構造化された要約文を出力してください。`;

        case 'emotional':
          return `${baseContext}

【要約タイプ: 感情・トーン要約】
上記のメッセージを**80-150文字程度**で感情やトーンに焦点を当てて要約してください。

【要件】
- 送信者の感情状態を分析
- メッセージのトーンや雰囲気を表現
- 相手への気持ちや関係性を考慮
- 言葉の奥にある意図を読み取る

【出力形式】
「${senderName}は○○という気持ちで、△△のトーンで××について伝えている。」
のような感情重視の要約文を出力してください。`;

        default:
          return `${baseContext}

上記のメッセージを適切な長さで要約してください。`;
      }
    };

    const prompt = generatePrompt();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    // 📊 要約結果の品質チェック
    const qualityMetrics = {
      originalLength: content.length,
      summaryLength: summary.length,
      compressionRatio: Math.round((1 - summary.length / content.length) * 100),
      wordCount: summary.split(/\s+/).length,
      summaryType,
      senderRole: role
    };

    return NextResponse.json({
      summary,
      metrics: qualityMetrics,
      originalContent: content,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Message summary error:', error);
    return NextResponse.json(
      { 
        error: 'メッセージの要約に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 🎯 要約品質の自動評価
function evaluateSummaryQuality(
  original: string, 
  summary: string, 
  summaryType: string
): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 100;

  // 長さチェック
  const expectedLengths = {
    'concise': { min: 30, max: 100 },
    'detailed': { min: 100, max: 250 },
    'emotional': { min: 60, max: 180 }
  };

  const expected = expectedLengths[summaryType as keyof typeof expectedLengths] || { min: 50, max: 200 };
  
  if (summary.length < expected.min) {
    score -= 20;
    feedback.push('要約が短すぎます');
  } else if (summary.length > expected.max) {
    score -= 15;
    feedback.push('要約が長すぎます');
  }

  // 圧縮率チェック
  const compressionRatio = 1 - (summary.length / original.length);
  if (compressionRatio < 0.2) {
    score -= 25;
    feedback.push('圧縮率が低すぎます（要約効果が小さい）');
  }

  // 内容の重複チェック（簡易）
  const originalWords = new Set(original.split(/\s+/));
  const summaryWords = new Set(summary.split(/\s+/));
  const commonWords = new Set([...summaryWords].filter(x => originalWords.has(x)));
  const preservationRatio = commonWords.size / Math.min(originalWords.size, summaryWords.size);
  
  if (preservationRatio < 0.3) {
    score -= 20;
    feedback.push('元の内容との関連性が低い可能性があります');
  }

  if (feedback.length === 0) {
    feedback.push('良好な要約品質です');
  }

  return { score: Math.max(0, score), feedback };
}
