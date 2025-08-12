'use client';

import { useState, useEffect } from 'react';
import { X, Edit, User, Heart, Star, Shield, Save, Upload, Palette } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface TrackerItem {
  name: string;
  display_name: string;
  type: 'numeric' | 'state' | 'boolean';
  initial_value?: number;
  max_value?: number;
  min_value?: number;
  initial_state?: string;
  possible_states?: string[];
  initial_boolean?: boolean;
  category: 'relationship' | 'condition' | 'status';
  persistent: boolean;
  description: string;
}

interface Character {
  name: string;
  age: string;
  occupation: string;
  tags: string[];
  hobbies: string[];
  likes: string[];
  dislikes: string[];
  background: string;
  personality: string;
  external_personality: string;
  internal_personality: string;
  strengths: string[];
  weaknesses: string[];
  appearance: string;
  speaking_style: string;
  scenario: string;
  nsfw_profile?: {
    persona: string;
    libido_level: string;
    situation: string;
    mental_state: string;
    kinks: string[];
  };
  first_message: string;
  system_prompt: string;
  appearancePrompt?: string;
  appearanceNegativePrompt?: string;
  trackers: TrackerItem[];
  fileName?: string;
  customIconUrl?: string;
  customBackgroundUrl?: string;
  lastModified?: string;
}

interface CharacterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  onSave: (character: Character) => Promise<void>;
  onUpdateCharacter: (character: Character) => void;
}

export default function CharacterEditModal({
  isOpen,
  onClose,
  character,
  onSave,
  onUpdateCharacter
}: CharacterEditModalProps) {
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (character) {
      setEditingCharacter({ ...character });
    }
  }, [character]);

  const handleSave = async () => {
    if (!editingCharacter) return;
    
    setIsSaving(true);
    try {
      await onSave(editingCharacter);
      onClose();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof Character, value: any) => {
    if (!editingCharacter) return;
    
    const updatedCharacter = { ...editingCharacter, [field]: value };
    setEditingCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const handleArrayInputChange = (field: keyof Character, value: string) => {
    if (!editingCharacter) return;
    
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    const updatedCharacter = { ...editingCharacter, [field]: arrayValue };
    setEditingCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  if (!isOpen || !editingCharacter) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.4s ease-out' }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-400/30">
              <Edit className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                キャラクター編集
              </h2>
              <p className="text-gray-300 text-sm">{editingCharacter.name}の詳細設定</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 border border-white/10"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：画像設定 */}
          <div className="space-y-6">
            <ImageUpload
              isOpen={true}
              onClose={() => {}} // 編集モーダル内では常に表示
              onUpload={async (file, imageType) => {
                // TODO: 画像アップロード処理を実装
                console.log('画像アップロード:', file, imageType);
              }}
              currentCharacter={editingCharacter}
              onUpdateCharacter={(updatedCharacter) => setEditingCharacter(updatedCharacter)}
            />
          </div>

          {/* 右側：キャラクター詳細情報 */}
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* 基本情報 */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="h-6 w-6 text-green-400" />
                基本情報
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">名前</label>
                  <input
                    type="text"
                    value={editingCharacter.name}
                    className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">年齢</label>
                    <input
                      type="text"
                      value={editingCharacter.age}
                      className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">職業</label>
                    <input
                      type="text"
                      value={editingCharacter.occupation}
                      className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* タグ */}
                <div>
                  <label className="block text-white font-medium mb-2">タグ (カンマ区切り)</label>
                  <input
                    type="text"
                    value={editingCharacter.tags?.join(', ') || ''}
                    placeholder="例: 狼娘, 魔王, 盗賊"
                    className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                    onChange={(e) => handleArrayInputChange('tags', e.target.value)}
                  />
                </div>

                {/* 趣味・好み */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">趣味 (カンマ区切り)</label>
                    <input
                      type="text"
                      value={editingCharacter.hobbies?.join(', ') || ''}
                      placeholder="例: 読書, 音楽鑑賞, 料理"
                      className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                      onChange={(e) => handleArrayInputChange('hobbies', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">好きなもの (カンマ区切り)</label>
                      <input
                        type="text"
                        value={editingCharacter.likes?.join(', ') || ''}
                        placeholder="例: 甘いもの, 暖かい場所"
                        className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                        onChange={(e) => handleArrayInputChange('likes', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">嫌いなもの (カンマ区切り)</label>
                      <input
                        type="text"
                        value={editingCharacter.dislikes?.join(', ') || ''}
                        placeholder="例: 騒音, 寒い場所"
                        className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                        onChange={(e) => handleArrayInputChange('dislikes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 性格・背景 */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Heart className="h-6 w-6 text-pink-400" />
                性格・背景
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">背景・過去の経歴</label>
                  <textarea
                    value={editingCharacter.background || ''}
                    rows={3}
                    className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                    onChange={(e) => handleInputChange('background', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">現在の性格概要</label>
                  <textarea
                    value={editingCharacter.personality || ''}
                    rows={2}
                    className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                    onChange={(e) => handleInputChange('personality', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">外面的性格</label>
                    <textarea
                      value={editingCharacter.external_personality || ''}
                      rows={2}
                      className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                      onChange={(e) => handleInputChange('external_personality', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">内面的性格</label>
                    <textarea
                      value={editingCharacter.internal_personality || ''}
                      rows={2}
                      className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                      onChange={(e) => handleInputChange('internal_personality', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 長所・短所・外見 */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400" />
                特徴・外見
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">長所 (カンマ区切り)</label>
                    <input
                      type="text"
                      value={editingCharacter.strengths?.join(', ') || ''}
                      placeholder="例: 優しい, 頼りになる, 知識豊富"
                      className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      onChange={(e) => handleArrayInputChange('strengths', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">短所 (カンマ区切り)</label>
                    <input
                      type="text"
                      value={editingCharacter.weaknesses?.join(', ') || ''}
                      placeholder="例: 優柔不断, 短気, 甘いものに弱い"
                      className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      onChange={(e) => handleArrayInputChange('weaknesses', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">外見の特徴</label>
                  <textarea
                    value={editingCharacter.appearance || ''}
                    rows={3}
                    className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                    onChange={(e) => handleInputChange('appearance', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">話し方・口調</label>
                  <textarea
                    value={editingCharacter.speaking_style || ''}
                    rows={2}
                    className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                    onChange={(e) => handleInputChange('speaking_style', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* シナリオ・システムプロンプト */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-400" />
                シナリオ・設定
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">シナリオ・状況設定</label>
                  <textarea
                    value={editingCharacter.scenario || ''}
                    rows={3}
                    className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    onChange={(e) => handleInputChange('scenario', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">最初のメッセージ</label>
                  <textarea
                    value={editingCharacter.first_message || ''}
                    rows={2}
                    className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    onChange={(e) => handleInputChange('first_message', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">システムプロンプト</label>
                  <textarea
                    value={editingCharacter.system_prompt || ''}
                    rows={4}
                    className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 pt-6 border-t border-white/20 flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            キャンセル
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
