'use client'

import { useState } from 'react'
import { Download, Upload, CloudOff, FileText, AlertCircle } from 'lucide-react'
import { generateBackup, restoreBackup, storageHelpers } from '../../../lib/storageUtils'
import { handleError } from '../../../lib/errorHandler'

export default function DataBackup() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState('')

  const handleExport = async () => {
    setIsExporting(true)
    setMessage('')
    
    try {
      // 統一されたバックアップ生成を使用
      const exportData = {
        ...generateBackup(),
        device: navigator.userAgent
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
    } catch (error) {
      handleError(error, 'DataBackup Export', { logToConsole: true })
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
      
      if (!importData._backup_info) {
        throw new Error('無効なバックアップファイルです')
      }

      // 確認ダイアログ
      const backupInfo = importData._backup_info
      const confirm = window.confirm(
        '既存のデータが上書きされます。続行しますか？\n' +
        `バックアップ日時: ${new Date(backupInfo.timestamp).toLocaleString()}\n` +
        `バージョン: ${backupInfo.version || '不明'}`
      )
      
      if (!confirm) {
        setIsImporting(false)
        return
      }

      // 統一されたバックアップ復元を使用
      const success = restoreBackup(importData)
      if (!success) {
        throw new Error('データの復元に失敗しました')
      }

      setMessage('✅ データインポート完了！ページを再読み込みしてください。')
      
      // 3秒後に自動リロード
      setTimeout(() => {
        window.location.reload()
      }, 3000)

    } catch (error) {
      handleError(error, 'DataBackup Import', { logToConsole: true })
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
            <div className="font-medium mb-1">Supabaseクラウド同期の代替機能</div>
            <div>データをファイルとして保存・復元できます。他のデバイスでも同じデータを使用できます。</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* エクスポート */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-gray-900">データエクスポート</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            現在のデータをJSONファイルとしてダウンロードします
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
          <li>「データをダウンロード」でバックアップファイルを保存</li>
          <li>他のデバイスでバックアップファイルを開く</li>
          <li>「ファイルを選択」でバックアップファイルをインポート</li>
          <li>データが復元され、ページが自動リロードされます</li>
        </ol>
      </div>
    </div>
  )
}