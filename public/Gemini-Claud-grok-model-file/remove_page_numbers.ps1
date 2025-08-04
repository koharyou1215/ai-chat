# ページ番号削除スクリプト
# 使用方法: .\remove_page_numbers.ps1 -InputFile "ファイル名.txt" -OutputFile "出力ファイル名.txt"

param(
    [Parameter(Mandatory=$false)]
    [string]$InputFile = "原稿.txt",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "原稿_ページ番号削除.txt"
)

Write-Host "ページ番号を削除しています..." -ForegroundColor Green

try {
    # ファイルを読み込み（PowerShell 5.1対応）
    $content = Get-Content $InputFile
    
    # 行末の数字（ページ番号）を削除する正規表現
    # パターン: 行末にある1つ以上の数字（前に空白があってもよい）
    $cleanedContent = $content -replace '\s*\d+$', ''
    
    # 結果を新しいファイルに出力（PowerShell 5.1対応）
    $cleanedContent | Out-File $OutputFile -Encoding UTF8
    
    $originalLines = $content.Count
    $cleanedLines = $cleanedContent.Count
    
    Write-Host "完了しました！" -ForegroundColor Green
    Write-Host "元のファイル: $InputFile ($originalLines 行)" -ForegroundColor Yellow
    Write-Host "出力ファイル: $OutputFile ($cleanedLines 行)" -ForegroundColor Yellow
    Write-Host "ページ番号を削除しました。" -ForegroundColor Cyan
}
catch {
    Write-Error "エラーが発生しました: $($_.Exception.Message)"
}
