import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const charactersDir = path.join(process.cwd(), 'public', 'characters', 'character');
    
    // ディレクトリが存在するかチェック
    if (!fs.existsSync(charactersDir)) {
      return NextResponse.json([]);
    }
    
    // .jsonファイルのみをフィルター
    const files = fs.readdirSync(charactersDir)
      .filter(file => file.endsWith('.json'));
    
    return NextResponse.json(files);
  } catch (error) {
    console.error('Characters list error:', error);
    return NextResponse.json([], { status: 500 });
  }
} 