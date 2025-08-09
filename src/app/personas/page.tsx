'use client';

import { UserPersona } from '../../types/character';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PersonaGallery from '../../components/PersonaGallery';

export default function PersonasPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handlePersonaSelect = (
  _persona: UserPersona) => {
    // ペルソナ選択後、メインページに戻る
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900">
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
          <h1 className="text-2xl font-bold text-white">ペルソナ設定</h1>
        </div>

        {/* ペルソナギャラリー */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <PersonaGallery 
            onPersonaSelect={handlePersonaSelect}
            showTitle={false}
          />
        </div>
      </div>
    </div>
  );
}
