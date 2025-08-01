'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMemoProvider } from '../components/ChatMemoProvider'
import { useChatStore } from '../../stores/chatStore'

import SettingsModal from '../../components/SettingsModal'


interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const {
    sidebarOpen,
    toggleSidebar,
    settings,
    updateSettings,
  } = useChatStore()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // 背景動画自動再生（失敗しても無視）
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    videoRef.current?.play().catch(() => {})
  }, [])

  return (
    <ChatMemoProvider>
      {/* 背景動画 */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10"
      >
        <source src="/Background/bg.mp4" type="video/mp4" />
      </video>

      {/* メイン UI */}
      <div className="relative min-h-screen flex">
        {/* サイドバー */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-black/90 backdrop-blur-sm border-r border-gray-700 transform transition-transform duration-300 z-40 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 flex flex-col h-full overflow-y-auto text-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">メニュー</h2>
              <button onClick={toggleSidebar} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* 設定ボタン群 */}
            <div className="mt-auto space-y-2">

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
              >
                ⚙️ 設定
              </button>
            </div>
          </div>
        </aside>

        {/* オーバーレイ：サイドバーが開いているときのみ */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30"
            onClick={toggleSidebar}
          />
        )}

        {/* メインコンテンツ */}
        <main className="flex-1 ml-0 md:ml-64 transition-all duration-300 w-full">
          {children}
        </main>
      </div>

      {/* モーダル群 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
      />

    </ChatMemoProvider>
  )
}
