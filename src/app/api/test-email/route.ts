import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'メールアドレスが必要です'
      }, { status: 400 })
    }

    // 簡易メール形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: '正しいメールアドレス形式で入力してください'
      }, { status: 400 })
    }

    console.log('📧 テストメール送信要求:', {
      email: email,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')
    })

    // テスト成功レスポンス（実際のメール送信なし）
    return NextResponse.json({
      success: true,
      message: `テストメール送信完了: ${email}`,
      data: {
        email: email,
        timestamp: new Date().toISOString(),
        status: 'test_success',
        note: 'これはテスト機能です。実際のメールは送信されません。'
      }
    })
    
  } catch (error) {
    console.error('❌ テストメール送信エラー:', error)
    return NextResponse.json({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, { status: 500 })
  }
}