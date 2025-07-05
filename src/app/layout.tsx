import type { Metadata } from "next";
import { Geist, Geist_Mono, M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cuteFont = M_PLUS_Rounded_1c({
  variable: "--font-cute",
  subsets: ["latin"],
  weight: ["400","700"],
});

export const metadata: Metadata = {
  title: "AI Chat",
  description: "AIキャラクターと会話できるチャットアプリ",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cuteFont.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* 全画面背景動画 (public/bg.mp4) */}
        <video
          className="fixed inset-0 -z-10 w-full h-full object-cover"
          src="/bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        {children}
      </body>
    </html>
  );
}
