'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import CharacterGallery from '../../components/CharacterGallery';

export default function CharactersPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleCharacterSelect = (character: any) => {
    // キャラクター選択後、メインページに戻る
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
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
          <h1 className="text-2xl font-bold text-white">キャラクター選択</h1>
        </div>

        {/* キャラクターギャラリー */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <CharacterGallery 
            onCharacterSelect={handleCharacterSelect}
            showTitle={false}
          />
        </div>
      </div>
    </div>
  );
}
