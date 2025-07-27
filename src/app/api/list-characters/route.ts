import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 環境情報をログ出力
    console.log('🌐 環境情報:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      cwd: process.cwd(),
      filesCount: 0
    });
    
    const charactersDir = path.join(process.cwd(), 'public', 'characters', 'character');
    console.log('📂 キャラクターディレクトリパス:', charactersDir);
    
    // ディレクトリが存在するかチェック
    if (!fs.existsSync(charactersDir)) {
      console.error('❌ キャラクターディレクトリが存在しません:', charactersDir);
      
      // 代替パスを試行
      const altPath = path.join(process.cwd(), 'public', 'characters');
      console.log('🔄 代替パスを試行:', altPath);
      
      if (fs.existsSync(altPath)) {
        const altFiles = fs.readdirSync(altPath)
          .filter(file => file.endsWith('.json'));
        console.log('📋 代替パスで見つかったファイル:', altFiles);
        return NextResponse.json(altFiles);
      }
      
      return NextResponse.json([]);
    }
    
    console.log('✅ キャラクターディレクトリ確認済み');
    
    // .jsonファイルのみをフィルター
    const files = fs.readdirSync(charactersDir)
      .filter(file => file.endsWith('.json'));
    
    console.log('📋 見つかったキャラクターファイル:', files);
    
    // 環境情報を更新
    console.log('🌐 環境情報:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      cwd: process.cwd(),
      filesCount: files.length
    });
    
    return NextResponse.json(files);
  } catch (error) {
    console.error('❌ Characters list error:', error);
    return NextResponse.json([], { status: 500 });
  }
} 