import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 複数のキャラクターディレクトリをチェック
    const possibleDirs = [
      path.join(process.cwd(), 'public', 'characters'),
      path.join(process.cwd(), 'public', 'character'),
      path.join(process.cwd(), 'characters')
    ];
    
    const walkDir = (dirPath: string, fileList: string[]) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath, fileList);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          fileList.push(entry.name);
        }
      }
    };

    const allFiles: string[] = [];
    
    for (const dir of possibleDirs) {
      console.log('📂 キャラクターディレクトリパスをチェック:', dir);
      
      if (fs.existsSync(dir)) {
        console.log('✅ キャラクターディレクトリ確認済み:', dir);
        walkDir(dir, allFiles);
        console.log('📋 見つかったキャラクターファイル:', allFiles);
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