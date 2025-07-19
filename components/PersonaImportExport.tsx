'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileText, Package, AlertCircle, CheckCircle, X } from 'lucide-react';
import { UserPersona } from '../types/character';

interface PersonaImportExportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (personas: UserPersona[]) => void;
  allPersonas: UserPersona[];
}

export default function PersonaImportExport({ 
  isOpen, 
  onClose, 
  onImport, 
  allPersonas 
}: PersonaImportExportProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const importedPersonas: UserPersona[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      try {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const content = await readFileAsText(file);
          const data = JSON.parse(content);
          
          // 単一Persona or 複数Persona配列を処理
          const personas = Array.isArray(data) ? data : [data];
          
          for (const persona of personas) {
            const validatedPersona = validateAndNormalizePersona(persona, file.name);
            if (validatedPersona) {
              importedPersonas.push(validatedPersona);
            }
          }
        } else {
          errors.push(`${file.name}: JSONファイルのみサポートされています`);
        }
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : '読み込みエラー'}`);
      }
    }

    if (importedPersonas.length > 0) {
      onImport(importedPersonas);
      setImportStatus({
        type: 'success',
        message: `${importedPersonas.length}個のPersonaをインポートしました${errors.length > 0 ? `（${errors.length}個のエラー）` : ''}`
      });
    } else {
      setImportStatus({
        type: 'error',
        message: errors.length > 0 ? errors.join('\n') : 'インポートできるPersonaが見つかりませんでした'
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

  const validateAndNormalizePersona = (data: unknown, fileName: string): UserPersona | null => {
    try {
      // 型ガード
      if (typeof data !== 'object' || data === null) {
        throw new Error('無効なデータ形式です');
      }
      
      const obj = data as Record<string, unknown>;
      
      // 基本的なバリデーション
      if (!obj.name || typeof obj.name !== 'string') {
        throw new Error('Persona名が必要です');
      }

      // 様々な形式を統一形式に変換
      const persona: UserPersona = {
        id: (typeof obj.id === 'string' ? obj.id : '') || `persona_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: obj.name,
        likes: Array.isArray(obj.likes) ? obj.likes : (obj.likes ? [String(obj.likes)] : []),
        dislikes: Array.isArray(obj.dislikes) ? obj.dislikes : (obj.dislikes ? [String(obj.dislikes)] : []),
        other_settings: (typeof obj.other_settings === 'string' ? obj.other_settings : '') || 
                       (typeof obj.settings === 'string' ? obj.settings : '') ||
                       (typeof obj.description === 'string' ? obj.description : '')
      };

      return persona;
    } catch (error) {
      console.error(`Persona検証エラー (${fileName}):`, error);
      return null;
    }
  };

  const handleExport = (format: 'json' | 'backup') => {
    const personasToExport = selectedPersonas.length > 0 
      ? allPersonas.filter(persona => selectedPersonas.includes(persona.id))
      : allPersonas;

    if (personasToExport.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'エクスポートするPersonaを選択してください'
      });
      return;
    }

    const exportData = format === 'backup' 
      ? { 
          version: '1.0',
          type: 'personas',
          exportDate: new Date().toISOString(),
          personas: personasToExport 
        }
      : personasToExport.length === 1 ? personasToExport[0] : personasToExport;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'backup' 
      ? `personas-backup-${new Date().toISOString().split('T')[0]}.json`
      : `${personasToExport.length === 1 ? personasToExport[0].name : 'personas'}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setImportStatus({
      type: 'success',
      message: `${personasToExport.length}個のPersonaをエクスポートしました`
    });
  };

  const togglePersonaSelection = (personaId: string) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const selectAllPersonas = () => {
    setSelectedPersonas(allPersonas.map(persona => persona.id));
  };

  const clearSelection = () => {
    setSelectedPersonas([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Package size={28} />
            Persona管理
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
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Upload size={20} />
                    JSONファイルを選択
                  </button>
                  <p className="mt-4 text-gray-600">
                    JSON形式のPersonaファイルをサポート<br />
                    複数ファイルの一括インポートも可能
                  </p>
                </div>
              </div>

              {/* サンプル形式 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">JSON形式例</h3>
                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-700">
{`{
  "name": "田中太郎",
  "description": "明るく好奇心旺盛な大学生",
  "likes": ["アニメ", "ゲーム", "ラーメン"],
  "dislikes": ["早起き", "勉強"],
  "other_settings": "関西弁で話す、ツッコミが上手"
}`}
                  </pre>
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
                      選択したPersonaを標準JSON形式でエクスポート
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

              {/* Persona選択 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Persona選択</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllPersonas}
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
                  {allPersonas.map((persona) => (
                    <label
                      key={persona.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPersonas.includes(persona.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPersonas.includes(persona.id)}
                        onChange={() => togglePersonaSelection(persona.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{persona.name}</div>
                        <div className="text-sm text-gray-600 truncate">
                          {persona.other_settings || '設定なし'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {selectedPersonas.length > 0 
                    ? `${selectedPersonas.length}個のPersonaが選択されています`
                    : '選択なしの場合、全Personaがエクスポートされます'
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