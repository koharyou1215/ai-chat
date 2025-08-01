@echo off
REM ===============================
REM  直近1時間の Vercel ログを取得
REM  ※ Vercel CLI (vercel login) 済み必須
REM ===============================
cd /d C:\script\ai-chat

:: ===== 視覚通知（開始） =====
call :toast "AI-Chat Logs" "直近1時間のVercelログ取得を開始"
powershell -c "(New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Windows Information Bar.wav').Play()"

set PROJ=ai-chat      REM Vercel プロジェクト名
set HOURS=1h          REM 取得範囲: 例 1h / 24h / 7d
set OUT=vercel_logs.txt

echo ■ ログを取得しています...
vercel logs %PROJ% --prod --since %HOURS% > %OUT%
if errorlevel 1 (
  echo ！！ログ取得に失敗しました
  call :toast "AI-Chat Logs" "❌ ログ取得失敗"
  pause
  exit /b 1
)

echo ✅ %OUT% に保存しました
call :toast "AI-Chat Logs" "✅ ログ取得完了 (%OUT%)"
start notepad %OUT%   REM すぐにメモ帳で開く

exit /b

:toast
powershell -NoLogo -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.Popup('%~2',3,'%~1',64)"
exit /b
