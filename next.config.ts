import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Vercelデプロイ時の静的ファイル配信確保
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // CSS最適化の問題を修正
  experimental: {
    optimizeCss: false,
  },
  // デプロイ時のCSS適用確保
  compiler: {
    removeConsole: false,
  },
  // 本番環境でのCSS適用確保
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss|sass)$/,
        chunks: 'all',
        enforce: true,
      };
    }
    return config;
  },
  // セキュリティヘッダーでCSS適用を確保
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "style-src 'self' 'unsafe-inline'; font-src 'self' data:;",
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/globals.css',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
}

export default nextConfig
