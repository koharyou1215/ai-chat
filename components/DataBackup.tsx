'use client'

import { useState, useEffect } from 'react'
import { Download, Upload, CloudOff, FileText, AlertCircle, Clock } from 'lucide-react'

export default function DataBackup() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState('')
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [showBackupReminder, setShowBackupReminder] = useState(false)

  // コンポーネントマウント時に最後のバックアップ日時をチェック
  useEffect(() => {
    const lastBackupDate = localStorage.getItem('last-backup-date')
    setLastBackup(lastBackupDate)
    
    // 7日以上バックアップがない場合はリマインダーを表示
    if (lastBackupDate) {
      const daysSinceBackup = (Date.now() - new Date(lastBackupDate).getTime()) / (1000 * 60 * 60 * 24)
      setShowBackupReminder(daysSinceBackup > 7)
    } else {
      setShowBackupReminder(true) // 初回の場合
    }
  }, [])

  const handleExport = async () => {
    setIsExporting(true)
    setMessage('')
    
    try {
      // ローカルストレージから全データを取得
      const allData = {
        // 主要データ（Zustand persist）
        'ai-chat-store': localStorage.getItem('ai-chat-store') || '{}',
        // キャラクターデータ
        'ai-chat-characters': localStorage.getItem('ai-chat-characters') || '[]',
        'ai-chat-public-characters': localStorage.getItem('ai-chat-public-characters') || '[]',
        // トラッカーデータ
        'ai-chat-tracker-values': localStorage.getItem('ai-chat-tracker-values') || '{}',
        // その他の設定（もしあれば）
        'appSettings': localStorage.getItem('appSettings') || '{}',
        'characters': localStorage.getItem('characters') || '[]',
        'personas': localStorage.getItem('personas') || '[]',
        'memos': localStorage.getItem('memos') || '[]',
        'chatHistory': localStorage.getItem('chatHistory') || '[]'
      }

      // JSONファイルとしてダウンロード
      const exportData = {
        timestamp: new Date().toISOString(),
        version: "2.0.0",
        device: navigator.userAgent,
        data: allData
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-chat-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage('✅ データエクスポート完了！ファイルがダウンロードされました。')
      
      // バックアップ日時を記録
      const now = new Date().toISOString()
      localStorage.setItem('last-backup-date', now)
      setLastBackup(now)
      setShowBackupReminder(false)
    } catch (error) {
      console.error('エクスポートエラー:', error)
      setMessage('❌ エクスポートに失敗しました')
    }
    
    setIsExporting(false)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setMessage('')

    try {
      const text = await file.text()
      const importData = JSON.parse(text)
      
      if (!importData.data) {
        throw new Error('無効なバックアップファイルです')
      }

      // 確認ダイアログ
      const confirm = window.confirm(
        '既存のデータが上書きされます。続行しますか？\n' +
        `バックアップ日時: ${importData.timestamp || '不明'}\n` +
        `バージョン: ${importData.version || '不明'}\n\n` +
        '⚠️ 重要：この操作は元に戻せません。事前に現在のデータをバックアップすることをお勧めします。'
      )
      
      if (!confirm) {
        setIsImporting(false)
        return
      }

      // データを復元（すべてのキーをループして復元）
      const { data } = importData
      
      // 現在のlocalStorageをクリア（ai-chat関連のキーのみ）
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('ai-chat-') || 
        ['characters', 'personas', 'memos', 'appSettings', 'chatHistory'].includes(key)
      )
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // 新しいデータを復元
      Object.entries(data).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          localStorage.setItem(key, value)
        }
      })

      setMessage('✅ データインポート完了！ページを再読み込みしてください。')
      
      // 3秒後に自動リロード
      setTimeout(() => {
        window.location.reload()
      }, 3000)

    } catch (error) {
      console.error('インポートエラー:', error)
      setMessage('❌ インポートに失敗しました。ファイル形式を確認してください。')
    }
    
    setIsImporting(false)
    // ファイル選択をリセット
    event.target.value = ''
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <CloudOff className="w-6 h-6 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">データバックアップ</h3>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">💾 重要：データの永続化について</div>
            <div className="space-y-1">
              <p>• データはブラウザのローカルストレージに保存されます</p>
              <p>• <strong>サーバーやブラウザを変更すると全データが失われます</strong></p>
              <p>• 定期的にバックアップを取ることを強く推奨します</p>
              <p>• バックアップファイルがあれば他のデバイスでも同じデータを使用できます</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* バックアップリマインダー */}
      {showBackupReminder && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex gap-2">
            <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <div className="font-medium mb-1">📅 バックアップ推奨</div>
              <div>
                {lastBackup 
                  ? `最後のバックアップから7日以上経過しています（${new Date(lastBackup).toLocaleDateString()}）`
                  : 'まだバックアップが作成されていません'
                }。
                データ保護のため、定期的なバックアップをお勧めします。
              </div>
              <button
                onClick={() => setShowBackupReminder(false)}
                className="mt-2 text-xs text-orange-600 hover:text-orange-800 underline"
              >
                リマインダーを非表示
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* エクスポート */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-gray-900">データエクスポート</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            現在のデータをJSONファイルとしてダウンロードします
            {lastBackup && (
              <span className="block text-xs text-gray-500 mt-1">
                最後のバックアップ: {new Date(lastBackup).toLocaleString()}
              </span>
            )}
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                エクスポート中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                データをダウンロード
              </>
            )}
          </button>
        </div>

        {/* インポート */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">データインポート</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            バックアップファイルからデータを復元します
          </p>
          <label className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-2">
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                インポート中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                ファイルを選択
              </>
            )}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.startsWith('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* 使用方法 */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          使用方法
        </h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li><strong>定期バックアップ</strong>：重要な設定後に「データをダウンロード」を実行</li>
          <li><strong>安全な保存</strong>：バックアップファイルをクラウドストレージ等に保存</li>
          <li><strong>他デバイス移行</strong>：新しいデバイスで「ファイルを選択」からインポート</li>
          <li><strong>復旧</strong>：データが失われた場合はバックアップファイルから復元</li>
          <li><strong>確認</strong>：インポート後、ページが自動リロードされデータが復元されます</li>
        </ol>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <strong>⚠️ 注意</strong>：サーバーのポートを変更したり、異なるブラウザを使用するとデータが失われます。<br />
          作業前には必ずバックアップを作成してください。
        </div>
      </div>
    </div>
  )
}