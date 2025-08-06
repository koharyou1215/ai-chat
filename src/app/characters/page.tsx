'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import CharacterGallery from '../../../components/CharacterGallery';
import CharacterModal from '../../../components/CharacterModal';
import { CharacterLoader } from '../../../lib/characterLoader';
import { Character } from '../../../types/character';
import { saveCharacterToCloud } from '../../../lib/characterCloudSync';
import { useChatStore } from '../../../stores/chatStore';

export default function CharactersPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  
  // Zustandストアからキャラクター設定機能を取得
  const { setCurrentCharacter } = useChatStore();

  useEffect(() => {
    // キャラクターリストの初期ロード
    loadCharacters();
  }, []);

  const loadCharacters = () => {
    CharacterLoader.initialize(); // CharacterLoaderを初期化
    setCharacters(CharacterLoader.getAllCharacters());
  };

  const handleBack = () => {
    router.back();
  };

  const handleCharacterSelect = (character: Character) => {
    // キャラクター選択時にZustandストアを更新
    setCurrentCharacter(character);
    console.log('✅ キャラクター選択:', character.name);
    
    // メインページに戻る
    router.push('/');
  };

  const handleAddCharacter = () => {
    setEditingCharacter(null); // 新規作成のため既存キャラクターをクリア
    setIsModalOpen(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setIsModalOpen(true);
  };

  const handleDeleteCharacter = (characterToDelete: Character) => {
    if (window.confirm(`${characterToDelete.name}を削除してもよろしいですか？`)) {
      CharacterLoader.deleteCharacter(characterToDelete.name); // CharacterLoaderで削除
      loadCharacters(); // リストを再ロード
    }
  };

  const handleSaveCharacter = async (character: Character) => {
    CharacterLoader.addCharacter(character); // CharacterLoaderで追加/更新
    loadCharacters(); // リストを再ロード
    setIsModalOpen(false);
    
    // 新規作成時はZustandストアも更新
    setCurrentCharacter(character);
    
    // Supabaseに保存
    try {
      const result = await saveCharacterToCloud(character);
      if (result.success) {
        console.log('✅ キャラクターをSupabaseに保存しました:', character.name);
      } else {
        console.warn('⚠️ Supabase保存に失敗:', result.error);
      }
    } catch (error) {
      console.error('❌ Supabase保存エラー:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCharacter(null);
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
            characters={characters} // CharacterLoaderから取得したリストを渡す
            currentCharacter={null} // ここでは選択状態を管理しない
            onSelectCharacter={handleCharacterSelect} // キャラクター選択ハンドラ
            onAddCharacter={handleAddCharacter} // 新規作成ハンドラ
            onEditCharacter={handleEditCharacter} // 編集ハンドラ
            onDeleteCharacter={handleDeleteCharacter} // 削除ハンドラ
            onImportExport={() => { /* インポート/エクスポートは別途実装 */ }} // TODO: 後で実装
            onClose={() => {}} // このページでは閉じる処理は不要
          />
        </div>
      </div>

      {/* キャラクター編集/新規作成モーダル */}
      <CharacterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        character={editingCharacter}
        onSave={handleSaveCharacter}
      />
    </div>
  );
}
