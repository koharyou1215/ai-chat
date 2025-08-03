import { NextRequest, NextResponse } from 'next/server';

// Vercel認証を完全に無効化
export const runtime = 'edge';
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 認証なしのVOICEVOXプロキシAPI - 完全パブリックアクセス
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, speaker, apiUrl = 'https://deprecatedapis.tts.quest/v2/voicevox' } = body;

    if (!text || speaker === undefined) {
      return NextResponse.json(
        { error: 'textとspeakerパラメータが必要です' },
        { status: 400 }
      );
    }

    console.log('🎵 VOICEVOX プロキシ（認証なし）開始:', { text: text.substring(0, 50), speaker });

    // 1. audio_queryを作成
    const audioQueryUrl = `${apiUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`;
    
    const audioQueryResponse = await fetch(audioQueryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!audioQueryResponse.ok) {
      console.error('❌ VOICEVOX audio_query エラー:', audioQueryResponse.status, audioQueryResponse.statusText);
      return NextResponse.json(
        { error: `VOICEVOX audio_query API error: ${audioQueryResponse.status} ${audioQueryResponse.statusText}` },
        { status: audioQueryResponse.status }
      );
    }

    const audioQuery = await audioQueryResponse.json();
    console.log('✅ audio_query作成成功');

    // 2. 音声を合成
    const synthesisUrl = `${apiUrl}/synthesis?speaker=${speaker}`;
    
    const synthesisResponse = await fetch(synthesisUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(audioQuery),
    });

    if (!synthesisResponse.ok) {
      console.error('❌ VOICEVOX synthesis エラー:', synthesisResponse.status, synthesisResponse.statusText);
      return NextResponse.json(
        { error: `VOICEVOX synthesis API error: ${synthesisResponse.status} ${synthesisResponse.statusText}` },
        { status: synthesisResponse.status }
      );
    }

    // 音声データ（ArrayBuffer）を取得
    const audioBuffer = await synthesisResponse.arrayBuffer();
    console.log('✅ 音声合成成功, サイズ:', audioBuffer.byteLength);

    // ArrayBufferをBase64に変換
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      audioData: audioBase64,
      contentType: 'audio/wav'
    });

  } catch (error) {
    console.error('❌ VOICEVOX プロキシエラー:', error);
    return NextResponse.json(
      { error: 'VOICEVOX音声合成に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// VOICEVOX話者リスト取得用のGETエンドポイント（認証なし）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiUrl = searchParams.get('apiUrl') || 'https://deprecatedapis.tts.quest/v2/voicevox';

    console.log('🎭 VOICEVOX話者リスト取得（認証なし）:', apiUrl);

    const response = await fetch(`${apiUrl}/speakers`);
    
    if (!response.ok) {
      console.error('❌ VOICEVOX speakers API エラー:', response.status, response.statusText);
      return NextResponse.json(
        { error: `VOICEVOX speakers API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const speakers = await response.json();
    console.log('✅ 話者リスト取得成功:', speakers.length, '人');

    return NextResponse.json({
      success: true,
      speakers
    });

  } catch (error) {
    console.error('❌ VOICEVOX話者リスト取得エラー:', error);
    return NextResponse.json(
      { error: 'VOICEVOX話者リストの取得に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}