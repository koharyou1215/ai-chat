@echo off
setlocal enabledelayedexpansion
title AI-Chat Emergency Stop

REM ===============================
REM  AI-Chat 緊急停止ツール
REM  全プロセス強制終了 & ポート解放
REM ===============================
cd /d C:\script\ai-chat

:: ===== 緊急停止通知 =====
echo.
echo ████████████████████████████████████████
echo ██                                    ██
echo ██    🚨 AI-Chat 緊急停止             ██
echo ██                                    ██
echo ████████████████████████████████████████
echo.
call :toast "🚨 Emergency Stop" "AI-Chat緊急停止を開始"
call :play_sound "C:\\Windows\\Media\\Windows Critical Stop.wav"

REM --- Step 1: ポート3004強制解放 ---
echo ■ Step 1/4: ポート3004使用プロセス強制終了...
set killed_count=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004 2^>nul') do (
  if not "%%a"=="0" (
    set /a killed_count+=1
    echo   🔫 PID %%a を強制終了
    taskkill /f /pid %%a >nul 2>&1
  )
)
if %killed_count% gtr 0 (
  echo   ✅ %killed_count% 個のプロセスを停止
) else (
  echo   💡 ポート3004は使用されていません
)

REM --- Step 2: Node.js全プロセス停止 ---
echo ■ Step 2/4: Node.js全プロセス強制終了...
tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe" >nul
if %errorlevel%==0 (
  echo   🔫 全Node.jsプロセスを強制終了中...
  taskkill /f /im node.exe >nul 2>&1
  echo   ✅ Node.jsプロセス停止完了
) else (
  echo   💡 Node.jsプロセスは実行されていません
)

REM --- Step 3: Next.js開発サーバー関連停止 ---
echo ■ Step 3/4: Next.js関連プロセス停止...
tasklist /fi "windowtitle eq AI-Chat Dev Server*" 2>nul | find "cmd.exe" >nul
if %errorlevel%==0 (
  echo   🔫 Next.js開発サーバーウィンドウを終了中...
  taskkill /f /fi "windowtitle eq AI-Chat Dev Server*" >nul 2>&1
  echo   ✅ 開発サーバーウィンドウ終了完了
) else (
  echo   💡 開発サーバーウィンドウは見つかりません
)

REM --- Step 4: ファイルロック解除 ---
echo ■ Step 4/4: ファイルロック解除...
if exist .next (
  echo   🔓 .nextフォルダのロック解除を試行...
  rmdir /s /q .next 2>nul
  if exist .next (
    echo   ⚠️ .nextフォルダが残っています（使用中の可能性）
  ) else (
    echo   ✅ .nextフォルダ削除完了
  )
)

REM --- 最終確認 ---
echo.
echo ■ 最終確認:
netstat -ano | findstr :3004 >nul 2>&1
if %errorlevel%==0 (
  echo   ⚠️ まだポート3004が使用されています
  netstat -ano | findstr :3004
) else (
  echo   ✅ ポート3004は完全に解放されました
)

REM --- 完了通知 ---
echo.
echo ██████████████████████████████████████████████
echo ██                                          ██
echo ██        🚨 緊急停止完了！                ██
echo ██        すべてのプロセスを停止しました    ██
echo ██                                          ██
echo ██████████████████████████████████████████████
echo.

call :toast "🚨 Stop Complete" "AI-Chat全プロセス停止完了"
call :play_sound "C:\\Windows\\Media\\Windows Information Bar.wav"

echo 💡 3秒後に自動終了します...
timeout /t 3 /nobreak >nul
exit /b 0

:toast
powershell -NoLogo -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.Popup('%~2',3,'%~1',64)"
exit /b

:play_sound
powershell -NoLogo -NoProfile -Command "try { (New-Object Media.SoundPlayer '%~1').Play() } catch { }"
exit /b