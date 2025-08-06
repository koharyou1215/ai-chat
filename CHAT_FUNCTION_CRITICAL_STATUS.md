# 🔒 チャット機能の重要動作状態（絶対維持）

**⚠️ 警告: このファイルに記載された設定・動作は絶対に変更しないでください ⚠️**

作成日: 2025年8月6日
最終確認: 正常動作確認済み
目的: チャット機能✨、文章強化機能✨、返信提案💡機能の正常動作状態を永続保存

---

## 🎯 絶対維持すべき3つの核心機能

### 1. ✨ チャット機能（メインチャット）
- **API エンドポイント**: `/api/simple-chat`
- **使用モデル**: Gemini 1.5-flash (gemini-1.5-flash)
- **動作確認**: ✅ 正常動作確認済み
- **重要設定**:
  - `geminiApiManager.ts` の Gemini SDK 直接呼び出し
  - OpenRouter フォールバック機能
  - 空応答対策の candidates 抽出ロジック
  - 安全設定: すべて BLOCK_NONE

### 2. ✨ 文章強化機能（キラキラボタン）
- **API エンドポイント**: `/api/enhance-text`
- **使用モデル**: Gemini 1.5-flash
- **プロンプト取得**: `settings.enhancePrompt` から取得
- **プレースホルダー**: `{{user}}` を入力テキストで置換
- **動作確認**: ✅ 正常動作確認済み

### 3. 💡 返信提案機能（電球ボタン）
- **API エンドポイント**: `/api/user-inspiration`
- **使用モデル**: Gemini 1.5-flash
- **プロンプト取得**: `settings.inspirationPrompt` から取得
- **プレースホルダー置換**: 
  - `{{conversation}}` → 会話履歴
  - `{{user}}と{{char}}間の会話履歴` → 会話履歴
  - `会話履歴:` → `会話履歴:\n{会話履歴}`
- **フォールバック**: プレースホルダーなしの場合、末尾に会話履歴を追加
- **動作確認**: ✅ 正常動作確認済み

---

## 🔧 重要な技術的設定

### API 設定（絶対変更禁止）

#### `/api/user-inspiration/route.ts`
```typescript
// モデル設定
model: 'gemini-1.5-flash'  // ⚠️ 変更禁止

// 安全設定（すべて BLOCK_NONE）
safetySettings: [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  // 他3項目も同様にBLOCK_NONE
]

// プレースホルダー置換ロジック（複数パターン対応）
finalPrompt = finalPrompt.replace(/\{\{conversation\}\}/g, message);
finalPrompt = finalPrompt.replace(/\{\{user\}\}と\{\{char\}\}間の会話履歴/g, message);
finalPrompt = finalPrompt.replace(/会話履歴:/g, `会話履歴:\n${message}`);

// フォールバック機能
if (inspirationPrompt === finalPrompt) {
  finalPrompt = `${inspirationPrompt}\n\n**会話履歴:**\n${message}\n\n上記の会話履歴を分析して返信候補を生成してください。`;
}
```

#### `/api/enhance-text/route.ts`
```typescript
// モデル設定
model: 'gemini-1.5-flash'  // ⚠️ 変更禁止

// プレースホルダー置換
finalPrompt = enhancePrompt.replace(/\{\{user\}\}/g, userText);
```

#### `/api/simple-chat/route.ts`
```typescript
// geminiApiManager.generateWithPriority 使用
// Gemini 優先 → OpenRouter フォールバック
// 空応答対策の candidates 抽出あり
```

### メッセージ取得ロジック（絶対変更禁止）

#### `src/app/page.tsx` の `handleUserInspiration` 関数
```typescript
// 現在のメッセージを優先、セッションはフォールバック
const conversationHistory = messages.length > 0 
  ? messages 
  : (currentSessionId ? 
      (await historyManager.loadSession(currentSessionId))?.messages || [] 
      : []
    );
```

### 依存関係（絶対維持）

1. **Google Generative AI SDK**: `@google/generative-ai`
2. **環境変数**: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
3. **Zustand ストア**: `useChatStore` の設定値
4. **プロンプト設定**: 設定画面からの取得のみ（ハードコード禁止）

---

## 📝 動作フロー（保存版）

### 返信提案💡機能の完全フロー
1. 電球ボタンクリック
2. `handleUserInspiration` 実行
3. 現在のメッセージ配列から会話履歴取得
4. `/api/user-inspiration` への POST
5. `settings.inspirationPrompt` 取得
6. 複数パターンのプレースホルダー置換
7. Gemini 1.5-flash で生成
8. 候補リスト抽出・表示

### 文章強化✨機能の完全フロー
1. キラキラボタンクリック
2. 入力テキスト取得
3. `/api/enhance-text` への POST
4. `settings.enhancePrompt` 取得
5. `{{user}}` プレースホルダー置換
6. Gemini 1.5-flash で生成
7. 強化されたテキストで入力欄を置換

### チャット機能✨の完全フロー
1. メッセージ送信
2. `/api/simple-chat` への POST
3. `geminiApiManager.generateWithPriority` 実行
4. キャラクター・ペルソナ・設定込みプロンプト構築
5. Gemini 1.5-flash で生成（失敗時 OpenRouter）
6. 応答表示・音声再生・画像生成

---

## ⚠️ 絶対変更禁止項目

### コード変更禁止
- `/api/user-inspiration/route.ts` のプレースホルダー置換ロジック
- `/api/enhance-text/route.ts` の基本構造
- `/api/simple-chat/route.ts` の geminiApiManager 呼び出し
- `page.tsx` の `handleUserInspiration` 関数
- モデル名 `gemini-1.5-flash` の変更
- 安全設定 `BLOCK_NONE` の変更

### 設定変更禁止
- Gemini API の直接呼び出し方式
- プレースホルダーパターンの削除
- フォールバック機能の削除
- エラーハンドリングの簡略化

### 依存関係変更禁止
- `@google/generative-ai` SDK の削除
- `geminiApiManager.ts` の大幅変更
- `chatStore.ts` の設定構造変更

---

## 📊 最終動作確認ログ

```
✅ チャット機能: 正常動作
✅ 文章強化機能: 正常動作  
✅ 返信提案機能: 正常動作
✅ プレースホルダー置換: 複数パターン対応
✅ 会話履歴取得: メッセージ優先方式
✅ API応答: 630文字以上の適切な内容
✅ エラーハンドリング: 全分岐対応
✅ 履歴自動読み込み: 有効化済み (2025-08-06)
✅ 履歴保存数: 最大8件に拡張 (2025-08-06)
✅ プロンプト制限: 2000文字に緩和 (2025-08-06)
```

## 🔧 2025-08-06 設定関連修正

### 修正内容
1. **履歴自動読み込み有効化**
   - `stores/chatStore.ts`: `autoLoadHistory: false → true`
   - 原因: 設定が無効で会話履歴がリセットされていた

2. **履歴保存数拡張**
   - `src/app/api/simple-chat/route.ts`: 最大4件 → 8件
   - より長い会話の文脈を保持

3. **プロンプト制限緩和**
   - `src/app/api/simple-chat/route.ts`: 1500文字 → 2000文字
   - 記憶トークン数に配慮しつつ、適切な会話履歴を保持

4. **画像生成設定統一**
   - `stores/chatStore.ts`: 重複設定 `imageGenerationEnabled` を削除
   - `enableImageGeneration: true` に統一

5. **メッセージスクロール改善** (2025-08-06)
   - `src/app/page.tsx`: メッセージエリアの下部パディングを `pb-20` → `pb-32` に増加
   - スクロール動作改善: `scroll-smooth` `overscroll-auto` クラス追加
   - メインエリア高さ制限: `max-h-screen` 追加

### 💾 設定永続化確認事項
- ✅ `ai-chat-store` (Zustand) による設定保存
- ✅ `ai-chat-current-character` による最後のキャラクター保存  
- ✅ `BackgroundManager` による背景画像保存
- ✅ `IndexedDB` による会話履歴保存

### 📋 有効設定一覧
```typescript
// 核心機能
autoLoadHistory: true           // 履歴自動読み込み
enableImageGeneration: true     // 画像生成
voiceEnabled: true             // 音声機能
systemPromptEnabled: true      // システムプロンプト

// チャット設定  
maxTokens: 1000               // 最大トークン数
historySize: 8                // 履歴件数
temperature: 1.1              // 創造性

// 画像設定
imageEngine: 'runware'        // 画像エンジン
scenarioDetectionEnabled: true // シナリオ検出

// 音声設定
voiceProvider: 'webspeech'    // 音声プロバイダー
voiceAutoPlay: false          // 自動再生
```

## 🚨 緊急時の復旧方法

もし機能が停止した場合：

1. **まずこのファイルを確認**
2. **上記の設定が維持されているかチェック**
3. **変更が加えられた場合は即座に元に戻す**
4. **Gemini 1.5-flash モデルの使用を確認**
5. **プレースホルダー置換ロジックを確認**

---

**最重要**: このドキュメントに記載された設定は、チャット機能の正常動作が確認された時点の「動作保証済み設定」です。いかなる理由があっても変更しないでください。

**作成者注**: このファイルは正常動作確認済みの設定を永続保存するためのものです。機能追加や修正を行う際は、既存の動作に影響を与えないよう十分注意してください。
