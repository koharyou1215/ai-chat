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
    
    // .jsonファイルのみをフィルター
    const files = fs.readdirSync(personasDir)
      .filter(file => file.endsWith('.json'));
    
    return NextResponse.json(files);
  } catch (error) {
    console.error('Personas list error:', error);
    return NextResponse.json([], { status: 500 });
  }
} 