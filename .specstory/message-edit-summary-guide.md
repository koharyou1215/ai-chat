# 📝 メッセージ編集・要約機能 実装ガイド

## 🎯 機能概要

**ユーザー側とキャラクター側の両方**に以下の機能を追加：
- ✅ **メッセージ編集**: リアルタイム編集、自動リサイズ、変更統計
- ✅ **3種類の要約**: 簡潔・詳細・感情重視
- ✅ **編集支援**: 改行追加、空白除去、文区切りなど
- ✅ **ホバーアクション**: マウスオーバーで編集ボタン表示
- ✅ **モバイル対応**: タッチデバイス最適化

## 📋 実装ファイル一覧

### 1. 🎨 メイン編集・要約システム
```
MessageEditSummarySystem.tsx
```
**場所**: `c:\script\ai-chat\.specstory\MessageEditSummarySystem.tsx`
- ✅ タブ式UI（編集/要約）
- ✅ 3種類の要約タイプ
- ✅ リアルタイム編集統計
- ✅ 自動保存・リセット機能

### 2. 🔌 APIエンドポイント
```
/api/summarize-message
```
**場所**: `c:\script\ai-chat\.specstory\summarize-message-api.ts`
- ✅ Gemini AI使用
- ✅ 3種類の要約アルゴリズム
- ✅ 品質評価システム
- ✅ 圧縮率自動計算

### 3. 🎯 メッセージ統合コンポーネント
```
MessageActionsIntegration.tsx
```
**場所**: `c:\script\ai-chat\.specstory\MessageActionsIntegration.tsx`
- ✅ ホバー時アクション表示
- ✅ モバイル対応ボタン
- ✅ 既存チャットへの統合
- ✅ ユーザー・キャラクター両対応

## 🚀 統合手順

### Step 1: APIエンドポイント追加
```bash
# プロジェクトのAPIディレクトリに配置
cp "c:\script\ai-chat\.specstory\summarize-message-api.ts" "src/app/api/summarize-message/route.ts"
```

### Step 2: コンポーネント配置
```bash
# メインコンポーネントを配置
cp "c:\script\ai-chat\.specstory\MessageEditSummarySystem.tsx" "src/components/MessageEditSummarySystem.tsx"
cp "c:\script\ai-chat\.specstory\MessageActionsIntegration.tsx" "src/components/MessageActionsIntegration.tsx"
```

### Step 3: 既存チャット画面の更新

#### 🔧 メッセージリスト部分の置き換え
```typescript
// Before: 既存のメッセージ表示
{messages.map((message) => (
  <div key={message.id}>
    {/* 既存のメッセージ表示 */}
  </div>
))}

// After: 新しい編集・要約対応メッセージ
import { ChatMessageList } from './MessageActionsIntegration';

<ChatMessageList
  messages={messages}
  onMessageUpdate={handleMessageUpdate}
  onMessageDelete={handleMessageDelete}
  currentCharacter={currentCharacter}
/>
```

#### 📝 メッセージ更新ハンドラーの追加
```typescript
// ストア更新関数の追加（stores/chatStore.ts）
const handleMessageUpdate = (messageId: string, newContent: string) => {
  const { currentSession, sessions, updateSession } = useChatStore.getState();
  
  if (!currentSession) return;
  
  const updatedMessages = currentSession.messages.map(msg => 
    msg.id === messageId 
      ? { ...msg, content: newContent, timestamp: Date.now() }
      : msg
  );
  
  const updatedSession = {
    ...currentSession,
    messages: updatedMessages,
    updatedAt: Date.now()
  };
  
  updateSession(currentSession.id, updatedSession);
};

// 削除ハンドラー（オプション）
const handleMessageDelete = (messageId: string) => {
  const { currentSession, updateSession } = useChatStore.getState();
  
  if (!currentSession) return;
  
  const updatedMessages = currentSession.messages.filter(msg => msg.id !== messageId);
  const updatedSession = {
    ...currentSession,
    messages: updatedMessages,
    updatedAt: Date.now()
  };
  
  updateSession(currentSession.id, updatedSession);
};
```

## 🎨 UI/UX 特徴

### ✨ ユーザー体験
- **ホバーアクション**: メッセージにマウスオーバーで編集ボタン表示
- **タブ式UI**: 編集と要約を切り替え可能
- **リアルタイム統計**: 文字数変化、圧縮率を即座に表示
- **編集支援**: ワンクリックで改行追加、空白除去など

### 📱 モバイル最適化
- **タッチターゲット**: 十分なサイズのボタン
- **スワイプ対応**: モバイルでもアクセスしやすい配置
- **レスポンシブ**: 画面サイズに応じてレイアウト調整

### 🎯 両サイド対応
- **ユーザーメッセージ**: 青色系、右揃え
- **キャラクターメッセージ**: 緑色系、左揃え
- **統一UI**: 同じ機能セットをどちらでも利用可能

## 🔧 技術仕様

### 📊 要約アルゴリズム
```typescript
// 簡潔要約（50-80文字）
'concise': 核心部分のみ抽出

// 詳細要約（120-200文字）  
'detailed': 構造化された要約

// 感情要約（80-150文字）
'emotional': 感情・トーン重視
```

### 🎮 編集機能
```typescript
interface EditFeatures {
  autoResize: boolean;        // 自動リサイズ
  realTimeStats: boolean;     // リアルタイム統計
  assistTools: string[];      // 編集支援ツール
  changeTracking: boolean;    // 変更追跡
  autoSave: boolean;         // 自動保存対応
}
```

### 📱 レスポンシブ対応
```css
/* デスクトップ: ホバーアクション */
.desktop-hover {
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .desktop-hover {
  opacity: 1;
}

/* モバイル: 常時表示 */
@media (max-width: 768px) {
  .mobile-actions {
    display: block;
  }
  
  .desktop-hover {
    display: none;
  }
}
```

## 🧪 テスト項目

### ✅ 基本機能テスト
- [ ] メッセージ編集の保存・リセット
- [ ] 3種類の要約生成
- [ ] ユーザー・キャラクター両側で動作
- [ ] 編集支援ツールの動作

### ✅ UI/UXテスト  
- [ ] ホバー時のボタン表示
- [ ] モバイルでのタッチ操作
- [ ] タブ切り替えの動作
- [ ] リアルタイム統計の更新

### ✅ エラーハンドリング
- [ ] API通信エラー時の動作
- [ ] 空メッセージでの要約試行
- [ ] 長すぎるメッセージの処理
- [ ] ネットワーク断時の動作

## 🎉 実装完了後の機能

### 👥 ユーザー側
- **✏️ 編集**: 送信後のメッセージを自由に編集
- **📊 要約**: 長いメッセージを3種類で要約
- **🔧 支援**: 改行整理、空白除去などの編集支援
- **📱 モバイル**: タッチデバイスでも快適操作

### 🤖 キャラクター側  
- **✏️ 編集**: AIの返答を後から修正・調整
- **📊 要約**: 長い回答を簡潔に要約
- **🎯 改善**: より良い表現に編集
- **💝 感情**: 感情重視の要約で内容の雰囲気把握

## 💡 今後の拡張可能性

### 🚀 Phase 2 機能
- **🔄 履歴管理**: 編集履歴の保存・復元
- **🤝 協調編集**: 複数デバイス間での同期
- **🎨 テンプレート**: よく使う編集パターンの保存
- **📈 分析**: メッセージ品質の分析・改善提案

### 🎯 AI強化
- **🧠 自動改善**: AIによる自動的な文章改善提案
- **🎭 スタイル変換**: カジュアル↔フォーマルなど
- **🌍 多言語**: 翻訳機能との統合
- **🎪 クリエイティブ**: 創作支援機能

**🎉 実装完了！ユーザーとキャラクター両側でメッセージ編集・要約が可能になります！** ✨
