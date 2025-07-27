// チャットアプリの背景・会話復元問題診断スクリプト

console.log('🔍 チャットアプリ診断開始...\n');

// 1. 背景問題の診断
console.log('=== 📱 背景設定診断 ===');

// CSS変数チェック
const root = document.documentElement;
const computedStyle = getComputedStyle(root);
const bgColor = computedStyle.getPropertyValue('--theme-background').trim();
const bgImage = computedStyle.getPropertyValue('--theme-background-image').trim();

console.log('CSS変数:');
console.log('  --theme-background:', bgColor || '❌ 未設定');
console.log('  --theme-background-image:', bgImage || '❌ 未設定');

// LocalStorage テーマ設定チェック
const themeData = localStorage.getItem('ai-chat-theme');
console.log('\nLocalStorage テーマ:');
if (themeData) {
    try {
        const parsed = JSON.parse(themeData);
        console.log('  ✅ 設定あり:', parsed);
    } catch (e) {
        console.log('  ❌ パース失敗:', themeData);
    }
} else {
    console.log('  ❌ テーマ設定なし');
}

// 現在適用されている背景スタイルチェック
const bodyStyle = getComputedStyle(document.body);
console.log('\n実際の背景:');
console.log('  body background:', bodyStyle.background);
console.log('  body backgroundColor:', bodyStyle.backgroundColor);

// 2. 会話復元問題の診断
console.log('\n=== 💬 会話復元診断 ===');

// LocalStorage のセッションデータチェック
const sessionKeys = Object.keys(localStorage).filter(key => 
    key.includes('session') || key.includes('chat') || key.includes('message')
);

console.log('セッション関連データ:');
sessionKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, value ? `${value.length}文字` : '空');
});

// メッセージ状態のチェック (React状態は直接取得できないため、DOM要素から推測)
const chatContainer = document.querySelector('[class*="chat"], [class*="message"], .message-container');
const messageElements = document.querySelectorAll('[class*="message"]');

console.log('\nDOM メッセージ要素:');
console.log('  チャットコンテナ:', chatContainer ? '✅ 存在' : '❌ 見つからない');
console.log('  メッセージ要素数:', messageElements.length);

// 3. パス・ルーティング問題の診断
console.log('\n=== 🛣️  パス・ルーティング診断 ===');

console.log('現在のURL情報:');
console.log('  URL:', window.location.href);
console.log('  pathname:', window.location.pathname);
console.log('  search:', window.location.search);
console.log('  hash:', window.location.hash);

// History API の状態チェック
console.log('\nHistory API:');
console.log('  history.length:', history.length);
console.log('  history.state:', history.state);

// 4. エラー・警告の確認
console.log('\n=== ⚠️  エラー診断 ===');

// コンソールエラーの監視を設定
const originalError = console.error;
const originalWarn = console.warn;
let errorCount = 0;
let warnCount = 0;

console.error = function(...args) {
    errorCount++;
    originalError.apply(console, ['🔴 ERROR:', ...args]);
};

console.warn = function(...args) {
    warnCount++;
    originalWarn.apply(console, ['🟡 WARN:', ...args]);
};

// 5. 修復提案
console.log('\n=== 🔧 修復提案 ===');

if (!bgColor && !bgImage) {
    console.log('📱 背景問題の修復:');
    console.log('  1. localStorage.removeItem("ai-chat-theme")');
    console.log('  2. ページリロード');
    console.log('  3. 設定画面でテーマを再選択');
}

if (sessionKeys.length === 0) {
    console.log('💬 会話データ問題の修復:');
    console.log('  1. ブラウザキャッシュをクリア');
    console.log('  2. localStorage をクリア');
    console.log('  3. 新しい会話を開始');
}

console.log('\n✅ 診断完了');

// 簡易修復機能
window.fixBackground = function() {
    localStorage.removeItem('ai-chat-theme');
    console.log('🔧 テーマ設定をリセットしました。ページをリロードしてください。');
};

window.clearAllData = function() {
    localStorage.clear();
    console.log('🔧 すべてのデータをクリアしました。ページをリロードしてください。');
};

console.log('\n💡 修復コマンド:');
console.log('  背景修復: fixBackground()');
console.log('  全データリセット: clearAllData()');
