# AI Chat プロジェクト全体構造解析

## 📋 プロジェクト概要

**AI Chat** - Next.js 15.3.4 ベースのAIチャットアプリケーション
- **フレームワーク**: Next.js 15.3.4 (App Router)
- **言語**: TypeScript 5.0
- **状態管理**: Zustand 5.0.6
- **UI**: React 19.0.0 + Tailwind CSS 3.4.17
- **音声**: ElevenLabs API
- **画像生成**: Runware API / Stable Diffusion
- **AI**: Google Gemini API / OpenRouter API

## 🏗️ プロジェクト構造詳細

### **ルートディレクトリ**
- **package.json**: プロジェクト設定・依存関係管理
- **tsconfig.json**: TypeScript設定
- **next.config.ts**: Next.js設定
- **tailwind.config.mjs**: Tailwind CSS設定
- **.env.local**: ローカル環境変数（APIキー等）

### **src/app/** (Next.js App Router)
- **page.tsx**: メインアプリケーションページ（2690行）
- **layout.tsx**: ルートレイアウト
- **globals.css**: グローバルスタイル
- **ClientLayout.tsx**: クライアントサイドレイアウト

#### **src/app/api/** (API Routes)
- **simple-chat/route.ts**: メインチャットAPI
- **generate-image/route.ts**: 画像生成API
- **user-inspiration/route.ts**: 💡返信サポートAPI
- **enhanced-impression/route.ts**: 💖ハートマーク機能API
- **voicevox/route.ts**: VOICEVOX音声合成API
- **voicevox-proxy/route.ts**: VOICEVOXプロキシAPI
- **list-characters/route.ts**: キャラクター一覧取得API
- **list-personas/route.ts**: Persona一覧取得API
- **export-data/route.ts**: データエクスポートAPI
- **save-background/route.ts**: 背景保存API
- **summarize-chat/route.ts**: チャット要約API
- **enhance-text/route.ts**: テキスト強化API
- **test-gemini/route.ts**: Gemini APIテスト
- **test/route.ts**: 汎用テストAPI

#### **src/app/characters/** (キャラクター管理)
- **page.tsx**: キャラクター管理ページ

#### **src/app/personas/** (Persona管理)
- **page.tsx**: Persona管理ページ

#### **src/app/settings/** (設定)
- **page.tsx**: 設定ページ

#### **src/app/history/** (履歴)
- **page.tsx**: チャット履歴ページ

#### **src/app/auth/** (認証)
- **page.tsx**: 認証ページ

### **components/** (React コンポーネント)

#### **UI コンポーネント**
- **SettingsModal.tsx**: 設定モーダル（155行）
- **QuickSettingsModal.tsx**: クイック設定モーダル（163行）
- **CharacterModal.tsx**: キャラクター編集モーダル（689行）
- **PersonaModal.tsx**: Persona編集モーダル（302行）
- **AuthModal.tsx**: 認証モーダル（494行）
- **ThemeModal.tsx**: テーマ設定モーダル（440行）
- **VoiceControls.tsx**: 音声制御コンポーネント（199行）
- **FormattedText.tsx**: テキストフォーマット（19行）
- **Typewriter.tsx**: タイプライター効果（30行）

#### **キャラクター関連**
- **CharacterSelector.tsx**: キャラクター選択（261行）
- **CharacterGallery.tsx**: キャラクターギャラリー（529行）
- **CharacterImportExport.tsx**: キャラクターインポート/エクスポート（446行）
- **CharacterTracker.tsx**: キャラクタートラッカー（282行）
- **TrackerEditor.tsx**: トラッカー編集（493行）

#### **Persona関連**
- **PersonaSelector.tsx**: Persona選択（185行）
- **PersonaGallery.tsx**: Personaギャラリー（374行）
- **PersonaImportExport.tsx**: Personaインポート/エクスポート（383行）

#### **機能モーダル**
- **UserInspirationModal.tsx**: 💡返信サポートモーダル（65行）
- **EnhancedImpressionModal.tsx**: 💖ハートマーク機能モーダル（209行）
- **ChatSummaryModal.tsx**: チャット要約モーダル（363行）
- **MemoModal.tsx**: メモモーダル（335行）
- **MemoListModal.tsx**: メモ一覧モーダル（316行）
- **MessageEditorModal.tsx**: メッセージ編集モーダル（67行）
- **InspirationModal.tsx**: インスピレーションモーダル（61行）

#### **データ管理**
- **DataBackup.tsx**: データバックアップ（210行）
- **BackupControls.tsx**: バックアップ制御（79行）
- **ChatHistoryGallery.tsx**: チャット履歴ギャラリー（378行）

#### **特殊機能**
- **Live2DAvatar.tsx**: Live2Dアバター（42行）
- **MobileHelper.tsx**: モバイルヘルパー（128行）
- **ChatMemoProvider.tsx**: チャットメモプロバイダー（113行）
- **ThemeInitializer.tsx**: テーマ初期化（72行）

#### **設定関連**
- **components/settings/**: 設定関連コンポーネント
- **LoRASettings.tsx**: LoRA設定（331行）
- **RunwareSettingsModal.tsx**: Runware設定モーダル（61行）

### **lib/** (ユーティリティライブラリ)

#### **API管理**
- **geminiApiManager.ts**: Gemini API管理（345行）
- **openRouter.ts**: OpenRouter API管理（206行）
- **runwareApi.ts**: Runware API管理（96行）
- **stableDiffusionApi.ts**: Stable Diffusion API管理（124行）
- **geminiApi.ts**: Gemini API（165行）

#### **音声管理**
- **voiceManager.ts**: 音声管理（517行）
- **voicevoxManager.ts**: VOICEVOX音声管理（328行）

#### **データ管理**
- **characterLoader.ts**: キャラクター読み込み（374行）
- **autoLoader.ts**: 自動読み込み（173行）
- **historyManager.ts**: 履歴管理（204行）
- **memoryManager.ts**: メモリ管理（171行）
- **imagePromptGenerator.ts**: 画像プロンプト生成（632行）

#### **クラウド同期**
- **supabase.ts**: Supabase接続（134行）
- **cloudSyncManager.ts**: クラウド同期管理（125行）
- **settingsCloudSync.ts**: 設定クラウド同期（113行）
- **characterCloudSync.ts**: キャラクタークラウド同期（227行）
- **personaCloudSync.ts**: Personaクラウド同期（136行）
- **memoCloudSync.ts**: メモクラウド同期（153行）

#### **UI/UX管理**
- **backgroundManager.ts**: 背景管理（116行）
- **touchGestures.ts**: タッチジェスチャー（107行）
- **themes.ts**: テーマ管理（317行）
- **imageCompressor.ts**: 画像圧縮（196行）

#### **ユーティリティ**
- **defaultSystemPrompt.ts**: デフォルトシステムプロンプト（24行）
- **markdown.ts**: Markdown処理（13行）
- **uuidPolyfill.ts**: UUIDポリフィル（10行）

### **stores/** (状態管理)
- **chatStore.ts**: チャット状態管理（667行）
  - Zustandを使用したグローバル状態管理
  - チャット履歴、設定、キャラクター情報等

### **types/** (TypeScript型定義)
- **app.ts**: AppSettings型定義（99行）
- **character.ts**: キャラクター型定義（196行）
- **replicate.d.ts**: Replicate型定義（19行）

### **public/** (静的ファイル)
- **characters/**: キャラクターファイル（JSON）
- **personas/**: Personaファイル（JSON）
- **backgrounds/**: 背景画像/動画
- **favicon.ico**: ファビコン

## 🔗 主要な依存関係

### **外部ライブラリ**
- **@google/generative-ai**: Google Gemini API
- **@supabase/supabase-js**: Supabase接続
- **lucide-react**: アイコン
- **marked**: Markdown処理
- **replicate**: Replicate API
- **uuid**: UUID生成
- **zustand**: 状態管理

### **開発依存関係**
- **@types/node**: Node.js型定義
- **@types/react**: React型定義
- **tailwindcss**: CSSフレームワーク
- **typescript**: TypeScript
- **eslint**: コード品質

## 📊 ファイル間の依存関係

### **メインページ (src/app/page.tsx)**
**依存先:**
- `../../lib/characterLoader` - キャラクター読み込み
- `../../types/character` - キャラクター型定義
- `../../lib/historyManager` - 履歴管理
- `../../lib/voiceManager` - 音声管理
- `../../components/SettingsModal` - 設定モーダル
- `../../components/QuickSettingsModal` - クイック設定
- `../../components/VoiceControls` - 音声制御
- `../../components/CharacterModal` - キャラクター編集
- `../../components/CharacterSelector` - キャラクター選択
- `../../components/PersonaModal` - Persona編集
- `../../components/PersonaSelector` - Persona選択
- `../../components/ChatMemoProvider` - メモ機能
- `../../components/ChatSummaryModal` - 要約モーダル
- `../../components/AuthModal` - 認証モーダル
- `../../stores/chatStore` - 状態管理
- `../../components/FormattedText` - テキストフォーマット
- `../../lib/autoLoader` - 自動読み込み
- `../../lib/touchGestures` - タッチジェスチャー
- `../../lib/backgroundManager` - 背景管理
- `../../components/CharacterTracker` - トラッカー表示
- `../../components/Typewriter` - タイプライター効果

### **チャットAPI (src/app/api/simple-chat/route.ts)**
**依存先:**
- `../../../lib/geminiApiManager` - Gemini API管理
- `../../../types/app` - アプリ設定型
- `../../../types/character` - キャラクター型

### **画像生成API (src/app/api/generate-image/route.ts)**
**依存先:**
- `../../../lib/runwareApi` - Runware API
- `../../../lib/stableDiffusionApi` - Stable Diffusion API
- `../../../types/app` - アプリ設定型
- `../../../types/character` - キャラクター型

### **状態管理 (stores/chatStore.ts)**
**依存先:**
- `../types/app` - アプリ設定型
- `../types/character` - キャラクター型
- `../lib/characterLoader` - キャラクター読み込み
- `../lib/historyManager` - 履歴管理

### **Gemini API管理 (lib/geminiApiManager.ts)**
**依存先:**
- `@google/generative-ai` - Google Gemini API
- `../types/character` - キャラクター型
- `./openRouter` - OpenRouter API

### **キャラクター読み込み (lib/characterLoader.ts)**
**依存先:**
- `../types/character` - キャラクター型
- `fs` - ファイルシステム
- `path` - パス処理

## 🎯 主要機能の実装箇所

### **1. チャット機能**
- **API**: `src/app/api/simple-chat/route.ts`
- **UI**: `src/app/page.tsx` (メインページ)
- **状態管理**: `stores/chatStore.ts`

### **2. 💡返信サポート機能**
- **API**: `src/app/api/user-inspiration/route.ts`
- **UI**: `components/UserInspirationModal.tsx`
- **呼び出し**: `src/app/page.tsx` (💡ボタン)

### **3. 💖ハートマーク機能**
- **API**: `src/app/api/enhanced-impression/route.ts`
- **UI**: `components/EnhancedImpressionModal.tsx`
- **呼び出し**: `src/app/page.tsx` (💖ボタン)

### **4. 画像生成機能**
- **API**: `src/app/api/generate-image/route.ts`
- **ライブラリ**: `lib/runwareApi.ts`, `lib/stableDiffusionApi.ts`
- **プロンプト生成**: `lib/imagePromptGenerator.ts`

### **5. 音声機能**
- **ライブラリ**: `lib/voiceManager.ts`, `lib/voicevoxManager.ts`
- **UI**: `components/VoiceControls.tsx`
- **API**: `src/app/api/voicevox/route.ts`

### **6. キャラクター管理**
- **読み込み**: `lib/characterLoader.ts`
- **UI**: `components/CharacterGallery.tsx`, `components/CharacterModal.tsx`
- **ページ**: `src/app/characters/page.tsx`

### **7. 設定管理**
- **UI**: `components/SettingsModal.tsx`, `components/QuickSettingsModal.tsx`
- **型定義**: `types/app.ts`
- **状態管理**: `stores/chatStore.ts`

## 🔧 開発環境設定

### **環境変数 (.env.local)**
```bash
# API Keys
OPENROUTER_API_KEY=sk-or-v1-...
GOOGLE_API_KEY=AIzaSy...
RUNWARE_API_KEY=zj7h0aPEZpgG4Gc...
RUNWARE_MODEL_ID=runware:97@1

# Voice APIs
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=kdmDKE6EkgrWrrykO9Qt

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Local Development
LOCAL_SD_URL=http://localhost:7860
```

### **開発サーバー起動**
```bash
npm run dev  # ポート3004で起動
```

## 📈 プロジェクト統計

- **総ファイル数**: 約80ファイル
- **総コード行数**: 約15,000行
- **主要コンポーネント**: 30個
- **API エンドポイント**: 15個
- **ライブラリ**: 10個
- **型定義**: 3ファイル

## 🚀 デプロイ情報

- **プラットフォーム**: Vercel
- **Node.js バージョン**: 20.x
- **Next.js バージョン**: 15.3.4
- **TypeScript バージョン**: 5.0

---

**最終更新**: 2025年8月5日
**解析者**: AI Assistant 