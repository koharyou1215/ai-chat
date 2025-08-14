import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const charactersDir = path.join(process.cwd(), 'public', 'characters');
    
    // ディレクトリが存在するかチェック
    if (!fs.existsSync(charactersDir)) {
      return NextResponse.json([]);
    }

    // ディレクトリ内のファイル一覧を取得
    const files = fs.readdirSync(charactersDir);
    
    // JSONファイルのみフィルタリング（ガイドファイル等を除外）
    const jsonFiles = files.filter(file => {
      return file.endsWith('.json') && 
             !file.startsWith('.') && 
             !file.startsWith('_') &&
             file !== 'desktop.ini' &&
             !file.includes('GUIDE');
    });

    // 各JSONファイルの内容を読み込み
    const characters = [];
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(charactersDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const characterData = JSON.parse(fileContent);
        
        // 必要なフィールドが存在するかチェック
        if (characterData.name && characterData.personality) {
          // ファイル名も追加して返す（保存時に必要）
          characters.push({
            ...characterData,
            fileName: file
          });
        }
      } catch (fileError) {
        console.error(`Error reading character file ${file}:`, fileError);
        // 個別ファイルのエラーは無視して続行
      }
    }

    return NextResponse.json(characters);
  } catch (error) {
    console.error('Character files list error:', error);
    return NextResponse.json(
      { error: 'キャラクターファイル一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}