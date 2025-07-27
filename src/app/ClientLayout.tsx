'use client'

import { useRef, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import { ChatMemoProvider } from '../components/ChatMemoProvider'

// モーダルコンポーネントのインポート


interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { sidebarOpen, toggleSidebar } = useChatStore()
  
  // ビデオ背景の参照
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.error)
    }
  }, [])

  return (
    <ChatMemoProvider>
      <div className="relative min-h-screen overflow-hidden">
        {/* ビデオ背景 */}
        <div className="fixed inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Video loading error:', e)
              // ビデオが読み込めない場合のフォールバック
              if (videoRef.current) {
                videoRef.current.style.display = 'none'
              }
            }}
          >
            <source src="/Background/bg.mp4" type="video/mp4" />
          </video>
          {/* ビデオオーバーレイ */}
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>

        {/* サイドバー */}
        <div className={`fixed left-0 top-0 h-full w-64 bg-black bg-opacity-90 backdrop-blur-md border-r border-gray-700 transform transition-all duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">メニュー</h2>
              <button
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* ギャラリーセクション */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">🎭 キャラクター</h3>
                <div className="text-white text-sm">キャラクター一覧</div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">👤 Persona</h3>
                <div className="text-white text-sm">Persona一覧</div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">💬 チャット履歴</h3>
                <div className="text-white text-sm">履歴一覧</div>
              </div>
            </div>

            {/* 設定ボタン群 */}
            <div className="mt-8 space-y-2">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
              >
                ☁️ クラウド同期
              </button>
              <button
                onClick={() => setIsThemeOpen(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
              >
                🎨 テーマ変更
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
              >
                ⚙️ 設定
              </button>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className={`relative z-10 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          {/* ヘッダー */}
          <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-2 md:p-4 flex-shrink-0 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSidebar}
                  className="text-white hover:text-gray-300 text-xl"
                >
                  ☰
                </button>
                <h1 className="text-2xl font-bold text-white">AI Chat</h1>
              </div>
            </div>
          </div>

          {/* メインコンテンツエリア */}
          <div className="min-h-screen">
            {children}
          </div>
        </div>

        {/* モーダル群 - 一時的にコメントアウト */}
        {/* 
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
        <ThemeModal 
          isOpen={isThemeOpen} 
          onClose={() => setIsThemeOpen(false)} 
        />
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />
        <CharacterModal 
          isOpen={isCharacterModalOpen} 
          onClose={() => setIsCharacterModalOpen(false)} 
        />
        <PersonaModal 
          isOpen={isPersonaModalOpen} 
          onClose={() => setIsPersonaModalOpen(false)} 
        />
        */}
      </div>
    </ChatMemoProvider>
  )
}
