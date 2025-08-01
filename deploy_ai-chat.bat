@echo off
setlocal enabledelayedexpansion
title AI-Chat Complete Deploy Pipeline

REM ===============================
REM  AI-Chat 完全デプロイパイプライン
REM  ポート停止 → ビルド → Git → Vercel
REM ===============================
cd /d C:\script\ai-chat

:: ===== 開始通知 =====
echo.
echo ██████████████████████████████████████████████
echo ██                                          ██
echo ██        AI-Chat デプロイ開始              ██
echo ██                                          ██
echo ██████████████████████████████████████████████
echo.
call :toast "🚀 AI-Chat Deploy" "完全デプロイパイプライン開始"
call :play_sound "C:\\Windows\\Media\\Windows Startup.wav"

REM --- Step 1: ポート3004停止 ---
echo ■ Step 1/6: ポート3004を使用中のプロセスを停止...
call :show_progress 1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004') do (
  if not "%%a"=="0" (
    echo   ▶ PID %%a を強制終了
    taskkill /f /pid %%a >nul 2>&1
  )
)
echo   ✓ ポート3004解放完了

REM --- Step 2: ビルドキャッシュクリア ---
echo ■ Step 2/6: ビルドキャッシュをクリア...
call :show_progress 2
rmdir /s /q .next 2>nul
rmdir /s /q .turbo 2>nul
echo   ✓ キャッシュクリア完了

REM --- Step 3: ローカルビルドテスト ---
echo ■ Step 3/6: 本番ビルドテスト実行...
call :show_progress 3
echo   ▶ npm run build を実行中...
npm run build
if errorlevel 1 (
  echo   ❌ ビルドエラー発生！
  call :toast "❌ Deploy Error" "ビルドテストに失敗"
  call :play_sound "C:\\Windows\\Media\\Windows Error.wav"
  pause
  exit /b 1
)
echo   ✓ ビルドテスト成功

REM --- Step 4: Git 変更確認 & コミット ---
echo ■ Step 4/6: Git変更の確認とコミット...
call :show_progress 4
git status --porcelain > git_changes.txt
if not exist git_changes.txt (
  echo   ⚠ 変更なし、スキップ
) else (
  set /p has_changes=<git_changes.txt
  if not "!has_changes!"=="" (
    echo   ▶ 変更ファイル検出、コミット中...
    git add .
    git commit -m "auto-deploy: %date:~-10% %time:~0,8%"
    if errorlevel 1 (
      echo   ❌ Git commit 失敗
      call :toast "❌ Deploy Error" "Git commit失敗"
      pause
      exit /b 1
    )
    echo   ✓ Git commit 完了
  ) else (
    echo   ⚠ 変更なし、スキップ
  )
)

REM --- Step 5: Git Push ---
echo ■ Step 5/6: GitHub にプッシュ...
call :show_progress 5
git push
if errorlevel 1 (
  echo   ❌ Git push 失敗
  call :toast "❌ Deploy Error" "Git push失敗"
  call :play_sound "C:\\Windows\\Media\\Windows Error.wav"
  pause
  exit /b 1
)
echo   ✓ Git push 成功

REM --- Step 6: Vercel デプロイ ---
echo ■ Step 6/6: Vercel本番デプロイ...
call :show_progress 6
vercel --prod --yes
if errorlevel 1 (
  echo   ❌ Vercel デプロイ失敗
  call :toast "❌ Deploy Error" "Vercelデプロイ失敗"
  call :play_sound "C:\\Windows\\Media\\Windows Error.wav"
  pause
  exit /b 1
)

REM --- 完了通知 ---
echo.
echo ██████████████████████████████████████████████
echo ██                                          ██
echo ██        🎉 デプロイ成功！                 ██
echo ██                                          ██
echo ██████████████████████████████████████████████
echo.
call :toast "🎉 Deploy Success" "全てのデプロイが完了しました！"
call :play_sound "C:\\Windows\\Media\\Windows Notify.wav"

REM --- クリーンアップ ---
del build_output.txt 2>nul
del git_changes.txt 2>nul

echo プロセス完了 - 5秒後に自動終了
timeout /t 5 /nobreak >nul
exit /b 0

:toast
powershell -NoLogo -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.Popup('%~2',5,'%~1',64)"
exit /b

:play_sound
powershell -NoLogo -NoProfile -Command "try { (New-Object Media.SoundPlayer '%~1').Play() } catch { }"
exit /b

:show_progress
set /a progress=(%1*100)/6
echo   進捗: [%progress%%%] (%1/6)
exit /b
