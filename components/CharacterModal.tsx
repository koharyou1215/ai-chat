'use client';

import { useState, useEffect } from 'react';
import { X, Save, User, Heart, Tag, MessageSquare, TrendingUp } from 'lucide-react';
import { Character } from '../types/character';
import { ImageCompressor } from '../lib/imageCompressor';
import TrackerEditor from './TrackerEditor';
import { BackgroundManager } from '../lib/backgroundManager';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  character?: Character | null;
  onSave: (character: Character) => void;
  fromGallery?: boolean; // ギャラリーから開かれたかどうか
  onReturnToGallery?: () => void; // ギャラリーに戻る処理
}

export default function CharacterModal({ isOpen, onClose, character, onSave }: CharacterModalProps) {
  const [formData, setFormData] = useState<Character & { nsfw_profile: string | object }>({
    name: '',
    personality: '',
    appearance: '',
    speaking_style: '',
    scenario: '',
    first_message: '',
    nsfw_profile: '',
    tags: [],
    age: '',
    occupation: '',
    hobbies: [],
    likes: [],
    dislikes: [],
    background: '',
    trackers: [],
    systemPrompt: '',
    appearancePrompt: '',
    appearanceNegativePrompt: '',
    chatBackgroundUrl: '',
  // 新しいパーソナリティフィールド（string型で初期化）
  external_personality: '',
  internal_personality: '',
  strengths: '',
  weaknesses: ''
  });

  const [newTag, setNewTag] = useState('');
  const [newHobby, setNewHobby] = useState('');
  const [newLike, setNewLike] = useState('');
  const [newDislike, setNewDislike] = useState('');
  // 新しいパーソナリティフィールド用の状態
  


  useEffect(() => {
    if (character) {
      console.log('🔍 CharacterModal キャラクター設定開始:', character.name);
      console.log('🔍 キャラクター生データ:', {
        first_message: character.first_message,
        systemPrompt: character.systemPrompt,
        systemPromptLength: character.systemPrompt?.length || 0,
        appearanceNegativePrompt: character.appearanceNegativePrompt,
        nsfw_profile: character.nsfw_profile,
        character_definition: character.character_definition,
        // 🚨 新しいパーソナリティフィールドのデバッグ 🚨
        external_personality: character.external_personality,
        internal_personality: character.internal_personality,
        strengths: character.strengths,
        weaknesses: character.weaknesses
      });

      // 🚨 リリス専用の詳細ログ 🚨
      if (character.name === 'リリス') {
        console.log('🔍🔍🔍 リリス専用デバッグ:', {
          external_personality_type: typeof character.external_personality,
          external_personality_isArray: Array.isArray(character.external_personality),
          external_personality_length: character.external_personality?.length,
          external_personality_content: character.external_personality,
          internal_personality_type: typeof character.internal_personality,
          internal_personality_content: character.internal_personality,
          strengths_content: character.strengths,
          weaknesses_content: character.weaknesses
        });
      }
      
      // CharacterDefinition形式の場合の値取得
      const characterDef = character.character_definition;
      
      // 1. first_message の正規化処理  
      const firstMsgFromProps = Array.isArray(character.first_message) 
        ? character.first_message[0] || '' 
        : character.first_message || 
        characterDef?.scenario?.initial_situation ||
        '';

      // 2. systemPrompt の正規化処理
      const systemPromptFromProps = 
        character.systemPrompt || 
        '';

      // 3. appearanceNegativePrompt の正規化処理
      const negFromProps = 
        character.appearanceNegativePrompt || 
        characterDef?.appearance?.negativePrompt ||
        '';

      // 4. nsfw_profile の正規化処理
      const nsfwFromProps = 
        character.nsfw_profile ||
        characterDef?.nsfw_profile ||
        undefined;

      console.log('📊 モーダル正規化後の値:', {
        firstMsgFromProps,
        systemPromptFromProps,
        negFromProps,
        nsfwFromProps
      });

      // 🚨 カスタムキャラクター4項目が空の場合の緊急フォールバック 🚨
      const emergencyFirstMessage = firstMsgFromProps || character.first_message || 'こんにちは！';
      const emergencySystemPrompt = systemPromptFromProps || character.systemPrompt || '';
      const emergencyNegPrompt = negFromProps || character.appearanceNegativePrompt || '';
      const emergencyNsfw = nsfwFromProps || character.nsfw_profile || '';

      console.log('🚨 緊急フォールバック後の値:', {
        emergencyFirstMessage,
        emergencySystemPrompt, 
        emergencyNegPrompt,
        emergencyNsfw
      });
      
      setFormData({
        ...character,
        tags: Array.isArray(character.tags) ? character.tags : [],
        hobbies: Array.isArray(character.hobbies) ? character.hobbies : [],
        likes: Array.isArray(character.likes) ? character.likes : [],
        dislikes: Array.isArray(character.dislikes) ? character.dislikes : [],
        
        // 新しいパーソナリティフィールド（string型で初期化）
        external_personality: typeof character.external_personality === 'string'
          ? character.external_personality
          : (Array.isArray(character.external_personality) ? character.external_personality.join('\n') : ''),
        internal_personality: typeof character.internal_personality === 'string'
          ? character.internal_personality
          : (Array.isArray(character.internal_personality) ? character.internal_personality.join('\n') : ''),
        strengths: typeof character.strengths === 'string'
          ? character.strengths
          : (Array.isArray(character.strengths) ? character.strengths.join('\n') : ''),
        weaknesses: typeof character.weaknesses === 'string'
          ? character.weaknesses
          : (Array.isArray(character.weaknesses) ? character.weaknesses.join('\n') : ''),
        
        // 新しいフォーマット（CharacterDefinition）から読み込み
        personality: characterDef?.personality?.summary || character.personality || '',
        appearance: characterDef?.appearance?.description || character.appearance || '',
        speaking_style: characterDef?.speaking_style?.base || character.speaking_style || '',
        scenario: characterDef?.scenario?.initial_situation || character.scenario || '',
        
        // 🚨 4項目を緊急フォールバック値で確実に設定 🚨
        first_message: emergencyFirstMessage,
        systemPrompt: emergencySystemPrompt, 
        appearanceNegativePrompt: emergencyNegPrompt,
        
        // nsfw_profileの処理 - 緊急フォールバック値を使用
        nsfw_profile: (() => {
          console.log('🔍 NSFWプロファイル処理確認:', {
            emergencyNsfw: emergencyNsfw,
            type: typeof emergencyNsfw,
            isObject: typeof emergencyNsfw === 'object' && emergencyNsfw !== null,
            keys: emergencyNsfw && typeof emergencyNsfw === 'object' ? Object.keys(emergencyNsfw) : 'N/A'
          });

          // 緊急フォールバック値があればそれを使用
          if (emergencyNsfw !== undefined && emergencyNsfw !== null) {
            if (typeof emergencyNsfw === 'object') {
              // オブジェクト形式 - JSONとして整形
              return JSON.stringify(emergencyNsfw, null, 2);
            } else if (typeof emergencyNsfw === 'string' && emergencyNsfw.trim() !== '') {
              // 文字列形式で値がある場合はそのまま
              return emergencyNsfw;
            }
          }

          // フォールバック
          if (characterDef?.nsfw_profile) {
            return JSON.stringify(characterDef.nsfw_profile, null, 2);
          } else if (typeof character.nsfw_profile === 'object' && character.nsfw_profile) {
            return JSON.stringify(character.nsfw_profile, null, 2);
          } else if (typeof character.nsfw_profile === 'string' && character.nsfw_profile) {
            return character.nsfw_profile;
          }
          
          return '';
        })(),
        
        age: character.age || '',
        occupation: character.occupation || '',
        background: characterDef?.background || character.background || '',
        avatar_url: character.avatar_url || '',
        appearancePrompt: characterDef?.appearance?.prompt || character.appearancePrompt || '',
        chatBackgroundUrl: character.chatBackgroundUrl || '',
        trackers: Array.isArray(character.trackers) ? character.trackers : []
      });

      // 🚨 新しいパーソナリティフィールドの初期化確認 🚨
      setTimeout(() => {
        console.log('🚀 フォーム初期化完了後の新フィールド確認:', {
          external_personality: formData.external_personality,
          internal_personality: formData.internal_personality,
          strengths: formData.strengths,
          weaknesses: formData.weaknesses,
          characterName: character.name
        });
      }, 100);

      // シルヴィア専用デバッグログ
      if (character.name === 'シルヴィア') {
        console.log('🔍 CharacterModal シルヴィア詳細:', {
          originalCharacter: {
            systemPrompt: character.systemPrompt,
            appearancePrompt: character.appearancePrompt,
            first_message: character.first_message
          },
          characterDef: characterDef,
          formDataSet: {
            systemPrompt: character.systemPrompt || '',
            appearancePrompt: characterDef?.appearance?.prompt || character.appearancePrompt || '',
            first_message: character.first_message || ''
          }
        });
      }
    } else {
      // 新規作成時はリセット
      setFormData({
        name: '',
        personality: '',
        appearance: '',
        speaking_style: '',
        scenario: '',
        first_message: '',
        nsfw_profile: '',
        tags: [],
        age: '',
        occupation: '',
        hobbies: [],
        likes: [],
        dislikes: [],
        background: '',
        avatar_url: '',
        systemPrompt: '',
        appearancePrompt: '',
        appearanceNegativePrompt: '',
        chatBackgroundUrl: '',
        trackers: []
      });
    }
  }, [character]);



  // アバター画像ファイルアップロード処理
  const handleAvatarFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // 画像を圧縮（ImageCompressor.compressImageメソッドを使用）
        const compressionResult = await ImageCompressor.compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          maxSizeKB: 500,
          outputFormat: 'image/jpeg'
        });
        
        // 圧縮された画像のBase64データを直接formDataに設定
        setFormData(prev => ({ ...prev, avatar_url: compressionResult.dataUrl }));

        // 可能ならcharacter.nameをキーにして即時保存（新規作成時はonSaveで再保存される）
        const charId = (character?.name || formData.name || '').trim();
        if (charId) {
          try {
            localStorage.setItem(`ai-chat-char-avatar:${charId}`, compressionResult.dataUrl);
          } catch (e) {
            console.warn('アバター保存に失敗（localStorage容量等）:', e);
          }
        }
        
        console.log(`アバター画像圧縮: ${Math.round(compressionResult.originalSize/1024)}KB → ${Math.round(compressionResult.compressedSize/1024)}KB (${compressionResult.compressionRatio}% 削減)`);
      } catch (error) {
        console.error('アバター画像の処理に失敗しました:', error);
        alert('画像の処理に失敗しました。別の画像を試してください。');
      }
    }
  };

  // チャット背景ファイルアップロード処理（画像・動画対応）
  const handleBackgroundFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // MP4動画ファイルの場合
        if (file.type === 'video/mp4') {
          console.log('🎥 MP4動画ファイルを処理中...');
          
          // 動画をBase64に変換
          const reader = new FileReader();
          reader.onload = async (e) => {
            const videoDataUrl = e.target?.result as string;
            
            // 動画サイズチェック（5MB以下に制限）
            const sizeInMB = file.size / (1024 * 1024);
            if (sizeInMB > 5) {
              alert('動画ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。');
              return;
            }
            
            // formDataに設定
            setFormData(prev => ({ ...prev, chatBackgroundUrl: videoDataUrl }));
            
            // 即時保存
            const charName = (character?.name || formData.name || '').trim();
            if (charName) {
              try {
                await BackgroundManager.saveCharacterBackground(charName, videoDataUrl);
              } catch (e) {
                console.warn('動画背景保存に失敗:', e);
              }
            }
            
            console.log(`🎥 MP4動画背景設定完了: ${Math.round(sizeInMB * 100) / 100}MB`);
          };
          
          reader.readAsDataURL(file);
        }
        // 画像ファイルの場合（既存処理）
        else if (file.type.startsWith('image/')) {
          console.log('🖼️ 画像ファイルを処理中...');
          
          // 画像を圧縮（背景画像用は少し大きめに設定）
          const compressionResult = await ImageCompressor.compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.7,
            maxSizeKB: 2000,
            outputFormat: 'image/jpeg'
          });
          
          // 圧縮された画像のBase64データを直接formDataに設定
          setFormData(prev => ({ ...prev, chatBackgroundUrl: compressionResult.dataUrl }));

          // 即時保存（既存キャラ名があれば）。新規時はonSaveで再保存
          const charName = (character?.name || formData.name || '').trim();
          if (charName) {
            try {
              await BackgroundManager.saveCharacterBackground(charName, compressionResult.dataUrl);
            } catch (e) {
              console.warn('背景保存に失敗:', e);
            }
          }
          
          console.log(`🖼️ 背景画像圧縮: ${Math.round(compressionResult.originalSize/1024)}KB → ${Math.round(compressionResult.compressedSize/1024)}KB (${compressionResult.compressionRatio}% 削減)`);
        }
        else {
          alert('対応していないファイル形式です。画像ファイル(.jpg, .png, .webp)またはMP4動画ファイルを選択してください。');
        }
      } catch (error) {
        console.error('背景ファイルの処理に失敗しました:', error);
        alert('ファイルの処理に失敗しました。別のファイルを試してください。');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('キャラクター名は必須です');
      return;
    }

    // nsfw_profileの処理：JSONとして有効なら解析、そうでなければ文字列として保持
    let processedNsfwProfile: string | Record<string, unknown> = '';
    try {
      const nsfwData = formData.nsfw_profile;
      if (typeof nsfwData === 'string' && nsfwData.trim().startsWith('{')) {
        processedNsfwProfile = JSON.parse(nsfwData);
      } else if (typeof nsfwData === 'string') {
        processedNsfwProfile = nsfwData;
      } else if (typeof nsfwData === 'object' && nsfwData !== null) {
        processedNsfwProfile = nsfwData as Record<string, unknown>;
      }
    } catch {
      // JSON解析に失敗した場合は文字列として保持
      console.log('nsfw_profileをJSONとして解析できませんでした。文字列として保存します。');
      processedNsfwProfile = typeof formData.nsfw_profile === 'string' ? formData.nsfw_profile : '';
    }

    const now = Date.now();

    const characterData: Character = {
      ...formData,
      first_message: formData.first_message?.trim() || '',
      nsfw_profile: processedNsfwProfile as string | Record<string, unknown>,
      // タイムスタンプを設定
      createdAt: character?.createdAt || now, // 既存キャラは作成日時を保持
      updatedAt: now // 更新日時は常に現在時刻
    } as Character;

    // 最終保存の確実化（アイコン/背景）
    try {
      const id = characterData.name.trim();
      if (id && characterData.avatar_url) {
        try {
          localStorage.setItem(`ai-chat-char-avatar:${id}`, characterData.avatar_url);
        } catch (e) {
          console.warn('アバター保存に失敗（localStorage容量等）:', e);
        }
      }
      if (id && characterData.chatBackgroundUrl) {
        try {
          await BackgroundManager.saveCharacterBackground(id, characterData.chatBackgroundUrl);
        } catch (e) {
          console.warn('背景保存に失敗:', e);
        }
      }
    } catch (e) {
      console.warn('最終保存時の例外:', e);
    }
    
    onSave(characterData);
    onClose();
  };



  const addArrayItem = (type: 'tags' | 'hobbies' | 'likes' | 'dislikes' | 'external_personality' | 'internal_personality' | 'strengths' | 'weaknesses', value: string, setValue: (val: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }));
      setValue('');
    }
  };

  const removeArrayItem = (type: 'tags' | 'hobbies' | 'likes' | 'dislikes' | 'external_personality' | 'internal_personality' | 'strengths' | 'weaknesses', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };





  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">{/* 完全不透明の背景に変更 */}
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

                  {/* アバター画像 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      アバター画像
                    </label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      
                      <div className="text-center text-gray-500 text-sm">または</div>
                      
                      <input
                        type="url"
                        value={formData.avatar_url || ''}
                        onChange={async (e) => {
                          const newUrl = e.target.value;
                          setFormData(prev => ({ ...prev, avatar_url: newUrl }));
                          
                          // URL入力時も即座に保存（キャラクター名があれば）
                          if (newUrl && (character?.name || formData.name)) {
                            const charId = character?.name || formData.name;
                            try {
                              localStorage.setItem(`ai-chat-char-avatar:${charId}`, newUrl);
                              console.log(`🌐 URLアバター設定を保存: ${charId} -> ${newUrl}`);
                            } catch (e) {
                              console.warn('URLアバター保存に失敗:', e);
                            }
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                        placeholder="アバター画像URL（https://example.com/avatar.jpg）"
                      />
                      
                      {formData.avatar_url && (
                        <div className="mt-2">
                          <img
                            src={formData.avatar_url}
                            alt="アバタープレビュー"
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, avatar_url: '' }))}
                            className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                          >
                            アバターをクリア
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* チャット背景画像 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      チャット背景画像
                    </label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleBackgroundFileUpload}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      
                      <div className="text-center text-gray-500 text-sm">または</div>
                      
                      <input
                        type="url"
                        value={formData.chatBackgroundUrl || ''}
                        onChange={async (e) => {
                          const newUrl = e.target.value;
                          setFormData(prev => ({ ...prev, chatBackgroundUrl: newUrl }));
                          
                          // URL入力時も即座に保存（キャラクター名があれば）
                          if (newUrl && (character?.name || formData.name)) {
                            const charName = character?.name || formData.name;
                            try {
                              await BackgroundManager.saveCharacterBackground(charName, newUrl);
                              console.log(`🌐 URL背景設定を保存: ${charName} -> ${newUrl}`);
                            } catch (e) {
                              console.warn('URL背景保存に失敗:', e);
                            }
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                        placeholder="背景画像URL（https://example.com/image.jpg または https://example.com/video.mp4）"
                      />
                      
                      {formData.chatBackgroundUrl && (
                        <div className="mt-2">
                          {formData.chatBackgroundUrl.includes('.mp4') || formData.chatBackgroundUrl.startsWith('data:video/') ? (
                            <video
                              src={formData.chatBackgroundUrl}
                              className="w-32 h-20 object-cover rounded-lg border"
                              muted
                              loop
                              autoPlay
                            />
                          ) : (
                            <img
                              src={formData.chatBackgroundUrl}
                              alt="背景プレビュー"
                              className="w-32 h-20 object-cover rounded-lg border"
                            />
                          )}
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, chatBackgroundUrl: '' }))}
                            className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                          >
                            背景をクリア
                          </button>
                        </div>
                      )}
                    </div>
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

                {/* 外面的パーソナリティ（文章入力） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    外面的パーソナリティ
                  </label>
                  <textarea
                    value={formData.external_personality}
                    onChange={e => setFormData(prev => ({ ...prev, external_personality: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    rows={2}
                    placeholder="他人から見た性格や印象を文章で記述してください"
                  />
                </div>

                {/* 内面的パーソナリティ（文章入力） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内面的パーソナリティ
                  </label>
                  <textarea
                    value={formData.internal_personality}
                    onChange={e => setFormData(prev => ({ ...prev, internal_personality: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    rows={2}
                    placeholder="内心の本当の性格や葛藤を文章で記述してください"
                  />
                </div>

                {/* 強み（文章入力） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    強み
                  </label>
                  <textarea
                    value={formData.strengths}
                    onChange={e => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
                    rows={2}
                    placeholder="キャラクターの強みや得意分野を文章で記述してください"
                  />
                </div>

                {/* 弱み（文章入力） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    弱み
                  </label>
                  <textarea
                    value={formData.weaknesses}
                    onChange={e => setFormData(prev => ({ ...prev, weaknesses: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800"
                    rows={2}
                    placeholder="キャラクターの弱みや苦手分野を文章で記述してください"
                  />
                </div>
              </section>
            </div>
          </div>

          {/* フルワイドセクション */}
          <div className="mt-8 space-y-6">
            {/* シナリオ */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">シナリオ・Background
</h3>
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
                    placeholder="キャラクターとの出会いのシチュエーションやBackground
設定を記述してください"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生い立ち・設定
                  </label>
                  <textarea
                    value={formData.background}
                    onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    rows={3}
                    placeholder="キャラクターの詳細な生い立ちや世界観を記述してください"
                  />
                </div>

                {/* システムプロンプト */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    システムプロンプト
                  </label>
                  <textarea
                    value={formData.systemPrompt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    rows={6}
                    placeholder="キャラクター専用のシステムプロンプトを入力"
                  />
                </div>

                {/* 外見プロンプト */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎨 外見プロンプト（英文）
                  </label>
                  <textarea
                    value={formData.appearancePrompt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, appearancePrompt: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    rows={4}
                    placeholder="1girl, detailed appearance description in English for AI image generation..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    画像生成用の英文プロンプト。より精密な画像を生成できます。
                  </p>
                </div>

                {/* ネガティブプロンプト */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🚫 ネガティブプロンプト（英文）
                  </label>
                  <textarea
                    value={formData.appearanceNegativePrompt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, appearanceNegativePrompt: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    rows={3}
                    placeholder="bad anatomy, low quality, blurry..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    避けたい要素を指定。空欄の場合はデフォルトが使用されます。
                  </p>
                </div>
              </div>
            </section>

            {/* 初回メッセージ */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare size={20} />
                初回メッセージ
              </h3>
              <div>
                <textarea
                  value={formData.first_message || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_message: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  rows={4}
                  placeholder="キャラクターの初回メッセージを入力してください"
                />
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
                  value={typeof formData.nsfw_profile === 'string' 
                    ? formData.nsfw_profile 
                    : (typeof formData.nsfw_profile === 'object' && formData.nsfw_profile !== null 
                      ? JSON.stringify(formData.nsfw_profile, null, 2) 
                      : '')}
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



            {/* トラッカーパラメータ */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                パラメータトラッカー
              </h3>
              <TrackerEditor
                trackers={formData.trackers || []}
                onChange={(trackers) => setFormData(prev => ({ ...prev, trackers }))}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
