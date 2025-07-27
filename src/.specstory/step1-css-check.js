// 1番目: CSS変数の確認
console.log('=== 1番目: CSS変数の確認 ===');

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
cssVars.forEach(varName => {
    const value = computedStyle.getPropertyValue(varName);
    if (value) {
        console.log('✅ ' + varName + ': ' + value);
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
