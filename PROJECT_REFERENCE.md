# AI Chat プロジェクト参照ファイル

## 📋 プロジェクト概要

**AI Chat** - Next.js 15.3.4 ベースのAIチャットアプリケーション
- キャラクターとの会話機能
- 音声出力機能（ElevenLabs, Voicevox）
- 画像生成機能（Runware/Stable Diffusion）
- インスピレーション機能（💡返信サポート、💖ハートマーク）
- Persona設定機能
- メモ機能
- テーマ設定
- クラウド同期機能（Supabase）
- 認証機能（Supabase Auth）
- データバックアップ・インポート機能
- キャラクタートラッキング機能
- Live2Dアバター対応

## 🏗️ プロジェクト構造

```
ai-chat/
├── src/app/                    # Next.js App Router
│   ├── api/                    # API Routes
│   │   ├── chat/              # チャットAPI
│   │   ├── enhance-text/      # テキスト強化
│   │   ├── enhanced-impression/ # ハートマーク機能
│   │   ├── export-data/       # データエクスポート
│   │   ├── generate-image/    # 画像生成
│   │   ├── generate-memo-title/ # メモタイトル生成
│   │   ├── list-characters/   # キャラクター一覧
│   │   ├── list-personas/     # Persona一覧
│   │   ├── save-background/   # 背景保存
│   │   ├── simple-chat/       # メインチャットAPI
│   │   ├── summarize-chat/    # チャット要約
│   │   ├── test-*             # テスト用API群
│   │   ├── user-inspiration/  # 💡機能
│   │   └── voicevox*/         # Voicevox関連API
│   ├── auth/callback/         # 認証コールバック
│   ├── characters/            # キャラクター管理ページ
│   ├── history/               # 履歴ページ
│   ├── personas/              # Persona管理ページ
│   ├── settings/              # 設定ページ
│   └── page.tsx               # メインページ
├── src/components/             # React コンポーネント
│   ├── *Modal.tsx             # 各種モーダル
│   ├── *Selector.tsx          # セレクター系
│   ├── *Gallery.tsx           # ギャラリー系
│   ├── settings/              # 設定画面コンポーネント群
│   │   ├── ApiSettings.tsx    
│   │   ├── ChatSettings.tsx   
│   │   ├── ModelSettings.tsx  
│   │   └── ...
│   └── ...
├── components/                 # ルート階層のコンポーネント（重複）
├── lib/                       # ユーティリティライブラリ
│   ├── openRouter.ts          # OpenRouter API
│   ├── geminiApi*.ts          # Gemini API関連
│   ├── runwareApi.ts          # Runware API
│   ├── stableDiffusionApi.ts  # Stable Diffusion API
│   ├── voiceManager.ts        # ElevenLabs音声管理
│   ├── voicevoxManager.ts     # Voicevox音声管理
│   ├── memoryManager.ts       # メモリ管理
│   ├── historyManager.ts      # 履歴管理
│   ├── characterLoader.ts     # キャラクター読み込み
│   ├── *CloudSync.ts          # クラウド同期関連
│   ├── supabase.ts           # Supabase設定
│   ├── themes.ts             # テーマ管理
│   ├── imageCompressor.ts    # 画像圧縮
│   └── ...
├── types/                     # TypeScript型定義
│   ├── app.ts                 # AppSettings型
│   ├── character.ts           # キャラクター型
│   └── replicate.d.ts         # Replicate型定義
├── src/stores/                # 状態管理（src内）
│   └── chatStore.ts           # チャット状態
├── stores/                    # 状態管理（重複・ルート階層）
│   └── chatStore.ts           # チャット状態
├── src/config/                # 設定ファイル
│   └── model-config.ts        # モデル設定
├── public/                    # 静的ファイル
│   ├── characters/            # キャラクターファイル
│   └── personas/              # Personaファイル
└── ...
```

## 🔧 主要機能

### 1. チャット機能
- **API**: `src/app/api/simple-chat/route.ts`
- **機能**: キャラクターとの会話、複数候補生成
- **設定**: トークン数、温度、モデル選択
- **サポート**: OpenRouter, Gemini API

### 2. 💡返信サポート機能
- **API**: `src/app/api/user-inspiration/route.ts`
- **機能**: ユーザーの次の発言候補を3つ生成
- **設定**: 専用トークン数（デフォルト500）

### 3. 💖ハートマーク機能（インスピレーション）
- **API**: `src/app/api/enhanced-impression/route.ts`
- **機能**: 会話を3つの視点から分析
- **設定**: 専用トークン数（デフォルト1000）

### 4. 音声機能
- **ライブラリ**: `lib/voiceManager.ts`, `lib/voicevoxManager.ts`
- **機能**: ElevenLabs API、Voicevoxを使用した音声出力
- **設定**: 音声ID、安定性、類似度ブースト
- **API**: `src/app/api/voicevox*/route.ts`

### 5. 画像生成機能
- **API**: `src/app/api/generate-image/route.ts`
- **機能**: Runware/Stable Diffusion API
- **設定**: モデルID、APIキー
- **Runwareドキュメント**:
  - [接続方法](https://runware.ai/docs/en/getting-started/how-to-connect)
  - [API リファレンス](https://runware.ai/docs/en/image-inference/api-reference)
  - [Vercel AI ライブラリ](https://runware.ai/docs/en/libraries/vercel-ai)

### 6. 認証・クラウド同期機能
- **認証**: `src/app/auth/callback/page.tsx`
- **API**: `lib/supabase.ts`
- **機能**: Supabaseを使用したユーザー認証とデータ同期
- **同期対象**: キャラクター、設定、履歴、メモ、Persona

### 7. データ管理機能
- **バックアップ**: `src/components/DataBackup.tsx`
- **エクスポート**: `src/app/api/export-data/route.ts`
- **インポート**: 各種ImportExportコンポーネント

### 8. メモ・履歴機能
- **メモ**: `src/components/Memo*.tsx`
- **履歴**: `lib/historyManager.ts`
- **要約**: `src/app/api/summarize-chat/route.ts`

### 9. キャラクタートラッキング
- **コンポーネント**: `src/components/CharacterTracker.tsx`
- **機能**: キャラクターの使用状況追跡

### 10. Live2Dアバター
- **コンポーネント**: `src/components/Live2DAvatar.tsx`
- **機能**: Live2Dモデル表示

## ⚙️ 重要な設定

### 環境変数（Vercel）
```bash
# セキュリティのため、実際のAPIキーは環境変数で管理してください
# AI API Keys
# OPENROUTER_API_KEY=your_openrouter_api_key_here
# GEMINI_API_KEY=your_gemini_api_key_here

# 画像生成 API Keys
# RUNWARE_MODEL_ID=your_runware_model_id_here
# RUNWARE_API_KEY=your_runware_api_key_here
# STABLE_DIFFUSION_API_KEY=your_stable_diffusion_api_key_here

# 音声 API Keys
# ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# データベース・認証
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 型定義（types/app.ts）
```typescript
export interface AppSettings {
  // 基本設定
  temperature: number;
  topP: number;
  maxTokens: number;
  memorySize: number;
  historySize: number;
  bubbleOpacity: number;
  
  // APIキー
  openRouterApikey?: string;
  geminiApikey?: string;
  runwareApikey?: string;
  runwaremodelid?: string;
  elevenlabsApikey?: string;
  stableDiffusionApikey?: string;
  
  // インスピレーション設定
  inspirationMaxTokens?: number;
  enhancedImpressionMaxTokens?: number;
  
  // テーマ・UI設定
  theme?: string;
  fontFamily?: string;
  bubbleShape?: string;
  backgroundType?: string;
  
  // 音声設定
  voiceId?: string;
  voiceStability?: number;
  voiceSimilarityBoost?: number;
  voicevoxSpeaker?: string;
  
  // クラウド同期設定
  enableCloudSync?: boolean;
  autoSave?: boolean;
  
  // その他
  [key: string]: unknown;
}
```

## 🚨 注意事項

### 1. ファイル編集時の注意
- `SettingsModal.tsx`を編集する際は、型定義との整合性を確認
- APIファイルを編集する際は、エラーハンドリングを必ず追加
- コンポーネントを編集する際は、propsの型を確認

### 2. デプロイ時の注意
- 環境変数の設定を確認
- ビルドエラーがないことを確認
- 型エラーがないことを確認

### 3. よくあるエラー
- JSONパースエラー（APIレスポンスの途切れ）
- 型エラー（AppSettingsの型不一致）
- 環境変数エラー（Vercelでの設定漏れ）

## 📝 開発ルール

### 1. ファイル命名規則
- コンポーネント: PascalCase（例：`SettingsModal.tsx`）
- API: kebab-case（例：`user-inspiration`）
- 型定義: camelCase（例：`AppSettings`）
- ライブラリ: camelCase（例：`voiceManager.ts`）
- 設定ファイル: kebab-case（例：`model-config.ts`）

### 2. 重複ファイルの扱い
- `src/components/` と `components/` の重複は将来的に整理予定
- `src/stores/` と `stores/` の重複は将来的に整理予定
- バックアップファイル（.backup, .bak）は定期的に削除

### 2. コード規約
- TypeScriptの型安全性を重視
- エラーハンドリングを必ず実装
- コンソールログでデバッグ情報を出力

### 3. コミットメッセージ
- 機能追加: `feat: 機能名を追加`
- バグ修正: `fix: 問題を修正`
- 設定変更: `config: 設定を変更`

## 🔄 更新手順

### 1. 機能追加時
1. 型定義を更新（`types/app.ts`）
2. APIファイルを作成・更新
3. コンポーネントを作成・更新
4. 設定画面に項目を追加（必要に応じて）
5. テスト実行
6. デプロイ

### 2. バグ修正時
1. エラーログを確認
2. 該当ファイルを特定
3. 修正を実装
4. エラーハンドリングを追加
5. テスト実行
6. デプロイ

### 3. 設定変更時
1. 環境変数を更新（Vercel）
2. 設定画面を更新（必要に応じて）
3. 再デプロイ

## 📞 緊急時の連絡先

- プロジェクトURL: https://ai-chat-d5zmitie8-kous-projects-ba188115.vercel.app
- Vercelダッシュボード: https://vercel.com/kous-projects-ba188115/ai-chat
- デプロイログ: Vercelダッシュボードで確認

---

## 🧹 クリーンアップが必要な項目

### 不要ファイル・バックアップファイル
- `*.backup` ファイル（4個）
- `*.bak` ファイル（1個）
- `route.ts.new` ファイル
- 重複したコンポーネントディレクトリ
- 重複したstoresディレクトリ

### 整理が必要な構造
1. **コンポーネントの重複**: `src/components/` と `components/`
2. **ストアの重複**: `src/stores/` と `stores/`
3. **APIテストファイル**: test-* 系APIの整理
4. **ドキュメント**: 多数のMDファイルの整理

---

**最終更新**: 2025年8月9日
**バージョン**: 2.0.0
**更新内容**: 現在のプロジェクト構造に合わせて全面改訂
