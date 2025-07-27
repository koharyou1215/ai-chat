// AUTO-DIAGNOSIS: 1番目から順番に背景問題を診断するスクリプト
(function() {
    console.log('=== 🔍 1番目: CSS変数の確認 ===');
    
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const cssVars = [
        '--theme-background',
        '--theme-background-image', 
        '--theme-background-size',
        '--theme-background-position',
        '--theme-primary',
        '--theme-secondary'
    ];
    
    console.log('現在のCSS変数設定:');
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
    
    const bodyStyle = getComputedStyle(document.body);
    console.log('body要素の背景:');
    console.log('background-color: ' + bodyStyle.backgroundColor);
    console.log('background-image: ' + bodyStyle.backgroundImage);
    
    const videos = document.querySelectorAll('video');
    console.log('背景動画要素: ' + videos.length + '個');
    
    console.log('🎯 1番目の診断結果:');
    if (hasBackground) {
        console.log('✅ CSS変数は設定されています → 2番目に進んでください');
    } else {
        console.log('❌ CSS変数が未設定です → themes.tsの問題の可能性があります');
    }
    
    console.log('次の手順: step2() を実行');
    
    window.step2 = function() {
        console.log('=== 🔍 2番目: LocalStorageの確認 ===');
        
        const keys = ['ai-chat-theme', 'ai-chat-custom-background'];
        
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    const parsed = JSON.parse(value);
                    console.log('✅ ' + key + ':', parsed);
                } catch (e) {
                    console.log('✅ ' + key + ': ' + value);
                }
            } else {
                console.log('❌ ' + key + ': 未設定');
            }
        });
        
        console.log('次の手順: step3() を実行');
    };
    
    window.step3 = function() {
        console.log('=== 🔍 3番目: 背景ファイルの確認 ===');
        
        const files = ['/bg.mp4', '/background/bg.mp4'];
        
        Promise.all(files.map(file => 
            fetch(file, { method: 'HEAD' })
                .then(res => ({ file, ok: res.ok, status: res.status }))
                .catch(err => ({ file, ok: false, error: err.message }))
        )).then(results => {
            results.forEach(result => {
                if (result.ok) {
                    console.log('✅ ' + result.file + ': 存在します');
                } else {
                    console.log('❌ ' + result.file + ': 見つかりません');
                }
            });
            console.log('次の手順: step4() を実行');
        });
    };
    
    window.step4 = function() {
        console.log('=== 🔍 4番目: DOM要素とz-indexの確認 ===');
        
        const videos = document.querySelectorAll('video');
        console.log('背景動画要素: ' + videos.length + '個');
        videos.forEach((video, index) => {
            const style = getComputedStyle(video);
            console.log('Video ' + (index + 1) + ':', {
                src: video.src,
                zIndex: style.zIndex,
                display: style.display
            });
        });
        
        console.log('次の手順: step5() を実行');
    };
    
    window.step5 = function() {
        console.log('=== 🔍 5番目: テーマ適用のテスト ===');
        
        const root = document.documentElement;
        const originalBg = root.style.getPropertyValue('--theme-background');
        
        console.log('元の背景:', originalBg || '未設定');
        
        root.style.setProperty('--theme-background', 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)');
        root.style.setProperty('--theme-background-image', 'none');
        
        console.log('✅ テスト背景を適用しました (赤→青のグラデーション)');
        console.log('5秒後に元に戻します...');
        
        setTimeout(() => {
            root.style.setProperty('--theme-background', originalBg);
            console.log('元の背景設定に戻しました');
        }, 5000);
    };
    
    console.log('📝 全ての診断関数が準備完了しました');
    
})();
