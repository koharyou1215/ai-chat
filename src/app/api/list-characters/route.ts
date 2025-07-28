import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 複数のキャラクターディレクトリをチェック (より堅牢なパス解決)
    const publicDir = path.resolve(process.cwd(), 'public');
    const possibleDirs = [
      path.join(publicDir, 'characters'),
      path.join(publicDir, 'character'),
      path.join(process.cwd(), 'characters') // プロジェクトルート直下のcharactersもチェック
    ];
    
    const allFiles: string[] = [];
    
    for (const dir of possibleDirs) {
      console.log('📂 キャラクターディレクトリパスをチェック:', dir);
      
      if (fs.existsSync(dir)) {
        console.log('✅ キャラクターディレクトリ確認済み:', dir);
        
        const files = fs.readdirSync(dir)
          .filter(file => file.endsWith('.json'));
        
        console.log('📋 見つかったキャラクターファイル:', files);
        allFiles.push(...files);
      } else {
        console.log('❌ キャラクターディレクトリが存在しません:', dir);
      }
    }
    
    // 重複を除去
    const uniqueFiles = [...new Set(allFiles)];
    console.log('📋 最終的なキャラクターファイル一覧:', uniqueFiles);
    
    return NextResponse.json(uniqueFiles);
  } catch (error) {
    console.error('❌ Characters list error:', error);
    return NextResponse.json([], { status: 500 });
  }
} 