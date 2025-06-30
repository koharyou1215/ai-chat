'use client';

import { useState, useEffect } from 'react';
import { X, Save, User, Heart, Tag, MessageSquare } from 'lucide-react';
import { Character } from '../types/character';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  character?: Character | null;
  onSave: (character: Character) => void;
}

export default function CharacterModal({ isOpen, onClose, character, onSave }: CharacterModalProps) {
  const [formData, setFormData] = useState<Character>({
    name: '',
    personality: '',
    appearance: '',
    speaking_style: '',
    scenario: '',
    first_message: [''],
    nsfw_profile: '',
    tags: [],
    age: '',
    occupation: '',
    hobbies: [],
    likes: [],
    dislikes: [],
    background: '',
    avatar_url: '',
    imageSeed: undefined,
    imageWidth: 512,
    imageHeight: 768,
    imageSteps: 28,
    imageCfgScale: 8,
    imageSampler: 'DPM++ 2M Karras'
  });

  const [newTag, setNewTag] = useState('');
  const [newHobby, setNewHobby] = useState('');
  const [newLike, setNewLike] = useState('');
  const [newDislike, setNewDislike] = useState('');

  useEffect(() => {
    if (character) {
      // 安全にデータを設定（配列が未定義の場合は空配列に）
      setFormData({
        ...character,
        tags: Array.isArray(character.tags) ? character.tags : [],
        hobbies: Array.isArray(character.hobbies) ? character.hobbies : [],
        likes: Array.isArray(character.likes) ? character.likes : [],
        dislikes: Array.isArray(character.dislikes) ? character.dislikes : [],
        first_message: Array.isArray(character.first_message) ? character.first_message : [''],
        personality: character.personality || '',
        appearance: character.appearance || '',
        speaking_style: character.speaking_style || '',
        scenario: character.scenario || '',
        nsfw_profile: character.nsfw_profile || '',
        age: character.age || '',
        occupation: character.occupation || '',
        background: character.background || '',
        avatar_url: character.avatar_url || '',
        imageSeed: character.imageSeed,
        imageWidth: character.imageWidth,
        imageHeight: character.imageHeight,
        imageSteps: character.imageSteps,
        imageCfgScale: character.imageCfgScale,
        imageSampler: character.imageSampler
      });
    } else {
      // 新規作成時はリセット
      setFormData({
        name: '',
        personality: '',
        appearance: '',
        speaking_style: '',
        scenario: '',
        first_message: [''],
        nsfw_profile: '',
        tags: [],
        age: '',
        occupation: '',
        hobbies: [],
        likes: [],
        dislikes: [],
        background: '',
        avatar_url: '',
        imageSeed: undefined,
        imageWidth: 512,
        imageHeight: 768,
        imageSteps: 28,
        imageCfgScale: 8,
        imageSampler: 'DPM++ 2M Karras'
      });
    }
  }, [character, isOpen]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('キャラクター名は必須です');
      return;
    }
    
    const characterData: Character = {
      ...formData,
      first_message: (formData.first_message || ['']).filter(msg => msg.trim() !== '')
    };
    
    onSave(characterData);
    onClose();
  };

  const addArrayItem = (type: 'tags' | 'hobbies' | 'likes' | 'dislikes', value: string, setValue: (val: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }));
      setValue('');
    }
  };

  const removeArrayItem = (type: 'tags' | 'hobbies' | 'likes' | 'dislikes', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const addFirstMessage = () => {
    setFormData(prev => ({
      ...prev,
      first_message: [...(prev.first_message || []), '']
    }));
  };

  const updateFirstMessage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      first_message: (prev.first_message || ['']).map((msg, i) => i === index ? value : msg)
    }));
  };

  const removeFirstMessage = (index: number) => {
    const messages = formData.first_message || [''];
    if (messages.length > 1) {
      setFormData(prev => ({
        ...prev,
        first_message: (prev.first_message || []).filter((_, i) => i !== index)
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <User size={28} />
            {character ? 'キャラクター編集' : '新しいキャラクター'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左カラム */}
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
                      キャラクター名 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      placeholder="例: ナミ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      年齢
                    </label>
                    <input
                      type="text"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      placeholder="例: 20歳"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      職業
                    </label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      placeholder="例: 航海士"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      アバターURL
                    </label>
                    <input
                      type="url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </section>

              {/* タグ */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Tag size={20} />
                  タグ
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addArrayItem('tags', newTag, setNewTag)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      placeholder="タグを入力"
                    />
                    <button
                      onClick={() => addArrayItem('tags', newTag, setNewTag)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      追加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.tags || []).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => removeArrayItem('tags', index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* 趣味 */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">趣味</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newHobby}
                      onChange={(e) => setNewHobby(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addArrayItem('hobbies', newHobby, setNewHobby)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      placeholder="趣味を入力"
                    />
                    <button
                      onClick={() => addArrayItem('hobbies', newHobby, setNewHobby)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      追加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.hobbies || []).map((hobby, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {hobby}
                        <button
                          onClick={() => removeArrayItem('hobbies', index)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* 右カラム */}
            <div className="space-y-6">
              {/* 性格・外見 */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">性格・外見</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      性格
                    </label>
                    <textarea
                      value={formData.personality}
                      onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      rows={4}
                      placeholder="キャラクターの性格を詳しく記述してください"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      外見
                    </label>
                    <textarea
                      value={formData.appearance}
                      onChange={(e) => setFormData(prev => ({ ...prev, appearance: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      rows={4}
                      placeholder="キャラクターの外見を詳しく記述してください"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      話し方
                    </label>
                    <textarea
                      value={formData.speaking_style}
                      onChange={(e) => setFormData(prev => ({ ...prev, speaking_style: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      rows={3}
                      placeholder="話し方の特徴や口調を記述してください"
                    />
                  </div>
                </div>
              </section>

              {/* 好き・嫌い */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart size={20} />
                  好み
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 好きなもの */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      好きなもの
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={newLike}
                          onChange={(e) => setNewLike(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addArrayItem('likes', newLike, setNewLike)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-sm"
                          placeholder="好きなもの"
                        />
                        <button
                          onClick={() => addArrayItem('likes', newLike, setNewLike)}
                          className="px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>
                      <div className="space-y-1">
                        {(formData.likes || []).map((like, index) => (
                          <div
                            key={index}
                            className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-sm flex items-center justify-between"
                          >
                            {like}
                            <button
                              onClick={() => removeArrayItem('likes', index)}
                              className="text-pink-600 hover:text-pink-800"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 嫌いなもの */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      嫌いなもの
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={newDislike}
                          onChange={(e) => setNewDislike(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addArrayItem('dislikes', newDislike, setNewDislike)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-sm"
                          placeholder="嫌いなもの"
                        />
                        <button
                          onClick={() => addArrayItem('dislikes', newDislike, setNewDislike)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>
                      <div className="space-y-1">
                        {(formData.dislikes || []).map((dislike, index) => (
                          <div
                            key={index}
                            className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm flex items-center justify-between"
                          >
                            {dislike}
                            <button
                              onClick={() => removeArrayItem('dislikes', index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* フルワイドセクション */}
          <div className="mt-8 space-y-6">
            {/* シナリオ */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">シナリオ・背景</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    シナリオ
                  </label>
                  <textarea
                    value={formData.scenario}
                    onChange={(e) => setFormData(prev => ({ ...prev, scenario: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    rows={4}
                    placeholder="キャラクターとの出会いのシチュエーションや背景設定を記述してください"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    背景・設定
                  </label>
                  <textarea
                    value={formData.background}
                    onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    rows={3}
                    placeholder="キャラクターの詳細な背景設定や世界観を記述してください"
                  />
                </div>
              </div>
            </section>

            {/* 初回メッセージ */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare size={20} />
                初回メッセージ
              </h3>
              <div className="space-y-3">
                {(formData.first_message || ['']).map((message, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={message}
                      onChange={(e) => updateFirstMessage(index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      rows={3}
                      placeholder={`初回メッセージ ${index + 1}`}
                    />
                    {(formData.first_message || []).length > 1 && (
                      <button
                        onClick={() => removeFirstMessage(index)}
                        className="px-3 py-2 text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addFirstMessage}
                  className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 rounded-lg transition-colors"
                >
                  + メッセージを追加
                </button>
              </div>
            </section>

            {/* NSFW設定 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">詳細設定</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NSFW プロファイル
                </label>
                <textarea
                  value={formData.nsfw_profile}
                  onChange={(e) => setFormData(prev => ({ ...prev, nsfw_profile: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  rows={3}
                  placeholder="必要に応じて詳細な設定を記述してください"
                />
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ 責任を持って使用してください
                </p>
              </div>
            </section>

            {/* 画像生成設定 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">画像生成設定</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">デフォルトシード</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      value={formData.imageSeed ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageSeed: e.target.value === '' ? undefined : Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
                      placeholder="ランダム"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageSeed: Math.floor(Math.random()*2**32) }))}
                      className="px-2 py-2 bg-gray-200 rounded hover:bg-gray-300"
                      title="ランダム生成"
                    >🎲</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">幅</label>
                  <input type="number" value={formData.imageWidth}
                    onChange={e=>setFormData(prev=>({...prev, imageWidth:Number(e.target.value)}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">高さ</label>
                  <input type="number" value={formData.imageHeight}
                    onChange={e=>setFormData(prev=>({...prev, imageHeight:Number(e.target.value)}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
                  <input type="number" value={formData.imageSteps}
                    onChange={e=>setFormData(prev=>({...prev, imageSteps:Number(e.target.value)}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CFG Scale</label>
                  <input type="number" value={formData.imageCfgScale}
                    onChange={e=>setFormData(prev=>({...prev, imageCfgScale:Number(e.target.value)}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sampler</label>
                  <select value={formData.imageSampler}
                    onChange={e=>setFormData(prev=>({...prev, imageSampler:e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800">
                    {['DPM++ 2M Karras','Euler a','Euler','DDIM'].map(opt=>(<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
} 