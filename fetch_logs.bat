@echo off
REM ===============================
REM  直近1時間の Vercel ログを取得
REM  ※ Vercel CLI (vercel login) 済み必須
REM ===============================
cd /d C:\script\ai-chat

set PROJ=ai-chat      REM Vercel プロジェクト名
set HOURS=1h          REM 取得範囲: 例 1h / 24h / 7d
set OUT=vercel_logs.txt

echo ■ ログを取得しています...
vercel logs %PROJ% --prod --since %HOURS% > %OUT%
if errorlevel 1 (
  echo ！！ログ取得に失敗しました
  pause
  exit /b 1
)

echo ✅ %OUT% に保存しました
start notepad %OUT%   REM すぐにメモ帳で開く