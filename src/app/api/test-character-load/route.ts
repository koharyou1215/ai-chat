import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    console.log('🔍 キャラクター読み込みテスト開始');
    
    // 環境情報
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      cwd: process.cwd(),
      __dirname: __dirname,
    };
    console.log('🌍 環境情報:', envInfo);
    
    // 複数のキャラクターディレクトリをチェック
    const possibleDirs = [
      path.join(process.cwd(), 'public', 'characters'),
      path.join(process.cwd(), 'public', 'character'),
      path.join(process.cwd(), 'characters')
    ];
    
    const dirStatus = possibleDirs.map(dir => ({
      path: dir,
      exists: fs.existsSync(dir),
      isDirectory: fs.existsSync(dir) ? fs.statSync(dir).isDirectory() : false,
      files: fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')) : []
    }));
    
    console.log('📂 ディレクトリ状況:', dirStatus);
    
    // 実際のファイル読み込みテスト
    const testResults = [];
    for (const dirInfo of dirStatus) {
      if (dirInfo.exists && dirInfo.files.length > 0) {
        const testFile = dirInfo.files[0];
        try {
          const filePath = path.join(dirInfo.path, testFile);
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          
          testResults.push({
            file: testFile,
            directory: dirInfo.path,
            success: true,
            characterName: data.name,
            hasSystemPrompt: !!data.systemPrompt,
            hasFirstMessage: !!data.first_message
          });
        } catch (error) {
          testResults.push({
            file: testFile,
            directory: dirInfo.path,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    return NextResponse.json({
      envInfo,
      dirStatus,
      testResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ キャラクター読み込みテストエラー:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
