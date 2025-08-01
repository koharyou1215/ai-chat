@echo off
setlocal enabledelayedexpansion
title AI-Chat Log Fetcher

REM ===============================
REM  Vercel ログ取得 & 分析ツール
REM  ※ Vercel CLI (vercel login) 済み必須
REM ===============================
cd /d C:\script\ai-chat

:: ===== 開始通知 =====
echo.
echo ████████████████████████████████████████
echo ██                                    ██
echo ██    AI-Chat ログ取得ツール         ██
echo ██                                    ██
echo ████████████████████████████████████████
echo.
call :toast "📊 AI-Chat Logs" "Vercelログ取得を開始"
call :play_sound "C:\\Windows\\Media\\Windows Information Bar.wav"

REM --- Step 1: Vercel CLI確認 ---
echo ■ Step 1/4: Vercel CLI接続確認...
vercel whoami >nul 2>&1
if errorlevel 1 (
  echo   ❌ Vercel CLI未ログイン
  echo   💡 先に 'vercel login' を実行してください
  call :toast "❌ Auth Error" "Vercel CLI未ログイン"
  pause
  exit /b 1
)
echo   ✓ Vercel CLI認証済み

REM --- Step 2: プロジェクト存在確認 ---
echo ■ Step 2/4: プロジェクト確認...
set PROJ=ai-chat
vercel list | findstr %PROJ% >nul 2>&1
if errorlevel 1 (
  echo   ❌ プロジェクト '%PROJ%' が見つかりません
  call :toast "❌ Project Error" "プロジェクト未発見"
  pause
  exit /b 1
)
echo   ✓ プロジェクト '%PROJ%' 確認

REM --- Step 3: ログ取得 ---
echo ■ Step 3/4: ログ取得中...
set HOURS=3h
set TIMESTAMP=%date:~-10,4%%date:~-5,2%%date:~-2,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set OUT=vercel_logs_%TIMESTAMP%.txt

echo   ▶ 過去%HOURS%のログを取得中...
vercel logs %PROJ% --prod --since %HOURS% > %OUT% 2>&1
if errorlevel 1 (
  echo   ❌ ログ取得失敗
  type %OUT%
  call :toast "❌ Log Error" "ログ取得に失敗"
  call :play_sound "C:\\Windows\\Media\\Windows Error.wav"
  pause
  exit /b 1
)

REM --- Step 4: ログ分析 ---
echo ■ Step 4/4: ログ分析...
set /a total_lines=0
set /a error_lines=0
for /f %%i in ('type "%OUT%" ^| find /c /v ""') do set total_lines=%%i
for /f %%i in ('type "%OUT%" ^| findstr /i "error" ^| find /c /v ""') do set error_lines=%%i

echo   📊 ログ統計:
echo      - 総行数: %total_lines%
echo      - エラー行: %error_lines%
if %error_lines% gtr 0 (
  echo   ⚠️ エラーが検出されました
) else (
  echo   ✅ エラーなし
)

REM --- 完了通知 ---
echo.
echo ██████████████████████████████████████████████
echo ██                                          ██
echo ██        📊 ログ取得完了！                ██
echo ██        ファイル: %OUT%     ██
echo ██                                          ██
echo ██████████████████████████████████████████████
echo.

call :toast "📊 Log Success" "ログ取得完了: %total_lines%行 (エラー:%error_lines%)"
call :play_sound "C:\\Windows\\Media\\Windows Notify.wav"

echo 💡 3秒後にメモ帳でログファイルを開きます...
timeout /t 3 /nobreak >nul
start notepad %OUT%

exit /b 0

:toast
powershell -NoLogo -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.Popup('%~2',3,'%~1',64)"
exit /b

:play_sound
powershell -NoLogo -NoProfile -Command "try { (New-Object Media.SoundPlayer '%~1').Play() } catch { }"
exit /b
