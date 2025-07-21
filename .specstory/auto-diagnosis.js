// 1番目の診断を自動実行するスクリプト
(function() {
    console.log('=== 🔍 1番目: CSS変数の確認 ===');
    
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // テーマ関連のCSS変数をチェック
    const cssVars = [
        '--theme-background',
        '--theme-background-image', 
        '--theme-background-size',
        '--theme-background-position',
        '--theme-primary',
        '--theme-secondary'
    ];
    
    console.log('📋 現在のCSS変数設定:');
    let hasBackground = false;
    cssVars.forEach(varName => {
        const value = computedStyle.getPropertyValue(varName);
        if (value) {
            console.log('✅ ' + varName + ': ' + value);
            if (varName.includes('background')) hasBackground = true;
        } else {
            console.log('❌ ' + varName + ': 未設定');
        }
    });
    
    // body要素の背景も確認
    const bodyStyle = getComputedStyle(document.body);
    console.log('\n📋 body要素の背景:');
    console.log('background-color: ' + bodyStyle.backgroundColor);
    console.log('background-image: ' + bodyStyle.backgroundImage);
    
    // html要素の背景も確認
    console.log('\n📋 html要素の背景:');
    console.log('background-color: ' + computedStyle.backgroundColor);
    console.log('background-image: ' + computedStyle.backgroundImage);
    
    // 背景動画の確認
    const videos = document.querySelectorAll('video');
    console.log('\n📋 背景動画要素: ' + videos.length + '個');
    videos.forEach((video, index) => {
        console.log('Video ' + (index + 1) + ':', {
            src: video.src,
            style: video.style.cssText,
            display: getComputedStyle(video).display
        });
    });
    
    // 診断結果のサマリー
    console.log('\n🎯 1番目の診断結果:');
    if (hasBackground) {
        console.log('✅ CSS変数は設定されています → 2番目（LocalStorage確認）に進んでください');
    } else {
        console.log('❌ CSS変数が未設定です → themes.tsの問題の可能性があります');
    }
    
    // 次のステップの説明
    console.log('\n📝 次の手順:');
    console.log('2番目を実行: step2()');
    
    // グローバル関数として2番目を定義
    window.step2 = function() {
        console.log('\n=== 🔍 2番目: LocalStorageの確認 ===');
        
        const keys = ['ai-chat-theme', 'ai-chat-custom-background', 'ai-chat-settings'];
        
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    const parsed = JSON.parse(value);
                    console.log('✅ ' + key + ':', parsed);
                } catch (error) {
                    console.log('✅ ' + key + ': ' + value);
                }
            } else {
                console.log('❌ ' + key + ': 未設定');
            }
        });
        
        console.log('\n📝 次の手順:');
        console.log('3番目を実行: step3()');
    };
    
    window.step3 = function() {
        console.log('\n=== 🔍 3番目: 背景ファイルの確認 ===');
        
        const filesToCheck = ['/bg.mp4', '/background/bg.mp4', '/Background/bg.mp4'];
        
        Promise.all(filesToCheck.map(file => 
            fetch(file, { method: 'HEAD' })
                .then(response => ({ file, status: response.status, ok: response.ok }))
                .catch(error => ({ file, error: error.message, ok: false }))
        )).then(results => {
            results.forEach(result => {
                if (result.ok) {
                    console.log('✅ ' + result.file + ': 存在します');
                } else {
                    console.log('❌ ' + result.file + ': ' + (result.error || '見つかりません'));
                }
            });
            
            console.log('\n📝 次の手順:');
            console.log('4番目を実行: step4()');
        });
    };
    
    window.step4 = function() {
        console.log('\n=== 🔍 4番目: DOM要素とz-indexの確認 ===');
        
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
        
        console.log('\n📝 次の手順:');
        console.log('5番目を実行: step5()');
    };
    
    window.step5 = function() {
        console.log('\n=== 🔍 5番目: テーマ適用のテスト ===');
        
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
    };
})();
