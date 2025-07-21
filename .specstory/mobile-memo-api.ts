// 📱 モバイルメモ管理API - 統合エンドポイント
// CRUD操作、バッチ処理、レスポンス最適化

import { NextRequest, NextResponse } from 'next/server';

interface ChatMemo {
  id: string;
  messageId: string;
  sessionId: string;
  content: string;
  timestamp: number;
  category?: string;
  isImportant?: boolean;
}

interface MemoCreateRequest {
  messageId: string;
  sessionId: string;
  content: string;
  category?: string;
  isImportant?: boolean;
}

interface MemoUpdateRequest {
  content?: string;
  category?: string;
  isImportant?: boolean;
}

interface MemoBatchRequest {
  action: 'delete' | 'toggle_important' | 'update_category';
  memoIds: string[];
  data?: {
    category?: string;
    isImportant?: boolean;
  };
}

// 🗄️ メモ保存先（実装時はDBに置き換え）
const memoStorage = new Map<string, ChatMemo>();

// 🆔 ID生成関数
function generateId(): string {
  return `memo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// 📱 GET: メモ一覧取得
async function getMemos(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const messageId = searchParams.get('messageId');
    const category = searchParams.get('category');
    const important = searchParams.get('important');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let memos = Array.from(memoStorage.values());

    // 🔍 フィルタリング
    if (sessionId) {
      memos = memos.filter(memo => memo.sessionId === sessionId);
    }
    
    if (messageId) {
      memos = memos.filter(memo => memo.messageId === messageId);
    }
    
    if (category) {
      memos = memos.filter(memo => memo.category === category);
    }
    
    if (important === 'true') {
      memos = memos.filter(memo => memo.isImportant === true);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      memos = memos.filter(memo => 
        memo.content.toLowerCase().includes(searchLower)
      );
    }

    // 📊 ソート（新しい順）
    memos.sort((a, b) => b.timestamp - a.timestamp);

    // 📄 ページネーション
    const total = memos.length;
    const paginatedMemos = memos.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        memos: paginatedMemos,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    console.error('Get memos error:', error);
    return NextResponse.json(
      { success: false, error: 'メモの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 📝 POST: メモ作成
async function createMemo(request: NextRequest): Promise<NextResponse> {
  try {
    const body: MemoCreateRequest = await request.json();
    
    // バリデーション
    if (!body.content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'メモ内容は必須です' },
        { status: 400 }
      );
    }
    
    if (!body.sessionId) {
      return NextResponse.json(
        { success: false, error: 'セッションIDは必須です' },
        { status: 400 }
      );
    }

    const memo: ChatMemo = {
      id: generateId(),
      messageId: body.messageId || '',
      sessionId: body.sessionId,
      content: body.content.trim(),
      timestamp: Date.now(),
      category: body.category || '一般',
      isImportant: body.isImportant || false
    };

    memoStorage.set(memo.id, memo);

    return NextResponse.json({
      success: true,
      data: memo,
      message: 'メモを作成しました'
    });

  } catch (error) {
    console.error('Create memo error:', error);
    return NextResponse.json(
      { success: false, error: 'メモの作成に失敗しました' },
      { status: 500 }
    );
  }
}

// ✏️ PUT: メモ更新
async function updateMemo(request: NextRequest, memoId: string): Promise<NextResponse> {
  try {
    const body: MemoUpdateRequest = await request.json();
    
    const existingMemo = memoStorage.get(memoId);
    if (!existingMemo) {
      return NextResponse.json(
        { success: false, error: 'メモが見つかりません' },
        { status: 404 }
      );
    }

    // 更新
    const updatedMemo: ChatMemo = {
      ...existingMemo,
      ...(body.content !== undefined && { content: body.content.trim() }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.isImportant !== undefined && { isImportant: body.isImportant })
    };

    memoStorage.set(memoId, updatedMemo);

    return NextResponse.json({
      success: true,
      data: updatedMemo,
      message: 'メモを更新しました'
    });

  } catch (error) {
    console.error('Update memo error:', error);
    return NextResponse.json(
      { success: false, error: 'メモの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE: メモ削除
async function deleteMemo(memoId: string): Promise<NextResponse> {
  try {
    const existingMemo = memoStorage.get(memoId);
    if (!existingMemo) {
      return NextResponse.json(
        { success: false, error: 'メモが見つかりません' },
        { status: 404 }
      );
    }

    memoStorage.delete(memoId);

    return NextResponse.json({
      success: true,
      message: 'メモを削除しました'
    });

  } catch (error) {
    console.error('Delete memo error:', error);
    return NextResponse.json(
      { success: false, error: 'メモの削除に失敗しました' },
      { status: 500 }
    );
  }
}

// 📦 POST: バッチ操作
async function batchOperation(request: NextRequest): Promise<NextResponse> {
  try {
    const body: MemoBatchRequest = await request.json();
    
    if (!body.memoIds || body.memoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'メモIDが指定されていません' },
        { status: 400 }
      );
    }

    const results: Array<{
      memoId: string;
      success: boolean;
      error?: string;
      data?: ChatMemo;
    }> = [];
    
    for (const memoId of body.memoIds) {
      const memo = memoStorage.get(memoId);
      if (!memo) {
        results.push({ memoId, success: false, error: 'メモが見つかりません' });
        continue;
      }

      try {
        switch (body.action) {
          case 'delete':
            memoStorage.delete(memoId);
            results.push({ memoId, success: true });
            break;
            
          case 'toggle_important':
            const toggledMemo = { ...memo, isImportant: !memo.isImportant };
            memoStorage.set(memoId, toggledMemo);
            results.push({ memoId, success: true, data: toggledMemo });
            break;
            
          case 'update_category':
            if (!body.data?.category) {
              results.push({ memoId, success: false, error: 'カテゴリが指定されていません' });
              continue;
            }
            const updatedMemo = { ...memo, category: body.data.category };
            memoStorage.set(memoId, updatedMemo);
            results.push({ memoId, success: true, data: updatedMemo });
            break;
            
          default:
            results.push({ memoId, success: false, error: '不正なアクションです' });
        }
      } catch {
        results.push({ memoId, success: false, error: '操作に失敗しました' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: body.memoIds.length,
          success: successCount,
          failed: body.memoIds.length - successCount
        }
      },
      message: `${successCount}件の操作が完了しました`
    });

  } catch (error) {
    console.error('Batch operation error:', error);
    return NextResponse.json(
      { success: false, error: 'バッチ操作に失敗しました' },
      { status: 500 }
    );
  }
}

// 📊 GET: 統計情報
async function getStatistics(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    let memos = Array.from(memoStorage.values());
    
    if (sessionId) {
      memos = memos.filter(memo => memo.sessionId === sessionId);
    }

    const categories = memos.reduce((acc, memo) => {
      const category = memo.category || '一般';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const important = memos.filter(memo => memo.isImportant).length;
    
    const recentMemos = memos
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        total: memos.length,
        important,
        categories,
        recent: recentMemos
      }
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    return NextResponse.json(
      { success: false, error: '統計の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 🔄 メインルーター
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { pathname } = new URL(request.url);
  
  if (pathname.endsWith('/statistics')) {
    return getStatistics(request);
  }
  
  return getMemos(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { pathname } = new URL(request.url);
  
  if (pathname.endsWith('/batch')) {
    return batchOperation(request);
  }
  
  return createMemo(request);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const { pathname } = new URL(request.url);
  const pathParts = pathname.split('/');
  const memoId = pathParts[pathParts.length - 1];
  
  if (!memoId || memoId === 'memos') {
    return NextResponse.json(
      { success: false, error: 'メモIDが指定されていません' },
      { status: 400 }
    );
  }
  
  return updateMemo(request, memoId);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { pathname } = new URL(request.url);
  const pathParts = pathname.split('/');
  const memoId = pathParts[pathParts.length - 1];
  
  if (!memoId || memoId === 'memos') {
    return NextResponse.json(
      { success: false, error: 'メモIDが指定されていません' },
      { status: 400 }
    );
  }
  
  return deleteMemo(memoId);
}
