import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // ローカルストレージから全データを取得する処理
    const exportData = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      instructions: "このファイルを他デバイスでインポートしてください",
      data: {
        // 実際のデータはフロントエンド側で追加
        characters: "PLACEHOLDER_CHARACTERS",
        personas: "PLACEHOLDER_PERSONAS", 
        memos: "PLACEHOLDER_MEMOS",
        settings: "PLACEHOLDER_SETTINGS",
        history: "PLACEHOLDER_HISTORY"
      }
    }

    const fileName = `ai-chat-backup-${new Date().toISOString().split('T')[0]}.json`
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })
  } catch (error) {
    console.error('データエクスポートエラー:', error)
    return NextResponse.json({
      success: false,
      error: 'データエクスポートに失敗しました'
    }, { status: 500 })
  }
}