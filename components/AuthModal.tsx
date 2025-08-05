'use client'

import { useState, useEffect } from 'react'
import { X, Mail, LogOut, User, Cloud, RefreshCw, CheckCircle, AlertCircle, TestTube } from 'lucide-react'
import { signInWithEmail, signOut, onAuthStateChange, getCurrentUser, supabase } from '../lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { syncAllData, SyncData } from '../lib/cloudSyncManager'
import DataBackup from './DataBackup'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onDataSync?: (syncedData: SyncData) => void
}

export default function AuthModal({ isOpen, onClose, onDataSync }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{
    characters: boolean
    personas: boolean
    memos: boolean
    settings: boolean
  } | null>(null)

  // デバッグ情報
  useEffect(() => {
    console.log('🔧 AuthModal初期化:', {
      isOpen,
      hasSupabase: !!supabase,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    })
  }, [isOpen])

  useEffect(() => {
    // 認証状態の監視
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
    })

    // 初期ユーザー状態の確認
    getCurrentUser().then(setUser)

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // モバイル対応のメールアドレス検証
    const cleanEmail = email ? email.replace(/\s+/g, '').toLowerCase() : ''
    console.log('📧 メール検証:', { 
      originalEmail: email, 
      cleanEmail: cleanEmail, 
      length: cleanEmail.length,
      isEmpty: !cleanEmail,
      hasAtSymbol: cleanEmail.includes('@'),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    })
    
    if (!cleanEmail) {
      setMessage('メールアドレスを入力してください')
      console.warn('❌ メールアドレスが空です')
      return
    }

    // 基本的なメールフォーマットチェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setMessage('正しいメールアドレス形式で入力してください')
      console.warn('❌ メールアドレス形式が不正:', cleanEmail)
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      // /auth/callback に戻す絶対URLを明示
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      // signInWithEmail は1引数仕様のため、redirectToは内部で参照されるようにlib側で処理する前提
      // ここでは副作用的に window.__authRedirectTo に格納（libで拾う）
      if (typeof window !== 'undefined') {
        // 型安全にwindowへ一時格納（lib/supabase.ts側で参照してemailRedirectToに使用）
        (window as unknown as { __authRedirectTo?: string }).__authRedirectTo = redirectTo;
      }
      const result = await signInWithEmail(cleanEmail)
      
      if (result.success) {
        setMessage('SUCCESS:認証メールを送信しました！メールをチェックしてリンクをクリックしてください。')
        setEmail('')
        console.log('✅ メール送信成功')
      } else {
        setMessage(`エラー: ${result.error}`)
        console.error('❌ メール送信失敗:', result.error)
      }
    } catch (error) {
      setMessage('エラー: 予期しないエラーが発生しました')
      console.error('❌ 予期しないエラー:', error)
    }
    
    setIsLoading(false)
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    const success = await signOut()
    
    if (success) {
      setMessage('SUCCESS:ログアウトが完了しました。ローカルデータは引き続き利用できます。')
      setUser(null)
      setSyncStatus(null)
    } else {
      setMessage('ログアウトに失敗しました')
    }
    
    setIsLoading(false)
  }

  const handleSync = async () => {
    // onDataSync が未指定でも同期自体は実行し、UIに進捗を出す
    if (!user) {
      setMessage('ログインが必要です')
      return
    }
    
    setIsSyncing(true)
    setMessage('同期を開始しました…')
    console.log('🔄 [AuthModal] Sync start')
    
    try {
      // ローカルデータの取得と可視ログ
      const characters = JSON.parse(localStorage.getItem('ai-chat-characters') || '[]')
      const personas = JSON.parse(localStorage.getItem('ai-chat-personas') || '[]')
      const settingsJson = JSON.parse(localStorage.getItem('ai-chat-settings') || '{}')
      const localData: SyncData = {
        characters,
        personas,
        memos: [], // TODO: メモストア連携
        settings: settingsJson
      }
      console.log('🔎 [AuthModal] Local snapshot:', {
        characters: Array.isArray(characters) ? characters.length : 0,
        personas: Array.isArray(personas) ? personas.length : 0,
        hasSettings: !!settingsJson && Object.keys(settingsJson).length > 0
      })
      
      const result = await syncAllData(localData)
      console.log('✅ [AuthModal] syncAllData result:', result)
      
      if (result.success && result.data) {
        setSyncStatus(result.syncedItems)
        setMessage('SUCCESS:データの同期が完了しました！すべてのデバイスで最新データが利用できます。')
        if (onDataSync) {
          onDataSync(result.data)
        }
        localStorage.setItem('last-sync-time', new Date().toISOString())
      } else {
        setMessage(`同期エラー: ${result.error ?? '不明なエラー'}`)
      }
    } catch (error) {
      console.error('❌ [AuthModal] 同期エラー:', error)
      setMessage('同期中にエラーが発生しました。コンソールログを確認してください。')
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    if (user) {
      // 初期状態として全てfalseに設定
      setSyncStatus({
        characters: false,
        personas: false,
        memos: false,
        settings: false
      })
    }
  }, [user])

  if (!isOpen) return null

  // Supabase未設定の場合
  if (!supabase) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                クラウド同期
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Supabase未設定</span>
                </div>
                <p className="text-yellow-700 text-sm mb-3">
                  クラウド同期機能を利用するには、Supabaseの設定が必要です。
                </p>
                <div className="text-yellow-700 text-sm space-y-2">
                  <p><strong>📋 必要な手順：</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>プロジェクトルートの <code className="bg-yellow-100 px-1 rounded">SUPABASE_SETUP_GUIDE.md</code> を確認</li>
                    <li>Supabaseプロジェクトを作成</li>
                    <li>環境変数を <code className="bg-yellow-100 px-1 rounded">.env.local</code> に追加</li>
                    <li>開発サーバーを再起動</li>
                  </ol>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">🔧 環境変数例</h3>
                <div className="bg-gray-800 text-green-400 p-3 rounded text-sm font-mono">
                  <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...</div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">✨ 設定後の機能</h3>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• 設定・キャラクター・履歴のクラウド同期</li>
                  <li>• 複数デバイス間でのデータ共有</li>
                  <li>• 自動バックアップ・データ消失防止</li>
                  <li>• メールアドレスでの簡単ログイン</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">💰 料金情報</h3>
                <p className="text-green-700 text-sm">
                  Supabaseの無料枠（500MB・50,000リクエスト/月）で十分利用可能です。
                </p>
              </div>

              {/* データバックアップ機能 */}
              <DataBackup />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              クラウド同期
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {user ? (
            // ログイン済みの場合
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <User className="w-4 h-4" />
                  <span className="font-medium">ログイン中</span>
                </div>
                <p className="text-green-700 text-sm mt-1">{user.email}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">✅ 有効な機能</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• キャラクターデータのクラウド保存</li>
                  <li>• デバイス間でのデータ同期</li>
                  <li>• 自動バックアップ</li>
                  <li>• どのデバイスからでもアクセス可能</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  console.log('🖱️ [AuthModal] Sync button clicked')
                  handleSync()
                }}
                disabled={isSyncing}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? '同期中...' : 'データを同期'}
              </button>

              {syncStatus && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <h3 className="font-medium text-gray-800 mb-2">同期状況</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {syncStatus.characters ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
                      <span>キャラクター</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {syncStatus.personas ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
                      <span>Persona</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {syncStatus.memos ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
                      <span>メモ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {syncStatus.settings ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
                      <span>設定</span>
                    </div>
                  </div>
                </div>
              )}

              {/* データバックアップ機能（ログイン済みユーザー向け） */}
              <DataBackup />

              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {isLoading ? 'ログアウト中...' : 'ログアウト'}
              </button>
            </div>
          ) : (
            // ログインしていない場合
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">📱 デバイス間同期について</h3>
                <p className="text-yellow-700 text-sm">
                  現在、キャラクターデータはデバイスローカルに保存されています。
                  ログインすることで、複数のデバイス間でデータを同期できます。
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        const newEmail = e.target.value
                        console.log('📧 メール入力変更:', { 
                          old: email, 
                          new: newEmail, 
                          length: newEmail.length,
                          hasWhitespace: /\s/.test(newEmail)
                        })
                        setEmail(newEmail)
                      }}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      disabled={isLoading}
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={isLoading || !email || email.length < 3}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        メール送信中...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        ログインリンクを送信
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email || email.length < 3) {
                        setMessage('メールアドレスを入力してください')
                        return
                      }
                      
                      setIsLoading(true)
                      setMessage('')
                      
                      try {
                        const response = await fetch('/api/test-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: email.replace(/\s+/g, '').toLowerCase() })
                        })
                        
                        const result = await response.json()
                        
                        if (result.success) {
                          setMessage('SUCCESS:テストメール送信完了！（実際のメールは送信されません）')
                        } else {
                          setMessage(`エラー: ${result.error}`)
                        }
                      } catch (error) {
                        setMessage('エラー: テスト送信に失敗しました')
                        console.error('テストメール送信エラー:', error)
                      }
                      
                      setIsLoading(false)
                    }}
                    disabled={isLoading || !email || email.length < 3}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <TestTube className="w-4 h-4" />
                    テスト送信（Supabaseなし）
                  </button>
                </div>
              </form>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">🔒 安全について</h3>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• パスワードは不要です</li>
                  <li>• メールで認証リンクを送信</li>
                  <li>• データは暗号化されて保存</li>
                  <li>• 退会はいつでも可能</li>
                </ul>
              </div>
            </div>
          )}

          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.includes('エラー') 
                ? 'bg-red-50 border-2 border-red-200 text-red-700'
                : message.startsWith('SUCCESS:')
                ? 'bg-green-50 border-2 border-green-300 text-green-800'
                : 'bg-blue-50 border-2 border-blue-200 text-blue-700'
            }`}>
              <div className="flex items-start gap-3">
                {message.includes('エラー') ? (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                ) : message.startsWith('SUCCESS:') ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Mail className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className={`font-medium text-sm ${
                    message.includes('エラー') 
                      ? 'text-red-800'
                      : message.startsWith('SUCCESS:')
                      ? 'text-green-800'
                      : 'text-blue-800'
                  }`}>
                    {message.includes('エラー') 
                      ? '送信エラー'
                      : message.startsWith('SUCCESS:')
                      ? '✅ メール送信完了'
                      : '📧 メール送信中'
                    }
                  </div>
                  <div className="text-sm mt-1">
                    {message.startsWith('SUCCESS:') ? message.replace('SUCCESS:', '') : message}
                  </div>
                  {message.includes('Failed to execute') && (
                    <div className="mt-3 text-xs text-red-600 bg-red-100 p-2 rounded border border-red-200">
                      <div><strong>🔧 デバッグ情報:</strong></div>
                      <div>Supabase設定: {!!supabase ? '有効' : '無効'}</div>
                      <div>URL設定: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '有り' : '無し'}</div>
                      <div>Key設定: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '有り' : '無し'}</div>
                      <div>タイムスタンプ: {new Date().toLocaleString()}</div>
                    </div>
                  )}
                  {message.startsWith('SUCCESS:') && (
                    <div className="mt-2 text-xs text-green-600 bg-green-100 p-2 rounded border border-green-200">
                      <strong>📨 次のステップ:</strong><br/>
                      1. メールボックスを確認してください<br/>
                      2. 件名「[AI Chat] ログインリンク」を探してください<br/>
                      3. メール内のリンクをクリックしてログインを完了してください
                    </div>
                  )}
                </div>
              </div>

              {/* データバックアップ機能（未ログインユーザー向け） */}
              <DataBackup />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
