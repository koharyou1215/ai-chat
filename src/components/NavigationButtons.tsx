// src/components/NavigationButtons.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, MessageSquare, Settings, User } from 'lucide-react';

interface NavigationButtonsProps {
  className?: string;
}

export default function NavigationButtons({ className = '' }: NavigationButtonsProps) {
  const router = useRouter();

  const navigationItems = [
    {
      icon: Users,
      label: 'キャラクター選択',
      href: '/characters',
      color: 'from-purple-600 to-indigo-600'
    },
    {
      icon: User,
      label: 'ペルソナ設定',
      href: '/personas',
      color: 'from-green-600 to-teal-600'
    },
    {
      icon: MessageSquare,
      label: '会話履歴',
      href: '/history',
      color: 'from-amber-600 to-orange-600'
    },
    {
      icon: Settings,
      label: '設定',
      href: '/settings',
      color: 'from-slate-600 to-gray-600'
    }
  ];

  return (
    <div className={`grid grid-cols-1 gap-3 ${className}`}>
      {navigationItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={
              className="flex items-center p-4 rounded-xl text-white transition-all duration-300 bg-gradient-to-r  hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[48px] touch-manipulation"
            }
          >
            <IconComponent size={20} className="mr-3 flex-shrink-0" />
            <span className="font-medium text-left">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
