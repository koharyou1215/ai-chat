'use client';

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import CharacterGallery from "../components/CharacterGallery";
import { useState, useRef, useEffect, useCallback } from "react";
import ChatHistoryGallery from "../components/ChatHistoryGallery";
import SettingsModal from "../components/SettingsModal";
import PersonaGallery from "../components/PersonaGallery";
import ChatSummaryModal from "../components/ChatSummaryModal";
import EnhancedImpressionModal from "../components/EnhancedImpressionModal";
import UserInspirationModal from "../components/UserInspirationModal";
import AuthModal from "../components/AuthModal";
import { useChatStore } from "../stores/chatStore";
import ThemeModal from "../components/ThemeModal";
import MemoModal from "../components/MemoModal";
import MemoListModal from "../components/MemoListModal";
import { ChatMemoProvider } from "../components/ChatMemoProvider";
import CharacterModal from "../components/CharacterModal";
import CharacterSelector from "../components/CharacterSelector";
import PersonaModal from "../components/PersonaModal";
import PersonaSelector from "../components/PersonaSelector";

const GeistSansVariable = GeistSans.variable;
const GeistMonoVariable = GeistMono.variable;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarOpen = useChatStore((state) => state.sidebarOpen);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPersonaGallery, setShowPersonaGallery] = useState(false);
  const [showCharacterGallery, setShowCharacterGallery] = useState(false);
  const [showChatSummaryModal, setShowChatSummaryModal] = useState(false);
  const [showEnhancedImpressionModal, setShowEnhancedImpressionModal] = useState(false);
  const [showUserInspirationModal, setShowUserInspirationModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showMemoListModal, setShowMemoListModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const { toggleSidebar } = useChatStore((state) => ({ ...state }));

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoError = useCallback(() => {
    if (videoRef.current) {
      console.error("Background video failed to load. Attempting to play from start.");
      videoRef.current.load();
      videoRef.current.play().catch(e => console.error("Failed to play video after load: ", e));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar]);

  useEffect(() => {
    if (!sidebarOpen && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [sidebarOpen]);

  return (
    <html lang="ja" className={`h-full ${GeistSansVariable} ${GeistMonoVariable}`}>
      <head>
        {/* メタデータはsrc/app/metadata.tsに移動 */}
      </head>
      <body className="h-full overflow-hidden">
        <ChatMemoProvider>
          <div className="flex h-full w-full bg-black relative">
        <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
          src="/bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
              // @ts-expect-error
          webkit-playsinline="true"
              onError={handleVideoError}
            >
              <source src="/bg.mp4" type="video/mp4" />
              お使いのブラウザは動画タグをサポートしていません。
            </video>

            <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? "sidebar-open" : "sidebar-closed"} w-full md:w-80 bg-gray-900 bg-opacity-70 backdrop-blur-lg p-4 z-40 flex flex-col transition-all duration-300 ease-in-out shadow-lg max-w-xs md:max-w-none`}>
              {/* Sidebar Content */}
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-white">AI Chat</h1>
                <button
                  onClick={toggleSidebar}
                  className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2 transition-colors duration-200"
                  aria-label="サイドバーを閉じる"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                <CharacterGallery openCharacterModal={() => setShowCharacterModal(true)} openCharacterSelector={() => setShowCharacterSelector(true)} />
                <PersonaGallery openPersonaModal={() => setShowPersonaModal(true)} openPersonaSelector={() => setShowPersonaSelector(true)} />
                <ChatHistoryGallery />
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                  認証・アカウント
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M11.49 4.09A1 1 0 0010.51 3H9.49a1 1 0 00-.99 1.09l-.17 1.63a1 1 0 01-.73.74l-1.57.42a1 1 0 00-.7.68l-.44 1.48a1 1 0 00.32 1.05l1.28.98a1 1 0 01.3.99l-.07 1.63a1 1 0 00.99 1.09h1.02a1 1 0 00.99-1.09l.07-1.63a1 1 0 01.3-.99l1.28-.98a1 1 0 00.32-1.05l-.44-1.48a1 1 0 00-.7-.68l-1.57-.42a1 1 0 01-.73-.74l-.17-1.63zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                    設定
                  </button>
                  <button
                    onClick={() => setShowThemeModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 0110.665-7.488A8 8 0 002 10z"></path></svg>
                    テーマ
                  </button>
                </div>
              </div>
            </div>

            <main className="flex-grow relative z-10 flex flex-col bg-gray-800 bg-opacity-40 backdrop-blur-sm">
        {children}
            </main>

            {/* Modals */}
            {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />} 
            {showPersonaGallery && <PersonaGallery onClose={() => setShowPersonaGallery(false)} />} 
            {showCharacterGallery && <CharacterGallery onClose={() => setShowCharacterGallery(false)} />} 
            {showChatSummaryModal && <ChatSummaryModal onClose={() => setShowChatSummaryModal(false)} />} 
            {showEnhancedImpressionModal && <EnhancedImpressionModal onClose={() => setShowEnhancedImpressionModal(false)} />} 
            {showUserInspirationModal && <UserInspirationModal onClose={() => setShowUserInspirationModal(false)} />} 
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />} 
            {showThemeModal && <ThemeModal onClose={() => setShowThemeModal(false)} />} 
            {showMemoModal && <MemoModal onClose={() => setShowMemoModal(false)} />} 
            {showMemoListModal && <MemoListModal onClose={() => setShowMemoListModal(false)} />} 
            {showCharacterModal && <CharacterModal onClose={() => setShowCharacterModal(false)} />} 
            {showCharacterSelector && <CharacterSelector onClose={() => setShowCharacterSelector(false)} />} 
            {showPersonaModal && <PersonaModal onClose={() => setShowPersonaModal(false)} />} 
            {showPersonaSelector && <PersonaSelector onClose={() => setShowPersonaSelector(false)} />} 
          </div>
        </ChatMemoProvider>
      </body>
    </html>
  );
}
