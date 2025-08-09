'use client';

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    console.log('🎨 ThemeInitializer: useEffect実行開始');
    
    import('../lib/themes').then(({ ThemeManager, getDefaultTheme }) => {
      console.log('✅ themes.tsモジュール読み込み成功');
      
      const savedTheme = localStorage.getItem('ai-chat-theme');
      console.log('📋 保存されたテーマ:', savedTheme);
      
      if (savedTheme) {
        try {
          const themeData = JSON.parse(savedTheme);
          console.log('✅ テーマデータ解析成功:', themeData);
          
          // currentThemeが文字列（ID）の場合は、テーマオブジェクトを検索
          if (typeof themeData.currentTheme === 'string') {
            console.log('📋 テーマIDから検索:', themeData.currentTheme);
            import('../lib/themes').then(({ defaultThemes }) => {
              const foundTheme = defaultThemes.find(theme => theme.id === themeData.currentTheme);
              
              if (!foundTheme) {
                console.log('❌ テーマIDが見つかりません、デフォルトテーマを使用');
                ThemeManager.applyTheme(getDefaultTheme(), themeData.customBackground);
              } else {
                console.log('✅ テーマオブジェクト取得成功:', foundTheme.name);
                ThemeManager.applyTheme(foundTheme, themeData.customBackground);
              }
              console.log('✅ 保存テーマ適用完了');
            });
          } else {
            // currentThemeがオブジェクトの場合はそのまま使用
            const themeToApply = themeData.currentTheme || getDefaultTheme();
            ThemeManager.applyTheme(themeToApply, themeData.customBackground);
            console.log('✅ 保存テーマ適用完了');
          }
        } catch (error) {
          console.error('❌ テーマデータ解析エラー:', error);
          ThemeManager.applyTheme(getDefaultTheme());
          console.log('✅ デフォルトテーマ適用完了（フォールバック）');
        }
      } else {
        console.log('📋 初回アクセス: デフォルトテーマを適用');
        const defaultTheme = getDefaultTheme();
        ThemeManager.applyTheme(defaultTheme);
        
        // LocalStorageに保存
        localStorage.setItem('ai-chat-theme', JSON.stringify({
          currentTheme: defaultTheme,
          customBackground: null
        }));
        console.log('✅ デフォルトテーマ適用完了');
      }
      
      // CSS変数の確認
      const root = document.documentElement;
      const style = getComputedStyle(root);
      const bgVar = style.getPropertyValue('--theme-background');
      console.log('📋 適用後のCSS変数確認: --theme-background =', bgVar || '未設定');
      
    }).catch(error => {
      console.error('❌ themes.tsモジュール読み込みエラー:', error);
    });
  }, []);

  return null; // このコンポーネントは何もレンダリングしない
}
