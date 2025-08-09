"use client";
import React, { useRef } from 'react';
import { exportChatData, importChatData } from '../stores/chatStore';

interface BackupControlsProps {
  className?: string;
}

const BackupControls: React.FC<BackupControlsProps> = ({ className = '' }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      console.log('バックアップエクスポート開始');
      const json = exportChatData();
      console.log('バックアップJSON生成完了、サイズ:', json.length, '文字');
      
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-chat-backup_${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('バックアップファイルダウンロード完了');
      alert('バックアップが正常にエクスポートされました！');
    } catch (error) {
      console.error('バックアップエクスポートエラー:', error);
      alert('バックアップのエクスポートに失敗しました: ' + error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      console.log('バックアップインポート開始:', file.name, 'サイズ:', file.size);
      const text = await file.text();
      console.log('ファイル読み込み完了、サイズ:', text.length, '文字');
      
      importChatData(text);
      console.log('バックアップインポート完了');
      alert('インポートが完了しました！');
    } catch (err) {
      console.error('バックアップインポートエラー:', err);
      alert('バックアップファイルの読み込みに失敗しました: ' + err);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className={`flex gap-4 ${className}`}>
      <button
        onClick={handleExport}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        エクスポート
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
      >
        インポート
      </button>
      <input
        type="file"
        accept="application/json,.json"
        ref={fileRef}
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
};

export default BackupControls; 