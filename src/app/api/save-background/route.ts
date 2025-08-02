import { NextRequest, NextResponse } from 'next/server';

interface CharacterBackground {
  characterName: string;
  backgroundUrl: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const backgroundData: CharacterBackground = await request.json();
    
    console.log(`📝 キャラクター背景設定受信: ${backgroundData.characterName}`);
    
    // Vercelでは読み取り専用ファイルシステムのため、
    // 背景設定はクライアント側のローカルストレージで管理します
    // このAPIは成功レスポンスのみ返します
    
    console.log(`✅ キャラクター背景設定処理完了: ${backgroundData.characterName}`);
    console.log(`💡 背景設定はブラウザのローカルストレージに保存されます`);
    
    return NextResponse.json({ 
      success: true, 
      message: '背景設定を受信しました（ローカルストレージで管理）',
      characterName: backgroundData.characterName,
      note: 'Vercel環境では背景設定はクライアント側で永続化されます' 
    });
    
  } catch (error) {
    console.error('背景設定保存エラー:', error);
    return NextResponse.json(
      { success: false, error: '背景設定の保存に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 背景設定ファイルのパス
    const backgroundsFile = path.join(process.cwd(), 'data', 'backgrounds', 'character-backgrounds.json');
    
    if (!fs.existsSync(backgroundsFile)) {
      return NextResponse.json({ backgrounds: [] });
    }
    
    const fileContent = fs.readFileSync(backgroundsFile, 'utf-8');
    const backgrounds = JSON.parse(fileContent);
    
    return NextResponse.json({ backgrounds });
    
  } catch (error) {
    console.error('背景設定読み込みエラー:', error);
    return NextResponse.json(
      { error: '背景設定の読み込みに失敗しました' },
      { status: 500 }
    );
  }
} 