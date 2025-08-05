import { createClient, User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 環境変数の厳密チェック
const isValidSupabaseConfig = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl.trim() !== '' && 
         supabaseAnonKey.trim() !== '' &&
         supabaseUrl.startsWith('https://') &&
         supabaseAnonKey.length > 10
}

// Supabaseクライアント（設定がない場合はnull）
let supabaseClient = null
try {
  if (isValidSupabaseConfig()) {
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!)
    console.log('✅ Supabaseクライアント作成成功')
  } else {
    console.warn('⚠️ Supabase設定が無効:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlValid: supabaseUrl?.startsWith('https://'),
      keyValid: (supabaseAnonKey?.length || 0) > 10
    })
  }
} catch (error) {
  console.error('❌ Supabaseクライアント作成エラー:', error)
  supabaseClient = null
}

export const supabase = supabaseClient

// デバッグ情報（本番では削除予定）
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase設定状況:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlValid: supabaseUrl?.startsWith('https://'),
    keyValid: (supabaseAnonKey?.length || 0) > 10,
    clientCreated: !!supabase,
    urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
    keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
    timestamp: new Date().toISOString()
  })
}

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
  console.log('🔐 Supabaseログイン試行:', { email, hasSupabase: !!supabase })
  
  if (!supabase) {
    const errorMsg = 'Supabaseが設定されていません。環境変数を確認してください。'
    console.error('❌', errorMsg)
    return { success: false, error: errorMsg }
  }
  
  try {
    // redirectTo を安全に決定（優先: window.__authRedirectTo → fallback: Site URL想定のorigin + /auth/callback）
    let redirectTo: string | undefined;
    try {
      if (typeof window !== 'undefined') {
        const globalWin = window as unknown as { __authRedirectTo?: string; location?: Location };
        redirectTo =
          (globalWin.__authRedirectTo && /^https?:\/\//.test(globalWin.__authRedirectTo) ? globalWin.__authRedirectTo : undefined) ||
          (globalWin.location ? `${globalWin.location.origin}/auth/callback` : undefined);
      }
    } catch {
      // ignore
    }

    console.log('📤 Supabase OTP送信開始...', { redirectTo })
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true, // ユーザーが存在しない場合は自動作成
        emailRedirectTo: redirectTo,
      }
    })
    
    if (error) {
      console.error('❌ Supabaseログインエラー:', {
        message: error.message,
        status: error.status,
        details: error
      })
      
      // より親切なエラーメッセージ
      let userFriendlyError = error.message
      if (error.message.includes('Invalid login credentials')) {
        userFriendlyError = 'メールアドレスが正しくありません'
      } else if (error.message.includes('Too many requests')) {
        userFriendlyError = 'リクエストが多すぎます。しばらく待ってから再試行してください'
      } else if (error.message.includes('Rate limit')) {
        userFriendlyError = '送信制限に達しました。数分後に再試行してください'
      }
      
      return { success: false, error: userFriendlyError }
    }
    
    console.log('✅ Supabase OTP送信成功:', data)
    return { success: true, data }
  } catch (error) {
    // 型安全: errorはunknownとして扱い、メッセージ抽出はガードで行う
    console.error('❌ 予期しないSupabaseエラー:', error)
    
    let errorMessage = '予期しないエラーが発生しました'
    const msg = typeof error === 'object' && error && 'message' in error ? String((error as { message?: string }).message) : ''
    if (msg.includes('fetch')) {
      errorMessage = 'ネットワークエラーです。インターネット接続を確認してください'
    } else if (msg.includes('Invalid value')) {
      errorMessage = 'Supabase設定に問題があります。管理者にお問い合わせください'
    }
    
    return { success: false, error: errorMessage }
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
