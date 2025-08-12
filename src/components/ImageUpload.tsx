'use client';

import { useState } from 'react';
import { Upload, Image, X, Save, Edit, Trash2 } from 'lucide-react';

interface ImageUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, imageType: 'icon' | 'background') => Promise<void>;
  currentCharacter: any;
  onUpdateCharacter: (character: any) => void;
}

export default function ImageUpload({
  isOpen,
  onClose,
  onUpload,
  currentCharacter,
  onUpdateCharacter
}: ImageUploadProps) {
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [dragOver, setDragOver] = useState<'icon' | 'background' | null>(null);

  if (!isOpen || !currentCharacter) return null;

  const handleFileSelect = async (file: File, imageType: 'icon' | 'background') => {
    const uploading = imageType === 'icon' ? setUploadingIcon : setUploadingBackground;
    uploading(true);
    
    try {
      await onUpload(file, imageType);
    } finally {
      uploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent, imageType: 'icon' | 'background') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await handleFileSelect(file, imageType);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent, imageType: 'icon' | 'background') => {
    e.preventDefault();
    setDragOver(imageType);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const removeImage = (imageType: 'icon' | 'background') => {
    const updatedCharacter = {
      ...currentCharacter,
      [imageType === 'icon' ? 'customIconUrl' : 'customBackgroundUrl']: undefined
    };
    onUpdateCharacter(updatedCharacter);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Image className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">
              {currentCharacter.name} の画像管理
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* アイコン画像 */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-200 mb-4 flex items-center space-x-2">
              <Image className="w-5 h-5" />
              <span>キャラクターアイコン</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 現在のアイコン表示 */}
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-300 mb-3">現在のアイコン</h4>
                <div className="relative inline-block">
                  {currentCharacter.customIconUrl ? (
                    <div className="relative">
                      <img
                        src={currentCharacter.customIconUrl}
                        alt={`${currentCharacter.name}のアイコン`}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                      />
                      <button
                        onClick={() => removeImage('icon')}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-white/20 flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* アップロードエリア */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">新しいアイコンをアップロード</h4>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                    dragOver === 'icon' 
                      ? 'border-blue-400 bg-blue-500/10' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onDrop={(e) => handleDrop(e, 'icon')}
                  onDragOver={(e) => handleDragOver(e, 'icon')}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300 mb-2">
                    ファイルをドラッグ&ドロップまたは
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'icon');
                      }}
                      className="hidden"
                    />
                    <span className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 rounded-lg transition-colors text-sm">
                      ファイルを選択
                    </span>
                  </label>
                </div>
                {uploadingIcon && (
                  <div className="mt-3 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-xs text-gray-400 mt-1">アップロード中...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 背景画像 */}
          <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-200 mb-4 flex items-center space-x-2">
              <Image className="w-5 h-5" />
              <span>背景画像</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 現在の背景表示 */}
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-300 mb-3">現在の背景</h4>
                <div className="relative inline-block">
                  {currentCharacter.customBackgroundUrl ? (
                    <div className="relative">
                      <img
                        src={currentCharacter.customBackgroundUrl}
                        alt={`${currentCharacter.name}の背景`}
                        className="w-32 h-20 rounded-lg object-cover border-2 border-white/20"
                      />
                      <button
                        onClick={() => removeImage('background')}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-20 rounded-lg bg-gray-700 border-2 border-white/20 flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* アップロードエリア */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">新しい背景をアップロード</h4>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                    dragOver === 'background' 
                      ? 'border-green-400 bg-green-500/10' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onDrop={(e) => handleDrop(e, 'background')}
                  onDragOver={(e) => handleDragOver(e, 'background')}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300 mb-2">
                    ファイルをドラッグ&ドロップまたは
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'background');
                      }}
                      className="hidden"
                    />
                    <span className="px-4 py-2 bg-green-500/30 hover:bg-green-500/40 text-green-200 rounded-lg transition-colors text-sm">
                      ファイルを選択
                    </span>
                  </label>
                </div>
                {uploadingBackground && (
                  <div className="mt-3 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400 mx-auto"></div>
                    <p className="text-xs text-gray-400 mt-1">アップロード中...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">📝 注意事項</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• 対応形式: JPG, PNG, WebP, GIF</li>
              <li>• 推奨サイズ: アイコン 256x256px以上、背景 1920x1080px以上</li>
              <li>• ファイルサイズ: 10MB以下</li>
              <li>• アップロード後、画像は自動的に最適化されます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
