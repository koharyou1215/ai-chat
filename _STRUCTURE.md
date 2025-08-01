# AI Chat プロジェクト - ディレクトリ構造

## 📁 プロジェクト全体構造

```
ai-chat/
├── 📁 src/                           # メインソースコード
│   ├── 📁 app/                       # Next.js App Router
│   │   ├── 📁 api/                   # API Routes (バックエンド)
│   │   │   ├── 📁 simple-chat/       # メインチャット API
│   │   │   ├── 📁 enhance-text/      # 文章強化 API
│   │   │   ├── 📁 generate-image/    # 画像生成 API
│   │   │   ├── 📁 user-inspiration/  # 応答候補 API
│   │   │   └── 📁 [その他API]/       # 各種機能API
│   │   ├── 📄 page.tsx               # メインチャット画面
│   │   ├── 📄 layout.tsx             # アプリケーションレイアウト
│   │   ├── 📄 globals.css            # グローバルスタイル
│   │   └── 📁 [pages]/               # 各種ページ
│   ├── 📁 components/                # 共有コンポーネント（重複）
│   ├── 📁 config/                    # 設定ファイル
│   └── 📁 stores/                    # 状態管理（重複）
│
├── 📁 components/                    # React コンポーネント（メイン）
│   ├── 📁 settings/                  # 設定関連コンポーネント
│   │   ├── 📄 ApiSettings.tsx        # API設定
│   │   ├── 📄 ChatSettings.tsx       # チャット設定
│   │   ├── 📄 ModelSettings.tsx      # モデル設定
│   │   ├── 📄 VoiceSettings.tsx      # 音声設定
│   │   └── 📄 UISettings.tsx         # UI設定
│   ├── 📄 CharacterModal.tsx         # キャラクター編集
│   ├── 📄 CharacterSelector.tsx      # キャラクター選択
│   ├── 📄 SettingsModal.tsx          # 設定モーダル
│   ├── 📄 MessageEditorModal.tsx     # メッセージ編集
│   └── 📄 [その他コンポーネント].tsx
│
├── 📁 lib/                          # ユーティリティライブラリ
│   ├── 📄 openRouter.ts             # OpenRouter API連携
│   ├── 📄 runwareApi.ts             # Runware画像生成API
│   ├── 📄 stableDiffusionApi.ts     # Stable Diffusion API
│   ├── 📄 imagePromptGenerator.ts   # 画像プロンプト生成
│   ├── 📄 voiceManager.ts           # 音声管理
│   ├── 📄 historyManager.ts         # 履歴管理
│   ├── 📄 characterLoader.ts        # キャラクター読み込み
│   ├── 📄 settingsCloudSync.ts      # 設定クラウド同期
│   └── 📄 [その他ライブラリ].ts
│
├── 📁 types/                        # TypeScript型定義
│   ├── 📄 app.ts                    # アプリケーション設定型
│   ├── 📄 character.ts              # キャラクター型定義
│   └── 📄 replicate.d.ts            # 外部API型定義
│
├── 📁 stores/                       # 状態管理（Zustand）
│   └── 📄 chatStore.ts              # メインストア
│
├── 📁 public/                       # 静的ファイル
│   ├── 📁 characters/               # デフォルトキャラクター
│   │   ├── 📄 nami.json            # サンプルキャラクター
│   │   └── 📄 [その他キャラ].json
│   ├── 📁 personas/                 # ペルソナ設定
│   ├── 📄 manifest.json            # PWA設定
│   └── 📄 [アイコン・画像ファイル]
│
├── 📁 data/                         # データファイル
│   └── 📁 backgrounds/              # 背景画像設定
│
├── 📄 package.json                  # 依存関係
├── 📄 tsconfig.json                 # TypeScript設定
├── 📄 tailwind.config.mjs           # Tailwind CSS設定
├── 📄 next.config.ts                # Next.js設定
├── 📄 vercel.json                   # Vercel設定
│
├── 📁 [バッチファイル]/             # 自動化スクリプト
│   ├── 📄 ai-chat_dev.bat          # 開発サーバー起動
│   ├── 📄 deploy_ai-chat.bat       # デプロイ自動化
│   ├── 📄 fetch_logs.bat           # ログ取得
│   ├── 📄 status_ai-chat.bat       # 状況確認
│   └── 📄 stop_ai-chat.bat         # 緊急停止
│
└── 📁 [ドキュメント]/               # プロジェクト文書
    ├── 📄 PROJECT_REFERENCE.md     # プロジェクト概要
    ├── 📄 PROJECT_RULES.md         # 開発ルール
    ├── 📄 PROJECT_FEEDBACK.md      # 開発ログ
    ├── 📄 PROJECT_LESSONS_LEARNED.md # 学習記録
    ├── 📄 README.md                # セットアップガイド
    ├── 📄 CHANGELOG.md             # 変更履歴
    ├── 📄 BEGINNER_GUIDE.md        # 初心者ガイド
    ├── 📄 _INSTRUCTION.md          # 引き継ぎ命令書
    ├── 📄 _DEVELOPMENT_LOG.md      # 開発ログ
    └── 📄 _STRUCTURE.md            # この構造ファイル
```

## 🔍 重要ファイルの詳細

### 核となる設定・型定義
| ファイル | 役割 | 重要度 |
|---------|------|--------|
| `types/character.ts` | キャラクター型定義 | ⭐⭐⭐ |
| `types/app.ts` | アプリケーション設定型 | ⭐⭐⭐ |
| `stores/chatStore.ts` | メイン状態管理 | ⭐⭐⭐ |

### APIエンドポイント
| ファイル | 機能 | 重要度 |
|---------|------|--------|
| `src/app/api/simple-chat/route.ts` | メインチャット | ⭐⭐⭐ |
| `src/app/api/enhance-text/route.ts` | 文章強化（キラキラ） | ⭐⭐ |
| `src/app/api/generate-image/route.ts` | 画像生成 | ⭐⭐ |
| `src/app/api/user-inspiration/route.ts` | 応答候補（💡） | ⭐⭐ |

### UIコンポーネント
| ファイル | 機能 | 重要度 |
|---------|------|--------|
| `src/app/page.tsx` | メインチャット画面 | ⭐⭐⭐ |
| `components/CharacterModal.tsx` | キャラクター編集 | ⭐⭐⭐ |
| `components/SettingsModal.tsx` | 設定画面 | ⭐⭐ |
| `components/settings/ApiSettings.tsx` | API設定 | ⭐⭐ |

### ライブラリ・ユーティリティ
| ファイル | 機能 | 重要度 |
|---------|------|--------|
| `lib/openRouter.ts` | OpenRouter API連携 | ⭐⭐⭐ |
| `lib/imagePromptGenerator.ts` | 画像プロンプト生成 | ⭐⭐ |
| `lib/runwareApi.ts` | Runware画像生成 | ⭐⭐ |
| `lib/stableDiffusionApi.ts` | Stable Diffusion | ⭐⭐ |

## 🗂️ データフロー

### 1. キャラクター管理
```
public/characters/*.json
    ↓ (読み込み)
lib/characterLoader.ts
    ↓ (型変換)
types/character.ts (Character interface)
    ↓ (状態管理)
stores/chatStore.ts
    ↓ (UI表示)
components/CharacterModal.tsx
```

### 2. チャット処理
```
src/app/page.tsx (ユーザー入力)
    ↓ (API呼び出し)
src/app/api/simple-chat/route.ts
    ↓ (LLM連携)
lib/openRouter.ts
    ↓ (レスポンス)
stores/chatStore.ts (履歴保存)
    ↓ (UI更新)
src/app/page.tsx (メッセージ表示)
```

### 3. 画像生成
```
src/app/page.tsx (生成リクエスト)
    ↓ (プロンプト生成)
lib/imagePromptGenerator.ts
    ↓ (API呼び出し)
src/app/api/generate-image/route.ts
    ↓ (画像生成)
lib/runwareApi.ts | lib/stableDiffusionApi.ts
    ↓ (結果表示)
src/app/page.tsx
```

### 4. 設定管理
```
components/settings/*.tsx (設定UI)
    ↓ (状態更新)
stores/chatStore.ts
    ↓ (永続化)
localStorage + lib/settingsCloudSync.ts
    ↓ (API連携)
各種APIファイル
```

## 🔧 設定・環境ファイル

### 必須設定ファイル
- `.env.local` - 環境変数（APIキー等）
- `vercel.json` - Vercel設定
- `next.config.ts` - Next.js設定
- `tsconfig.json` - TypeScript設定
- `tailwind.config.mjs` - Tailwind CSS設定

### 自動化ファイル
- `*.bat` - Windows PowerShellスクリプト
- `package.json` - npm scripts

## 📊 ファイル統計

### 種類別ファイル数
- **TypeScript/JavaScript**: 100+ ファイル
- **JSON設定**: 40+ キャラクター + 設定ファイル
- **ドキュメント**: 10+ Markdownファイル
- **設定ファイル**: 10+ 設定・環境ファイル

### 重要度別分類
- **🔴 Critical (変更に注意)**: `types/`, `stores/`, メインAPI
- **🟡 Important (動作に影響)**: UI コンポーネント、ライブラリ
- **🟢 Normal (個別機能)**: 個別設定、ドキュメント

---

**最終更新**: 2025年8月1日  
**バージョン**: 2.0  
**記録者**: AI Assistant