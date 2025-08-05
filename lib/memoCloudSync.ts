import { supabase, getCurrentUser } from './supabase'
import { ChatMemo } from '../types/character'

// メモデータをクラウドに保存
export const saveMemoToCloud = async (memo: ChatMemo) => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabaseが設定されていません' }
    }
    
    const user = await getCurrentUser()
    if (!user) {
      console.error('ユーザーがログインしていません')
      return { success: false, error: 'ログインが必要です' }
    }

    // 上書き運用: user_id + memo_key で一意にする（memo_key は messageId か id を採用）
    const memoKey = memo.messageId || memo.id
    const payload = {
      id: memo.id,
      user_id: user.id,
      memo_key: memoKey,
      // 任意の補助フィールド（必要に応じて拡張可能）
      message_id: memo.messageId,
      session_id: memo.sessionId,
      character_id: memo.characterId,
      content: memo.content,
      note: memo.note,
      tags: memo.tags || [],
      is_ai_memory: memo.isAiMemory ?? false,
      importance: memo.importance ?? 1,
      created_at: new Date(memo.createdAt).toISOString(),
      updated_at: new Date(memo.updatedAt).toISOString()
    }

    const { data, error } = await supabase
      .from('memos')
      .upsert(payload, { onConflict: 'user_id,memo_key' })
      .select()

    if (error) {
      console.error('メモ保存エラー:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('予期しないエラー:', error)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

// クラウドからメモデータを取得
export const loadMemosFromCloud = async (): Promise<ChatMemo[]> => {
  try {
    if (!supabase) return []
    
    const user = await getCurrentUser()
    if (!user) {
      console.error('ユーザーがログインしていません')
      return []
    }

    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('メモ取得エラー:', error)
      return []
    }

    // Supabaseのデータを我々のChatMemo型に変換
    return data.map((item: any) => ({
      id: item.id,
      messageId: item.message_id,
      sessionId: item.session_id,
      characterId: item.character_id,
      content: item.content,
      note: item.note,
      tags: item.tags || [],
      isAiMemory: item.is_ai_memory ?? false,
      importance: item.importance ?? 1,
      createdAt: new Date(item.created_at).getTime(),
      updatedAt: new Date(item.updated_at).getTime()
    }))
  } catch (error) {
    console.error('予期しないエラー:', error)
    return []
  }
}

// クラウドからメモを削除
export const deleteMemoFromCloud = async (memoId: string) => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabaseが設定されていません' }
    }
    
    const user = await getCurrentUser()
    if (!user) {
      console.error('ユーザーがログインしていません')
      return { success: false, error: 'ログインが必要です' }
    }

    const { error } = await supabase
      .from('memos')
      .delete()
      .eq('id', memoId)
      .eq('user_id', user.id)

    if (error) {
      console.error('メモ削除エラー:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('予期しないエラー:', error)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

// ローカルとクラウドのメモデータを同期
export const syncMemos = async (localMemos: ChatMemo[]): Promise<ChatMemo[]> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      // ログインしていない場合はローカルデータをそのまま返す
      return localMemos
    }

    // クラウドからデータを取得
    const cloudMemos = await loadMemosFromCloud()
    
    // ローカルデータをクラウドに保存（新しいもの）
    for (const localMemo of localMemos) {
      const cloudMemo = cloudMemos.find(c => c.id === localMemo.id)
      if (!cloudMemo) {
        await saveMemoToCloud(localMemo)
      }
    }

    // 最新のクラウドデータを取得して返す
    return await loadMemosFromCloud()
  } catch (error) {
    console.error('メモ同期エラー:', error)
    return localMemos
  }
}
