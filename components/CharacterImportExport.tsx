'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileText, Image, Package, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Character } from '../types/character';

interface CharacterImportExportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (characters: Character[]) => void;
  allCharacters: Character[];
}

export default function CharacterImportExport({ 
  isOpen, 
  onClose, 
  onImport, 
  allCharacters 
}: CharacterImportExportProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const importedCharacters: Character[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      try {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const content = await readFileAsText(file);
          const data = JSON.parse(content);
          
          // 単一キャラクター or 複数キャラクター配列を処理
          const characters = Array.isArray(data) ? data : [data];
          
          for (const char of characters) {
            const validatedCharacter = validateAndNormalizeCharacter(char, file.name);
            if (validatedCharacter) {
              importedCharacters.push(validatedCharacter);
            }
          }
        } else if (file.name.endsWith('.png') || file.name.endsWith('.webp')) {
          // CharacterAI/TavernAI形式の画像メタデータを読み取り
          const character = await extractCharacterFromImage(file);
          if (character) {
            importedCharacters.push(character);
          } else {
            errors.push(`${file.name}: 画像にキャラクターデータが見つかりませんでした`);
          }
        } else {
          errors.push(`${file.name}: サポートされていないファイル形式です`);
        }
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : '読み込みエラー'}`);
      }
    }

    if (importedCharacters.length > 0) {
      onImport(importedCharacters);
      setImportStatus({
        type: 'success',
        message: `${importedCharacters.length}個のキャラクターをインポートしました${errors.length > 0 ? `（${errors.length}個のエラー）` : ''}`
      });
    } else {
      setImportStatus({
        type: 'error',
        message: errors.length > 0 ? errors.join('\n') : 'インポートできるキャラクターが見つかりませんでした'
      });
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
      reader.readAsText(file);
    });
  };

  const extractCharacterFromImage = async (file: File): Promise<Character | null> => {
    // PNG/WebPのメタデータからキャラクター情報を抽出
    // 実装注: 実際のメタデータ抽出は複雑なため、基本的な処理のみ
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const text = new TextDecoder().decode(uint8Array);
      
      // TavernAI/CharacterAI形式のJSONを検索
      const jsonMatch = text.match(/\{[\s\S]*"name"[\s\S]*\}/);
      if (jsonMatch) {
        const characterData = JSON.parse(jsonMatch[0]);
        return validateAndNormalizeCharacter(characterData, file.name);
      }
    } catch (error) {
      console.error('画像メタデータ抽出エラー:', error);
    }
    return null;
  };

  const validateAndNormalizeCharacter = (data: any, fileName: string): Character | null => {
    try {
      // 基本的なバリデーション
      if (!data.name) {
        throw new Error('キャラクター名が必要です');
      }

      // 様々な形式を統一形式に変換
      const character: Character = {
        'file-name': data['file-name'] || fileName,
        name: data.name,
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
        first_message: Array.isArray(data.first_message) 
          ? data.first_message 
          : (data.first_mes || data.greeting ? [data.first_mes || data.greeting] : ['']),
        
        // 基本フィールド
        personality: data.personality || data.description || '',
        appearance: data.appearance || '',
        speaking_style: data.speaking_style || '',
        scenario: data.scenario || data.world_scenario || '',
        nsfw_profile: data.nsfw_profile || '',
        age: data.age || '',
        occupation: data.occupation || '',
        hobbies: Array.isArray(data.hobbies) ? data.hobbies : [],
        likes: Array.isArray(data.likes) ? data.likes : [],
        dislikes: Array.isArray(data.dislikes) ? data.dislikes : [],
        background: data.background || '',
        avatar_url: data.avatar_url || '',

        // 既存の複雑な構造がある場合は保持
        character_definition: data.character_definition,
        trackers: data.trackers,
        example_dialogue: data.example_dialogue
      };

      return character;
    } catch (error) {
      console.error(`キャラクター検証エラー (${fileName}):`, error);
      return null;
    }
  };

  const handleExport = (format: 'json' | 'backup') => {
    const charactersToExport = selectedCharacters.length > 0 
      ? allCharacters.filter(char => selectedCharacters.includes(char.name))
      : allCharacters;

    if (charactersToExport.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'エクスポートするキャラクターを選択してください'
      });
      return;
    }

    const exportData = format === 'backup' 
      ? { 
          version: '1.0',
          exportDate: new Date().toISOString(),
          characters: charactersToExport 
        }
      : charactersToExport.length === 1 ? charactersToExport[0] : charactersToExport;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'backup' 
      ? `characters-backup-${new Date().toISOString().split('T')[0]}.json`
      : `${charactersToExport.length === 1 ? charactersToExport[0].name : 'characters'}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setImportStatus({
      type: 'success',
      message: `${charactersToExport.length}個のキャラクターをエクスポートしました`
    });
  };

  const toggleCharacterSelection = (characterName: string) => {
    setSelectedCharacters(prev => 
      prev.includes(characterName)
        ? prev.filter(name => name !== characterName)
        : [...prev, characterName]
    );
  };

  const selectAllCharacters = () => {
    setSelectedCharacters(allCharacters.map(char => char.name));
  };

  const clearSelection = () => {
    setSelectedCharacters([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Package size={28} />
            キャラクター管理
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Upload size={20} className="inline mr-2" />
            インポート
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Download size={20} className="inline mr-2" />
            エクスポート
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'import' ? (
            <div className="space-y-6">
              {/* ファイル選択 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">ファイルを選択</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".json,.png,.webp"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Upload size={20} />
                    ファイルを選択
                  </button>
                  <p className="mt-4 text-gray-600">
                    JSON、PNG、WebPファイルをサポート<br />
                    複数ファイルの一括インポートも可能
                  </p>
                </div>
              </div>

              {/* サポート形式 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">サポート形式</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={20} className="text-blue-500" />
                      <span className="font-medium">JSON形式</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      標準的なキャラクター定義ファイル
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Image size={20} className="text-green-500" />
                      <span className="font-medium">TavernAI形式</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      PNG/WebP画像のメタデータ
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Package size={20} className="text-purple-500" />
                      <span className="font-medium">バックアップ形式</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      複数キャラクターの一括データ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* エクスポート形式選択 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">エクスポート形式</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleExport('json')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={20} className="text-blue-500" />
                      <span className="font-medium">JSON形式</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      選択したキャラクターを標準JSON形式でエクスポート
                    </p>
                  </button>
                  <button
                    onClick={() => handleExport('backup')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Package size={20} className="text-purple-500" />
                      <span className="font-medium">バックアップ形式</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      メタデータ付きの完全バックアップファイル
                    </p>
                  </button>
                </div>
              </div>

              {/* キャラクター選択 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">キャラクター選択</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllCharacters}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      全選択
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      選択解除
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {allCharacters.map((character) => (
                    <label
                      key={character.name}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCharacters.includes(character.name)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCharacters.includes(character.name)}
                        onChange={() => toggleCharacterSelection(character.name)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{character.name}</div>
                        <div className="text-sm text-gray-600">
                          {character.tags.slice(0, 2).join(', ')}
                          {character.tags.length > 2 && ` +${character.tags.length - 2}`}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {selectedCharacters.length > 0 
                    ? `${selectedCharacters.length}個のキャラクターが選択されています`
                    : '選択なしの場合、全キャラクターがエクスポートされます'
                  }
                </p>
              </div>
            </div>
          )}

          {/* ステータスメッセージ */}
          {importStatus.type && (
            <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
              importStatus.type === 'success' ? 'bg-green-50 text-green-800' :
              importStatus.type === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {importStatus.type === 'success' ? <CheckCircle size={20} className="flex-shrink-0 mt-0.5" /> :
               importStatus.type === 'error' ? <AlertCircle size={20} className="flex-shrink-0 mt-0.5" /> :
               <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />}
              <div className="whitespace-pre-wrap">{importStatus.message}</div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
} 