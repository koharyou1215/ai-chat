import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Chat',
  description: 'AI Chat Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={`${GeistSans.className} ${GeistMono.className} antialiased`}>
        <div className="min-h-screen bg-black text-white">
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
