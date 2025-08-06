import { NextRequest, NextResponse } from 'next/server';
import { GeminiApiManager } from '../../../../lib/geminiApiManager';

// シンプル要約プロンプト（20〜30文字程度、名詞句ベース・句点不要）
const SYSTEM_PROMPT = `あなたは会話メモの見出しを作る編集者です。
- 出力は20〜30文字程度の日本語の短い見出し
- 体言止め（名詞句、句点不要）
- 重複語を避け、要点だけを抽出
- 固有名詞や関係性、感情の変化など重要語を優先
- 余計な記号や説明は入れない（「タイトル:」等を付けない）
例: 「緊張が高まる対峙」「距離が縮まる船上の会話」「秘密を明かす決意」`;

function buildMessages(message: string, current: string, maxLen: number) {
  const goal = Math.max(8, Math.min(maxLen || 30, 40));
  const user = [
    `要約対象（チャット抜粋）:`,
    message.trim(),
    current ? `\n既存の下書き（任意）: ${current.trim()}` : '',
    `\n出力条件: 約${goal}文字 / 名詞句 / 句点不要 / 一行 / JSON等禁止`,
  ].join('\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user }
  ] as Array<{ role: 'system' | 'user'; content: string }>;
}

// 出力を最終整形（改行/句点/余計な空白を除去、長さ調整）
function postProcessTitle(text: string, maxLen: number): string {
  let t = (text || '').replace(/\r?\n/g, ' ').trim();
  t = t.replace(/^[「『\-\s]+|[」』\-\s]+$/g, '');   // 前後の記号・空白
  t = t.replace(/。+$/g, '');                        // 語尾の句点
  t = t.replace(/\s{2,}/g, ' ');                    // 連続空白
  const limit = Math.max(8, Math.min(maxLen || 30, 40));
  if (t.length > limit) t = t.slice(0, limit);
  return t;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = String(body?.message || '');
    const current = String(body?.current || '');
    const maxLen = Number(body?.maxLen || 30);
    const openRouterApiKey = String(body?.openRouterApiKey || process.env.OPENROUTER_API_KEY || '');

    if (!message.trim() && !current.trim()) {
      return NextResponse.json(
        { success: false, error: '要約対象テキストが空です' },
        { status: 400 }
      );
    }

    const model = 'gemini-2.5-flash'; // まずはGemini直指定（GeminiApiManager側でOpenRouterへフォールバック）
    const messages = buildMessages(message, current, maxLen);

    const res = await GeminiApiManager.generateWithPriority(
      model,
      messages,
      {
        maxTokens: 128,
        temperature: 0.4,
        openRouterApiKey // OpenRouterフォールバック用（設定画面から渡ってきてもOK）
      }
    );

    if (!res.success || !res.content) {
      return NextResponse.json(
        { success: false, error: res.error || '生成に失敗しました' },
        { status: 500 }
      );
    }

    const title = postProcessTitle(res.content, maxLen);
    if (!title) {
      return NextResponse.json(
        { success: false, error: '生成結果が空でした' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, title });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
