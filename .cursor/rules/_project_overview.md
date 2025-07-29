以下は、リポジトリ直下（`./`）をトップレベルから俯瞰し、主要ファイルのみを抜粋して整理した一覧です。  
（※ “主要”＝UI/状態管理/API/ユーティリティ/型定義など、他ファイルから頻繁に参照される中核的なもの）

---

### 1. Next.js アプリの核

- **ファイル名:** `src/app/page.tsx`  
  - **役割:** SPA 全体のメインページ（チャット UI ・状態管理・各種モーダル）  
  - **依存先:**  
    - `components/*`（UI 各種）  
    - `stores/chatStore.ts`（Zustand 状態）  
    - `lib/*`（CharacterLoader／BackgroundManager／historyManager 等）  
    - `types/*`（型定義）

- **ファイル名:** `src/app/ClientLayout.tsx`  
  - **役割:** `<html>` / `<body>` ラッパー・テーマ適用・フォント読み込み  
  - **依存先:** `lib/themes.ts`, `components/ThemeInitializer.tsx`

- **ファイル名:** `src/app/layout.tsx`  
  - **役割:** 全ページ共通レイアウト（メタデータ・フォント）  
  - **依存先:** なし（Next.js のトップレベル）

---

### 2. API ルート（`src/app/api/*`）

| ファイル | 役割 | 依存先 |
|---|---|---|
| `simple-chat/route.ts` | OpenRouter/Gemini でチャット生成 | `lib/openRouter.ts`, `lib/memoryManager.ts`, `lib/characterLoader.ts`, `lib/historyManager.ts`, `types/*` |
| `user-inspiration/route.ts` | ユーザー返信候補生成 | `lib/openRouter.ts`, `types/*` |
| `enhance-text/route.ts` | ユーザーテキスト強化 | `lib/openRouter.ts` |
| `generate-image/route.ts` | 画像生成 (Runware / SD) | `lib/runwareApi.ts`, `lib/stableDiffusionApi.ts` |
| `list-characters/route.ts` | `public/characters/character` からキャラ JSON 一覧取得 | `fs`, `path` |
| `list-personas/route.ts` | ペルソナ JSON 一覧取得 | `fs`, `path` |
| `save-background/route.ts` | 背景画像 URL を永続化 | `fs`, `path` |

---

### 3. UI コンポーネント（抜粋）

- **ファイル名:** `components/CharacterGallery.tsx`  
  - **役割:** キャラクター一覧表示・検索・CRUD  
  - **依存先:** `types/character.ts`, `lib/characterLoader.ts`

- **ファイル名:** `components/CharacterModal.tsx`  
  - **役割:** キャラ詳細編集ダイアログ  
  - **依存先:** `types/character.ts`, `lib/characterLoader.ts`

- **ファイル名:** `components/settings/*` 内各ファイル  
  - **役割:** 設定画面タブ（APIキー・モデル・UI など）  
  - **依存先:** `types/app.ts`, `stores/chatStore.ts`

- **ファイル名:** `components/FormattedText.tsx`  
  - **役割:** Markdown → HTML 変換 & XSS サニタイズ  
  - **依存先:** `lib/markdown.ts`

---

### 4. 状態管理

- **ファイル名:** `stores/chatStore.ts`  
  - **役割:** グローバルチャット状態 (Zustand)  
  - **依存先:** `types/character.ts`, `types/app.ts`

---

### 5. ユーティリティ / ライブラリ

| ファイル | 役割 | 依存先 |
|---|---|---|
| `lib/characterLoader.ts` | キャラ JSON のロード/保存/検索 | `localStorage`, `fs` (ブラウザでは File API) |
| `lib/historyManager.ts` | IndexedDB でチャット履歴 CRUD | なし |
| `lib/backgroundManager.ts` | 背景画像 URL 保存・取得 | `localStorage`, `fetch` |
| `lib/openRouter.ts` | OpenRouter API ラッパー | `fetch` |
| `lib/runwareApi.ts` / `lib/stableDiffusionApi.ts` | 画像生成サービス呼び出し | `fetch` |
| `lib/memoryManager.ts` | 長期メモリ要約生成 | なし |

---

### 6. 型定義

- `types/app.ts` … 画面設定（APIキー・モデル設定など）
- `types/character.ts` … キャラクター / メッセージ / セッション型
- `types/replicate.d.ts` … 画像生成用の外部型

---

### 7. 静的リソース

- `public\charactersC:\script\ai-chat\public\characters/*.json` … キャラクター定義  
- `public\personas\personas/*.json` … ユーザーペルソナ 
- `public\Background\bg.mp4` … 背景リソース
---

上記がプロジェクトの主要構造と依存関係の概要です。  
この一覧をベースに、次のご要望（リファクタ・機能追加など）をお知らせください。