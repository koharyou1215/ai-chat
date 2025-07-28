import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import ThemeInitializer from '../../components/ThemeInitializer'

export const metadata: Metadata = {
  title: 'AI Chat',
  description: 'AIチャットアプリケーション',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body 
        className={`${GeistSans.className} ${GeistMono.className} antialiased relative`}
        suppressHydrationWarning={true}
      >
        <ThemeInitializer />
        {/* 背景動画 */}
        <video
          autoPlay
          loop
          muted
          className="fixed inset-0 w-full h-full object-cover z-[-1]"
        >
          <source src="/Background/bg.mp4" type="video/mp4" />
        </video>
        <div className="min-h-screen bg-black/50 text-white relative z-10">
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
