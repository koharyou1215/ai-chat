"use client";
import React, { useRef } from 'react';
import { exportChatData, importChatData } from '../stores/chatStore';

interface BackupControlsProps {
  className?: string;
}

const BackupControls: React.FC<BackupControlsProps> = ({ className = '' }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportChatData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-backup_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importChatData(text);
      alert('インポートが完了しました！');
    } catch (err) {
      alert('バックアップファイルの読み込みに失敗しました');
      console.error(err);
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