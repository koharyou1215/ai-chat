@echo off
setlocal enabledelayedexpansion
title AI-Chat Project Status Monitor

REM ===============================
REM  AI-Chat プロジェクト状況確認
REM  開発状況・デプロイ状況・ログ確認
REM ===============================
cd /d C:\script\ai-chat

:: ===== 開始通知 =====
echo.
echo ████████████████████████████████████████
echo ██                                    ██
echo ██    AI-Chat 状況確認ダッシュボード  ██
echo ██                                    ██
echo ████████████████████████████████████████
echo.
call :toast "📊 AI-Chat Status" "プロジェクト状況確認開始"
call :play_sound "C:\\Windows\\Media\\Windows Information Bar.wav"

REM --- ローカル開発サーバー状況 ---
echo ■ ローカル開発サーバー状況:
set dev_running=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004 2^>nul') do (
  if not "%%a"=="0" (
    set dev_running=1
    echo   🟢 ポート3004で実行中 (PID: %%a)
  )
)
if %dev_running%==0 (
  echo   🔴 停止中
)

REM --- Git状況 ---
echo.
echo ■ Git リポジトリ状況:
git status --porcelain > temp_git_status.txt 2>nul
if exist temp_git_status.txt (
  set /p git_changes=<temp_git_status.txt
  if "!git_changes!"=="" (
    echo   ✅ すべてコミット済み
  ) else (
    echo   ⚠️ 未コミットの変更あり
    git status --short 2>nul
  )
) else (
  echo   ❌ Gitリポジトリではありません
)

REM --- 最新コミット情報 ---
echo.
echo ■ 最新コミット:
git log -1 --oneline 2>nul || echo   ❌ コミット履歴なし

REM --- Vercel デプロイ状況 ---
echo.
echo ■ Vercel デプロイ状況:
vercel whoami >nul 2>&1
if errorlevel 1 (
  echo   ❌ Vercel CLI未ログイン
) else (
  echo   ✅ Vercel CLI認証済み
  echo   📋 最新デプロイメント:
  vercel list --scope=kous-projects-ba188115 2>nul | head -5 2>nul || echo   ⚠️ デプロイメント情報取得失敗
)

REM --- Node.js/npm 環境 ---
echo.
echo ■ 開発環境:
node --version 2>nul && echo   ✅ Node.js: 利用可能 || echo   ❌ Node.js: 未インストール
npm --version 2>nul && echo   ✅ npm: 利用可能 || echo   ❌ npm: 未インストール

REM --- プロジェクトファイル確認 ---
echo.
echo ■ プロジェクトファイル:
if exist package.json (
  echo   ✅ package.json 存在
) else (
  echo   ❌ package.json 不存在
)
if exist next.config.ts (
  echo   ✅ next.config.ts 存在
) else (
  echo   ❌ next.config.ts 不存在
)
if exist .env.local (
  echo   ✅ .env.local 存在
) else (
  echo   ⚠️ .env.local 不存在
)

REM --- ポート使用状況 ---
echo.
echo ■ ポート使用状況:
echo   📋 ポート3004周辺の状況:
netstat -ano | findstr :300 2>nul | head -10 2>nul || echo   💡 ポート3000番台は空いています

REM --- 最近のログファイル ---
echo.
echo ■ 最近のログファイル:
if exist vercel_logs*.txt (
  for %%f in (vercel_logs*.txt) do (
    echo   📄 %%f
  )
) else (
  echo   💡 ログファイルなし
)

REM --- 完了通知 ---
echo.
echo ██████████████████████████████████████████████
echo ██                                          ██
echo ██        📊 状況確認完了！                ██
echo ██                                          ██
echo ██████████████████████████████████████████████
echo.

call :toast "📊 Status Complete" "プロジェクト状況確認完了"
call :play_sound "C:\\Windows\\Media\\Windows Notify.wav"

REM --- クリーンアップ ---
del temp_git_status.txt 2>nul

echo 💡 5秒後に自動終了します...
timeout /t 5 /nobreak >nul
exit /b 0

:toast
powershell -NoLogo -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.Popup('%~2',3,'%~1',64)"
exit /b

:play_sound
powershell -NoLogo -NoProfile -Command "try { (New-Object Media.SoundPlayer '%~1').Play() } catch { }"
exit /b