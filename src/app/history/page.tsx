'use client';

import { ChatSession } from '../../types/character';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ChatHistoryGallery from '../../components/ChatHistoryGallery';

export default function HistoryPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleHistorySelect = (
  _historyItem: ChatSession) => {
    // 履歴選択後、メインページに戻る
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-red-900">
      <div className="container mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-white/80 hover:text-white transition-colors mr-4 p-2 rounded-lg hover:bg-white/10"
          >
            <ArrowLeft size={20} className="mr-2" />
            戻る
          </button>
          <h1 className="text-2xl font-bold text-white">会話履歴</h1>
        </div>

        {/* 会話履歴ギャラリー */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <ChatHistoryGallery 
            onHistorySelect={handleHistorySelect}
            showTitle={false}
          />
        </div>
      </div>
    </div>
  );
}
