import { createClient } from '@supabase/supabase-js'
import { SessionSummary } from './historyManager'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://efmdilrmrgsfrqrdfajh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWRpbHJtcmdzZnJxcmRmYWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MjczNTMsImV4cCI6MjA0ODAwMzM1M30.sLLZaUQ_pWfmUKMCGNBrNQKRj0OOOm8KUbOm2nJW1p4'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 現在のユーザーを取得
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

// 履歴をクラウドに保存
export const saveHistoryToCloud = async (sessions: SessionSummary[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'ログインが必要です' }
    }

    console.log('💾 履歴をクラウドに保存中...', sessions.length, '件')

    // セッションデータをクラウド用に変換
    const cloudSessions = sessions.map(session => ({
      id: session.id,
      user_id: user.id,
      title: session.title,
      character_name: session.characterName,
      character_id: session.characterId,
      last_message: session.lastMessage,
      message_count: session.messageCount,
      created_at: new Date(session.createdAt).toISOString(),
      updated_at: new Date(session.updatedAt).toISOString(),
      messages: JSON.stringify(session.messages),
      metadata: JSON.stringify({
        duration: session.duration,
        favorite: session.favorite
      })
    }))

    // 既存データを削除してから新規追加（upsert）
    const { error: deleteError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ 既存履歴削除エラー:', deleteError)
    }

    // 新しいデータを挿入
    const { error: insertError } = await supabase
      .from('chat_sessions')
      .insert(cloudSessions)

    if (insertError) {
      console.error('❌ 履歴保存エラー:', insertError)
      return { success: false, error: insertError.message }
    }

    console.log('✅ 履歴クラウド保存完了:', sessions.length, '件')
    return { success: true }

  } catch (error) {
    console.error('❌ 履歴クラウド保存エラー:', error)
    return { success: false, error: String(error) }
  }
}

// クラウドから履歴を読み込み
export const loadHistoryFromCloud = async (): Promise<{ success: boolean; data?: SessionSummary[]; error?: string }> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'ログインが必要です' }
    }

    console.log('📥 クラウドから履歴を読み込み中...')

    const { data: cloudSessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ 履歴読み込みエラー:', error)
      return { success: false, error: error.message }
    }

    if (!cloudSessions || cloudSessions.length === 0) {
      console.log('📭 クラウドに履歴がありません')
      return { success: true, data: [] }
    }

    // クラウドデータをローカル形式に変換
    const sessions: SessionSummary[] = cloudSessions.map(session => {
      const metadata = session.metadata ? JSON.parse(session.metadata) : {}
      return {
        id: session.id,
        title: session.title,
        characterName: session.character_name,
        characterId: session.character_id,
        lastMessage: session.last_message,
        messageCount: session.message_count,
        createdAt: new Date(session.created_at).getTime(),
        updatedAt: new Date(session.updated_at).getTime(),
        messages: JSON.parse(session.messages || '[]'),
        duration: metadata.duration,
        favorite: metadata.favorite
      }
    })

    console.log('✅ クラウド履歴読み込み完了:', sessions.length, '件')
    return { success: true, data: sessions }

  } catch (error) {
    console.error('❌ クラウド履歴読み込みエラー:', error)
    return { success: false, error: String(error) }
  }
}

// 履歴を同期（双方向）
export const syncHistory = async (localSessions: SessionSummary[]): Promise<{ success: boolean; data?: SessionSummary[]; error?: string }> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'ログインが必要です' }
    }

    console.log('🔄 履歴同期開始 - ローカル:', localSessions.length, '件')

    // クラウドから最新データを取得
    const cloudResult = await loadHistoryFromCloud()
    if (!cloudResult.success) {
      return cloudResult
    }

    const cloudSessions = cloudResult.data || []
    console.log('☁️ クラウド履歴:', cloudSessions.length, '件')

    // マージ処理（更新時刻の新しい方を優先）
    const mergedSessions = new Map<string, SessionSummary>()

    // ローカルセッションを追加
    localSessions.forEach(session => {
      mergedSessions.set(session.id, session)
    })

    // クラウドセッションで上書き（より新しい場合）
    cloudSessions.forEach(cloudSession => {
      const localSession = mergedSessions.get(cloudSession.id)
      if (!localSession || cloudSession.updatedAt > localSession.updatedAt) {
        mergedSessions.set(cloudSession.id, cloudSession)
      }
    })

    const finalSessions = Array.from(mergedSessions.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)

    // クラウドに保存
    const saveResult = await saveHistoryToCloud(finalSessions)
    if (!saveResult.success) {
      return saveResult
    }

    console.log('✅ 履歴同期完了:', finalSessions.length, '件')
    return { success: true, data: finalSessions }

  } catch (error) {
    console.error('❌ 履歴同期エラー:', error)
    return { success: false, error: String(error) }
  }
}
