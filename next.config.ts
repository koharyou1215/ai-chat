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
}

export default nextConfig;
