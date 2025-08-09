'use client';

export default function RuleSettings() {
  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">プロジェクトルール</h3>
      <div className="space-y-4">
        {/* ルール表示 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">現在のルール</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• 型安全性の確保</p>
            <p>• エラーハンドリングの実装</p>
            <p>• ログ出力の追加</p>
            <p>• ファイル命名規則の遵守</p>
          </div>
        </div>
        
        {/* ルール詳細リンク */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => window.open('/PROJECT_RULES.md', '_blank')}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            詳細ルールを確認
          </button>
        </div>
        
        {/* フィードバック記録リンク */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => window.open('/PROJECT_FEEDBACK.md', '_blank')}
            className="text-green-600 hover:text-green-800 text-sm underline"
          >
            フィードバック記録を確認
          </button>
        </div>
      </div>
    </section>
  );
} 