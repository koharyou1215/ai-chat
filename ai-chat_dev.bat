@echo off
REM -----------------------------
REM  AI-Chat 開発サーバー再起動バッチ
REM -----------------------------
cd /d C:\script\ai-chat

:: ===== 視覚通知（開始） =====
call :toast "AI-Chat Dev" "開発サーバーを起動します"
powershell -c "(New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Windows Notify.wav').Play()"

echo ■ Node プロセスを強制終了...
taskkill /f /im node.exe >nul 2>&1

echo ■ ビルドキャッシュ(.next/.turbo) を削除...
rmdir /s /q .next  2>nul
rmdir /s /q .turbo 2>nul

echo ■ 開発サーバーを起動します (ポート 3004)...
REM cmd /k でウィンドウを残したまま next dev を実行
cmd /k "npm run dev -- -p 3004"

:: スクリプトの終了位置（cmd /k で戻らない場合が多い）
goto :eof

:toast
powershell -NoLogo -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.Popup('%~2',3,'%~1',64)"
exit /b
