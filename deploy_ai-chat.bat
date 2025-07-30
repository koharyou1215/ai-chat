@echo off
REM ===============================
REM  AI-Chat Git → Vercel デプロイ
REM ===============================
cd /d C:\script\ai-chat

REM --- Git push ---
echo ■ 変更をコミット ⇒ プッシュ
git add .
git commit -m "deploy: %date% %time%"
git push
if errorlevel 1 (
  echo ！！Git push でエラーが発生しました
  pause
  exit /b 1
)

REM --- Vercel 本番デプロイ ---
echo ■ Vercel に本番デプロイ
vercel --prod --confirm
if errorlevel 1 (
  echo ！！Vercel デプロイ失敗
) else (
  echo ✅ デプロイ完了
)

pause