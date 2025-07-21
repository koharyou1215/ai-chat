// 📝 メッセージ編集・要約システム コンポーネント
// ユーザー側・キャラクター側両方対応

'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Edit3, 
  FileText, 
  Save, 
  X, 
  RotateCcw, 
  Loader, 
  CheckCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  User,
  Bot,
  Zap
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  characterName?: string;
}

interface MessageEditSummaryProps {
  message: ChatMessage;
  onMessageUpdate: (messageId: string, newContent: string) => void;
  onClose: () => void;
  isOpen: boolean;
  currentCharacter?: any;
}

// 🎯 メイン編集・要約コンポーネント
export default function MessageEditSummarySystem({
  message,
  onMessageUpdate,
  onClose,
  isOpen,
  currentCharacter
}: MessageEditSummaryProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'summary'>('edit');
  const [editedContent, setEditedContent] = useState(message.content);
  const [originalContent] = useState(message.content);
  const [summaryContent, setSummaryContent] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [summaryType, setSummaryType] = useState<'concise' | 'detailed' | 'emotional'>('concise');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedContent(message.content);
    setHasChanges(false);
  }, [message.content]);

  useEffect(() => {
    setHasChanges(editedContent !== originalContent);
  }, [editedContent, originalContent]);

  // 📝 自動リサイズ
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editedContent]);

  // 💾 保存処理
  const handleSave = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      await onMessageUpdate(message.id, editedContent);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Message update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 🔄 リセット
  const handleReset = () => {
    setEditedContent(originalContent);
    setHasChanges(false);
  };

  // 📊 要約生成
  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const response = await fetch('/api/summarize-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message.content,
          role: message.role,
          summaryType,
          characterName: message.characterName || currentCharacter?.name,
          contextualInfo: {
            messageLength: message.content.length,
            wordCount: message.content.split(' ').length
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSummaryContent(data.summary);
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      setSummaryContent('要約の生成に失敗しました。');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 📄 要約を編集内容として適用
  const applySummaryAsEdit = () => {
    if (summaryContent) {
      setEditedContent(summaryContent);
      setActiveTab('edit');
    }
  };

  if (!isOpen) return null;

  const isUserMessage = message.role === 'user';
  const messageIcon = isUserMessage ? <User size={20} /> : <Bot size={20} />;
  const messageColor = isUserMessage ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
  const tabColor = isUserMessage ? 'blue' : 'green';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-gray-200">
        {/* 🎨 ヘッダー */}
        <div className={`${messageColor} p-6 border-b border-gray-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isUserMessage ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
              }`}>
                {messageIcon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {isUserMessage ? 'ユーザーメッセージ' : `${message.characterName || currentCharacter?.name || 'AI'}のメッセージ`}
                </h2>
                <p className="text-sm text-gray-600">
                  編集・要約・改善が可能です
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {hasChanges && (
                <div className="flex items-center gap-1 text-orange-600 text-sm">
                  <AlertCircle size={16} />
                  <span>未保存の変更</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* 📱 タブナビゲーション */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'edit'
                  ? `text-${tabColor}-600 border-b-2 border-${tabColor}-500 bg-white`
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Edit3 size={16} />
              メッセージ編集
              {hasChanges && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'summary'
                  ? `text-${tabColor}-600 border-b-2 border-${tabColor}-500 bg-white`
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileText size={16} />
              要約・分析
            </button>
          </div>
        </div>

        {/* 📄 メインコンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'edit' && (
            <div className="space-y-6">
              {/* 🔤 編集エリア */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージ内容を編集
                </label>
                <textarea
                  ref={textareaRef}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px] resize-none"
                  placeholder="メッセージ内容を入力してください..."
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>文字数: {editedContent.length}</span>
                  <span>行数: {editedContent.split('\n').length}</span>
                </div>
              </div>

              {/* 🎯 編集支援機能 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Sparkles size={16} />
                  編集支援機能
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button 
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    onClick={() => setEditedContent(editedContent + '\n\n')}
                  >
                    改行追加
                  </button>
                  <button 
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                    onClick={() => setEditedContent(editedContent.trim())}
                  >
                    空白除去
                  </button>
                  <button 
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    onClick={() => setEditedContent(editedContent.replace(/。/g, '。\n'))}
                  >
                    文区切り
                  </button>
                  <button 
                    className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                    onClick={() => setEditedContent(editedContent.replace(/\n+/g, ''))}
                  >
                    改行削除
                  </button>
                </div>
              </div>

              {/* 📊 変更統計 */}
              {hasChanges && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">変更の統計</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">文字数変化:</span>
                      <span className={`ml-1 font-medium ${
                        editedContent.length > originalContent.length ? 'text-green-600' : 
                        editedContent.length < originalContent.length ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {editedContent.length > originalContent.length ? '+' : ''}
                        {editedContent.length - originalContent.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">現在の文字数:</span>
                      <span className="ml-1 font-medium">{editedContent.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">行数:</span>
                      <span className="ml-1 font-medium">{editedContent.split('\n').length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">単語数:</span>
                      <span className="ml-1 font-medium">{editedContent.split(/\s+/).length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* 📊 要約タイプ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  要約の種類を選択
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSummaryType('concise')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      summaryType === 'concise' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <Zap className="mx-auto mb-2 text-blue-500" size={20} />
                      <div className="font-medium">簡潔要約</div>
                      <div className="text-sm text-gray-600">核心部分のみ</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSummaryType('detailed')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      summaryType === 'detailed' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <FileText className="mx-auto mb-2 text-green-500" size={20} />
                      <div className="font-medium">詳細要約</div>
                      <div className="text-sm text-gray-600">構造化された要約</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSummaryType('emotional')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      summaryType === 'emotional' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <MessageSquare className="mx-auto mb-2 text-purple-500" size={20} />
                      <div className="font-medium">感情要約</div>
                      <div className="text-sm text-gray-600">感情・トーン重視</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 🎯 要約生成ボタン */}
              <div className="text-center">
                <button
                  onClick={generateSummary}
                  disabled={isGeneratingSummary}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {isGeneratingSummary ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {isGeneratingSummary ? '要約生成中...' : '要約を生成'}
                </button>
              </div>

              {/* 📄 要約結果 */}
              {summaryContent && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800">生成された要約</h3>
                    <button
                      onClick={applySummaryAsEdit}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      編集に適用
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{summaryContent}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    文字数: {summaryContent.length} | 
                    圧縮率: {Math.round((1 - summaryContent.length / message.content.length) * 100)}%
                  </div>
                </div>
              )}

              {/* 📈 元メッセージ情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">元メッセージ情報</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">文字数:</span>
                    <span className="ml-1 font-medium">{message.content.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">行数:</span>
                    <span className="ml-1 font-medium">{message.content.split('\n').length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">単語数:</span>
                    <span className="ml-1 font-medium">{message.content.split(/\s+/).length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">送信者:</span>
                    <span className="ml-1 font-medium">
                      {isUserMessage ? 'ユーザー' : message.characterName || 'AI'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🔧 フッターアクション */}
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeTab === 'edit' && hasChanges && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw size={16} />
                  リセット
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </button>
              {activeTab === 'edit' && (
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSaving ? '保存中...' : '保存'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
