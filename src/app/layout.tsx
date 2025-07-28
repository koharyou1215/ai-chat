import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './ClientLayout' // ClientLayoutをインポート

export const metadata: Metadata = {
  title: 'AI Chat App',
  description: 'AI Chat Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <ClientLayout> {/* ClientLayoutでchildrenをラップ */}
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
