import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CharacterBackground {
  characterName: string;
  backgroundUrl: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const backgroundData: CharacterBackground = await request.json();
    
    // 背景設定ファイルのパス
    const backgroundsDir = path.join(process.cwd(), 'data', 'backgrounds');
    const backgroundsFile = path.join(backgroundsDir, 'character-backgrounds.json');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(backgroundsDir)) {
      fs.mkdirSync(backgroundsDir, { recursive: true });
    }
    
    // 既存の背景設定を読み込み
    let backgrounds: CharacterBackground[] = [];
    if (fs.existsSync(backgroundsFile)) {
      const fileContent = fs.readFileSync(backgroundsFile, 'utf-8');
      backgrounds = JSON.parse(fileContent);
    }
    
    // 同じキャラクターの設定を更新または追加
    const existingIndex = backgrounds.findIndex(bg => bg.characterName === backgroundData.characterName);
    if (existingIndex >= 0) {
      backgrounds[existingIndex] = backgroundData;
    } else {
      backgrounds.push(backgroundData);
    }
    
    // ファイルに保存
    fs.writeFileSync(backgroundsFile, JSON.stringify(backgrounds, null, 2));
    
    console.log(`✅ キャラクター背景設定を保存: ${backgroundData.characterName}`);
    
    return NextResponse.json({ 
      success: true, 
      message: '背景設定を保存しました',
      characterName: backgroundData.characterName 
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