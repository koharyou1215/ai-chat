# 🚀 AI Chat プロジェクト - よく使うコマンド集

## 📁 プロジェクト情報
- **プロジェクトパス**: `C:\Users\kohar\Desktop\新しいフォルダー\ai-chat`
- **開発サーバー**: `http://localhost:3003`
- **ポート**: 3003

---

## 🔧 基本操作

### 開発サーバー起動
```bash
npm run dev
```

### サーバー停止
```bash
Ctrl + C
```

### 強制終了（止まらない場合）
```bash
taskkill /f /im node.exe
```

---

## 📦 Git 操作

### 変更確認
```bash
git status
```

### すべての変更を追加
```bash
git add .
```

### 特定ファイルのみ追加
```bash
git add ファイル名.tsx
```

### コミット
```bash
git commit -m "feat: 新しい機能を追加"
git commit -m "fix: バグを修正"
git commit -m "style: デザインを調整"
git commit -m "refactor: コード整理"
git commit -m "docs: ドキュメント更新"
```

### プッシュ
```bash
git push
```

### 最新の変更を取得
```bash
git pull
```

---

## 🏗️ ビルド・デプロイ

### ビルド
```bash
npm run build
```

### デプロイ（Vercel）
```bash
vercel --prod
```

---

## 📋 よく使うコミットメッセージ

| 種類 | メッセージ例 |
|------|-------------|
| 新機能 | `git commit -m "feat: 新しい機能を追加"` |
| バグ修正 | `git commit -m "fix: バグを修正"` |
| デザイン | `git commit -m "style: デザインを調整"` |
| コード整理 | `git commit -m "refactor: コード整理"` |
| ドキュメント | `git commit -m "docs: ドキュメント更新"` |
| テスト | `git commit -m "test: テスト追加"` |

---

## 🔄 作業フロー

### 開発開始時
```bash
cd C:\Users\kohar\Desktop\新しいフォルダー\ai-chat
git pull
npm run dev
```

### 作業完了時
```bash
git status
git add .
git commit -m "feat: 新しい機能を追加"
git push
Ctrl + C
```

### トラブルシューティング
```bash
# ポートが使われている場合
taskkill /f /im node.exe

# 依存関係の問題
npm install

# キャッシュクリア
npm run build
```

---

## 🎯 ワンクリック実行用コマンド

### 開発サーバー起動
```bash
cd /d "C:\Users\kohar\Desktop\新しいフォルダー\ai-chat" && npm run dev
```

### サーバー停止
```bash
taskkill /f /im node.exe
```

### 変更保存・プッシュ
```bash
cd /d "C:\Users\kohar\Desktop\新しいフォルダー\ai-chat" && git add . && git commit -m "feat: 更新" && git push
```

### 最新取得
```bash
cd /d "C:\Users\kohar\Desktop\新しいフォルダー\ai-chat" && git pull
```

---

## 📝 メモ
- プロジェクトフォルダ: `C:\Users\kohar\Desktop\新しいフォルダー\ai-chat`
- 開発サーバー: `http://localhost:3003`
- ポート: 3003 