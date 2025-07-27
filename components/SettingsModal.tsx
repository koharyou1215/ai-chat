'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { AppSettings } from '../types/app'; // types/app からインポートするように修正
import { ElevenLabsVoice } from '../lib/voiceManager';
import ApiSettings from './settings/ApiSettings';
import ModelSettings from './settings/ModelSettings';
import ChatSettings from './settings/ChatSettings';
import VoiceSettings from './settings/VoiceSettings';
import UISettings from './settings/UISettings';
import PromptSettings from './settings/PromptSettings';
import RuleSettings from './settings/RuleSettings';
import BackupAndOtherSettings from './settings/BackupAndOtherSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [formSettings, setFormSettings] = useState<AppSettings>(settings);
  const [voiceList, setVoiceList] = useState<ElevenLabsVoice[]>([]);

  // ユーザー指定のカスタム音声プリセット
  const customVoices: ElevenLabsVoice[] = [
    { voice_id: '4lOQ7A2l7HPuG7UIHiKA', name: 'アニボ2', category: 'custom' },
    { voice_id: '8EkOjt4xTPGMclNlh1pk', name: 'アニポ1', category: 'custom' },
    { voice_id: 'rbsFyUZnrPQVns8cpVRF', name: '優しく温かみのある日本人女性', category: 'custom' },
    { voice_id: 'XMdATmXVAFIlBM5jzss7', name: '種崎明るい', category: 'custom' },
    { voice_id: 'U4ogK8bgSusDpge7RLA2', name: 'morioki', category: 'custom' },
    { voice_id: 'mtbZa13Y8veKZNZ2Qixj', name: 'kyoko', category: 'custom' },
  ];

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  // ElevenLabsの音声リストを取得
  // useEffect(() => {
  //   const fetchVoices = async () => {
  //     try {
  //       if (formSettings.elevenLabsApiKey) {
  //         // APIキーをVoiceManagerに設定
  //         VoiceManager.setApiKey(formSettings.elevenLabsApiKey);
  //         
  //         const voices = await VoiceManager.getAvailableVoices();
  //         // APIから取得した音声とカスタムをマージ（重複除外）
  //         const merged = [...customVoices, ...voices.filter(v => !customVoices.some(c => c.voice_id === v.voice_id))];
  //         setVoiceList(merged);
  //       }
  //     } catch (e) {
  //       console.warn('音声リスト取得失敗:', e);
  //     }
  //   };
  //   fetchVoices();
  // }, [formSettings.elevenLabsApiKey, customVoices, setVoiceList]);

  const handleSave = () => {
    console.log('設定保存開始 - 保存する設定:', formSettings);
    onSave(formSettings);
    console.log('設定保存完了');
    onClose();
  };

  const handleReset = () => {
    setFormSettings(settings);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">設定</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* 設定内容 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-8">
              {/* API設定 */}
              <ApiSettings formSettings={formSettings} setFormSettings={setFormSettings} />

              {/* モデル設定 */}
              <ModelSettings formSettings={formSettings} setFormSettings={setFormSettings} />

              {/* チャット設定 */}
              <ChatSettings formSettings={formSettings} setFormSettings={setFormSettings} />

              {/* 音声設定 */}
              <VoiceSettings
                formSettings={formSettings}
                setFormSettings={setFormSettings}
                voiceList={voiceList}
                setVoiceList={setVoiceList}
                customVoices={customVoices}
              />

              {/* UI設定 */}
              <UISettings formSettings={formSettings} setFormSettings={setFormSettings} />

              {/* プロンプト設定 */}
              <PromptSettings formSettings={formSettings} setFormSettings={setFormSettings} />

              {/* ルール設定 */}
              <RuleSettings />

              {/* バックアップと復元 */}
              <BackupAndOtherSettings formSettings={formSettings} setFormSettings={setFormSettings} onClose={onClose} />
            </div>
          </div>

          {/* フッター */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              リセット
            </button>
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
    </>
  );
}