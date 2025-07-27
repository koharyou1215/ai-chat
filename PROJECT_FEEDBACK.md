# AI Chat プロジェクト - フィードバック記録

## 📝 フィードバック記録の目的

このファイルは、プロジェクト開発中に発生した問題、解決策、学んだ教訓を記録し、今後の開発に活かすためのものです。

## 🔄 記録ルール

### 記録すべき内容
- **機能追加時**: 何を追加したか、どのような問題が発生したか、どう解決したか
- **エラー発生時**: エラーの内容、原因、解決方法、再発防止策
- **設定変更時**: 変更内容、影響範囲、結果
- **デプロイ時**: 成功/失敗、問題点、改善点

### 記録形式
```markdown
## [日付] [カテゴリ] [タイトル]

### 概要
- 何が起こったか

### 詳細
- 具体的な問題や変更内容

### 解決方法
- どのように解決したか

### 学んだ教訓
- 今後に活かせる教訓

### 関連ファイル
- 変更したファイル一覧

### ステータス
- [ ] 完了
- [ ] 進行中
- [ ] 保留
```

---

## 📋 フィードバック記録

### 2025年7月24日 - OpenRouter API認証エラー修正

#### 概要
- OpenRouter APIで401認証エラーが発生
- APIキーは正しい形式だが認証に失敗

#### 詳細
- エラー: `OpenRouter API error: 401 {"error":{"message":"No auth credentials found","code":401}}`
- APIキー形式: `sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- 環境変数は正しく設定済み

#### 解決方法
- `lib/openRouter.ts`のHTTPヘッダーを修正
- `HTTP-Referer` → `Referer`に変更
- `X-Title`ヘッダーを追加
- `User-Agent`ヘッダーを追加
- デフォルト`Referer`URLを設定

#### 学んだ教訓
- OpenRouter APIは認証ヘッダーの形式が厳密
- `HTTP-Referer`は正しくない、`Referer`が正しい
- 認証エラー時はヘッダー形式を確認する

#### 関連ファイル
- `lib/openRouter.ts`
- `src/app/api/simple-chat/route.ts`

#### ステータス
- [x] 完了

---

### 2025年7月24日 - チャット停止問題の修正

#### 概要
- チャットが途中で止まる、新チャットを求める問題が発生

#### 詳細
- インスピレーション機能で複数候補生成時にローディング状態が正しく管理されていない
- 空のAIメッセージが残ってしまう

#### 解決方法
- `src/app/page.tsx`の`chatResponse`処理を修正
- 複数候補生成時は`setIsLoading(false)`を設定
- 空のAIメッセージを削除する処理を追加

#### 学んだ教訓
- インスピレーション機能の状態管理が複雑
- ローディング状態の管理は慎重に行う必要がある
- 空のメッセージが残るとUXが悪くなる

#### 関連ファイル
- `src/app/page.tsx`

#### ステータス
- [x] 完了

---

### 2025年7月24日 - プロジェクトルール参照機能の追加

#### 概要
- プロジェクト全体の理解を助けるルール参照機能を追加

#### 詳細
- Cursorの設定画面でプロジェクトルールを設定
- アプリケーションの設定画面にルール参照機能を追加
- `PROJECT_REFERENCE.md`の重要性を強調

#### 解決方法
- `.cursorrules`ファイルを作成・更新
- `components/SettingsModal.tsx`にプロジェクトルールセクションを追加
- プロジェクト全体理解の重要性を強調

#### 学んだ教訓
- プロジェクト全体の理解が重要
- 重複機能の実装を防ぐ仕組みが必要
- 段階的な開発フローが効果的

#### 関連ファイル
- `.cursorrules`
- `components/SettingsModal.tsx`
- `PROJECT_REFERENCE.md`

#### ステータス
- [x] 完了

---

### 2025年7月24日 - 型定義エラーの修正

#### 概要
- `inspirationMaxTokens`プロパティの型定義エラーが発生

#### 詳細
- エラー: `Property 'inspirationMaxTokens' does not exist on type 'AppSettings'`
- 新しいプロパティが型定義に追加されていない

#### 解決方法
- `types/character.ts`の`AppSettings`インターフェースに`inspirationMaxTokens?: number;`を追加

#### 学んだ教訓
- 新しいプロパティを使用する前に型定義を更新する必要がある
- TypeScriptの型安全性は重要

#### 関連ファイル
- `types/character.ts`

#### ステータス
- [x] 完了

---

## 🎯 今後の改善点

### 1. 自動化
- フィードバック記録を自動化する仕組みの検討
- エラー発生時の自動記録

### 2. 分類・検索
- カテゴリ別の整理
- 検索機能の追加

### 3. 統計・分析
- エラー発生頻度の分析
- 解決時間の統計

---

---

### 2025年7月24日 - Failed to fetch エラーの修正

#### 概要
- `handleRegenerate`関数で「Failed to fetch」エラーが発生
- エラーハンドリングが不十分で、具体的な問題が特定できない

#### 詳細
- エラー: `Error: Failed to fetch` (Call Stack: handleRegenerate)
- APIリクエストの失敗時に適切なエラーメッセージが表示されない
- ネットワークエラーやAPIエラーの詳細が不明

#### 解決方法
- `src/app/page.tsx`の`handleRegenerate`関数に詳細なログ出力を追加
- APIレスポンスの状態チェックを強化
- エラー時のフォールバックメッセージを追加
- `src/app/api/simple-chat/route.ts`のリクエストボディ解析エラーハンドリングを改善
- `lib/openRouter.ts`のエラーハンドリングを強化

#### 学んだ教訓
- エラーハンドリングは段階的に行う必要がある
- ログ出力は問題特定に重要
- ユーザーには分かりやすいエラーメッセージを表示する
- APIエラーの詳細情報を取得する仕組みが必要

#### 関連ファイル
- `src/app/page.tsx`
- `src/app/api/simple-chat/route.ts`
- `lib/openRouter.ts`

#### ステータス
- [x] 完了

---

---

### 2025年7月24日 - 画像生成APIとOpenRouter APIエラーの修正

#### 概要
- 画像生成APIで`t.trim is not a function`エラーが発生
- OpenRouter APIで応答にcontentが含まれていないエラーが発生

#### 詳細
- エラー1: `TypeError: t.trim is not a function` (画像生成API)
- エラー2: `OpenRouter 応答に content が含まれていません` (チャットAPI)
- 画像生成APIでpromptパラメータの型チェックが不十分
- OpenRouter APIのレスポンス検証が不十分

#### 解決方法
- `src/app/api/generate-image/route.ts`でpromptパラメータの型チェックと変換を追加
- `lib/openRouter.ts`でAPIレスポンスの詳細ログ出力を追加
- `src/app/api/simple-chat/route.ts`で候補生成の検証を強化
- エラーメッセージをより詳細に改善

#### 学んだ教訓
- APIパラメータの型チェックは重要
- 外部APIのレスポンス検証は必須
- 詳細なログ出力が問題特定に不可欠
- エラーハンドリングは段階的に行う必要がある

#### 関連ファイル
- `src/app/api/generate-image/route.ts`
- `lib/openRouter.ts`
- `src/app/api/simple-chat/route.ts`
- `src/app/page.tsx`

#### ステータス
- [x] 完了

---

---

### 2025年7月24日 - 画像生成とOpenRouter APIエラーの詳細修正

#### 概要
- 画像生成APIでローカルStable DiffusionのURL設定エラーが発生
- OpenRouter APIで応答にcontentが含まれていない問題が継続

#### 詳細
- エラー1: `getaddrinfo ENOTFOUND your-sd.example.com` (ローカルSD URLがデフォルト値のまま)
- エラー2: `OpenRouter 応答に content が含まれていません` (APIレスポンスの詳細不明)
- 画像生成テストでエラーハンドリングが不十分
- OpenRouter APIのレスポンス検証が不十分

#### 解決方法
- `src/app/api/generate-image/route.ts`でローカルSD URLの検証を強化
- `lib/openRouter.ts`でAPIレスポンスの詳細ログ出力を改善
- `src/app/api/simple-chat/route.ts`でOpenRouter API呼び出しの詳細ログを追加
- `src/app/page.tsx`で画像生成テストのエラーハンドリングを強化

#### 学んだ教訓
- デフォルト値のURLは実際のエンドポイントに変更する必要がある
- APIレスポンスの詳細ログが問題特定に不可欠
- 段階的なエラーハンドリングが重要
- テスト機能のエラーハンドリングも重要

#### 関連ファイル
- `src/app/api/generate-image/route.ts`
- `lib/openRouter.ts`
- `src/app/api/simple-chat/route.ts`
- `src/app/page.tsx`

#### ステータス
- [x] 完了

---

---

### 2025年7月24日 - キャラクター個別壁紙機能の実装

#### 概要
- キャラクター個別の壁紙設定機能を実装
- キャラクター変更時に背景が自動適用される機能を追加

#### 詳細
- キャラクター変更時に個別背景が適用されない問題
- キャラクター編集画面で背景設定のUIが不十分
- キャラクター削除時の背景処理が不適切

#### 解決方法
- `src/app/page.tsx`でキャラクター変更時の背景自動適用機能を追加
- キャラクター削除時の代替キャラクター背景適用機能を追加
- `components/CharacterModal.tsx`で背景設定UIを追加
- 背景URLの入力フィールドとプレビュー機能を実装

#### 学んだ教訓
- キャラクター変更時のUI状態管理が重要
- 背景設定はユーザビリティを考慮したUI設計が必要
- 動的インポートによるテーマ管理の効果的な活用

#### 関連ファイル
- `src/app/page.tsx`
- `components/CharacterModal.tsx`
- `lib/themes.ts`

#### ステータス
- [x] 完了

---

### 2025年7月24日 - キャラクター背景ファイルアップロード機能の実装

#### 概要
- キャラクター編集画面にファイルアップロード機能を追加
- URL入力とファイルアップロードの両方に対応
- 画像・動画ファイルの自動圧縮とプレビュー機能

#### 詳細
- 背景設定がURL入力のみで、ファイルアップロードができない
- 画像ファイルの圧縮機能が活用されていない
- プレビュー機能が不十分

#### 解決方法
- `components/CharacterModal.tsx`にファイルアップロードUIを追加
- `ImageCompressor`クラスを使用した画像圧縮機能を実装
- ファイルサイズ制限（10MB）と形式チェックを追加
- 画像・動画のプレビュー機能を実装
- Base64形式での保存に対応

#### 学んだ教訓
- ファイルアップロード機能はユーザビリティ向上に重要
- 画像圧縮はパフォーマンス向上に不可欠
- 適切なバリデーションがユーザー体験を向上させる
- プレビュー機能は設定内容の確認に重要

#### 関連ファイル
- `components/CharacterModal.tsx`
- `lib/imageCompressor.ts`

#### ステータス
- [x] 完了

---

### 2025年7月24日 - 電球・キラキラマークのプロンプト設定機能実装

#### 概要
- 電球マーク（💡）とキラキラマーク（✨）のプロンプトを設定画面で管理できる機能を実装
- ユーザーがカスタマイズ可能なプロンプト設定を追加

#### 詳細
- 電球マーク（インスピレーション機能）のプロンプトがハードコードされている
- キラキラマーク（文章強化機能）のプロンプトがハードコードされている
- 設定画面でプロンプトをカスタマイズできない

#### 解決方法
- `components/SettingsModal.tsx`にプロンプト設定項目を追加
  - 💡 インスピレーションプロンプト設定
  - ✨ 文章強化プロンプト設定
  - インスピレーション用トークン数設定
- `src/app/api/user-inspiration/route.ts`で設定画面のプロンプトを使用
- `src/app/api/enhance-text/route.ts`で設定画面のプロンプトを使用
- デフォルトプロンプトをフォールバックとして設定

#### 学んだ教訓
- プロンプトのカスタマイズ機能はユーザビリティ向上に重要
- 設定画面での管理により、ユーザーが自由に調整可能
- デフォルトプロンプトのフォールバック機能が重要
- 型定義の事前準備が実装をスムーズにする

#### 関連ファイル
- `components/SettingsModal.tsx`
- `src/app/api/user-inspiration/route.ts`
- `src/app/api/enhance-text/route.ts`
- `stores/chatStore.ts`

#### ステータス
- [x] 完了

---

**最終更新**: 2025年7月24日
**記録者**: AI Assistant 

## 2025年7月24日 - 設定画面プロンプト重複、背景画像反映、キャラクター関連問題の修正

### 問題
1. **設定画面のプロンプト設定の重複**: 2つのプロンプト設定欄があり、下の2つは気にしなくていいかどうか
2. **背景画像が反映されていない**: キャラクターの背景設定がチャット画面に反映されていない
3. **キャラクター関連の問題**: キャラクターが自動的に読み込まれない、手動でアップロードする画面に行けない

### 解決策

#### 1. 設定画面のプロンプト設定の重複
**確認結果**: 設定画面には2つのプロンプト設定欄がありますが、これらは異なる機能用です：
- 💡 インスピレーションプロンプト（電球マーク）
- ✨ 文章強化プロンプト（キラキラマーク）

**解決策**: 下の2つ（インスピレーション用トークン数）は気にしなくて大丈夫です。これは電球マーク機能の詳細設定です。

#### 2. 背景画像が反映されていない
**原因**: キャラクター選択時に`handleThemeChange`が呼ばれていない

**修正内容**:
- `src/app/page.tsx`の`onSelectCharacter`で`handleThemeChange(settings.currentTheme || 'default', character.background)`を呼び出すように修正
- キャラクター削除時の代替キャラクター選択時も同様に修正
- キャラクターがなくなった場合のデフォルトテーマ適用も修正

#### 3. キャラクター関連の問題
**原因**: `CharacterGallery`コンポーネントが正しく使用されていない

**修正内容**:
- `src/app/page.tsx`に`CharacterGallery`モーダルを追加
- 設定画面に「キャラクターギャラリー」ボタンを追加
- `CharacterGallery`の各アクション（選択、追加、編集、削除）を適切に実装
- 背景画像の適用も`CharacterGallery`内で正しく動作するように修正

### 学んだ教訓
- キャラクター選択時は必ず背景画像の適用処理を呼び出す
- モーダルコンポーネントは適切なプロパティとアクションハンドラーを設定する
- 設定画面の機能説明を明確にする

### 関連ファイル
- `src/app/page.tsx` - キャラクター選択処理と背景適用の修正
- `components/CharacterGallery.tsx` - キャラクターギャラリーコンポーネント
- `components/SettingsModal.tsx` - 設定画面のプロンプト設定

---

## 2025年7月24日 - チャット履歴管理とコンテキスト制限の改善

### 問題
- チャットの返信が過去の履歴を全部使って返信を作成している
- 聞いていないことも以前聞いたことの返信をしてくる
- これにより「あれ？」という混乱が生じている

### 原因
1. **履歴サイズが小さすぎる**: `settings?.historySize || 4`で4件しか履歴を保持していない
2. **履歴フィルタリングが不適切**: 長いメッセージ（250文字以上）を除外している
3. **コンテキスト制限が不十分**: プロンプトが30,000文字を超えるまで履歴を削除しない

### 解決策

#### 1. 履歴サイズの適切な設定
- デフォルト履歴サイズを4件から8件に増加
- `src/app/api/simple-chat/route.ts`で`settings?.historySize || 8`に変更
- `stores/chatStore.ts`で`historySize: 8`に変更
- `src/app/page.tsx`の両方の履歴制限箇所で8件に統一

#### 2. 履歴フィルタリングの改善
- 長いメッセージの除外ではなく、要約（500文字で切り詰め）に変更
- すべてのメッセージを保持しつつ、長すぎるものは要約してコンテキストを維持

#### 3. コンテキスト制限の強化
- プロンプト長制限を30,000文字から15,000文字に削減
- より厳しい制限により、AIが最新の会話に集中できるように改善

#### 4. 型定義の修正
- `stores/chatStore.ts`の型エラーを修正
- `enableJailbreak` → `jailbreakPromptEnabled`
- `enableSystemPrompt` → `systemPromptEnabled`
- `model` → `usedModel`
- `chatNotificationSound` → `chatCompletionSound`
- 不要なプロパティ（`customBackground`, `provider`）を削除

### 学んだ教訓
- 履歴サイズは小さすぎても大きすぎても問題が発生する
- 長いメッセージの除外ではなく要約が効果的
- プロンプト長制限は厳しすぎず緩すぎずが重要
- 型定義と実装の整合性を保つことが重要

### 関連ファイル
- `src/app/api/simple-chat/route.ts` - 履歴管理とコンテキスト制限の修正
- `stores/chatStore.ts` - デフォルト設定と型定義の修正
- `src/app/page.tsx` - フロントエンド側の履歴制限修正
- `types/character.ts` - 型定義の確認

--- 

# プロジェクトフィードバック記録

## 2025年1月27日 - 電球マーク機能の修正

### 問題
ユーザーが電球マーク（💡）を押すと「もう少し詳しく教えてください」というメッセージが表示される問題が発生。ユーザーは電球マークを「AIが自ら返信を生成する」機能として期待していたが、実際は「ユーザーの返信候補を提案する」機能として実装されていた。

### 原因
1. 電球マークの機能が「ユーザーの返信候補を提案」する設計になっていた
2. APIからの応答がJSON形式でない場合のフォールバックメッセージとして「もう少し詳しく教えてください」が設定されていた
3. フロントエンドで生成された候補をメッセージ欄に設定するだけで、実際のチャットには送信していなかった

### 修正内容

#### 1. API側の修正（`src/app/api/user-inspiration/route.ts`）
- プロンプトを「AIが自ら返信を生成する」機能に変更
- JSON形式での応答を期待せず、直接的な返信として扱うように修正
- フォールバックメッセージを「会話の流れを理解できませんでした。もう一度お聞かせください。」に変更

#### 2. フロントエンド側の修正（`src/app/page.tsx`）
- `handleUserInspiration`関数を修正し、生成された返信を直接チャットに送信するように変更
- メッセージ欄に設定するのではなく、AIの返信として`messages`に追加

#### 3. 設定画面の修正（`components/SettingsModal.tsx`）
- 電球マークの機能説明を「返信候補を生成」から「AIが自ら返信を生成」に変更

#### 4. デフォルトプロンプトの修正（`stores/chatStore.ts`）
- `inspirationPrompt`のデフォルト値を「AIが自ら返信を生成する」機能に適した内容に変更

### 結果
- 電球マークを押すと、AIが自ら適切な返信を生成してチャットに送信されるようになった
- 「もう少し詳しく教えてください」という不適切なメッセージが表示されなくなった
- ユーザーの期待する機能と実際の動作が一致した

### 学んだ教訓
- 機能の設計意図とユーザーの期待を事前に確認することが重要
- フォールバックメッセージは機能の目的に合致した内容にする必要がある
- UIの説明文は機能の実際の動作と一致させる必要がある

---

## 2025年1月27日 - チャット履歴管理とコンテキスト制限の改善

### 問題
チャットの返信が過去の履歴を全部使ってしまい、聞いていないことまで返答してしまう問題が発生。AIが「あれ？」と混乱するような不適切な返答をしていた。

### 原因
1. 履歴サイズが小さすぎる（4件）
2. 履歴フィルタリングが不適切（長いメッセージを除外）
3. コンテキスト制限が不十分（プロンプトが長すぎる）

### 修正内容

#### 1. 履歴サイズの調整（`src/app/api/simple-chat/route.ts`）
- デフォルト履歴サイズを4件から8件に増加
- 履歴フィルタリングを改善：長いメッセージの除外ではなく要約（500文字で切り詰め）に変更

#### 2. コンテキスト制限の強化
- プロンプト長制限を30,000文字から15,000文字に削減
- 型定義の修正：`msg.role`を明示的にキャスト

#### 3. 設定の同期（`stores/chatStore.ts`）
- `defaultSettings.historySize`を6から8に更新
- `AppSettings`の型定義と実装の整合性を修正

#### 4. フロントエンド側の修正（`src/app/page.tsx`）
- `handleSend`と`handleRegenerate`での履歴制限を`-(settings.historySize || 8)`に統一

### 結果
- AIが最新の会話に焦点を当てた適切な返答をするようになった
- 過去の履歴を適切に活用しつつ、最新の会話に集中できるようになった
- ユーザーの「あれ？」という混乱が解消された

### 学んだ教訓
- 履歴サイズは8件が適切なバランス
- 長いメッセージの要約により、コンテキストを保持しつつ適切な長さに制限
- プロンプト長制限の強化により、AIが最新の会話に集中できる

---

## 2025年1月27日 - 設定画面プロンプト重複、背景画像反映、キャラクター関連問題の修正

### 問題
1. 設定画面にプロンプトを書くところが2つになった
2. 背景画像が反映されていない
3. キャラクターは自動的に読み込まれない
4. 手動でアップロードする画面にも行けない

### 修正内容

#### 1. プロンプト設定の明確化
- 設定画面の説明文を更新し、電球マークとキラキラマークの機能を明確化
- デフォルトプロンプトは既に存在し、設定画面でカスタマイズ可能であることを確認

#### 2. 背景画像反映の修正（`src/app/page.tsx`）
- `onSelectCharacter`で`handleThemeChange`を呼び出して背景を適用
- キャラクター削除後の背景リセット処理を修正

#### 3. キャラクター関連機能の復旧
- `CharacterGallery`モーダルを再統合
- 設定タブにキャラクターギャラリーボタンを追加
- キャラクターの自動読み込みは`initializeApp`で処理されていることを確認

### 結果
- 設定画面のプロンプト設定が明確になった
- 背景画像がキャラクター変更時に適切に反映されるようになった
- キャラクターギャラリーにアクセスできるようになった

---

## 2025年1月27日 - 電球マークとキラキラマークのプロンプト設定機能追加

### 実装内容

#### 1. 設定画面へのプロンプト設定項目追加（`components/SettingsModal.tsx`）
- 電球マーク（💡）用のプロンプト設定
- キラキラマーク（✨）用のプロンプト設定
- インスピレーション用トークン数設定

#### 2. API側のプロンプトカスタマイズ対応
- `/api/user-inspiration/route.ts`: 設定画面のプロンプトを優先使用
- `/api/enhance-text/route.ts`: 設定画面のプロンプトを優先使用

#### 3. 型定義の更新（`types/character.ts`）
- `AppSettings`に`inspirationPrompt`、`enhancementPrompt`、`inspirationMaxTokens`を追加

#### 4. デフォルト設定の更新（`stores/chatStore.ts`）
- 既存のデフォルトプロンプトを設定画面で表示・編集可能に

### 結果
- ユーザーが電球マークとキラキラマークの動作をカスタマイズできるようになった
- デフォルトプロンプトは既に存在し、設定画面で確認・編集可能

---

## 2025年1月27日 - キャラクター個別背景設定機能の実装

### 実装内容

#### 1. キャラクター型定義の更新（`types/character.ts`）
- `Character`インターフェースに`background?: string`プロパティを追加

#### 2. キャラクター編集画面の拡張（`components/CharacterModal.tsx`）
- 背景URL入力フィールドの追加
- ファイルアップロード機能の追加（画像・動画対応）
- 画像圧縮機能の統合

#### 3. 背景適用機能の実装（`src/app/page.tsx`）
- キャラクター選択時の背景自動適用
- キャラクター削除時の背景リセット

#### 4. 画像圧縮機能（`lib/imageCompressor.ts`）
- クライアントサイドでの画像圧縮
- ファイルサイズ制限（10MB）
- Base64エンコーディング

### 結果
- キャラクターごとに個別の背景を設定可能
- URLとファイルアップロードの両方に対応
- キャラクター変更時に自動的に背景が反映される

---

## 2025年1月27日 - OpenRouter API関連のエラー修正

### 問題
1. `OpenRouter 応答に content が含まれていません`エラー
2. ハードコードされた`HTTP-Referer`と`X-Title`の値
3. 環境変数の動的処理に関する質問

### 修正内容

#### 1. OpenRouter API エラーハンドリングの改善（`lib/openRouter.ts`）
- レスポンスの詳細なログ出力
- エラーメッセージの改善
- `HTTP-Referer`のフォールバックURL更新
- `X-Title`を環境変数から動的に取得

#### 2. API レスポンス検証の強化（`src/app/api/simple-chat/route.ts`）
- `candidates`配列の空チェック
- 複数候補生成の詳細ログ
- フォールバック処理の改善

#### 3. 環境変数の動的処理
- `OPENROUTER_TITLE`環境変数の活用
- `HTTP-Referer`の自動更新対応

### 結果
- OpenRouter APIエラーの詳細な診断が可能
- 環境変数による動的な設定が可能
- APIレスポンスの信頼性が向上

---

## 2025年1月27日 - 画像生成API エラー修正

### 問題
1. `TypeError: t.trim is not a function`エラー
2. ローカル安定拡散のホスト名解決エラー

### 修正内容

#### 1. プロンプト型チェックの追加（`src/app/api/generate-image/route.ts`）
- `prompt`パラメータの型検証
- 文字列変換処理の追加

#### 2. ローカル安定拡散URL検証の強化
- `example.com`を含むURLの除外
- 無効なURLへの接続試行を防止

### 結果
- 画像生成APIの安定性が向上
- 無効なURLへの接続エラーを防止

---

## 2025年1月27日 - 初期エラー修正

### 問題
`Error: Failed to fetch`エラーが`handleRegenerate`で発生

### 修正内容

#### 1. エラーハンドリングの強化（`src/app/page.tsx`）
- `handleRegenerate`関数に詳細なログ出力を追加
- `chatResponse.ok`チェックの改善
- フォールバックエラーレスポンスの実装

#### 2. API リクエスト処理の改善（`src/app/api/simple-chat/route.ts`）
- JSONパースエラーのハンドリング
- リクエストボディの検証強化

#### 3. OpenRouter API エラーハンドリング（`lib/openRouter.ts`）
- レスポンステキストの読み取り
- 詳細なエラーログ出力

### 結果
- エラーの詳細な診断が可能
- ユーザーフレンドリーなエラーメッセージ
- API通信の信頼性が向上

---

## 2025年1月27日 - キャラクターデータ読み込み問題の修正

### 問題
- `public/characters/character/`からキャラクターデータが読み込めない
- ユーザーが「キャラクターのデータが読み込めないです」と報告

### 詳細
- キャラクターファイルは存在するが、`Character`型の定義と完全に一致していない
- `public/characters/character/`内のファイルは簡易形式（`character_definition`フィールドなし）
- `lib/autoLoader.ts`が完全形式を期待していたため読み込みに失敗

### 修正内容

#### 1. データ正規化機能の追加（`lib/autoLoader.ts`）
- `normalizeCharacterData`関数を実装
- 簡易形式のキャラクターデータを完全形式に変換
- 既存の完全形式データはそのまま保持

#### 2. 詳細ログ出力の追加
- キャラクターファイル読み込み過程の詳細ログ
- APIレスポンス状態の確認
- エラー時の詳細情報出力

#### 3. API エンドポイントの改善（`src/app/api/list-characters/route.ts`）
- ディレクトリ存在確認の詳細ログ
- ファイル一覧取得の詳細ログ

### 結果
- 簡易形式のキャラクターファイルも正常に読み込み可能
- 問題発生時の詳細な診断が可能
- キャラクターデータの互換性が向上

## 2025年1月27日 - 画像生成APIエラーの修正

### 問題
- 画像生成テストで「APIキーが設定されていません」エラーが発生
- Runware API Keyは環境変数に設定済みだが認識されない

### 詳細
- Runware APIのリクエストペイロードが配列形式でないため400エラー
- APIキーの検証ロジックで詳細なデバッグ情報が不足
- エラーハンドリングが不十分

### 修正内容

#### 1. Runware APIリクエスト形式の修正（`lib/runwareApi.ts`）
- リクエストペイロードを配列でラップ（`JSON.stringify([body])`）
- 配列レスポンスと単一オブジェクトレスポンスの両方に対応
- タスクID取得処理の改善

#### 2. エラーハンドリングの強化（`src/app/api/generate-image/route.ts`）
- Runwareエラー時の詳細ログ出力
- 全プロバイダー失敗時のデバッグ情報追加
- APIキー検証の詳細ログ

#### 3. タスクステータス取得の改善（`lib/runwareApi.ts`）
- 配列レスポンス対応
- 複数の画像フィールド形式に対応
- 詳細なログ出力

### 結果
- Runware APIの正しいリクエスト形式に対応
- エラー発生時の詳細な診断が可能
- 画像生成の成功率向上 

## 2025年1月27日 - モバイルレイアウトと背景画像修正

### 修正内容

#### 1. モバイルレイアウトの修正
- **問題**: モバイルでヘッダーが見切れ、バーガーメニューが操作できない
- **解決策**: 
  - メインコンテナに`overflow-y-auto`を追加してスクロール可能に
  - ヘッダーの`sticky`固定を解除
  - メインコンテナの`maxHeight`制限を解除
  - チャットメッセージエリアの`overflow-y-auto`を削除

#### 2. 背景画像の永続化問題
- **問題**: モバイルで背景画像が反映されない、設定画面での説明が不明確
- **解決策**:
  - `loadCharacterBackground`関数を改善し、キャラクター固有とグローバル設定の優先順位を明確化
  - 設定画面の説明を「チャット背景画像/動画URL」に変更
  - キャラクター設定画面の説明を「生い立ち・設定」と「チャット背景画像/動画URL」に分離

#### 3. 設定画面の説明改善
- **問題**: 「Background・設定」と「URLから設定」の説明が不明確
- **解決策**:
  - キャラクター設定画面: 「生い立ち・設定」と「チャット背景画像/動画URL」に分離
  - 設定画面: 「チャット背景画像/動画URL」に統一
  - プレースホルダーテキストを改善

### 技術的変更点

#### src/app/page.tsx
```diff
- className="flex h-screen relative"
+ className="flex h-screen relative overflow-y-auto"

- className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-2 md:p-4 safe-area-top flex-shrink-0 sticky top-0 z-50"
+ className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-2 md:p-4 safe-area-top flex-shrink-0"

- className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4 md:space-y-6 scroll-touch"
+ className="flex-1 p-2 md:p-4 space-y-4 md:space-y-6"
```

#### components/settings/BackupAndOtherSettings.tsx
```diff
- カスタム背景画像URL
+ チャット背景画像/動画URL

- 背景に表示する画像のURLを指定します。
+ チャット画面の背景に表示する画像または動画のURLを指定します。画像URLまたはbase64データURLが使用できます。
```

#### components/CharacterModal.tsx
```diff
- Background・設定
+ 生い立ち・設定

- URLから設定
+ チャット背景画像/動画URL
```

### 結果
- モバイルでスクロール可能になり、バーガーメニューが操作可能
- 背景画像の永続化が改善
- 設定画面の説明が明確化

### 注意点
- 背景画像はキャラクター固有設定が優先され、次にグローバル設定が適用される
- モバイルでの表示は固定ではなく、スクロール可能なレイアウトに変更
- 設定画面での説明を統一し、ユーザーの混乱を防止

## 2025年1月27日 - モバイルスクロール問題の追加修正

### 追加修正内容

#### 問題
- モバイルでメッセージ入力欄をタップしてキーボードを出した後、下にスクロールすると固定される
- バーガーメニューが見えるまでスクロールすると、そこで固定されてメッセージ入力欄が見えなくなる

#### 解決策
- メインコンテナの`h-screen`を削除し、`minHeight`のみに変更
- メインチャットエリアに`min-h-0`を追加
- メッセージ入力フォームに背景色とボーダーを追加して視認性を向上

#### 技術的変更点
```diff
- className="flex h-screen relative overflow-y-auto"
+ className="flex relative overflow-y-auto"

- style={{ height: '100vh', minHeight: '-webkit-fill-available' }}
+ style={{ minHeight: '-webkit-fill-available' }}

- className="flex-1 flex flex-col w-full md:w-auto"
+ className="flex-1 flex flex-col w-full md:w-auto min-h-0"

- className="p-2 md:p-4 safe-area-bottom flex-shrink-0"
+ className="p-2 md:p-4 safe-area-bottom flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-gray-200"
```

### 結果
- モバイルでキーボード表示後もスクロールが正常に動作
- メッセージ入力欄が常に見える状態を維持
- バーガーメニューの操作が可能

---

## 2025年1月27日 - モバイルスクロール問題の根本的修正

### 問題
- モバイルで画面が固定され、スクロールできない
- キーボード表示後に固定化される
- バーガーメニューが見えない

### 根本原因
1. **メインコンテナの高さ制約**: `minHeight: '-webkit-fill-available'` がモバイルでの固定化を引き起こしている
2. **ヘッダーの固定位置**: `sticky top-0 z-50` が適切に設定されていない
3. **チャットエリアのスクロール制約**: `overflow-y-auto` が適切に動作していない

### 修正内容
1. **メインコンテナの修正**:
   - `className`から`overflow-y-auto`を削除
   - `style`で`height: '100vh'`と`overflow: 'hidden'`を設定
   - `minHeight: '-webkit-fill-available'`を削除

2. **チャットエリアの修正**:
   - メインチャットエリアに`overflow-hidden`を追加
   - チャットメッセージエリアに`overflow-y-auto`を追加
   - ヘッダーに`sticky top-0 z-50`を追加
   - メッセージ入力フォームに`sticky bottom-0 z-40`を追加

### 技術的変更点
```diff
- className="flex relative overflow-y-auto"
+ className="flex relative"

- style={{ background: '#ffffff', minHeight: '-webkit-fill-available' }}
+ style={{ background: '#ffffff', height: '100vh', overflow: 'hidden' }}

- className="flex-1 flex flex-col w-full md:w-auto overflow-hidden"
+ className="flex-1 flex flex-col w-full md:w-auto overflow-hidden"

- className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-2 md:p-4 safe-area-top flex-shrink-0"
+ className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-2 md:p-4 safe-area-top flex-shrink-0 sticky top-0 z-50"

- className="flex-1 p-2 md:p-4 space-y-4 md:space-y-6"
+ className="flex-1 p-2 md:p-4 space-y-4 md:space-y-6 overflow-y-auto"

- className="p-2 md:p-4 safe-area-bottom flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-gray-200"
+ className="p-2 md:p-4 safe-area-bottom flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 sticky bottom-0 z-40"
```

### 期待される効果
- モバイルでスクロール可能になる
- ヘッダーとメニューが常に表示される
- キーボード表示後も固定化されない

### 画像生成関連コード
ユーザーからの要望により、画像生成に関連する主要ファイルを特定：

1. **`src/app/api/generate-image/route.ts`** - メイン画像生成API
   - Runware API（優先）
   - Stable Diffusion API（フォールバック）
   - ローカルStable Diffusion（フォールバック）

2. **`lib/stableDiffusionApi.ts`** - Stable Diffusion API クライアント
3. **`lib/runwareApi.ts`** - Runware API クライアント
4. **`src/app/page.tsx`** - フロントエンド画像生成処理

### 次のステップ
- モバイルでの動作確認
- 背景画像の永続化問題の解決
- コンソールエラーの修正 

---

## 2025年1月27日 - Runware画像生成API修正

### 概要
- RunwareServiceクラスの実装が不完全で、画像生成ができない問題を修正
- ポーリング方式から同期REST API方式に変更

### 詳細
- **問題**: 現在のRunwareServiceが公式APIと一致しない独自の実装
- **原因**: ポーリング方式のAPIが存在しないのに、`createGenerationTask`と`getGenerationTaskStatus`を使用
- **正しいAPI**: 同期的なREST APIで即座に画像URLを返す

### 解決方法
1. **`lib/runwareApi.ts`の完全書き換え**:
   - ポーリング方式を削除
   - `generateImage`メソッドを新規実装
   - `taskUUID`を使用した直接的な画像生成
   - 同期REST API呼び出しに変更

2. **`src/app/api/generate-image/route.ts`の修正**:
   - `createGenerationTask`と`getGenerationTaskStatus`の呼び出しを削除
   - 新しい`generateImage`メソッドを使用
   - ポーリングループを削除
   - 即座に結果を返すように変更

### 学んだ教訓
- APIドキュメントを正確に理解することが重要
- ポーリング方式と同期方式の違いを明確にする
- 実装前に公式ドキュメントを必ず確認する

### 関連ファイル
- `lib/runwareApi.ts` (完全書き換え)
- `src/app/api/generate-image/route.ts` (Runware部分修正)
- `lib/runwareApi.ts.backup` (バックアップ)
- `src/app/api/generate-image/route.ts.backup` (バックアップ)

### ステータス
- [x] 完了 

---

## 2025年7月27日 - 画像生成モデル優先順位修正

### 概要
- 画像生成のモデル設定において、設定画面のモデルを環境変数よりも優先するように修正

### 詳細
- 現在の実装では環境変数`RUNWARE_MODEL_ID`が設定画面のモデルよりも優先されていた
- ユーザーの要求により、設定画面で指定されたモデルIDを最優先にする必要があった
- また、プロパティ名の不一致（`runwaremodelid` vs `runwareModelId`）も修正

### 解決方法
- `src/app/api/generate-image/route.ts`の優先順位ロジックを修正
  ```typescript
  // 修正前: 環境変数優先
  const runwareModelId = envRunwareModelId || settingsRunwareModelId;
  
  // 修正後: 設定画面優先
  const runwareModelId = settingsRunwareModelId || envRunwareModelId;
  ```
- プロパティ名を統一（`runwaremodelid` → `runwareModelId`）
- `types/app.ts`に`runwareLoraIds?: string[]`プロパティを追加
- バックアップファイルも同様に修正

### 学んだ教訓
- 設定の優先順位はユーザーの期待に合わせる必要がある
- プロパティ名の統一は型安全性の観点から重要
- バックアップファイルも同時に修正する必要がある

### 関連ファイル
- `src/app/api/generate-image/route.ts`
- `src/app/api/generate-image/route.ts.backup`
- `types/app.ts`

### ステータス
- [x] 完了 

---

## 2025年7月27日 - API優先順位と画像生成設定の統合修正

### 概要
- Vercel環境変数からのAPI読み込み確認と設定画面優先への修正
- キャラクター編集画面から画像生成設定を削除し、設定画面に移動
- 永続化機能の確認と修正

### 詳細
- **API優先順位修正**: すべてのAPIファイルで設定画面の値を環境変数よりも優先するように修正
- **画像生成設定統合**: キャラクター編集画面から画像生成設定を削除し、設定画面に統合
- **永続化機能確認**: キャラクター設定、背景設定、履歴の永続化機能を確認

### 解決方法
1. **API優先順位修正**:
   - `src/app/api/generate-image/route.ts`: Runware APIキーとモデルIDの優先順位修正
   - `src/app/api/simple-chat/route.ts`: OpenRouter APIキーの優先順位修正
   - `src/app/api/user-inspiration/route.ts`: OpenRouter APIキーの優先順位修正
   - `src/app/api/enhance-text/route.ts`: OpenRouter APIキーの優先順位修正

2. **画像生成設定統合**:
   - `components/CharacterModal.tsx`: 画像生成設定セクションを削除
   - `components/settings/ApiSettings.tsx`: 画像生成設定セクションを追加
   - `types/app.ts`: 画像生成設定プロパティを追加
   - `stores/chatStore.ts`: 画像生成設定のデフォルト値を追加

3. **永続化機能確認**:
   - `lib/backgroundManager.ts`: キャラクター背景設定の永続化機能確認
   - `src/app/api/save-background/route.ts`: サーバーサイド永続化機能確認
   - `lib/characterLoader.ts`: キャラクター設定の自動読み込み機能確認

### 学んだ教訓
- 設定の優先順位は一貫性を保つことが重要
- 画像生成設定は設定画面で一元管理する方が適切
- 永続化機能は複数層（localStorage + サーバー）で実装されている

### 関連ファイル
- `src/app/api/generate-image/route.ts`
- `src/app/api/simple-chat/route.ts`
- `src/app/api/user-inspiration/route.ts`
- `src/app/api/enhance-text/route.ts`
- `components/CharacterModal.tsx`
- `components/settings/ApiSettings.tsx`
- `types/app.ts`
- `stores/chatStore.ts`
- `lib/backgroundManager.ts`
- `src/app/api/save-background/route.ts`
- `lib/characterLoader.ts`

### ステータス
- [x] 完了 

---

## 2025年7月27日 - AI重複発言チェック機能の無効化とキャラクター読み込み問題の調査

### 概要
- AIが「同じことを2回も言わないで」と言う問題が発生
- キャラクターが読み込まれていない問題が報告された

### 詳細
- **AI重複発言チェック問題**: `lib/defaultSystemPrompt.ts`の17行目に「繰り返しの徹底的な回避」指示があり、これが原因でAIが重複発言を過度に警戒していた
- **キャラクター読み込み問題**: `C:\script\ai-chat\public\characters\character`からキャラクターが読み込まれていない可能性

### 解決方法
- **AI重複発言チェック**: `lib/defaultSystemPrompt.ts`の「繰り返しの徹底的な回避」を「自然な会話の維持」に変更
- **キャラクター読み込み**: デバッグログを追加して読み込み状況を確認
  - `lib/characterLoader.ts`に詳細なログを追加
  - `src/app/page.tsx`にキャラクター一覧ログを追加
  - `lib/autoLoader.ts`のNSFWProfile型定義エラーを修正

### 学んだ教訓
- システムプロンプトの指示はAIの行動に大きく影響する
- キャラクター読み込みは複数の段階で失敗する可能性がある
- 型定義の整合性は重要で、エラーが発生すると読み込みが失敗する

### 関連ファイル
- `lib/defaultSystemPrompt.ts`
- `lib/characterLoader.ts`
- `lib/autoLoader.ts`
- `src/app/page.tsx`

### ステータス
- [x] AI重複発言チェック修正完了
- [ ] キャラクター読み込み問題の調査継続中