import React, { useState } from 'react';

interface SimpleBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  customBackground?: string;
  onBackgroundChange: (background?: string) => void;
}

const SimpleBackgroundModal: React.FC<SimpleBackgroundModalProps> = ({
  isOpen,
  onClose,
  customBackground,
  onBackgroundChange
}) => {
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // ファイルをBase64に変換
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onBackgroundChange(result);
        localStorage.setItem('customBackground', result);
        onClose();
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('背景アップロードエラー:', error);
      setIsUploading(false);
    }
  };

  const handleRemoveBackground = () => {
    onBackgroundChange(undefined);
    localStorage.removeItem('customBackground');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">背景設定</h2>
        
        <div className="space-y-4">
          {/* 現在の背景 */}
          {customBackground && (
            <div>
              <p className="text-sm text-gray-600 mb-2">現在の背景:</p>
              <div 
                className="w-full h-32 rounded-lg bg-cover bg-center border"
                style={{ backgroundImage: `url(${customBackground})` }}
              />
            </div>
          )}

          {/* アップロードボタン */}
          <div>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-400 transition-colors">
                {isUploading ? (
                  <p className="text-gray-600">アップロード中...</p>
                ) : (
                  <>
                    <p className="text-gray-600">画像をアップロード</p>
                    <p className="text-sm text-gray-400 mt-1">クリックして画像を選択</p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* 背景削除 */}
          {customBackground && (
            <button
              onClick={handleRemoveBackground}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              背景を削除（白背景に戻す）
            </button>
          )}
        </div>

        {/* 閉じるボタン */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleBackgroundModal;
