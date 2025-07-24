# AI Chat クイックスタートガイド

## 🚀 プロジェクト開始時の必須確認事項

### 1. プロジェクト概要の確認
```bash
# プロジェクト参照ファイルを確認
cat PROJECT_REFERENCE.md

# プロジェクトルールを確認
cat PROJECT_RULES.md

# 変更履歴を確認
cat CHANGELOG.md
```

### 2. 環境変数の確認
```bash
# Vercelの環境変数設定
OPENROUTER_API_KEY=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
RUNWARE_MODEL_ID=rundiffusion:130@100
RUNWARE_API_KEY=zj7h0aPEZpgG4GczcCGzvuuVlcYG5Ik5
```

### 3. 重要なファイルの場所
```
📁 プロジェクト構造
├── 📄 PROJECT_REFERENCE.md    # プロジェクト概要
├── 📄 PROJECT_RULES.md        # 開発ルール
├── 📄 CHANGELOG.md            # 変更履歴
├── 📄 QUICK_START.md          # このファイル
├── 📁 src/app/api/            # API Routes
├── 📁 components/             # React コンポーネント
├── 📁 types/                  # TypeScript型定義
└── 📁 lib/                    # ユーティリティライブラリ
```

## 🔧 開発開始時のチェックリスト

### 開発環境の準備
- [ ] Node.js 18+ のインストール確認
- [ ] npm または yarn のインストール確認
- [ ] Git の設定確認
- [ ] VSCode の設定確認

### プロジェクトのセットアップ
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルドテスト
npm run build
```

### 重要なファイルの確認
- [ ] `types/app.ts` - 型定義の確認
- [ ] `components/SettingsModal.tsx` - 設定画面の確認
- [ ] `src/app/api/simple-chat/route.ts` - メインAPIの確認
- [ ] `lib/openRouter.ts` - OpenRouter APIの確認

## 🎯 機能別クイックガイド

### 💡 返信サポート機能
```typescript
// API: src/app/api/user-inspiration/route.ts
// 設定: inspirationMaxTokens (デフォルト500)
// 機能: ユーザーの次の発言候補を3つ生成
```

### 💖 ハートマーク機能
```typescript
// API: src/app/api/enhanced-impression/route.ts
// 設定: impressionMaxTokens (デフォルト1000)
// 機能: 会話を3つの視点から分析
```

### 🎤 音声機能
```typescript
// ライブラリ: lib/voiceManager.ts
// 設定: ElevenLabs APIキー
// 機能: 音声出力
```

### 🖼️ 画像生成機能
```typescript
// API: src/app/api/generate-image/route.ts
// 設定: Runware APIキー、モデルID
// 機能: AI画像生成
```

## 🚨 よくある問題と対処法

### 1. 型エラーが発生した場合
```bash
# エラー例
Property 'inspirationMaxTokens' does not exist on type 'AppSettings'

# 対処法
1. types/app.tsで型定義を追加
2. デフォルト値を設定
3. 型ガードを使用
```

### 2. APIエラーが発生した場合
```bash
# エラー例
OpenRouter API Key is not set

# 対処法
1. Vercelダッシュボードで環境変数を確認
2. 設定画面でAPIキーを確認
3. 再デプロイを実行
```

### 3. JSONパースエラーが発生した場合
```bash
# エラー例
Unexpected token < in JSON at position 0

# 対処法
1. レスポンスの前処理を追加
2. try-catch文でエラーハンドリング
3. フォールバック値を設定
```

## 📝 開発時のベストプラクティス

### 1. ファイル編集前のチェック
- [ ] 型定義の確認
- [ ] エラーハンドリングの確認
- [ ] ログ出力の確認
- [ ] バックアップの作成

### 2. コード品質の確保
- [ ] TypeScriptの型安全性
- [ ] エラーハンドリングの実装
- [ ] コンソールログの追加
- [ ] コードの可読性

### 3. テストとデプロイ
- [ ] ビルドテストの実行
- [ ] 機能テストの実行
- [ ] エラーログの確認
- [ ] 本番環境での動作確認

## 🔄 更新作業の流れ

### 新機能追加時
1. **計画**
   - 機能要件の明確化
   - 型定義の設計
   - API設計

2. **実装**
   - 型定義の追加
   - APIファイルの作成
   - コンポーネントの作成
   - 設定画面の更新

3. **テスト**
   - 単体テスト
   - 統合テスト
   - エラーハンドリングテスト

4. **デプロイ**
   - ビルドテスト
   - 本番デプロイ
   - 動作確認

### バグ修正時
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

## 📞 緊急時の連絡先

- **プロジェクトURL**: https://ai-chat-d5zmitie8-kous-projects-ba188115.vercel.app
- **Vercelダッシュボード**: https://vercel.com/kous-projects-ba188115/ai-chat
- **デプロイログ**: Vercelダッシュボードで確認

## 📚 参考資料

- [PROJECT_REFERENCE.md](./PROJECT_REFERENCE.md) - プロジェクト概要
- [PROJECT_RULES.md](./PROJECT_RULES.md) - 開発ルール
- [CHANGELOG.md](./CHANGELOG.md) - 変更履歴
- [README.md](./README.md) - セットアップガイド

---

**最終更新**: 2025年7月24日
**バージョン**: 1.0.0 