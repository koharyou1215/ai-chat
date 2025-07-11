// next.config.ts
const isProd = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: isProd ? { loaders: {} } : {},
  },
  images: {
    domains: ['replicate.delivery'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Vercelツールバーを無効化
  env: {
    NEXT_PUBLIC_VERCEL_ENV: 'production',
  },
}

export default nextConfig;
