'use client';

import { useEffect } from 'react';
import { ThemeManager, getDefaultTheme } from '../lib/themes';

export default function ThemeInitializer() {
  useEffect(() => {
    const initTheme = async () => {
      try {
        console.log(' テーマシステム初期化開始...');
        
        // LocalStorageからテーマ設定を読み込み
        const savedTheme = localStorage.getItem('ai-chat-theme');
        
        if (savedTheme) {
          try {
            const themeData = JSON.parse(savedTheme);
            console.log(' 保存されたテーマ設定:', themeData);
            
            if (themeData.currentTheme) {
              ThemeManager.applyTheme(themeData.currentTheme, themeData.customBackground);
              console.log(' 保存されたテーマを適用しました');
            } else {
              // デフォルトテーマを適用
              const defaultTheme = getDefaultTheme();
              ThemeManager.applyTheme(defaultTheme);
              console.log(' デフォルトテーマを適用しました');
            }
          } catch (parseError) {
            console.error(' テーマ設定の解析エラー:', parseError);
            // フォールバック: デフォルトテーマを適用
            const defaultTheme = getDefaultTheme();
            ThemeManager.applyTheme(defaultTheme);
          }
        } else {
          // 初回アクセス: デフォルトテーマを適用
          const defaultTheme = getDefaultTheme();
          ThemeManager.applyTheme(defaultTheme);
          console.log(' 初回アクセス: デフォルトテーマを適用しました');
          
          // LocalStorageに保存
          localStorage.setItem('ai-chat-theme', JSON.stringify({
            currentTheme: defaultTheme,
            customBackground: null
          }));
        }
        
        console.log(' テーマシステム初期化完了');
      } catch (error) {
        console.error(' テーマシステム初期化エラー:', error);
      }
    };
    
    // DOM読み込み完了後に実行
    if (typeof window !== 'undefined') {
      initTheme();
    }
  }, []);

  return null; // このコンポーネントは何も表示しない
}
