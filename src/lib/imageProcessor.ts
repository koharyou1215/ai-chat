/**
 * 画像・動画処理ユーティリティ
 * リサイズ、圧縮、フォーマット変換を統合管理
 */

interface ProcessedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
}

interface ProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

/**
 * 画像をリサイズ・圧縮処理
 */
export async function processImage(
  file: File, 
  options: ProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    maintainAspectRatio = true
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
        // アスペクト比を計算
        let { width, height } = img;
        
        if (maintainAspectRatio) {
          const aspectRatio = width / height;
          
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
          
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
        } else {
          width = Math.min(width, maxWidth);
          height = Math.min(height, maxHeight);
        }

        // Canvasサイズを設定
        canvas.width = width;
        canvas.height = height;

        // 高品質描画設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);

        // Blobに変換
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                url: URL.createObjectURL(blob),
                width,
                height,
                size: blob.size
              });
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 動画ファイルかチェック
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * 画像ファイルかチェック
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * サポートされているファイルかチェック
 */
export function isSupportedMediaFile(file: File): boolean {
  const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const supportedVideoTypes = ['video/mp4', 'video/webm'];
  
  return supportedImageTypes.includes(file.type) || supportedVideoTypes.includes(file.type);
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 動画から静止画サムネイルを生成
 */
export async function generateVideoThumbnail(
  file: File,
  timeSeconds: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = Math.min(timeSeconds, video.duration);
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0);
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(thumbnailUrl);
    };

    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
}

/**
 * レスポンシブ背景スタイルを生成
 */
export function generateResponsiveBackgroundStyle(url: string, isVideo: boolean = false): React.CSSProperties {
  if (isVideo) {
    return {
      position: 'relative',
      overflow: 'hidden'
    };
  }

  return {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'local',
    backgroundRepeat: 'no-repeat'
  };
}

/**
 * 動画背景要素の設定を生成
 */
export function createVideoBackgroundConfig(url: string) {
  return {
    url,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    className: "w-full h-full object-cover",
    style: { objectFit: 'cover' as const },
    overlay: "absolute inset-0 bg-black/40"
  };
}