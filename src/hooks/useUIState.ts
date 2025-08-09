/**
 * UI状態管理フック
 * 画面右上のアイコンやその他のUI要素の状態を管理
 */
import { useState } from 'react';

export function useUIState() {
  // 🚨 画面右上5つのアイコン関連State変数 - 重要機能保護開始 🚨
  // これらのstate変数は何度も消失しています。絶対に削除・変更しないでください！
  
  // 1. 詳細設定関連
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // 2. クイック設定関連  
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  // 3. チャット履歴関連
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  // 4. キャラクターギャラリー関連
  const [isCharacterGalleryOpen, setIsCharacterGalleryOpen] = useState(false);
  // 5. トラッカー表示制御
  const [showTrackers, setShowTrackers] = useState(true);
  
  // 🚨 画面右上5つのアイコン関連State変数 - 重要機能保護終了 🚨

  // Personaインポート/エクスポート
  const [isPersonaImportExportOpen, setIsPersonaImportExportOpen] = useState(false);

  return {
    // 画面右上のアイコン群
    isSettingsOpen,
    setIsSettingsOpen,
    isQuickSettingsOpen,
    setIsQuickSettingsOpen,
    isChatHistoryOpen,
    setIsChatHistoryOpen,
    isCharacterGalleryOpen,
    setIsCharacterGalleryOpen,
    showTrackers,
    setShowTrackers,

    // その他のUI
    isPersonaImportExportOpen,
    setIsPersonaImportExportOpen
  };
}