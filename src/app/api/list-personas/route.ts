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
    
    const files = fs.readdirSync(personasDir)
      .filter(file => file.endsWith('.json'));

    const personas = files.map(file => {
      const filePath = path.join(personasDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const persona = JSON.parse(fileContent);
      return persona;
    });
    
    return NextResponse.json(personas);
  } catch (error) {
    console.error('Personas list error:', error);
    return NextResponse.json([], { status: 500 });
  }
} 