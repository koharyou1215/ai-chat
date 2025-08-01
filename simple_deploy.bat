@echo off
setlocal enabledelayedexpansion
title AI-Chat Simple Deploy
chcp 65001 >nul

REM --- 開始通知 ---
cls
echo ======================================================
echo         AI-Chat Simple Deploy
echo ======================================================
echo.

echo Step 1/4: プロセス停止...
taskkill /f /im node.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004 2^>nul') do (
  if not "%%a"=="0" (
    taskkill /f /pid %%a >nul 2>&1
  )
)
echo   ✓ プロセス停止完了

echo.
echo Step 2/4: キャッシュクリア...
rmdir /s /q .next 2>nul
rmdir /s /q .turbo 2>nul
echo   ✓ キャッシュクリア完了

echo.
echo Step 3/4: Git操作...
git add . >nul 2>&1
git commit -m "auto-deploy: %date% %time%" >nul 2>&1
git push >nul 2>&1
echo   ✓ Git操作完了

echo.
echo Step 4/4: Vercelデプロイ...
echo   ▶ vercel --prod --yes を実行中...
vercel --prod --yes
if errorlevel 1 (
  echo   ❌ Vercelデプロイ失敗
  powershell -NoLogo -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.Popup('❌ Vercelデプロイ失敗',5,'Deploy Error',64)"
  pause
  exit /b 1
)

REM --- 完了通知 ---
echo.
echo ======================================================
echo         🎉 デプロイ成功！
echo ======================================================
echo.
powershell -NoLogo -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.Popup('🎉 デプロイ完了！',5,'Deploy Success',64)"

echo 5秒後に自動終了...
timeout /t 5 /nobreak >nul
exit /b 0