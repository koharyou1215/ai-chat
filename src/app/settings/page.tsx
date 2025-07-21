'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    apiProvider: 'openrouter',
    theme: 'dark',
    fontSize: 'medium',
    autoSave: true,
    notifications: true
  });

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    // 設定保存ロジック
    localStorage.setItem('chatSettings', JSON.stringify(settings));
    alert('設定を保存しました');
  };

  const handleReset = () => {
    if (confirm('設定をリセットしますか？')) {
      setSettings({
        apiProvider: 'openrouter',
        theme: 'dark',
        fontSize: 'medium',
        autoSave: true,
        notifications: true
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
      <div className="container mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="flex items-center text-white/80 hover:text-white transition-colors mr-4 p-2 rounded-lg hover:bg-white/10"
            >
              <ArrowLeft size={20} className="mr-2" />
              戻る
            </button>
            <h1 className="text-2xl font-bold text-white">設定</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              リセット
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Save size={16} className="mr-2" />
              保存
            </button>
          </div>
        </div>

        {/* 設定フォーム */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-6">
          {/* API設定 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">API設定</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-white/80 mb-2">APIプロバイダー</label>
                <select 
                  value={settings.apiProvider}
                  onChange={(e) => setSettings({...settings, apiProvider: e.target.value})}
                  className="w-full p-3 bg-white/20 text-white rounded-lg border border-white/30 focus:border-blue-400 focus:outline-none"
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
            </div>
          </div>

          {/* 表示設定 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">表示設定</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-white/80 mb-2">テーマ</label>
                <select 
                  value={settings.theme}
                  onChange={(e) => setSettings({...settings, theme: e.target.value})}
                  className="w-full p-3 bg-white/20 text-white rounded-lg border border-white/30 focus:border-blue-400 focus:outline-none"
                >
                  <option value="dark">ダーク</option>
                  <option value="light">ライト</option>
                  <option value="auto">自動</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 mb-2">フォントサイズ</label>
                <select 
                  value={settings.fontSize}
                  onChange={(e) => setSettings({...settings, fontSize: e.target.value})}
                  className="w-full p-3 bg-white/20 text-white rounded-lg border border-white/30 focus:border-blue-400 focus:outline-none"
                >
                  <option value="small">小</option>
                  <option value="medium">中</option>
                  <option value="large">大</option>
                </select>
              </div>
            </div>
          </div>

          {/* 機能設定 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">機能設定</h3>
            <div className="space-y-3">
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                  className="mr-3 w-4 h-4"
                />
                自動保存
              </label>
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                  className="mr-3 w-4 h-4"
                />
                通知
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
