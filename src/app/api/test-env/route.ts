import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    return NextResponse.json({
      success: true,
      data: {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: supabaseKey?.length || 0,
        urlPrefix: supabaseUrl?.substring(0, 20) || 'undefined',
        keyPrefix: supabaseKey?.substring(0, 20) || 'undefined'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    })
  }
}