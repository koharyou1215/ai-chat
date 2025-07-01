import { createClient, User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Supabaseクライアント（設定がない場合はnull）
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null

// ユーザー情報を取得
export const getCurrentUser = async () => {
  if (!supabase) return null
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('ユーザー取得エラー:', error)
    return null
  }
  return user
}

// 簡単なログイン（メールアドレスのみ、パスワードなし）
export const signInWithEmail = async (email: string) => {
  if (!supabase) return { success: false, error: 'Supabaseが設定されていません' }
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true, // ユーザーが存在しない場合は自動作成
      }
    })
    
    if (error) {
      console.error('ログインエラー:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('予期しないエラー:', error)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

// ログアウト
export const signOut = async () => {
  if (!supabase) return false
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('ログアウトエラー:', error)
    return false
  }
  return true
}

// 認証状態の変更を監視
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null)
  })
} 