@echo off
setlocal enabledelayedexpansion
title AI-Chat Development Server Manager

REM -----------------------------
REM  AI-Chat 開発サーバー完全管理
REM -----------------------------
cd /d C:\script\ai-chat

:: ===== 開始通知 =====
echo.
echo ████████████████████████████████████████
echo ██                                    ██
echo ██    AI-Chat 開発サーバー起動       ██
echo ██                                    ██
echo ████████████████████████████████████████
echo.
call :toast "🛠️ AI-Chat Dev" "開発サーバー管理を開始"
call :play_sound "C:\\Windows\\Media\\Windows Notify.wav"

REM --- Step 1: ポート確認と停止 ---
echo ■ Step 1/4: ポート3004の状況確認...
set found_processes=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004 2^>nul') do (
  if not "%%a"=="0" (
    set /a found_processes+=1
    echo   ▶ PID %%a を発見、強制終了中...
    taskkill /f /pid %%a >nul 2>&1
  )
)
if !found_processes! gtr 0 (
  echo   ✓ !found_processes! 個のプロセスを停止
) else (
  echo   ✓ ポート3004は使用されていません
)

REM --- Step 2: Node.jsプロセス全停止 ---
echo ■ Step 2/4: 全Node.jsプロセスを安全停止...
taskkill /f /im node.exe >nul 2>&1
echo   ✓ Node.jsプロセス停止完了

REM --- Step 3: キャッシュクリア ---
echo ■ Step 3/4: 開発キャッシュをクリア...
if exist .next (
  rmdir /s /q .next 2>nul
  echo   ✓ .next フォルダ削除
)
if exist .turbo (
  rmdir /s /q .turbo 2>nul
  echo   ✓ .turbo フォルダ削除
)
echo   ✓ キャッシュクリア完了

REM --- Step 4: 開発サーバー起動 ---
echo ■ Step 4/4: 開発サーバー起動中...
echo.
echo ██████████████████████████████████████████████
echo ██                                          ██
echo ██     🚀 開発サーバーを起動します         ██
echo ██     ポート: 3004                        ██
echo ██     URL: http://localhost:3004          ██
echo ██                                          ██
echo ██████████████████████████████████████████████
echo.
call :toast "🚀 Dev Server" "ポート3004で開発サーバー起動中"

REM 新しいウィンドウで開発サーバーを起動
start "AI-Chat Dev Server" cmd /k "title AI-Chat Dev Server (Port 3004) && echo 開発サーバー実行中... && npm run dev -- -p 3004"

echo ✓ 開発サーバーが新しいウィンドウで起動しました
echo.
echo 💡 開発サーバーは別ウィンドウで実行中です
echo 💡 ブラウザで http://localhost:3004 にアクセスしてください
echo.

timeout /t 3 /nobreak >nul
exit /b 0

:toast
powershell -NoLogo -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.Popup('%~2',3,'%~1',64)"
exit /b

:play_sound
powershell -NoLogo -NoProfile -Command "try { (New-Object Media.SoundPlayer '%~1').Play() } catch { }"
exit /b
