import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const personaName = formData.get('personaName') as string;
    const imageType = formData.get('imageType') as string; // 'icon'

    if (!file || !personaName || !imageType) {
      return NextResponse.json(
        { error: 'ファイル、ペルソナ名、画像タイプが必要です' },
        { status: 400 }
      );
    }

    // サポートされているファイル形式かチェック
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const supportedVideoTypes = ['video/mp4', 'video/webm'];
    const isVideo = supportedVideoTypes.includes(file.type);
    const isImage = supportedImageTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'サポートされていないファイル形式です。画像(JPG, PNG, WebP, GIF)または動画(MP4, WebM)を選択してください。' },
        { status: 400 }
      );
    }

    // ファイルサイズ制限 (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます。50MB以下にしてください。' },
        { status: 400 }
      );
    }

    // 画像保存ディレクトリを作成
    const imageDir = path.join(process.cwd(), 'public', 'persona-images', personaName);
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let fileName: string;
    let publicUrl: string;

    if (isVideo) {
      // 動画ファイルの場合、そのまま保存
      const fileExtension = path.extname(file.name) || '.mp4';
      fileName = `${imageType}${fileExtension}`;
      const filePath = path.join(imageDir, fileName);
      
      fs.writeFileSync(filePath, buffer);
      publicUrl = `/persona-images/${personaName}/${fileName}`;
    } else {
      // 画像ファイルの場合、現在は元ファイルをそのまま保存
      const fileExtension = path.extname(file.name) || '.jpg';
      fileName = `${imageType}${fileExtension}`;
      const filePath = path.join(imageDir, fileName);
      
      fs.writeFileSync(filePath, buffer);
      publicUrl = `/persona-images/${personaName}/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      fileType: isVideo ? 'video' : 'image',
      originalSize: file.size,
      message: `${isVideo ? '動画' : '画像'}が正常に保存されました`
    });

  } catch (error) {
    console.error('Persona media save error:', error);
    return NextResponse.json(
      { error: 'ファイルの保存に失敗しました' },
      { status: 500 }
    );
  }
}