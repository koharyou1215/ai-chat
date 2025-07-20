import { Theme } from '../types/character';

export const defaultThemes: Theme[] = [
  {
    id: 'ocean-sunset',
    name: '夕暮れの海',
    type: 'gradient',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    sidebar: 'rgba(0, 0, 0, 0.3)',
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
      accent: '#ffd700'
    },
    bubble: {
      user: 'rgba(59, 130, 246, 0.9)',
      ai: 'rgba(255, 255, 255, 0.9)',
      opacity: 0.9
    },
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'forest-morning',
    name: '森の朝',
    type: 'gradient',
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    sidebar: 'rgba(0, 0, 0, 0.25)',
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.85)',
      accent: '#ffeb3b'
    },
    bubble: {
      user: 'rgba(34, 197, 94, 0.9)',
      ai: 'rgba(255, 255, 255, 0.95)',
      opacity: 0.9
    },
    preview: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  {
    id: 'cherry-blossom',
    name: '桜の季節',
    type: 'gradient',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    sidebar: 'rgba(0, 0, 0, 0.2)',
    text: {
      primary: '#4a5568',
      secondary: '#718096',
      accent: '#e53e3e'
    },
    bubble: {
      user: 'rgba(236, 72, 153, 0.9)',
      ai: 'rgba(255, 255, 255, 0.95)',
      opacity: 0.9
    },
    preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  },
  {
    id: 'midnight-city',
    name: '真夜中の街',
    type: 'gradient',
    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    sidebar: 'rgba(0, 0, 0, 0.4)',
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      accent: '#3498db'
    },
    bubble: {
      user: 'rgba(52, 152, 219, 0.9)',
      ai: 'rgba(44, 62, 80, 0.9)',
      opacity: 0.9
    },
    preview: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)'
  },
  {
    id: 'aurora-night',
    name: 'オーロラの夜',
    type: 'gradient',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    sidebar: 'rgba(0, 0, 0, 0.35)',
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
      accent: '#00ff88'
    },
    bubble: {
      user: 'rgba(42, 82, 152, 0.9)',
      ai: 'rgba(255, 255, 255, 0.95)',
      opacity: 0.9
    },
    preview: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
  },
  {
    id: 'sunset-glow',
    name: '夕焼けの輝き',
    type: 'gradient',
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    sidebar: 'rgba(0, 0, 0, 0.25)',
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.9)',
      accent: '#ff6b6b'
    },
    bubble: {
      user: 'rgba(250, 112, 154, 0.9)',
      ai: 'rgba(255, 255, 255, 0.95)',
      opacity: 0.9
    },
    preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    id: 'dark-mode',
    name: 'ダークモード',
    type: 'solid',
    background: '#0f172a',
    sidebar: 'rgba(15, 23, 42, 0.8)',
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      accent: '#60a5fa'
    },
    bubble: {
      user: 'rgba(59, 130, 246, 0.9)',
      ai: 'rgba(30, 41, 59, 0.9)',
      opacity: 0.9
    },
    preview: '#0f172a'
  },
  {
    id: 'light-mode',
    name: 'ライトモード',
    type: 'solid',
    background: '#f8fafc',
    sidebar: 'rgba(248, 250, 252, 0.8)',
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      accent: '#3b82f6'
    },
    bubble: {
      user: 'rgba(59, 130, 246, 0.9)',
      ai: 'rgba(255, 255, 255, 0.95)',
      opacity: 0.9
    },
    preview: '#f8fafc'
  }
];

export const getThemeById = (id: string): Theme | null => {
  return defaultThemes.find(theme => theme.id === id) || null;
};

export const getDefaultTheme = (): Theme => {
  return defaultThemes[0]; // ocean-sunset
};

export class ThemeManager {
  static applyTheme(theme: Theme, customBackground?: string) {
    const root = document.documentElement;
    
    // Backgroundの適用
    if (customBackground) {
      // 動画かどうかを判定（blob: または .mp4/.webm を含む）
      const isVideo = customBackground.startsWith('blob:') || 
                      customBackground.match(/\.(mp4|webm|mov|avi)$/i);
      
      if (isVideo) {
        // 動画Backgroundの場合
        root.style.setProperty('--theme-background-image', 'none');
        root.style.setProperty('--theme-background', 'transparent');
        
        // 既存の動画要素を削除
        const existingVideo = document.querySelector('#custom-bg-video');
        if (existingVideo) existingVideo.remove();
        
        // 新しい動画要素を作成
        const video = document.createElement('video');
        video.id = 'custom-bg-video';
        video.src = customBackground;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: -10;
          pointer-events: none;
        `;
        
        // body の最初の子要素として挿入（layout.tsx の動画より前に配置）
        document.body.insertBefore(video, document.body.firstChild);
        
        // layout.tsx のBackground動画を隠す
        const layoutVideo = document.querySelector('video[src="/bg.mp4"]');
        if (layoutVideo && layoutVideo instanceof HTMLVideoElement) {
          layoutVideo.style.display = 'none';
        }
        
        document.body.classList.remove('vertical-image-bg');
        return;
      }
      
      // 画像の縦横比を検出して適切な background-size を設定
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        if (aspectRatio < 0.8) { // 縦長画像（2:3 など）
          root.style.setProperty('--theme-background-size', 'contain');
          root.style.setProperty('--theme-background-position', 'center top');
          // vertical-image クラスを body に追加
          document.body.classList.add('vertical-image-bg');
        } else {
          root.style.setProperty('--theme-background-size', 'cover');
          root.style.setProperty('--theme-background-position', 'center');
          document.body.classList.remove('vertical-image-bg');
        }
      };
      img.src = customBackground;
      
      root.style.setProperty('--theme-background-image', `url(${customBackground})`);
      root.style.setProperty('--theme-background', 'transparent');
    } else {
      // カスタム動画を削除
      const existingVideo = document.querySelector('#custom-bg-video');
      if (existingVideo) {
        existingVideo.remove();
        
        // layout.tsx のBackground動画を復元
        const layoutVideo = document.querySelector('video[src="/bg.mp4"]');
        if (layoutVideo && layoutVideo instanceof HTMLVideoElement) {
          layoutVideo.style.display = '';
        }
      }
      
      root.style.setProperty('--theme-background-image', 'none');
      root.style.setProperty('--theme-background', theme.background);
      root.style.setProperty('--theme-background-size', 'auto');
      root.style.setProperty('--theme-background-position', 'initial');
      document.body.classList.remove('vertical-image-bg');
    }
    
    // サイドバー
    root.style.setProperty('--theme-sidebar', theme.sidebar);
    
    // テキストカラー
    root.style.setProperty('--theme-text-primary', theme.text.primary);
    root.style.setProperty('--theme-text-secondary', theme.text.secondary);
    root.style.setProperty('--theme-text-accent', theme.text.accent);
    
    // バブルカラー
    root.style.setProperty('--theme-bubble-user', theme.bubble.user);
    root.style.setProperty('--theme-bubble-ai', theme.bubble.ai);
    root.style.setProperty('--theme-bubble-opacity', theme.bubble.opacity.toString());
  }
  
  static saveTheme(themeId: string, customBackground?: string) {
    try {
      // blob: URL の場合は保存をスキップして警告
      if (customBackground && customBackground.startsWith('blob:')) {
        console.warn(`動画ファイルは一時的なBackgroundとして設定されました。ページリロード後は無効になります。`);
        // blob URL は localStorage に保存せず、現在のセッションのみ有効
        return;
      }
      
      const settings = {
        currentTheme: themeId,
        customBackground: customBackground
      };
      
      const settingsStr = JSON.stringify(settings);
      
      // データサイズチェック（4MB制限）
      if (settingsStr.length > 4 * 1024 * 1024) {
        throw new Error('設定データが大きすぎます');
      }
      
      localStorage.setItem('ai-chat-theme', settingsStr);
    } catch (error) {
      console.error('テーマ保存エラー:', error);
      
      if (error instanceof Error && error.message.includes('quota')) {
        // ストレージ容量不足の場合、カスタムBackgroundなしで保存
        const fallbackSettings = {
          currentTheme: themeId === 'custom' ? 'ocean-sunset' : themeId
        };
        try {
          localStorage.setItem('ai-chat-theme', JSON.stringify(fallbackSettings));
          alert('画像データが大きすぎるため、カスタムBackgroundなしで保存されました');
        } catch {
          alert('設定の保存に失敗しました');
        }
      } else {
        alert('テーマの保存に失敗しました');
      }
    }
  }
  
  static loadTheme(): { themeId: string; customBackground?: string } {
    try {
      const saved = localStorage.getItem('ai-chat-theme');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Theme loading error:', error);
    }
    
    return { themeId: 'ocean-sunset' };
  }
} 