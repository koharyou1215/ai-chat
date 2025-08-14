import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const personaData = await request.json();
    
    if (!personaData.fileName) {
      return NextResponse.json(
        { error: 'ファイル名が必要です' },
        { status: 400 }
      );
    }

    const personasDir = path.join(process.cwd(), 'public', 'personas');
    const filePath = path.join(personasDir, personaData.fileName);

    // ファイルが存在するかチェック
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'ペルソナファイルが見つかりません' },
        { status: 404 }
      );
    }

    // 既存データを読み込み
    const existingContent = fs.readFileSync(filePath, 'utf-8');
    const existingData = JSON.parse(existingContent);

    // データをマージ（新しいフィールドを追加）
    const updatedData = {
      ...existingData,
      ...personaData,
      // カスタムユーザーアイコンURL
      userIconUrl: personaData.userIconUrl || existingData.userIconUrl,
      // 更新日時を追加
      lastModified: new Date().toISOString()
    };

    // ファイル名は除外して保存
    const { fileName, ...dataToSave } = updatedData;

    // ファイルに書き込み
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));

    return NextResponse.json({
      success: true,
      message: 'ペルソナが正常に更新されました',
      persona: updatedData
    });

  } catch (error) {
    console.error('Persona update error:', error);
    return NextResponse.json(
      { error: 'ペルソナの更新に失敗しました' },
      { status: 500 }
    );
  }
}