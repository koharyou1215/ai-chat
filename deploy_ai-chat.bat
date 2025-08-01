@echo off
REM ===============================
REM  AI-Chat Git → Vercel デプロイ
REM ===============================
cd /d C:\script\ai-chat

:: ===== 視覚通知（開始） =====
call :toast "AI-Chat Deploy" "Git Push → Vercel デプロイ開始"
powershell -c "(New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Windows Exclamation.wav').Play()"

REM --- Git push ---
echo ■ 変更をコミット ⇒ プッシュ
git add .
git commit -m "deploy: %date% %time%"
git push
if errorlevel 1 (
  echo ！！Git push でエラーが発生しました
  call :toast "AI-Chat Deploy" "❌ Git push 失敗"
  pause
  exit /b 1
)

REM --- Vercel 本番デプロイ ---
echo ■ Vercel に本番デプロイ
vercel --prod --yes
if errorlevel 1 (
  echo ！！Vercel デプロイ失敗
  call :toast "AI-Chat Deploy" "❌ デプロイ失敗"
) else (
  echo ✅ デプロイ完了
  call :toast "AI-Chat Deploy" "✅ デプロイ完了"
)

pause
exit /b

:toast
powershell -NoLogo -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.Popup('%~2',3,'%~1',64)"
exit /b
