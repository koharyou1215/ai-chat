export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export class ImageCompressor {
  /**
   * 画像を自動圧縮して指定サイズ以下に収める
   */
  static async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<{ 
    dataUrl: string; 
    originalSize: number; 
    compressedSize: number; 
    compressionRatio: number;
  }> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      maxSizeKB = 3000, // 3MB
      outputFormat = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // 元の画像サイズ
          const originalSize = file.size;
          
          // アスペクト比を保持して最適なサイズを計算
          const { width, height } = this.calculateOptimalSize(
            img.width, 
            img.height, 
            maxWidth, 
            maxHeight
          );

          // Canvasのサイズを設定
          canvas.width = width;
          canvas.height = height;

          // 画像を描画
          ctx.drawImage(img, 0, 0, width, height);

          // 品質を段階的に下げながら圧縮
          this.compressWithQualityAdjustment(
            canvas,
            outputFormat,
            quality,
            maxSizeKB
          ).then((result) => {
            const compressedSize = Math.round(result.dataUrl.length * 0.75); // Base64のサイズを推定
            const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

            resolve({
              dataUrl: result.dataUrl,
              originalSize,
              compressedSize,
              compressionRatio: Math.max(0, compressionRatio)
            });
          }).catch(reject);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // ファイルを読み込み
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * アスペクト比を保持した最適なサイズを計算
   */
  private static calculateOptimalSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // 最大幅を超える場合
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    // 最大高さを超える場合
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * 品質を調整しながら圧縮
   */
  private static async compressWithQualityAdjustment(
    canvas: HTMLCanvasElement,
    format: string,
    initialQuality: number,
    maxSizeKB: number
  ): Promise<{ dataUrl: string; finalQuality: number }> {
    let quality = initialQuality;
    let dataUrl = '';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      dataUrl = canvas.toDataURL(format, quality);
      const sizeKB = Math.round(dataUrl.length * 0.75 / 1024); // Base64のサイズをKBで推定

      if (sizeKB <= maxSizeKB || quality <= 0.1) {
        break;
      }

      // 品質を段階的に下げる
      quality = Math.max(0.1, quality - 0.1);
      attempts++;

      // UIフリーズを防ぐためにイベントループに制御を返す
      // 0ms の setTimeout と同等
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }

    return {
      dataUrl,
      finalQuality: quality
    };
  }

  /**
   * ファイルサイズを人間が読みやすい形式に変換
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 画像形式を最適化
   */
  static getOptimalFormat(file: File): 'image/jpeg' | 'image/webp' | 'image/png' {
    // WebPサポートをチェック
    const canvas = document.createElement('canvas');
    const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

    if (supportsWebP) {
      return 'image/webp'; // 最も効率的
    }

    // 透明度が必要な場合はPNG、それ以外はJPEG
    if (file.type === 'image/png') {
      return 'image/png';
    }

    return 'image/jpeg';
  }
} 