'use client'

import { useState, useEffect } from 'react'
import { X, Mail, LogOut, User, Cloud, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { signInWithEmail, signOut, onAuthStateChange, getCurrentUser } from '../lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { syncAllData, checkSyncStatus, SyncData } from '../lib/cloudSyncManager'

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
    if (!email.trim()) {
      setMessage('メールアドレスを入力してください')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    const result = await signInWithEmail(email.trim())
    
    if (result.success) {
      setMessage('認証メールを送信しました！メールをチェックしてリンクをクリックしてください。')
      setEmail('')
    } else {
      setMessage(`エラー: ${result.error}`)
    }
    
    setIsLoading(false)
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    const success = await signOut()
    
    if (success) {
      setMessage('ログアウトしました')
      setUser(null)
      setSyncStatus(null)
    } else {
      setMessage('ログアウトに失敗しました')
    }
    
    setIsLoading(false)
  }

  const handleSync = async () => {
    if (!user || !onDataSync) return
    
    setIsSyncing(true)
    setMessage('')
    
    try {
      // 現在のローカルデータを取得（この部分は実際の実装で調整が必要）
      const localData: SyncData = {
        characters: JSON.parse(localStorage.getItem('ai-chat-characters') || '[]'),
        personas: JSON.parse(localStorage.getItem('ai-chat-personas') || '[]'),
        memos: [], // メモストアから取得
        settings: JSON.parse(localStorage.getItem('ai-chat-settings') || '{}')
      }
      
      const result = await syncAllData(localData)
      
      if (result.success && result.data) {
        setSyncStatus(result.syncedItems)
        setMessage('同期が完了しました！')
        onDataSync(result.data)
        localStorage.setItem('last-sync-time', new Date().toISOString())
      } else {
        setMessage(`同期エラー: ${result.error}`)
      }
    } catch (error) {
      console.error('同期エラー:', error)
      setMessage('同期中にエラーが発生しました')
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
                onClick={handleSync}
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
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? '送信中...' : 'ログインリンクを送信'}
                </button>
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
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('エラー') 
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 