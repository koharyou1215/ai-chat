'use client';

import { useState, useEffect } from 'react';
import { X, Save, User, Heart, Tag, Plus } from 'lucide-react';
import { UserPersona } from '../types/character';
import { v4 as uuidv4 } from 'uuid';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPersona?: UserPersona | null;
  onSave: (persona: UserPersona) => void;
}

export default function PersonaModal({ isOpen, onClose, initialPersona, onSave }: PersonaModalProps) {
  const [formData, setFormData] = useState<UserPersona>({
    id: '',
    name: '',
    description: '',
    role: '',
    traits: [],
    likes: [],
    dislikes: [],
    other_settings: ''
  });

  const [newLike, setNewLike] = useState('');
  const [newDislike, setNewDislike] = useState('');
  const [newTrait, setNewTrait] = useState('');

  useEffect(() => {
    if (initialPersona) {
      setFormData(initialPersona);
    } else {
      const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : uuidv4();

      setFormData({
        id,
        name: '',
        description: '',
        role: '',
        traits: [],
        likes: [],
        dislikes: [],
        other_settings: ''
      });
    }
  }, [initialPersona, isOpen]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Persona名は必須です');
      return;
    }
    
    onSave(formData);
    onClose();
  };

  const addItem = (type: 'likes' | 'dislikes' | 'traits', value: string, setValue: (val: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...(prev[type] || []), value.trim()]
      }));
      setValue('');
    }
  };

  const removeItem = (type: 'likes' | 'dislikes' | 'traits', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: (prev[type] || []).filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <User size={28} />
            {initialPersona ? 'Persona編集' : '新しいPersona'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 操作ボタン（上部に移動） */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-b border-gray-200 bg-gray-50/30">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
          >
            <Save size={14} />
            保存
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* 基本情報 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} />
                基本情報
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persona名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    placeholder="例: 冒険好きの学生"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    あなたのPersonaに名前を付けてください
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    placeholder="例: プログラミングが好きな大学生"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    あなたの簡単な説明を入力してください
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    役割・肩書き
                  </label>
                  <input
                    type="text"
                    value={formData.role || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    placeholder="例: エンジニア、学生、研究者"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    あなたの職業や役割を入力してください
                  </p>
                </div>
              </div>
            </section>

            {/* 特徴タグ */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Tag size={20} />
                特徴キーワード
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  あなたの特徴
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTrait}
                      onChange={(e) => setNewTrait(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addItem('traits', newTrait, setNewTrait)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      placeholder="特徴を入力（例: 内向的、完璧主義、チャレンジ精神）"
                    />
                    <button
                      onClick={() => addItem('traits', newTrait, setNewTrait)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} />
                      追加
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(formData.traits || []).map((trait, index) => (
                      <div
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg flex items-center justify-between"
                      >
                        <span className="flex-1">{trait}</span>
                        <button
                          onClick={() => removeItem('traits', index)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {(formData.traits || []).length === 0 && (
                      <div className="text-gray-500 text-sm text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                        特徴キーワードを追加してください
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 好み設定 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Heart size={20} />
                好み設定
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 好きなもの */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    好きなもの・興味
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLike}
                        onChange={(e) => setNewLike(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addItem('likes', newLike, setNewLike)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                        placeholder="好きなものを入力"
                      />
                      <button
                        onClick={() => addItem('likes', newLike, setNewLike)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        追加
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.likes.map((like, index) => (
                        <div
                          key={index}
                          className="bg-green-100 text-green-800 px-3 py-2 rounded-lg flex items-center justify-between"
                        >
                          <span className="flex-1">{like}</span>
                          <button
                            onClick={() => removeItem('likes', index)}
                            className="text-green-600 hover:text-green-800 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {formData.likes.length === 0 && (
                        <div className="text-gray-500 text-sm text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                          好きなものを追加してください
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 嫌いなもの */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    嫌いなもの・苦手
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDislike}
                        onChange={(e) => setNewDislike(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addItem('dislikes', newDislike, setNewDislike)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                        placeholder="苦手なものを入力"
                      />
                      <button
                        onClick={() => addItem('dislikes', newDislike, setNewDislike)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        追加
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.dislikes.map((dislike, index) => (
                        <div
                          key={index}
                          className="bg-red-100 text-red-800 px-3 py-2 rounded-lg flex items-center justify-between"
                        >
                          <span className="flex-1">{dislike}</span>
                          <button
                            onClick={() => removeItem('dislikes', index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {formData.dislikes.length === 0 && (
                        <div className="text-gray-500 text-sm text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                          苦手なものを追加してください
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* その他の設定 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Tag size={20} />
                その他の設定
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  その他の設定・特徴
                </label>
                <textarea
                  value={formData.other_settings}
                  onChange={(e) => setFormData(prev => ({ ...prev, other_settings: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  rows={6}
                  placeholder="あなたの性格、趣味、価値観、ライフスタイルなど、AIに理解してもらいたい情報を自由に記述してください。

例：
- 性格：内向的だが友人には積極的、完璧主義な傾向
- 趣味：読書、ゲーム、映画鑑賞
- 価値観：効率性を重視、新しいことに挑戦するのが好き
- ライフスタイル：夜型、在宅ワーク
- 会話スタイル：カジュアル、時々ジョークを交える"
                />
                <p className="text-xs text-gray-500 mt-1">
                  この情報はAIがあなたに合わせた返答をするために使用されます
                </p>
              </div>
            </section>

            {/* プレビュー */}
            <section className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">プレビュー</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">名前：</span>
                  <span className="text-gray-600">{formData.name || '未設定'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">説明：</span>
                  <span className="text-gray-600">{formData.description || '設定なし'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">役割：</span>
                  <span className="text-gray-600">{formData.role || '設定なし'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">特徴：</span>
                  <span className="text-gray-600">
                    {(formData.traits || []).length > 0 ? (formData.traits || []).join(', ') : '設定なし'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">好きなもの：</span>
                  <span className="text-gray-600">
                    {formData.likes.length > 0 ? formData.likes.join(', ') : '未設定'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">嫌いなもの：</span>
                  <span className="text-gray-600">
                    {formData.dislikes.length > 0 ? formData.dislikes.join(', ') : '未設定'}
                  </span>
                </div>
                {formData.other_settings && (
                  <div>
                    <span className="font-medium text-gray-700">その他：</span>
                    <div className="text-gray-600 mt-1 whitespace-pre-wrap">
                      {formData.other_settings}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 