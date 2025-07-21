'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import { ChatMemoProvider } from '../components/ChatMemoProvider'

// モーダルコンポーネントのインポート
import SettingsModal from '../components/SettingsModal'
import ThemeModal from '../components/ThemeModal'
import AuthModal from '../components/AuthModal'
import CharacterModal from '../components/CharacterModal'
import PersonaModal from '../components/PersonaModal'
import CharacterGallery from '../components/CharacterGallery'
import PersonaGallery from '../components/PersonaGallery'
import ChatHistoryGallery from '../components/ChatHistoryGallery'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false)
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false)
  
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
          <div className="bg-black bg-opacity-50 backdrop-blur-md border-b border-gray-700 p-4">
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
