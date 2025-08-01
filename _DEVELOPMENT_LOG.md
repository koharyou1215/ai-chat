# AI Chat プロジェクト - 開発ログ

## 📋 開発履歴記録

### 2025年8月1日 - キャラクター機能大幅拡張と問題修正

#### 実装済み機能
**1. キャラクター専用システムプロンプト**
- `Character` インターフェースに `systemPrompt` フィールド追加
- `/api/simple-chat` でキャラクター専用プロンプトを最優先適用
- `CharacterModal.tsx` に編集UI追加
- デフォルトキャラクター（nami.json等）に実装例追加

**2. 画像生成機能強化**
- `appearancePrompt` / `appearanceNegativePrompt` フィールド追加
- 英文プロンプト対応による画像品質向上
- 新設定項目追加:
  - `imageGenerationEnabled` - 画像生成有効/無効
  - `contextPromptWeight` - 文脈プロンプト重み (0-1)
  - `emotionDetectionSensitivity` - 感情検出感度 (0-1) 
  - `scenarioDetectionEnabled` - シナリオ検出有効/無効
  - `customQualityTags` - カスタム品質タグ

**3. トラッカーシステム基盤**
- `CharacterTracker` インターフェース定義
- 好感度・信頼度・機嫌パラメータのサンプル実装
- JSON形式での設定例（nami.json）

**4. UI/UX改善**
- ヘッダータップでキャラ追加が開く問題修正（`pointer-events-none`）
- チャット入力フィールドの視認性向上
  - 閉じている時: `bg-gradient-to-r from-white/70 to-white/60 backdrop-blur-sm`
  - 開いている時: `bg-white/95 dark:bg-gray-800/95 backdrop-blur-md`
- フォント色の改善: `text-gray-900 dark:text-white`

**5. API並列処理改善**
- `Promise.allSettled` による並列リクエスト処理
- 単一リクエスト失敗が全体をブロックしない仕組み

#### 修正済みエラー
**1. ビルドエラー**
- 重複import除去（`StableDiffusionService` in `/api/generate-image`）
- 文字列リテラル未終了エラー修正（`stores/chatStore.ts`）
- ESLintエラー対応（未使用変数、const推奨など）

**2. 機能エラー**
- 文章強化（キラキラ）機能で「情報が足りません」エラー
  - `enhancementPrompt` の参照方法修正
  - 元テキストの適切な渡し方修正
- 画像生成エンジン選択ロジック修正
  - `settings?.imageEngine` の優先適用
  - Stable Diffusion URL検証強化

**3. パフォーマンス**
- `VoiceSettings.tsx` の無限ループ修正（useEffect依存配列最適化）

#### 技術的改善
**1. 型安全性向上**
- `Character` インターフェースの拡張
- `AppSettings` への新設定項目追加
- トラッカー関連の型定義追加

**2. プロンプト管理改善**
- キャラクター専用プロンプトの優先順位確立
- 画像生成プロンプトの英文対応
- ネガティブプロンプトの分離管理

**3. 設定管理拡張**
- API設定画面に画像生成オプション追加
- 設定の永続化と同期

#### 現在の状況
**完了済み**
- 基本機能の実装と動作確認
- 主要エラーの修正
- UIの改善

**テスト待ち**
- 画像生成機能（Stable Diffusion設定確認）
- 文章強化機能の動作確認
- トラッカーパラメータの表示/更新

**未実装**
- トラッカーUI表示機能
- トラッカー値更新ロジック
- クラウド同期の拡張

#### 次回作業予定
1. 不要ファイル削除とコミット
2. デプロイ実行
3. 画像生成・文章強化機能のテスト
4. トラッカーUI実装の検討

---

### 2025年7月24日 - プロジェクト基盤構築

#### 初期設定
- Next.js + TypeScript + Tailwind CSS環境構築
- OpenRouter API連携実装
- 基本的なチャット機能実装
- キャラクター選択機能実装

#### API実装
- `/api/simple-chat` - メインチャット機能
- `/api/enhance-text` - 文章強化機能
- `/api/generate-image` - 画像生成機能
- `/api/user-inspiration` - 応答候補機能

#### 基本UI実装
- チャット画面
- 設定モーダル
- キャラクター選択/編集画面
- テーマ切り替え機能

#### 初期問題と解決
- OpenRouter API認証エラー → APIキー設定方法修正
- 環境変数管理 → `.env.local` 設定確立
- デプロイ設定 → Vercel環境変数設定

---

## 🔧 技術スタック

### フロントエンド
- **Next.js 14** - Reactフレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Zustand** - 状態管理

### バックエンド
- **Next.js API Routes** - サーバー機能
- **OpenRouter API** - LLM連携
- **Runware API** - 画像生成
- **Stable Diffusion** - ローカル画像生成

### 開発・デプロイ
- **Vercel** - ホスティング
- **Git** - バージョン管理
- **ESLint** - コード品質
- **PowerShell** - 自動化スクリプト

## 📊 プロジェクト統計

### ファイル構成
- **コンポーネント**: 30+ React コンポーネント
- **API ルート**: 8 エンドポイント
- **型定義**: 3 主要インターフェースファイル
- **ライブラリ**: 15+ ユーティリティモジュール

### 機能数
- **チャット機能**: メイン・応答候補・文章強化
- **キャラクター**: 40+ デフォルトキャラクター
- **画像生成**: 2 エンジン対応
- **設定項目**: 50+ 設定オプション

---

**最終更新**: 2025年8月1日  
**記録者**: AI Assistant  
**プロジェクト状況**: 基本機能実装完了、拡張機能開発中