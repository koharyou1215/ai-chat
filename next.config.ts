// next.config.ts
const isProd = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番環境での安定性を向上
  output: 'standalone',
  experimental: {
    turbo: isProd ? { loaders: {} } : {},
  },
  images: {
    domains: ['replicate.delivery'],
    unoptimized: true, // デプロイ時の画像最適化問題を回避
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ビルド時の警告を抑制
  typescript: {
    ignoreBuildErrors: true,
  },
  // Vercelツールバーを無効化
  env: {
    NEXT_PUBLIC_VERCEL_ENV: 'production',
  },
  // 本番環境でのパフォーマンス最適化
  compress: true,
  poweredByHeader: false,
  // デプロイ時の安定性向上
  swcMinify: true,
  // 静的ファイルの最適化
  assetPrefix: isProd ? '' : undefined,
  // ビルド時の警告を抑制
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default nextConfig;
