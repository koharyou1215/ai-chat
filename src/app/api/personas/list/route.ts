import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const personasDir = path.join(process.cwd(), 'public', 'personas');
    
    // ディレクトリが存在するかチェック
    if (!fs.existsSync(personasDir)) {
      return NextResponse.json([]);
    }

    // ディレクトリ内のファイル一覧を取得
    const files = fs.readdirSync(personasDir);
    
    // JSONファイルのみフィルタリング（隠しファイルや無関係なファイルを除外）
    const jsonFiles = files.filter(file => {
      return file.endsWith('.json') && 
             !file.startsWith('.') && 
             !file.startsWith('_') &&
             file !== 'desktop.ini';
    });

    return NextResponse.json(jsonFiles);
  } catch (error) {
    console.error('Persona files list error:', error);
    return NextResponse.json(
      { error: 'ペルソナファイル一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
