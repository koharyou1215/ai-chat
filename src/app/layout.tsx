'use client';

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { useRef, useEffect, useCallback } from "react";
import { useChatStore } from "../../stores/chatStore";
import ChatMemoProvider from "../../components/ChatMemoProvider";

const GeistSansVariable = GeistSans.variable;
const GeistMonoVariable = GeistMono.variable;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const toggleSidebar = useChatStore((state) => state.toggleSidebar);
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

  return (
    <html lang="ja" className={`h-full ${GeistSansVariable} ${GeistMonoVariable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="AI Chat Application" />
        <title>AI Chat</title>
      </head>
      <body className="h-full overflow-hidden">
        <ChatMemoProvider currentSessionId={null}>
          <div className="flex h-full w-full bg-black relative">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
              src="/Background/bg.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              webkit-playsinline="true"
              onError={handleVideoError}
            >
              <source src="/Background/bg.mp4" type="video/mp4" />
              お使いのブラウザは動画タグをサポートしていません。
            </video>
            
            {children}
          </div>
        </ChatMemoProvider>
      </body>
    </html>
  );
}
