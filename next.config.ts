import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  // スタンドアロンビルド設定
  output: 'standalone',
};

export default nextConfig;
