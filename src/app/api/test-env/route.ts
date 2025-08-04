import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔧 サーバー側環境変数チェック:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlValue: supabaseUrl,
      keyValue: supabaseKey?.substring(0, 20) + '...'
    })
    
    return NextResponse.json({
      success: true,
      data: {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: supabaseKey?.length || 0,
        urlPrefix: supabaseUrl?.substring(0, 30) || 'undefined',
        keyPrefix: supabaseKey?.substring(0, 20) || 'undefined',
        isValidUrl: supabaseUrl?.startsWith('https://'),
        timestamp: new Date().toISOString(),
        deployVersion: 'v2025-08-04-debug'
      }
    })
  } catch (error) {
    console.error('❌ test-env APIエラー:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    })
  }
}