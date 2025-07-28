import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const charactersDir = path.join(process.cwd(), 'public', 'characters', 'character');
    console.log('📂 キャラクターディレクトリパス:', charactersDir);
    
    // ディレクトリが存在するかチェック
    if (!fs.existsSync(charactersDir)) {
      console.error('❌ キャラクターディレクトリが存在しません:', charactersDir);
      return NextResponse.json([]);
    }
    
    console.log('✅ キャラクターディレクトリ確認済み');
    
    // .jsonファイルのみをフィルター
    const files = fs.readdirSync(charactersDir)
      .filter(file => file.endsWith('.json'));
    
    console.log('📋 見つかったキャラクターファイル:', files);
    
    return NextResponse.json(files);
  } catch (error) {
    console.error('❌ Characters list error:', error);
    return NextResponse.json([], { status: 500 });
  }
} 