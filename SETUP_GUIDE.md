# 🚀 AI Chat プロジェクト - 自動化セットアップガイド

## 📋 作成されたファイル

1. **`COMMANDS_GUIDE.md`** - よく使うコマンド集
2. **`AI_Chat_Helper.ahk`** - AutoHotkey v2スクリプト
3. **`.vscode/tasks.json`** - VSCodeタスク設定

---

## 🔧 AutoHotkey v2 セットアップ

### 1. AutoHotkey v2 をインストール
1. [AutoHotkey v2 公式サイト](https://www.autohotkey.com/) にアクセス
2. "Download AutoHotkey v2" をクリック
3. インストーラーをダウンロードして実行

### 2. スクリプトを実行
1. `AI_Chat_Helper.ahk` ファイルをダブルクリック
2. システムトレイにアイコンが表示される
3. 右クリックでメニューが表示される

### 3. ホットキー一覧
| キー | 機能 |
|------|------|
| `Ctrl + Alt + 1` | 開発サーバー起動 |
| `Ctrl + Alt + 2` | サーバー停止 |
| `Ctrl + Alt + 3` | 変更保存・プッシュ |
| `Ctrl + Alt + 4` | 最新の変更を取得 |
| `Ctrl + Alt + 5` | プロジェクトフォルダを開く |
| `Ctrl + Alt + 6` | VSCodeでプロジェクトを開く |
| `Ctrl + Alt + 7` | ブラウザで開発サーバーを開く |
| `Ctrl + Alt + 8` | コマンド集を開く |
| `Ctrl + Alt + 9` | Git ステータス確認 |
| `Ctrl + Alt + 0` | ヘルプ表示 |

---

## 💻 VSCode タスク設定

### 1. タスクを実行する方法
1. VSCodeでプロジェクトを開く
2. `Ctrl + Shift + P` でコマンドパレットを開く
3. "Tasks: Run Task" と入力
4. 実行したいタスクを選択

### 2. 利用可能なタスク
- 🚀 開発サーバー起動
- 🛑 サーバー停止
- 📦 Git 変更保存・プッシュ
- ⬇️ Git 最新取得
- 📊 Git ステータス確認
- 🏗️ ビルド
- 🚀 デプロイ
- 🌐 ブラウザで開く

---

## 🎯 推奨ワークフロー

### 開発開始時
1. `Ctrl + Alt + 6` でVSCodeを開く
2. `Ctrl + Alt + 4` で最新の変更を取得
3. `Ctrl + Alt + 1` で開発サーバー起動
4. `Ctrl + Alt + 7` でブラウザを開く

### 作業完了時
1. `Ctrl + Alt + 3` で変更を保存・プッシュ
2. `Ctrl + Alt + 2` でサーバー停止

---

## 🔧 カスタマイズ

### プロジェクトパスを変更する場合
`AI_Chat_Helper.ahk` の以下の行を編集：
```autohotkey
PROJECT_PATH := "C:\Users\kohar\Desktop\新しいフォルダー\ai-chat"
```

### 新しいホットキーを追加する場合
`AI_Chat_Helper.ahk` に以下の形式で追加：
```autohotkey
; Ctrl + Alt + キー: 機能説明
^!キー::
{
    ; 実行したいコマンド
    MsgBox("実行完了！")
}
```

---

## 🚨 トラブルシューティング

### AutoHotkeyが動作しない場合
1. AutoHotkey v2がインストールされているか確認
2. スクリプトファイルを右クリック → "Run as Administrator"
3. ウイルス対策ソフトがブロックしていないか確認

### VSCodeタスクが実行できない場合
1. VSCodeでプロジェクトフォルダを開いているか確認
2. `.vscode/tasks.json` ファイルが存在するか確認
3. 必要なコマンド（npm, git等）がインストールされているか確認

---

## 📝 メモ
- プロジェクトパス: `C:\Users\kohar\Desktop\新しいフォルダー\ai-chat`
- 開発サーバー: `http://localhost:3003`
- ポート: 3003

---

## 🎉 完了！
これで、よく使うコマンドをワンクリックで実行できるようになりました！

何か問題があれば、`Ctrl + Alt + 0` でヘルプを表示できます。 