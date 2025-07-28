import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 全てのキャラクターファイルをpublic/charactersから読み込む
    const charactersDir = path.resolve(process.cwd(), 'public', 'characters');
    console.log('📂 キャラクターディレクトリパスをチェック:', charactersDir);
    
    if (!fs.existsSync(charactersDir)) {
      console.error('❌ キャラクターディレクトリが存在しません:', charactersDir);
      return NextResponse.json([]);
    }
    
    const files = fs.readdirSync(charactersDir)
      .filter(file => file.endsWith('.json'));
    
    console.log('📋 見つかったキャラクターファイル:', files);
    
    // 重複を除去（念のため、実際は不要になるはず）
    const uniqueFiles = [...new Set(files)];
    console.log('📋 最終的なキャラクターファイル一覧:', uniqueFiles);
    
    return NextResponse.json(uniqueFiles);
  } catch (error) {
    console.error('❌ Characters list error:', error);
    return NextResponse.json([], { status: 500 });
  }
} 