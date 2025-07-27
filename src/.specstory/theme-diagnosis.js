// テーマ変更診断ツール - ブラウザのコンソールで実行
(function() {
    console.log('🔍 === テーマ変更診断開始 ===');
    
    // 1. CSS変数の現在の状態
    const root = document.documentElement;
    const style = getComputedStyle(root);
    
    console.log('📋 現在のCSS変数:');
    [
        '--theme-background',
        '--theme-background-image',
        '--theme-primary',
        '--theme-secondary'
    ].forEach(varName => {
        const value = style.getPropertyValue(varName);
        console.log((value ? '✅' : '❌') + ' ' + varName + ': ' + (value || '未設定'));
    });
    
    // 2. LocalStorageの確認
    console.log('\n📋 LocalStorage確認:');
    const themeData = localStorage.getItem('ai-chat-theme');
    if (themeData) {
        try {
            const parsed = JSON.parse(themeData);
            console.log('✅ ai-chat-theme:', parsed);
        } catch (e) {
            console.log('❌ JSON解析エラー:', themeData);
        }
    } else {
        console.log('❌ ai-chat-theme: 未設定');
    }
    
    // 3. テーマ手動適用テスト
    console.log('\n🧪 テーマ手動適用テスト...');
    
    // テスト用テーマ関数を定義
    window.testTheme = function(themeName) {
        console.log('🎨 テーマ適用テスト:', themeName);
        
        // 直接CSS変数を設定
        switch(themeName) {
            case 'ocean':
                root.style.setProperty('--theme-background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
                root.style.setProperty('--theme-primary', '#667eea');
                root.style.setProperty('--theme-secondary', '#764ba2');
                break;
            case 'sunset':
                root.style.setProperty('--theme-background', 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)');
                root.style.setProperty('--theme-primary', '#ff9a9e');
                root.style.setProperty('--theme-secondary', '#fecfef');
                break;
            case 'forest':
                root.style.setProperty('--theme-background', 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)');
                root.style.setProperty('--theme-primary', '#134e5e');
                root.style.setProperty('--theme-secondary', '#71b280');
                break;
            default:
                console.log('❌ 不明なテーマ:', themeName);
                return;
        }
        
        // bodyの背景も更新
        document.body.style.background = 'var(--theme-background)';
        
        console.log('✅ テーマ適用完了:', themeName);
        
        // LocalStorageに保存
        const testThemeData = {
            currentTheme: {
                id: themeName,
                name: themeName,
                background: getComputedStyle(root).getPropertyValue('--theme-background')
            },
            customBackground: null
        };
        localStorage.setItem('ai-chat-theme', JSON.stringify(testThemeData));
        console.log('✅ LocalStorageに保存しました');
    };
    
    // 4. ThemeManagerの確認
    console.log('\n📋 ThemeManager確認...');
    import('../../lib/themes').then(({ ThemeManager, getDefaultTheme, defaultThemes }) => {
        console.log('✅ themes.tsモジュール読み込み成功');
        console.log('📋 利用可能なテーマ:', defaultThemes.length + '個');
        defaultThemes.forEach((theme, index) => {
            console.log('  ' + (index + 1) + '. ' + theme.name + ' (' + theme.id + ')');
        });
        
        // テーマ適用関数を公開
        window.applyThemeById = function(themeId) {
            const theme = defaultThemes.find(t => t.id === themeId);
            if (theme) {
                console.log('🎨 公式テーマ適用:', theme.name);
                ThemeManager.applyTheme(theme);
                
                // LocalStorageに保存
                localStorage.setItem('ai-chat-theme', JSON.stringify({
                    currentTheme: theme,
                    customBackground: null
                }));
                console.log('✅ 公式テーマ適用完了');
            } else {
                console.log('❌ テーマが見つかりません:', themeId);
            }
        };
        
        console.log('\n📝 使用方法:');
        console.log('testTheme("ocean") - 手動テストテーマ適用');
        console.log('testTheme("sunset") - 手動テストテーマ適用');
        console.log('testTheme("forest") - 手動テストテーマ適用');
        console.log('applyThemeById("ocean-sunset") - 公式テーマ適用');
        
    }).catch(error => {
        console.error('❌ themes.tsモジュール読み込みエラー:', error);
    });
    
    console.log('\n🔍 === 診断完了 ===');
})();
