// 自動修復実行スクリプト
const fs = require('fs');
const path = require('path');

console.log('🔧 自動修復開始...');

// 1. CSS強制修復（globals.css にデフォルト背景を追加）
const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const backgroundCSS = `
/* 緊急背景修復 */
:root {
  --theme-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --theme-background-size: cover;
  --theme-background-attachment: fixed;
}

body, html {
  background: var(--theme-background) !important;
  background-size: var(--theme-background-size) !important;
  background-attachment: var(--theme-background-attachment) !important;
}

.main-container {
  background: var(--theme-background) !important;
  min-height: 100vh;
}
`;

// CSS ファイルに追加
if (!cssContent.includes('緊急背景修復')) {
  fs.writeFileSync(cssPath, cssContent + backgroundCSS);
  console.log('✅ CSS背景修復完了');
}

// 2. Next.js のビルドキャッシュをクリア
const nextPath = path.join(__dirname, '..', '.next');
if (fs.existsSync(nextPath)) {
  fs.rmSync(nextPath, { recursive: true, force: true });
  console.log('✅ Next.js キャッシュクリア完了');
}

// 3. 設定ファイルの修正（package.json の確認）
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ プロジェクト構造確認完了');
}

console.log('🎉 自動修復完了！');
console.log('📋 次の手順:');
console.log('  1. ブラウザでF12を押してコンソールを開く');
console.log('  2. 以下のコードを実行:');
console.log(`  
// 緊急修復コマンド
localStorage.setItem('ai-chat-theme', JSON.stringify({
  currentTheme: 'ocean-sunset',
  customBackground: null
}));

// セッション過多を修復
const sessionKeys = Object.keys(localStorage).filter(k => k.includes('session'));
if (sessionKeys.length > 5) {
  sessionKeys.slice(5).forEach(key => localStorage.removeItem(key));
}

// ページリロード
location.reload();
`);

console.log('  3. ページがリロードされるまで待つ');
console.log('  4. 問題が解決されているか確認');
