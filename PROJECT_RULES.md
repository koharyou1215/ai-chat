# AI Chat プロジェクトルール

## 🎯 プロジェクトルール

### 1. ファイル編集時の必須チェックリスト

#### 設定関連ファイルを編集する前
- [ ] `types/app.ts`の型定義を確認
- [ ] `components/SettingsModal.tsx`との整合性を確認
- [ ] デフォルト値の設定を確認

#### APIファイルを編集する前
- [ ] エラーハンドリングの実装を確認
- [ ] JSONパース処理の安全性を確認
- [ ] ログ出力の追加を確認
- [ ] 型安全性の確認

#### コンポーネントを編集する前
- [ ] propsの型定義を確認
- [ ] 状態管理の整合性を確認
- [ ] エラー境界の設定を確認

### 2. 禁止事項

#### ❌ やってはいけないこと
- `PROJECT_REFERENCE.md`を読まずに機能追加
- 既存機能の重複実装
- 型定義なしでのコード追加
- エラーハンドリングなしでのAPI実装
- ハードコードされたAPIキー
- 既存機能の削除（バックアップなし）
- 同じインストールの重複実行
- **APIキーや機密情報を`.env`や`.env.local`に記載しても、絶対にリポジトリやデプロイ成果物に含めないこと（`.gitignore`で管理）**

#### ✅ 必ずやること
- 型安全性の確保
- エラーハンドリングの実装
- ログ出力の追加
- バックアップの作成
- テスト実行

### 3. ファイル命名規則

#### コンポーネント
```
✅ 正しい例
- SettingsModal.tsx
- CharacterSelector.tsx
- UserInspirationModal.tsx

❌ 間違った例
- settings-modal.tsx
- character_selector.tsx
- userInspirationModal.tsx
```

#### API Routes
```
✅ 正しい例
- user-inspiration
- enhanced-impression
- simple-chat

❌ 間違った例
- userInspiration
- enhancedImpression
- simple_chat
```

#### 型定義
```
✅ 正しい例
- AppSettings
- UserPersona
- ChatMessage

❌ 間違った例
- app_settings
- user_persona
- chat_message
```

### 4. コード規約

#### TypeScript
```typescript
// ✅ 正しい例
interface AppSettings {
  temperature: number;
  maxTokens: number;
  openRouterApikey?: string;
}

// ❌ 間違った例
interface AppSettings {
  temperature: any;
  maxTokens: any;
  openRouterApikey: any;
}
```

#### エラーハンドリング
```typescript
// ✅ 正しい例
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  return { error: error instanceof Error ? error.message : 'Unknown error' };
}

// ❌ 間違った例
const response = await fetch(url);
const data = await response.json();
return data;
```

#### ログ出力
```typescript
// ✅ 正しい例
console.log('API called with params:', { model, temperature });
console.error('Error occurred:', error);
console.warn('Warning:', warning);

// ❌ 間違った例
console.log('debug');
console.log('test');
```

### 5. デプロイ前チェックリスト

#### ビルド前
- [ ] 型エラーの確認
- [ ] リンターエラーの確認
- [ ] 未使用インポートの削除
- [ ] コンソールログの整理

#### デプロイ前
- [ ] 環境変数の設定確認
- [ ] APIキーの有効性確認
- [ ] 機能テストの実行
- [ ] エラーログの確認

#### デプロイ後
- [ ] 本番環境での動作確認
- [ ] エラーログの監視
- [ ] パフォーマンスの確認

### 6. トラブルシューティング

#### よくあるエラーと対処法

**1. 型エラー**
```bash
# エラー例
Property 'inspirationMaxTokens' does not exist on type 'AppSettings'

# 対処法
1. types/app.tsで型定義を追加
2. デフォルト値を設定
3. 型ガードを使用
```

**2. JSONパースエラー**
```bash
# エラー例
Unexpected token < in JSON at position 0

# 対処法
1. レスポンスの前処理を追加
2. try-catch文でエラーハンドリング
3. フォールバック値を設定
```

**3. 環境変数エラー**
```bash
# エラー例
OpenRouter API Key is not set

# 対処法
1. Vercelダッシュボードで環境変数を確認
2. 設定画面でAPIキーを確認
3. 再デプロイを実行
```

### 7. 開発フロー

#### 新機能追加時
1. **計画段階**
   - 機能要件の明確化
   - 型定義の設計
   - API設計

2. **実装段階**
   - 型定義の追加
   - APIファイルの作成
   - コンポーネントの作成
   - 設定画面の更新

3. **テスト段階**
   - 単体テスト
   - 統合テスト
   - エラーハンドリングテスト

4. **デプロイ段階**
   - ビルドテスト
   - 本番デプロイ
   - 動作確認

#### バグ修正時
1. **問題特定**
   - エラーログの確認
   - 再現手順の確認
   - 影響範囲の特定

2. **修正実装**
   - 根本原因の特定
   - 修正コードの実装
   - エラーハンドリングの追加

3. **テスト実行**
   - 修正内容のテスト
   - 回帰テスト
   - 本番環境での確認

### 8. 品質管理

#### コードレビュー項目
- [ ] 型安全性の確認
- [ ] エラーハンドリングの確認
- [ ] パフォーマンスの確認
- [ ] セキュリティの確認
- [ ] 可読性の確認

#### テスト項目
- [ ] 正常系のテスト
- [ ] 異常系のテスト
- [ ] エッジケースのテスト
- [ ] パフォーマンステスト

### 9. ドキュメント管理

#### 必須ドキュメント
- [ ] `PROJECT_REFERENCE.md` - プロジェクト概要
- [ ] `PROJECT_RULES.md` - 開発ルール
- [ ] `README.md` - セットアップガイド
- [ ] `CHANGELOG.md` - 変更履歴

#### 更新タイミング
- 新機能追加時
- バグ修正時
- 設定変更時
- アーキテクチャ変更時

---

**最終更新**: 2025年7月24日
**バージョン**: 1.0.0 