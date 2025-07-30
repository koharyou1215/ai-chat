@echo off
REM -----------------------------
REM  AI-Chat 開発サーバー再起動バッチ
REM -----------------------------
cd /d C:\script\ai-chat

echo ■ Node プロセスを強制終了...
taskkill /f /im node.exe >nul 2>&1

echo ■ ビルドキャッシュ(.next/.turbo) を削除...
rmdir /s /q .next  2>nul
rmdir /s /q .turbo 2>nul

echo ■ 開発サーバーを起動します (ポート 3004)...
REM cmd /k でウィンドウを残したまま next dev を実行
cmd /k "npm run dev -- -p 3004"