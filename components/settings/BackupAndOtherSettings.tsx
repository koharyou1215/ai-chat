'use client';

import { AppSettings } from '../../types/app';
import BackupControls from '../BackupControls'; // パスを修正

interface BackupAndOtherSettingsProps {
  formSettings: AppSettings;
  setFormSettings: (prev: (prevSettings: AppSettings) => AppSettings) => void;
  onClose: () => void;
}

export default function BackupAndOtherSettings({ formSettings, setFormSettings, onClose }: BackupAndOtherSettingsProps) {
  return (
    <>
      {/* バックアップと復元 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">バックアップと復元</h3>
        <BackupControls onClose={onClose} />
      </section>

      {/* その他の設定 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">その他の設定</h3>
        <div className="space-y-4">
          {/* ダークモード */}
          <div className="flex items-center justify-between">
            <label htmlFor="currentTheme" className="block text-sm font-medium text-gray-700">
              テーマ
            </label>
            <select
              id="currentTheme"
              value={formSettings.currentTheme || 'light'}
              onChange={(e) => setFormSettings(prev => ({ ...prev, currentTheme: e.target.value }))}
              className="w-full max-w-[150px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            >
              <option value="light">ライト</option>
              <option value="dark">ダーク</option>
              <option value="system">システム</option>
            </select>
          </div>

          {/* カスタム背景画像 */}
          <div>
            <label htmlFor="customBackground" className="block text-sm font-medium text-gray-700 mb-2">
              チャット背景画像/動画URL
            </label>
            <input
              type="text"
              id="customBackground"
              value={formSettings.customBackground || ''}
              onChange={(e) => setFormSettings(prev => ({ ...prev, customBackground: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              placeholder="https://example.com/your-image.jpg または data:image/jpeg;base64,..."
            />
            <p className="text-xs text-gray-500 mt-1">
              チャット画面の背景に表示する画像または動画のURLを指定します。画像URLまたはbase64データURLが使用できます。
            </p>
          </div>
        </div>
      </section>
    </>
  );
} 