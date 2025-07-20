import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chat App",
  description: "AIキャラクターと会話できるチャットアプリ",
  keywords: "AI, チャット, キャラクター, ロールプレイ, 生成AI, Gemini",
  authors: [{ name: "AI Chat Team" }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    minimumScale: 1,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Chat',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
  },
}; 