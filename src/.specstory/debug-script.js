// ブラウザのコンソールで実行する背景設定デバッグスクリプト

console.log('=== 🔍 チャットアプリ背景設定デバッグ開始 ===');

// 1. CSS変数の確認
function checkCSSVariables() {
    console.log('\n1. === CSS変数の確認 ===');
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const cssVars = [
        '--theme-background',
        '--theme-background-image', 
        '--theme-background-size',
        '--theme-background-position',
        '--theme-sidebar',
        '--theme-text-primary'
    ];
    
    cssVars.forEach(varName => {
        const value = computedStyle.getPropertyValue(varName);
        console.log(varName + ': ' + (value || '未設定'));
    });
}

// 2. LocalStorageの確認
function checkLocalStorage() {
    console.log('\n2. === LocalStorageの確認 ===');
    
    const keys = [
        'ai-chat-theme',
        'ai-chat-custom-background',
        'ai-chat-settings'
    ];
    
    keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                const parsed = JSON.parse(value);
                console.log(key + ':', parsed);
            } catch (error) {
                console.log(key + ': ' + value);
            }
        } else {
            console.log(key + ': 未設定');
        }
    });
}

// 3. 背景動画ファイルの確認
function checkBackgroundFiles() {
    console.log('\n3. === 背景ファイルの確認 ===');
    
    const filesToCheck = [
        '/bg.mp4',
        '/background/bg.mp4', 
        '/Background/bg.mp4',
        '/public/bg.mp4'
    ];
    
    filesToCheck.forEach(function(file) {
        fetch(file, { method: 'HEAD' })
            .then(function(response) {
                if (response.ok) {
                    console.log('✅ ' + file + ': 存在します (' + response.status + ')');
                } else {
                    console.log('❌ ' + file + ': 見つかりません (' + response.status + ')');
                }
            })
            .catch(function(error) {
                console.log('❌ ' + file + ': エラー - ' + error.message);
            });
    });
}

// 4. DOM要素とz-indexの確認  
function checkDOMElements() {
    console.log('\n4. === DOM要素の確認 ===');
    
    // 背景動画要素
    const videos = document.querySelectorAll('video');
    console.log('背景動画要素: ' + videos.length + '個');
    videos.forEach((video, index) => {
        const style = getComputedStyle(video);
        console.log('Video ' + (index + 1) + ':', {
            src: video.src,
            zIndex: style.zIndex,
            position: style.position,
            opacity: style.opacity,
            display: style.display
        });
    });
    
    // z-index の確認
    const allElements = document.querySelectorAll('*');
    let zIndexElements = [];
    allElements.forEach(el => {
        const style = getComputedStyle(el);
        const zIndex = style.zIndex;
        if (zIndex !== 'auto' && zIndex !== '0') {
            zIndexElements.push({
                element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
                zIndex: zIndex,
                position: style.position
            });
        }
    });
    
    console.log('z-index設定要素:', zIndexElements);
}

// 5. テーマ適用のテスト
function testThemeApplication() {
    console.log('\n5. === テーマ適用テスト ===');
    
    const root = document.documentElement;
    
    // 元の値を保存
    const originalBg = root.style.getPropertyValue('--theme-background');
    const originalBgImage = root.style.getPropertyValue('--theme-background-image');
    
    console.log('元の背景設定:', {
        background: originalBg,
        backgroundImage: originalBgImage
    });
    
    // テスト用背景を適用
    root.style.setProperty('--theme-background', 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)');
    root.style.setProperty('--theme-background-image', 'none');
    
    console.log('テスト背景を適用しました (赤→青のグラデーション)');
    console.log('5秒後に元に戻します...');
    
    // 5秒後に元に戻す
    setTimeout(() => {
        root.style.setProperty('--theme-background', originalBg);
        root.style.setProperty('--theme-background-image', originalBgImage);
        console.log('元の背景設定に戻しました');
    }, 5000);
}

// 6. 背景が表示されない原因の診断
function diagnoseBackgroundIssues() {
    console.log('\n6. === 背景問題の診断 ===');
    
    const issues = [];
    
    // CSS変数の確認
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const bgVar = computedStyle.getPropertyValue('--theme-background');
    const bgImageVar = computedStyle.getPropertyValue('--theme-background-image');
    
    if (!bgVar && !bgImageVar) {
        issues.push('❌ CSS変数が設定されていません');
    }
    
    // localStorage の確認
    const theme = localStorage.getItem('ai-chat-theme');
    if (!theme) {
        issues.push('❌ localStorage にテーマが保存されていません');
    }
    
    // 動画要素の確認
    const videos = document.querySelectorAll('video');
    if (videos.length === 0) {
        issues.push('❌ 背景動画要素が見つかりません');
    }
    
    // 結果の表示
    if (issues.length === 0) {
        console.log('✅ 明らかな問題は見つかりませんでした');
        console.log('💡 以下を確認してください:');
        console.log('   - テーマファイルの読み込み状況');
        console.log('   - CSSの競合');
        console.log('   - ネットワークエラー');
    } else {
        console.log('🔍 見つかった問題:');
        issues.forEach(issue => console.log('   ' + issue));
        
        console.log('\n🛠 推奨される修正手順:');
        if (issues.some(i => i.includes('CSS変数'))) {
            console.log('   1. テーマ設定を再読み込み: location.reload()');
        }
        if (issues.some(i => i.includes('localStorage'))) {
            console.log('   2. デフォルトテーマを設定: resetToDefaultTheme()');
        }
        if (issues.some(i => i.includes('動画要素'))) {
            console.log('   3. レイアウトコンポーネントを確認');
        }
    }
}

// すべての診断を実行
function runFullDiagnostic() {
    checkCSSVariables();
    checkLocalStorage();
    checkBackgroundFiles();
    checkDOMElements();
    testThemeApplication();
    const issues = diagnoseBackgroundIssues();
    
    console.log('\n=== 🎯 推奨対処法 ===');
    if (issues.length > 0) {
        console.log('以下の対処法を試してください:');
        console.log('1. ページをリロード (Ctrl+F5)');
        console.log('2. ブラウザキャッシュをクリア');
        console.log('3. localStorage.clear() でデータをリセット');
        console.log('4. testThemeApplication() でテーマ適用をテスト');
    } else {
        console.log('testThemeApplication() でテーマ変更をテストしてみてください');
    }
}

// グローバル関数として公開
window.debugBackground = {
    checkCSSVariables: checkCSSVariables,
    checkLocalStorage: checkLocalStorage,
    checkBackgroundFiles: checkBackgroundFiles,
    checkDOMElements: checkDOMElements,
    testThemeApplication: testThemeApplication,
    diagnoseBackgroundIssues: diagnoseBackgroundIssues,
    runFullDiagnostic: runFullDiagnostic
};

console.log('\n=== 🎯 背景診断ツールが読み込まれました ===');
console.log('使用方法:');
console.log('debugBackground.runFullDiagnostic() - 全体診断実行');
console.log('debugBackground.testThemeApplication() - テーマ適用テスト');
console.log('debugBackground.checkCSSVariables() - CSS変数確認');

// 自動実行
console.log('\n自動診断を開始します...');
runFullDiagnostic();
