# 🔐 OpenRouter APIキー セキュリティ対策ガイド

## 🚨 現在の状況
- Vercel環境変数は設定済み ✅
- ローカル開発時は手動入力 ✅
- OpenRouterからセキュリティアラート → APIキーロック ⚠️

## 🔍 APIキー状態確認方法

### Step 1: OpenRouterダッシュボードで確認
1. https://openrouter.ai/keys にアクセス
2. 現在のAPIキーの状態を確認：
   - 🟢 Active: 正常
   - 🟡 Limited: 制限あり
   - 🔴 Suspended: 停止中

### Step 2: ローカルでAPIキー診断
ブラウザの開発者ツール（F12）→ Consoleで実行：

```javascript
// OpenRouter APIキー診断
async function checkOpenRouterKey() {
  const testKey = prompt('OpenRouter APIキーを入力してください（テスト用）:');
  if (!testKey) return;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${testKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ APIキー有効 - 正常に動作します');
      const data = await response.json();
      console.log('利用可能モデル数:', data.data?.length || 0);
    } else if (response.status === 401) {
      console.log('❌ APIキー無効 - 認証エラー');
    } else if (response.status === 429) {
      console.log('⚠️ レート制限 - 一時的な制限');
    } else {
      console.log('⚠️ その他のエラー:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ 接続エラー:', error.message);
  }
}

checkOpenRouterKey();
```

## 🛠️ セキュリティ対策の実装

### 現在のAPIキー読み込み方法を確認
現在のターミナルログから以下が確認できます：
```
OpenRouter API Key check: {
  hasSettingsApiKey: false,
  hasEnvApiKey: false,
  settingsApiKeyLength: 0,
  finalApiKeyLength: 0,
  finalApiKeyStart: 'none'
}
```

### 修正が必要な箇所

1. **環境変数の読み込みロジック**
2. **APIキーの検証機能**
3. **フォールバック機能の強化**

## 📋 次のアクション

### 即座に実行すべき項目：
1. OpenRouterダッシュボードでAPIキー状態確認
2. 必要に応じて新しいAPIキー生成
3. Vercel環境変数の更新
4. ローカル設定でのAPIキー手動入力確認

### コード修正項目：
1. 環境変数読み込みの改善
2. APIキー検証機能の追加
3. エラーハンドリングの強化

---

## 🔐 セキュリティベストプラクティス

### GitHubへの誤コミット防止：
- `.env*` ファイルの`.gitignore`登録
- APIキーを含むファイルのコミット前チェック
- 環境変数のみでの管理

### OpenRouter セキュリティ設定：
- IP制限の設定（可能であれば）
- 定期的なキーローテーション
- 使用量モニタリング

---
**重要**: セキュリティアラートが発生した場合は、すぐに新しいAPIキーを生成することをお勧めします。
