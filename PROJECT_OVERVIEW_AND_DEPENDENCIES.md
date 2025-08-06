# AI Chat プロジェクト統合ドキュメント（Overview + Dependency Map）
 毎回確認  
##最重要
- 修復するたびにチャット機能の不調で再修復の繰り返しなので修正する場合は絶対に**チャット機能✨ キラキラ（文章強化）返信提案💡機能**この3つ- に絶対に影響がないように修復する。何度も確認してこの3つは絶対、エラーを出さないでください。
- 「設定\プロンプト設定\電球（インスピレーション）プロンプト」の内容で返信内容を提案- 返信提案機能（user-inspiration API）
- ✅ 全AIモデルの安定動作
- ✅ フォールバックシステムの確実な動作

---

## 10. 付録: 代表的依存呼び出し図（簡易）提案💡機能**
- 「設定\プロンプト設定\✨ キラキラ（文章強化）プロンプト」のプロンプトでメッセージ入力欄に入力された{{user}}のテキストを拡張して文章強化する**文章強化機能✨** 
- プロンプトの変更、設定以外からのプロンプト呼び出しは絶対しない。プロンプトはこのままでもなんの問題もなく以前はなっていたの間違いなく他です他を疑ってください。

修復する前に必ず本ファイルを確認
C:\script\ai-chat\PROJECT_OVERVIEW_AND_DEPENDENCIES.md
毎回確認して依存の重複などを防ぐ
-ジェミニはGemini API 経由を優先その他のモデルはopenRouter API を経由しGemini APIが経由できなかったときはGeminiもこちらを経由 
-openRouter API keyはデプロイするとセキュリティがかかるからVercelからの環境変数と設定への直接の手入力のみでキーを入れる。


- トラッカーの情報がキャラクターの返信に関連付けられているか
- そのトラッカーの情報はチャットにより順次変動するようになっているか?
- 変動した数値はチャット欄の上部に,表示されているトラッカーの情報にちゃんと反映され順次更新されているか
最終更新: 2025-08-07

本ドキュメントは以下2ファイルの内容を統合し、現行プロジェクト実態と整合するよう矛盾点を解消した最新版です。
- _project_overview.md（プロジェクト構造・機能概要）
- PROJECT_DEPENDENCY_MAP.md（依存マップ・関数フロー）

統合ポリシー
- 現行の実装（src/lib/…、src/app/api/…、components/…）を基準に整合。
- 既存ドキュメントの記述が現実と異なる場合は、実装に合わせて修正。
- 今後の拡張や課題は「今後の拡張/課題」に集約。

---

## 1. プロジェクト概要

- フレームワーク: Next.js 15.3.4（App Router）
- 言語: TypeScript 5.0
- UI: React 19 + Tailwind CSS 3.4.17
- 状態管理: Zustand
- 画像生成: Runware API / Stable Diffusion / ローカルSD
- 音声: VoiceVox（ローカル）/ ElevenLabs（オプション）
- AI: Google Gemini（@google/generative-ai SDK）/ OpenRouter 経由各モデル
- 認証/同期: Supabase（将来的に本格利用予定、現状はテーブル未作成）

起動
- npm run dev（3004番ポート）

---

## 2. ディレクトリ構造（実態）

ルート
- package.json / tsconfig.json / next.config.ts / tailwind.config.mjs / .env.local
- PROJECT_REFERENCE.md（全体解説）
- PROJECT_DEPENDENCY_MAP.md（旧：依存マップ設計図）
- 本書（PROJECT_OVERVIEW_AND_DEPENDENCIES.md）

src/app（App Router）
- page.tsx（メインチャットUI）
- characters/page.tsx（キャラクター管理）
- personas/page.tsx（ペルソナ管理）
- settings/page.tsx（設定）
- history/page.tsx（履歴）
- auth/**（認証: callbackページ等）
- api/**（API Routes）
  - simple-chat/route.ts（メインチャットAPI）
  - generate-image/route.ts（画像生成API）
  - user-inspiration/route.ts（返信サポート）
  - enhance-text/route.ts（文章強化）
  - list-characters/route.ts（キャラ一覧）
  - list-personas/route.ts（ペルソナ一覧）
  - voicevox/route.ts / voicevox-proxy/route.ts（音声）
  - export-data/route.ts / save-background/route.ts / summarize-chat/route.ts
  - test-gemini/route.ts / test/route.ts（検証用）

components（UI群）
- SettingsModal.tsx / QuickSettingsModal.tsx / CharacterModal.tsx / PersonaModal.tsx / AuthModal.tsx / ThemeModal.tsx / VoiceControls.tsx / …
- CharacterSelector.tsx / CharacterGallery.tsx / CharacterImportExport.tsx / CharacterTracker.tsx / TrackerEditor.tsx
- UserInspirationModal.tsx / EnhancedImpressionModal.tsx / ChatSummaryModal.tsx / MemoModal.tsx / MemoListModal.tsx
- DataBackup.tsx / BackupControls.tsx / ChatHistoryGallery.tsx
- Live2DAvatar.tsx / MobileHelper.tsx / ChatMemoProvider.tsx / ThemeInitializer.tsx
- settings/*（Model設定、API設定など）

lib（ユーティリティ/ラッパ/同期）
- geminiApiManager.ts（Gemini優先＋OpenRouterフォールバック）
- openRouter.ts（OpenRouterチャットラッパ）
- runwareApi.ts / stableDiffusionApi.ts（画像生成）
- geminiApi.ts（Gemini補助）
- characterLoader.ts / autoLoader.ts / historyManager.ts / memoryManager.ts
- imagePromptGenerator.ts / imageCompressor.ts
- voiceManager.ts / voicevoxManager.ts
- supabase.ts / cloudSyncManager.ts / *CloudSync.ts（characters/personas/memos/settings）
- backgroundManager.ts / touchGestures.ts / themes.ts
- defaultSystemPrompt.ts / markdown.ts / uuidPolyfill.ts

stores
- chatStore.ts（グローバル状態）

types
- app.ts（アプリ設定）
- character.ts（キャラクター）
- replicate.d.ts

public
- characters/*.json（キャラクターデータ）
- personas/*.json（ペルソナ）
- backgrounds/*（背景）
- assets（icons、manifestなど）

---

## 3. 依存関係（モジュール単位）

UI（src/app/page.tsx）
- 依存: components/*、stores/chatStore、lib/*（characterLoader, historyManager, voiceManager, backgroundManager, autoLoader, touchGestures, uuidPolyfill）など
- 送信フロー: fetch('/api/simple-chat') → 応答描画/音声 → 必要に応じて要約/印象/画像生成等のAPI

API
- /api/simple-chat → lib/geminiApiManager（Gemini SDK → OpenRouterフォールバック）/ lib/openRouter
- /api/generate-image → lib/runwareApi優先 → 失敗時 stableDiffusionApi → さらにローカルSD
- /api/user-inspiration（返信候補）/ /api/enhance-text（文章強化）
- /api/list-characters / /api/list-personas
- /api/voicevox / /api/voicevox-proxy
- /api/test-gemini / /api/test

GeminiApiManager（lib/geminiApiManager.ts）
- @google/generative-ai を使用。generateContent結果が空文字の場合、candidates[0].content.parts から連結してフォールバック抽出を実装済み（空応答対策）。
- OpenRouterフォールバックは google/gemini-* モデル名の整形を考慮。

画像生成
- RunwareService.generateImage（成功時: URL/UUID）
- 失敗 → StableDiffusionService.generateImage（成功時: base64）
- さらにローカルSDへフォールバック（/sdapi/v1/txt2img）

クラウド同期（将来本実装）
- cloudSyncManager.ts → *CloudSync.ts → supabase.ts（@supabase/supabase-js）
- 現状はテーブル未作成のため 404/42P01 となる想定。テーブル・RLS・ポリシー要設定。

---

## 4. 関数フロー（要点）

/api/simple-chat
1) リクエスト解析（message/settings/character/persona/memos/trackers）
2) CharacterLoader でキャラ取得
3) DEFAULT_SYSTEM_PROMPT + キャラ/メモ/ペルソナ/トラッカー/指示 → プロンプト構築
4) GeminiApiManager.generateWithPriority（Gemini優先、失敗でOpenRouter）※空応答対策あり
5) 応答をJSON返却

/ api/generate-image
1) リクエスト解析（prompt, character, negativePrompt, settings）
2) character.appearancePrompt/NegativePrompt を先頭にマージ（重複防止）
3) Runware → 失敗時 Stable Diffusion → さらに local SD
4) 画像URLまたはデータURLを返却（失敗時は必ずJSONエラーを返す）

/ api/user-inspiration, / api/enhance-text
- いずれも GeminiApiManager.generateWithPriority を使用
- モデル名の扱いに注意（string以外が来た場合に備え、isGeminiModel で防御済み）

---

## 5. 実装とドキュメントの矛盾点（修正済み）

1) 「AIモデルのバージョンは app/lib/api/client.ts で厳密管理」との記述（旧ポリシー）
- 実態: lib/openRouter.ts と src/config/model-config.ts 側で運用中。client.ts の集中管理は存在しない。
- 修正: モデル管理は現状の分散管理（openRouter.ts と model-config.ts）に合わせて記載。将来、集中管理に統合する余地がある旨を注記。

2) /api/chat/route.ts の有無・利用箇所の表現
- 実態: /api/simple-chat/route.ts がメイン。/api/chat/route.ts は存在する可能性があるが、現状メインは simple-chat。
- 修正: メインチャットAPIは simple-chat と明記。chat/route.ts はテスト/補助用途として記載を控えめに。

3) Supabase 同期の現状
- 旧: 同期実装前提の記述
- 実態: テーブル未作成で 404/42P01 が想定される。将来実装予定。
- 修正: 「将来実装。現状は未作成でエラー想定」と明記。

4) Gemini 空応答時の挙動
- 旧: 記載なし
- 実態: 応答が空のケースがあり、フォールバック抽出を実装済み。
- 修正: フォールバック抽出の導入とログ強化を反映。

5) 画像生成エラー時のレスポンス
- 旧: 例外スローによりレスポンス欠落の可能性
- 実態: route.ts を修正し、全分岐で JSON を返す方針へ是正。
- 修正: その方針を本文に反映。

---

## 6. トークン使用量の目安（現行設定の概算）

- プロンプト: キャラ定義/システム/履歴3-4発言/ユーザー入力 → 約 1,200〜2,200 tokens
- 出力: maxTokens 800〜1000 設定が多く、1応答 600〜900 tokens 前後（短い場合は200台、描写多めで1000に近づく）
- 合計（プロンプト+出力）: 概ね 2,000〜3,200 tokens

必要に応じて simple-chat APIにプロンプト長・推定トークン数のログを追加して実測可視化可能。

---

## 7. 型/設定/注意点

- 型: types/app.ts / types/character.ts を参照。UI/Lib/API で整合を取る。
- 設定: SettingsModal.tsx と stores/chatStore.ts の整合に注意（UI項目の増減時は型/状態更新）
- 環境変数: .env.local 前提。OpenRouter/Gemini/Runware/StableDiffusion/VoiceVox 等はキーまたはURLで切替。
- ファイル命名: public/characters の一部ファイル名にtypoがある（例: -claud.json, -clau.json）。読み込み側で存在しないIDを参照しないように注意（実装上はファイル名スキャンなので致命ではないが運用上は修正推奨）。

---

## 8. 既知の課題・改善方針

- Supabase 同期
  - まずテーブル作成とRLSポリシー設定（characters/personas/memos/settings）
  - *CloudSync.ts のCRUDとクラウド/ローカル解決ポリシーを明確化
- モデル管理の集中
  - openRouter.ts と model-config.ts の役割を整理し、1箇所へ集約検討
- セッション復元とキャラ固定
  - 復元直後のキャラ固定ガード追加（クライアント）/ API側で clientProvidedCharacter の優先適用（サーバ）
- ESLint any の解消（lib/geminiApiManager.ts）
  - parts型/options型などに適切な型付けを追加

## 9. 最新の修正履歴（2025-08-07）

### 修正完了項目
- **503 Service Unavailable エラー解決**
  - GeminiApiManager.generateWithPriority システム実装
  - Gemini API直接呼び出し → 失敗時OpenRouterフォールバック
  - 全てのモデルタイプ（Gemini、Claude、GPT、Qwen等）に対応

- **user-inspiration機能の内容表示問題解決**
  - カテゴリタイトルのみ表示される問題を修正
  - 候補抽出ロジック改善（`^\d+\.`番号形式と`\[.*?\]`ブラケット形式の両方対応）
  - デバッグログ追加でAIレスポンス内容の確認可能

- **TypeScript型安全性向上**
  - GenerationOptionsインターface追加
  - エラーハンドリングの改善
  - lib/geminiApiManager.ts の重複コード除去

### 動作確認済み機能
- ✅ チャット機能（simple-chat API）
- ✅ 文章強化機能（enhance-text API）
- ✅ 返信提案機能（user-inspiration API）
- ✅ 全AIモデルの安定動作
- ✅ フォールバックシステムの確実な動作

---

## 9. 付録: 代表的依存呼び出し図（簡易）

page.tsx
  ├─ components/*（多数, dynamic import含む）
  ├─ stores/chatStore
  ├─ lib/characterLoader, historyManager, voiceManager, backgroundManager, autoLoader
  └─ fetch → /api/simple-chat | /api/generate-image | /api/enhance-text | /api/user-inspiration | /api/summarize-chat

/api/simple-chat
  └─ lib/geminiApiManager → @google/generative-ai | openRouter.ts

/api/generate-image
  └─ lib/runwareApi → 失敗時 lib/stableDiffusionApi → 更に local SD

クラウド同期（将来）
  components/AuthModal → lib/cloudSyncManager → *CloudSync.ts → lib/supabase

---

この統合ドキュメントを今後の単一の参照元とし、変更時は本書を更新する運用に切り替えてください。
