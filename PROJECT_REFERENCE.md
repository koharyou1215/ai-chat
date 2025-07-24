# AI Chat プロジェクト参照ファイル

## 📋 プロジェクト概要

**AI Chat** - Next.js 15.3.4 ベースのAIチャットアプリケーション
- キャラクターとの会話機能
- 音声出力機能（ElevenLabs）
- 画像生成機能（Runware/Stable Diffusion）
- インスピレーション機能（💡返信サポート、💖ハートマーク）
- Persona設定機能
- メモ機能
- テーマ設定

## 🏗️ プロジェクト構造

```
ai-chat/
├── src/app/                    # Next.js App Router
│   ├── api/                    # API Routes
│   │   ├── chat/              # チャットAPI
│   │   ├── enhanced-impression/ # ハートマーク機能
│   │   ├── generate-image/    # 画像生成
│   │   ├── simple-chat/       # メインチャットAPI
│   │   ├── user-inspiration/  # 💡機能
│   │   └── ...
│   ├── characters/            # キャラクター管理ページ
│   ├── history/               # 履歴ページ
│   ├── personas/              # Persona管理ページ
│   ├── settings/              # 設定ページ
│   └── page.tsx               # メインページ
├── components/                 # React コンポーネント
│   ├── SettingsModal.tsx      # 設定モーダル
│   ├── CharacterSelector.tsx  # キャラクター選択
│   ├── PersonaSelector.tsx    # Persona選択
│   ├── VoiceControls.tsx      # 音声制御
│   ├── UserInspirationModal.tsx # 💡機能モーダル
│   ├── EnhancedImpressionModal.tsx # 💖機能モーダル
│   └── ...
├── lib/                       # ユーティリティライブラリ
│   ├── openRouter.ts          # OpenRouter API
│   ├── voiceManager.ts        # 音声管理
│   ├── memoryManager.ts       # メモリ管理
│   ├── characterLoader.ts     # キャラクター読み込み
│   └── ...
├── types/                     # TypeScript型定義
│   ├── app.ts                 # AppSettings型
│   └── character.ts           # キャラクター型
├── stores/                    # 状態管理
│   └── chatStore.ts           # チャット状態
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

### 2. 💡返信サポート機能
- **API**: `src/app/api/user-inspiration/route.ts`
- **機能**: ユーザーの次の発言候補を3つ生成
- **設定**: 専用トークン数（デフォルト500）

### 3. 💖ハートマーク機能（インスピレーション）
- **API**: `src/app/api/enhanced-impression/route.ts`
- **機能**: 会話を3つの視点から分析
- **設定**: 専用トークン数（デフォルト1000）

### 4. 音声機能
- **ライブラリ**: `lib/voiceManager.ts`
- **機能**: ElevenLabs APIを使用した音声出力
- **設定**: 音声ID、安定性、類似度ブースト

### 5. 画像生成機能
- **API**: `src/app/api/generate-image/route.ts`
- **機能**: Runware/Stable Diffusion API
- **設定**: モデルID、APIキー
- **Runwareドキュメント**:
  - [接続方法](https://runware.ai/docs/en/getting-started/how-to-connect)
  - [API リファレンス](https://runware.ai/docs/en/image-inference/api-reference)
  - [Vercel AI ライブラリ](https://runware.ai/docs/en/libraries/vercel-ai)

## ⚙️ 重要な設定

### 環境変数（Vercel）
```bash
OPENROUTER_API_KEY=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
RUNWARE_MODEL_ID=rundiffusion:130@100
RUNWARE_API_KEY=zj7h0aPEZpgG4GczcCGzvuuVlcYG5Ik5
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

**最終更新**: 2025年7月24日
**バージョン**: 1.0.0
