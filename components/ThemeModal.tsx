'use client';

import { useState, useRef } from 'react';
import { X, Palette, Upload, Trash2, Eye, Check, Zap, Info } from 'lucide-react';

import { defaultThemes, ThemeManager } from '../lib/themes';
import { ImageCompressor } from '../lib/imageCompressor';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  customBackground?: string;
  onThemeChange: (themeId: string, customBackground?: string) => void;
}

export default function ThemeModal({
  isOpen,
  onClose,
  currentTheme,
  customBackground,
  onThemeChange
}: ThemeModalProps) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [previewBackground, setPreviewBackground] = useState<string | undefined>(customBackground);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: string;
    compressedSize: string;
    compressionRatio: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    setPreviewBackground(undefined); // カスタム背景をリセット
  };

  const handleApplyTheme = () => {
    onThemeChange(selectedTheme, previewBackground);
    ThemeManager.saveTheme(selectedTheme, previewBackground);
    onClose();
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setIsCompressing(true);
    setCompressionInfo(null);

    try {
      // 最適な形式を自動選択
      const optimalFormat = ImageCompressor.getOptimalFormat(file);
      
      // 自動圧縮実行
      const result = await ImageCompressor.compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        maxSizeKB: 3000, // 3MB
        outputFormat: optimalFormat
      });

      // 圧縮結果を設定
      setPreviewBackground(result.dataUrl);
      setSelectedTheme('custom');
      
      // 圧縮情報を表示
      setCompressionInfo({
        originalSize: ImageCompressor.formatFileSize(result.originalSize),
        compressedSize: ImageCompressor.formatFileSize(result.compressedSize),
        compressionRatio: result.compressionRatio
      });

    } catch (error) {
      console.error('画像圧縮エラー:', error);
      alert('画像の処理中にエラーが発生しました。別の画像をお試しください。');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeCustomBackground = () => {
    setPreviewBackground(undefined);
    setCompressionInfo(null);
    if (selectedTheme === 'custom') {
      setSelectedTheme('ocean-sunset');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Palette size={28} />
            テーマ・背景設定
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="space-y-8">
            
            {/* カスタム背景アップロード */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Upload size={20} />
                カスタム背景画像
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                  自動圧縮
                </span>
              </h3>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {isCompressing ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                      <Zap className="animate-spin text-blue-500 mb-2" size={48} />
                      <p className="text-lg text-gray-600 font-medium">画像を自動圧縮中...</p>
                      <p className="text-sm text-gray-500">最適なサイズに調整しています</p>
                    </div>
                  </div>
                ) : previewBackground ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={previewBackground}
                        alt="カスタム背景プレビュー"
                        className="w-32 h-20 object-cover rounded-lg shadow-md"
                      />
                      <button
                        onClick={removeCustomBackground}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">カスタム背景が設定されました</p>
                      {compressionInfo && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                          <div className="flex items-center gap-1 text-green-700 font-medium">
                            <Info size={14} />
                            自動圧縮完了
                          </div>
                          <div className="text-xs text-green-600 space-y-1">
                            <div>元のサイズ: {compressionInfo.originalSize}</div>
                            <div>圧縮後: {compressionInfo.compressedSize}</div>
                            <div>圧縮率: {compressionInfo.compressionRatio}%</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="mx-auto text-gray-400" size={48} />
                    <div>
                      <p className="text-lg text-gray-600 mb-2">
                        画像をドラッグ&ドロップ または
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        ファイルを選択
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF形式をサポート（自動圧縮機能付き）
                      <br />
                      どんなサイズでもOK！自動で最適化されます
                    </p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
              </div>
            </section>

            {/* プリセットテーマ */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Palette size={20} />
                プリセットテーマ
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {defaultThemes.map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      selectedTheme === theme.id
                        ? 'border-blue-500 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* テーマプレビュー */}
                    <div
                      className="w-full h-24"
                      style={{ background: theme.preview }}
                    >
                      {selectedTheme === theme.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    
                    {/* テーマ名 */}
                    <div className="p-3 bg-white">
                      <h4 className="font-medium text-gray-800 text-sm text-center">
                        {theme.name}
                      </h4>
                    </div>
                  </div>
                ))}
                
                {/* カスタム背景テーマ */}
                {previewBackground && (
                  <div
                    onClick={() => setSelectedTheme('custom')}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      selectedTheme === 'custom'
                        ? 'border-blue-500 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* カスタム背景プレビュー */}
                    <div className="w-full h-24 relative">
                      <img
                        src={previewBackground}
                        alt="カスタム背景"
                        className="w-full h-full object-cover"
                      />
                      {selectedTheme === 'custom' && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    
                    {/* テーマ名 */}
                    <div className="p-3 bg-white">
                      <h4 className="font-medium text-gray-800 text-sm text-center">
                        カスタム背景
                      </h4>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* プレビューエリア */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Eye size={20} />
                プレビュー
              </h3>
              
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className="h-32 relative"
                  style={
                    selectedTheme === 'custom' && previewBackground
                      ? {
                          backgroundImage: `url(${previewBackground})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }
                      : {
                          background: defaultThemes.find(t => t.id === selectedTheme)?.background || defaultThemes[0].background
                        }
                  }
                >
                  {/* プレビューサイドバー */}
                  <div 
                    className="absolute left-0 top-0 w-20 h-full"
                    style={{
                      background: defaultThemes.find(t => t.id === selectedTheme)?.sidebar || defaultThemes[0].sidebar
                    }}
                  >
                    <div className="p-2">
                      <div className="w-12 h-2 bg-white/50 rounded mb-2"></div>
                      <div className="w-8 h-1 bg-white/30 rounded mb-1"></div>
                      <div className="w-10 h-1 bg-white/30 rounded"></div>
                    </div>
                  </div>
                  
                  {/* プレビューチャット */}
                  <div className="absolute right-4 top-4 space-y-2">
                    <div 
                      className="px-3 py-1 rounded-lg text-xs text-white max-w-32"
                      style={{
                        background: defaultThemes.find(t => t.id === selectedTheme)?.bubble.user || defaultThemes[0].bubble.user
                      }}
                    >
                      ユーザーメッセージ
                    </div>
                    <div 
                      className="px-3 py-1 rounded-lg text-xs text-gray-800 max-w-32"
                      style={{
                        background: defaultThemes.find(t => t.id === selectedTheme)?.bubble.ai || defaultThemes[0].bubble.ai
                      }}
                    >
                      AIの返答
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50/50">
          <div className="text-sm text-gray-600">
            選択中: {
              selectedTheme === 'custom' 
                ? 'カスタム背景' 
                : defaultThemes.find(t => t.id === selectedTheme)?.name || '不明'
            }
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleApplyTheme}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              適用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 