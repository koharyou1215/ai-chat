# プロジェクト依存マップ設計図（詳細版）

本ドキュメントは src および lib を中心に、モジュール単位の依存関係・主要関数の呼び出し経路・外部API/SDKのバージョン管理をまとめた設計図です。今後の拡張（例：RLS/テーブル設計、同期機能の本実装、API追加）時の参照元として利用します。

更新日: 2025-08-05

---

## 0. 方針

- 粒度:
  - モジュール単位の依存関係（必須）
  - 重要箇所は関数単位の呼び出し関係も併記（「関数フロー」項）
- 対象:
  - src/app（ページ、APIルート）
  - src/components（上位UI）
  - src/stores（Zustand）
  - src/config（モデル設定）
  - lib（ユーティリティ・APIラッパ・同期モジュール）
- 除外:
  - 静的アセット（public/*）は概要のみ
  - 細かいUI下層（見た目のみのプレースホルダ）は省略

---

## 1. Backbone（重要経路）

- UI（src/app/page.tsx）
  - 依存: components/* 各UI、lib/*（キャラロード、履歴、音声、背景、動的Import 等）、stores/chatStore
  - 外部: next/dynamic、next/image、lucide-react
  - 関数フロー例:
    - 送信 → fetch('/api/simple-chat') → AI応答 → 表示/音声 → 履歴・要約・印象生成
- API
  - /api/simple-chat → lib/geminiApiManager（Gemini優先） or lib/openRouter → lib/characterLoader, lib/memoryManager
  - /api/chat → @google/generative-ai 直接利用
  - /api/generate-image → lib/runwareApi（優先）→失敗時 lib/stableDiffusionApi → ローカルSD
- 同期（クラウド）
  - components/AuthModal → lib/cloudSyncManager → lib/*CloudSync（characters/personas/memos/settings）→ lib/supabase（@supabase/supabase-js）
  - 重要: Supabase テーブル・RLS 必須（未作成のため現状404）

---

## 2. モジュール別マップ

### 2.1 src/app

- ファイル名: src/app/layout.tsx
  - 役割: ルートレイアウト（フォント、テーマ初期化、背景動画）
  - 依存先:
    - next: Metadata, next/font/google
    - ローカル: ./globals.css, ../../components/ThemeInitializer
  - 参照元: Next.js自動

- ファイル名: src/app/page.tsx
  - 役割: チャットUIメイン
  - 依存先（主要）:
    - components: SettingsModal, VoiceControls, CharacterModal, CharacterSelector, PersonaModal, PersonaSelector, ChatMemoProvider(MessageMemoButton), ChatSummaryModal, CharacterTracker, Typewriter, ほか動的import群
    - lib: characterLoader, historyManager, voiceManager, autoLoader, touchGestures, backgroundManager, uuidPolyfill
    - stores: ../../stores/chatStore（実体は src/stores/chatStore.ts）
    - next: image, dynamic
  - 関数フロー（概略）:
    - 初期化 → CharacterLoader.initialize/loadPublicCharacters → 状態セット
    - 送信 → fetch('/api/simple-chat') → 応答反映 → VoiceControls 読み上げ
    - 要約 → fetch('/api/summarize-chat')
    - 印象 → fetch('/api/enhanced-impression')
    - 画像生成 → fetch('/api/generate-image')（設定優先: runware/sd/local sd）

- API ルート（抜粋）
  - src/app/api/simple-chat/route.ts
    - 依存先: lib/memoryManager, lib/characterLoader, types/character(ExampleDialogue), lib/defaultSystemPrompt, lib/openRouter(chatCompletion), lib/geminiApiManager(GeminiApiManager)
    - 外部: OpenRouter API（経由）、Google Gemini（lib経由）
    - 関数フロー:
      1) リクエスト解析（message/settings/character/persona/memos/trackers）
      2) キャラクター取得（CharacterLoader）
      3) プロンプト生成（DEFAULT_SYSTEM_PROMPT + キャラ + メモ + ペルソナ + トラッカー + 指示）
      4) Gemini優先の generateWithPriority → フォールバックでOpenRouter
      5) 置換（{{char}}, {{user}}）
      6) 応答JSON返却
  - src/app/api/chat/route.ts
    - 依存先: @google/generative-ai, lib/defaultSystemPrompt
    - 関数フロー: Geminiモデルへ直接 generateContent → テキスト → 置換 → 返却
  - src/app/api/generate-image/route.ts
    - 依存先: lib/runwareApi(RunwareService), lib/stableDiffusionApi(StableDiffusionService)
    - 外部: Runware API/ Stable Diffusion API / ローカルSD
    - 関数フロー:
      1) リクエスト解析（prompt, character, negativePrompt, settings）
      2) キャラの appearancePrompt/Negative を付与
      3) 優先エンジン選択（runware → 失敗時 sd → さらに local sd ）
      4) 画像URL/データURL返却

### 2.2 src/stores

- ファイル名: src/stores/chatStore.ts
  - 役割: Zustandで messages / currentChat と setter 提供
  - 依存先: zustand, types/character（ChatMessage）
  - 参照元: src/app/page.tsx ほかUI

### 2.3 src/config

- ファイル名: src/config/model-config.ts
  - 役割: OpenRouter モデル一覧、表示名、デフォルト設定
  - 依存先: なし
  - 参照元: 設定UI/モデル選択箇所（components/settings/* など）

### 2.4 components（上位のみ）

- ファイル名: components/AuthModal.tsx
  - 役割: Supabase ログイン（Magic Link/OTP）、同期実行UI
  - 依存先: lib/supabase（signInWithEmail/signOut/onAuthStateChange/getCurrentUser）, lib/cloudSyncManager(syncAllData), DataBackup
  - 関数フロー:
    - ログイン: signInWithEmail（lib で supabase.auth.signInWithOtp）→ /auth/callback で exchangeCodeForSession
    - 同期: syncAllData(localSnapshot) → characters/personas/memos/settings の順でCRUD（lib/*CloudSync）
- ファイル名: components/SettingsModal.tsx ほか
  - 役割: 各設定UI
  - 依存先: stores/chatStore, config/model-config, lib/voiceManager etc.

---

## 3. lib（ユーティリティ/同期/AIラッパ）

- ファイル名: lib/characterLoader.ts
  - 役割: キャラクターの読み込み/登録/検索
  - 依存先: public/characters 配下JSON、ブラウザAPI（fetch/LocalStorage）
  - 主な関数:
    - initialize(), loadPublicCharacters(), getAllCharacters(), getCharacterByName(name), addCharacter(obj), deleteCharacter(name)
  - 参照元: src/app/page.tsx, /api/simple-chat など

- ファイル名: lib/historyManager.ts
  - 役割: セッション履歴の要約・表示用整形
  - 参照元: components/ChatHistoryGallery.tsx, /api/summarize-chat

- ファイル名: lib/defaultSystemPrompt.ts
  - 役割: システムプロンプト定義
  - 参照元: /api/*

- ファイル名: lib/geminiApi.ts / lib/geminiApiManager.ts
  - 役割: Gemini の呼び出しヘルパ / 優先制御（OpenRouterフォールバック）
  - 依存先: fetch / Google Generative AI SDK（直接は chat/route.ts で）

- ファイル名: lib/openRouter.ts
  - 役割: OpenRouter 経由の chatCompletion ラッパ
  - 依存先: fetch（Authorization: OpenRouter key）
  - 主な関数:
    - chatCompletion(messages, options)

- ファイル名: lib/runwareApi.ts
  - 役割: Runware 画像生成 API ラッパ
  - 主な関数:
    - new RunwareService(apiKey).generateImage(params) → { imageURL, imageUUID }

- ファイル名: lib/stableDiffusionApi.ts
  - 役割: Stable Diffusion (API) 画像生成ラッパ
  - 主な関数:
    - new StableDiffusionService(apiKey).generateImage(params) → { image: base64, seed }

- ファイル名: lib/supabase.ts
  - 役割: Supabaseクライアント生成、Authユーティリティ
  - 依存先: @supabase/supabase-js
  - 主な関数:
    - signInWithEmail(email)
    - signOut()
    - onAuthStateChange(cb)
    - getCurrentUser()
  - 注意: emailRedirectTo を window.location.origin/auth/callback で統一

- ファイル名: lib/cloudSyncManager.ts
  - 役割: 同期オーケストレーション
  - 依存先: characterCloudSync.ts, personaCloudSync.ts, memoCloudSync.ts, settingsCloudSync.ts, supabase.ts
  - 主な関数:
    - syncAllData(localData): Promise<{success, data?, error?, syncedItems}>  
      内部で各*CloudSync.tsを順次実行

- ファイル名: lib/characterCloudSync.ts
  - 役割: characters テーブルのCRUD
  - 依存先: supabase.ts
  - 主な関数:
    - loadCharactersFromCloud(userId)
    - saveCharacterToCloud(userId, character)
    - syncCharacters(local, userId)
  - 現状の課題: Supabase側に public.characters が存在しないため 404/42P01

- ファイル名: lib/personaCloudSync.ts, lib/memoCloudSync.ts, lib/settingsCloudSync.ts
  - 役割: 各テーブルのCRUD
  - 依存先: supabase.ts
  - 課題: 同上（テーブル未作成）

---

## 4. 外部API / SDK バージョン管理

- Next.js: 15.1.3（プロジェクト設定）
- React: 19.0.0
- Tailwind CSS: 3.4.17
- Zustand: バージョンは package.json 参照
- Supabase JS: @supabase/supabase-js（package.json 参照）
- Google Generative AI:
  - パッケージ: @google/generative-ai
  - 利用箇所: src/app/api/chat/route.ts
  - モデル: settings.model or 'gemini-2.5-flash'
- OpenRouter:
  - API 経由（lib/openRouter.ts）
  - モデル: src/config/model-config.ts に定義（Qwen/Grok/Gemini/DeepSeek/Claude の各ID）
- Runware:
  - API 直叩き（lib/runwareApi.ts）
- Stable Diffusion:
  - API 直叩き（lib/stableDiffusionApi.ts）
  - ローカルSD: /sdapi/v1/txt2img（AbortSignal.timeout 利用）

注意: 本プロジェクトでは .cursorrules により「AIモデルのバージョンは app/lib/api/client.ts で厳密管理」等のルール記載があるが、現行構成では lib/openRouter.ts と src/config/model-config.ts 側で運用。将来的に統合を検討。

---

## 5. 関数フロー一覧（要点のみ）

- チャット（/api/simple-chat）
  - generateWithPriority(model, messages, config) → Gemini success? else OpenRouter
- 画像生成（/api/generate-image）
  - RunwareService.generateImage → 失敗 → StableDiffusionService.generateImage → 失敗 → local sd fetch
- 認証
  - signInWithEmail → メール → /auth/callback → exchangeCodeForSession(url)
- 同期
  - cloudSyncManager.syncAllData → characterCloudSync.syncCharacters → personaCloudSync.syncPersonas → memoCloudSync.syncMemos → settingsCloudSync.syncSettings

---

## 6. Supabase（同期機能）前提のテーブル設計（最小案）

- characters (id uuid pk, user_id uuid, name text, data jsonb, updated_at timestamptz default now())
  - RLS: user_id = auth.uid() のみCRUD許可
- personas (id uuid pk, user_id uuid, name text, data jsonb, updated_at timestamptz default now())
- memos (id uuid pk, user_id uuid, character_id text, content text, data jsonb, updated_at timestamptz default now())
- settings (id uuid pk, user_id uuid, data jsonb, updated_at timestamptz default now())

現状: 404/42P01 よりテーブル未作成。GUIで作成→RLS有効化→ポリシー作成後、同期フローが動作。

---

## 7. 参照逆引き（主要ファイル）

- src/app/page.tsx → imports: CharacterLoader, historyManager, voiceManager, backgroundManager, autoLoader, touchGestures, dynamic(components/*), stores/chatStore
- src/app/api/simple-chat/route.ts → imports: MemoryManager, CharacterLoader, DEFAULT_SYSTEM_PROMPT, openRouter.chatCompletion, GeminiApiManager
- src/app/api/chat/route.ts → imports: @google/generative-ai, DEFAULT_SYSTEM_PROMPT
- src/app/api/generate-image/route.ts → imports: RunwareService, StableDiffusionService
- components/AuthModal.tsx → imports: lib/supabase, lib/cloudSyncManager

---

## 8. 今後の拡張と整合性

- 型の一元化: types/character.ts, types/app.ts を基点に、lib/* と components/* の整合性を維持
- 依存の整理:
  - AI呼び出しを1レイヤ（client.ts 等）に集約する設計も検討可
  - 画像生成の設定項目（LoRA, steps, CFG等）を types/app.ts 側へ昇格

---

## 9. 既知の課題（現時点）

- 同期: Supabase テーブル未作成のため CRUD が 404（relation not exists）
- 一部 components/* はプレースホルダ（実装が薄い）
- モデル版管理: src/config/model-config.ts に散在。将来、1箇所で集中管理の余地あり

---

## 10. 付録: 依存マップ（簡易グラフ）

UI(page.tsx)
  ├─ components/*（多数）
  ├─ stores/chatStore
  ├─ lib/characterLoader
  ├─ lib/historyManager
  ├─ lib/voiceManager
  ├─ lib/backgroundManager
  └─ fetch → /api/simple-chat, /api/generate-image, /api/enhanced-impression, /api/summarize-chat

API
  /api/simple-chat → lib/geminiApiManager → lib/geminiApi / lib/openRouter
  /api/chat        → @google/generative-ai
  /api/generate-image → lib/runwareApi / lib/stableDiffusionApi / local sd

Cloud Sync
