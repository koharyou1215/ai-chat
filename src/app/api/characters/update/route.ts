import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const characterData = await request.json();
    
    if (!characterData.fileName) {
      return NextResponse.json(
        { error: 'ファイル名が必要です' },
        { status: 400 }
      );
    }

    const charactersDir = path.join(process.cwd(), 'public', 'characters');
    const filePath = path.join(charactersDir, characterData.fileName);

    // ファイルが存在するかチェック
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'キャラクターファイルが見つかりません' },
        { status: 404 }
      );
    }

    // 既存データを読み込み
    const existingContent = fs.readFileSync(filePath, 'utf-8');
    const existingData = JSON.parse(existingContent);

    // データをマージ（新しいフィールドを追加）
    const updatedData = {
      ...existingData,
      ...characterData,
      // カスタム画像URLs
      customIconUrl: characterData.customIconUrl || existingData.customIconUrl,
      customBackgroundUrl: characterData.customBackgroundUrl || existingData.customBackgroundUrl,
      // 更新日時を追加
      lastModified: new Date().toISOString()
    };

    // ファイル名は除外して保存
    const { fileName, ...dataToSave } = updatedData;

    // ファイルに書き込み
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));

    return NextResponse.json({
      success: true,
      message: 'キャラクターが正常に更新されました',
      character: updatedData
    });

  } catch (error) {
    console.error('Character update error:', error);
    return NextResponse.json(
      { error: 'キャラクターの更新に失敗しました' },
      { status: 500 }
    );
  }
}