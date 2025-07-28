'use client'

import { useEffect, useRef } from 'react'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ThemeManager, getDefaultTheme, defaultThemes } from '../../lib/themes' // テーマ関連のインポートを追加

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // 背景動画の自動再生
    if (videoRef.current) {
      videoRef.current.play().catch(console.error)
    }

    // テーマ初期化ロジックを復元
    console.log('🎨 ClientLayout.tsx: useEffect実行開始');
    const savedTheme = localStorage.getItem('ai-chat-theme');
    console.log('📋 保存されたテーマ:', savedTheme);
    
    if (savedTheme) {
      try {
        const themeData = JSON.parse(savedTheme);
        console.log('✅ テーマデータ解析成功:', themeData);
        
        if (typeof themeData.currentTheme === 'string') {
          console.log('📋 テーマIDから検索:', themeData.currentTheme);
          const foundTheme = defaultThemes.find(theme => theme.id === themeData.currentTheme);
          
          if (!foundTheme) {
            console.log('❌ テーマIDが見つかりません、デフォルトテーマを使用');
            ThemeManager.applyTheme(getDefaultTheme(), themeData.customBackground);
          } else {
            console.log('✅ テーマオブジェクト取得成功:', foundTheme.name);
            ThemeManager.applyTheme(foundTheme, themeData.customBackground);
          }
          console.log('✅ 保存テーマ適用完了');
        } else {
          const themeToApply = themeData.currentTheme || getDefaultTheme();
          ThemeManager.applyTheme(themeToApply, themeData.customBackground);
          console.log('✅ 保存テーマ適用完了');
        }
      } catch (error) {
        console.error('❌ テーマデータ解析エラー:', error);
        ThemeManager.applyTheme(getDefaultTheme());
        console.log('✅ デフォルトテーマ適用完了（フォールバック）');
      }
    } else {
      console.log('📋 初回アクセス: デフォルトテーマを適用');
      const defaultTheme = getDefaultTheme();
      ThemeManager.applyTheme(defaultTheme);
      
      localStorage.setItem('ai-chat-theme', JSON.stringify({
        currentTheme: defaultTheme,
        customBackground: null
      }));
      console.log('✅ デフォルトテーマ適用完了');
    }
    
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const bgVar = style.getPropertyValue('--theme-background');
    console.log('📋 適用後のCSS変数確認: --theme-background =', bgVar || '未設定');

  }, [])

  return (
    <div className={`${GeistSans.className} ${GeistMono.className} antialiased relative`}>
      {/* 背景動画 */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[-1]"
        onError={(e) => {
          console.error('Video loading error:', e);
          if (videoRef.current) {
            videoRef.current.style.display = 'none';
          }
        }}
      >
        <source src="/Background/bg.mp4" type="video/mp4" />
      </video>
      <div className="min-h-screen bg-black/50 text-white relative z-10">
        {children}
      </div>
    </div>
  )
}
