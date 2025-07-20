#Requires AutoHotkey v2.0

; AI Chat プロジェクト用 AutoHotkey スクリプト
; よく使うコマンドをワンクリックで実行

; プロジェクトパス
PROJECT_PATH := "C:\Users\kohar\Desktop\新しいフォルダー\ai-chat"

; ホットキー設定
; Ctrl + Alt + 1: 開発サーバー起動
^!1::
{
    RunWait("cmd /c cd /d """ PROJECT_PATH """ && npm run dev",, "Hide")
    MsgBox("開発サーバーを起動しました！`nブラウザで http://localhost:3003 を開いてください。")
}

; Ctrl + Alt + 2: サーバー停止
^!2::
{
    RunWait("taskkill /f /im node.exe",, "Hide")
    MsgBox("サーバーを停止しました！")
}

; Ctrl + Alt + 3: 変更保存・プッシュ
^!3::
{
    RunWait("cmd /c cd /d """ PROJECT_PATH """ && git add . && git commit -m ""feat: 更新"" && git push",, "Hide")
    MsgBox("変更を保存・プッシュしました！")
}

; Ctrl + Alt + 4: 最新の変更を取得
^!4::
{
    RunWait("cmd /c cd /d """ PROJECT_PATH """ && git pull",, "Hide")
    MsgBox("最新の変更を取得しました！")
}

; Ctrl + Alt + 5: プロジェクトフォルダを開く
^!5::
{
    Run("explorer """ PROJECT_PATH """")
}

; Ctrl + Alt + 6: VSCodeでプロジェクトを開く
^!6::
{
    Run("code """ PROJECT_PATH """")
}

; Ctrl + Alt + 7: ブラウザで開発サーバーを開く
^!7::
{
    Run("http://localhost:3003")
}

; Ctrl + Alt + 8: コマンド集を開く
^!8::
{
    Run("notepad """ PROJECT_PATH "\COMMANDS_GUIDE.md""")
}

; Ctrl + Alt + 9: Git ステータス確認
^!9::
{
    RunWait("cmd /c cd /d """ PROJECT_PATH """ && git status",, "Hide")
    MsgBox("Git ステータスを確認しました！")
}

; Ctrl + Alt + 0: ヘルプ表示
^!0::
{
    helpText := "
    (
    🚀 AI Chat プロジェクト - ホットキー一覧
    
    Ctrl + Alt + 1: 開発サーバー起動
    Ctrl + Alt + 2: サーバー停止
    Ctrl + Alt + 3: 変更保存・プッシュ
    Ctrl + Alt + 4: 最新の変更を取得
    Ctrl + Alt + 5: プロジェクトフォルダを開く
    Ctrl + Alt + 6: VSCodeでプロジェクトを開く
    Ctrl + Alt + 7: ブラウザで開発サーバーを開く
    Ctrl + Alt + 8: コマンド集を開く
    Ctrl + Alt + 9: Git ステータス確認
    Ctrl + Alt + 0: このヘルプを表示
    
    プロジェクトパス: """ PROJECT_PATH """
    開発サーバー: http://localhost:3003
    )"
    
    MsgBox(helpText)
}

; 右クリックメニューに追加（オプション）
; システムトレイアイコンを追加
tray := A_TrayMenu
tray.Add("開発サーバー起動", (*) => Send("^!1"))
tray.Add("サーバー停止", (*) => Send("^!2"))
tray.Add("変更保存・プッシュ", (*) => Send("^!3"))
tray.Add("最新取得", (*) => Send("^!4"))
tray.Add()
tray.Add("プロジェクトフォルダを開く", (*) => Send("^!5"))
tray.Add("VSCodeで開く", (*) => Send("^!6"))
tray.Add("ブラウザで開く", (*) => Send("^!7"))
tray.Add()
tray.Add("ヘルプ", (*) => Send("^!0"))
tray.Add("終了", (*) => ExitApp())

; 起動時のメッセージ
MsgBox("AI Chat プロジェクト用 AutoHotkey スクリプトが起動しました！`n`nCtrl + Alt + 0 でヘルプを表示できます。") 