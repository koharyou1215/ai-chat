const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // 本番環境でのCSS最適化を制御
  safelist: [
    // 重要なユーティリティクラスを保護
    'bg-black',
    'bg-white',
    'text-white',
    'text-black',
    'bg-opacity-50',
    'bg-gradient-to-br',
    'from-blue-500',
    'to-purple-600',
    'hover:from-blue-600',
    'hover:to-purple-700',
    'shadow-lg',
    'rounded-lg',
    'transition-all',
    'duration-300',
    'transform',
    'scale-105',
    // アニメーションクラス
    'animate-pulse',
    'animate-bounce',
    'animate-spin',
    'animate-ping',
    'animate-none',
    'hover:animate-none',
    'scale-95',
    'scale-110',
    // モーダル関連のクラス
    'fixed',
    'inset-0',
    'z-50',
    'flex',
    'items-center',
    'justify-center',
    // サイドバー関連のクラス
    'w-64',
    'h-full',
    'left-0',
    'top-0',
    'translate-x-0',
    '-translate-x-full',
  ],
};

export default config; 