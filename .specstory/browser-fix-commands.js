// 簡単な修復確認とクリーンアップ
console.log('=== 🔧 簡易修復ツール ===');
console.log('ブラウザのコンソールで実行してください\n');

// 1. 現在の状態をチェック
console.log('// 1. 現在の状態チェック');
console.log(`
const bgStyle = getComputedStyle(document.documentElement);
const bg = bgStyle.getPropertyValue('--theme-background');
console.log('背景CSS変数:', bg || '❌未設定');

const themeData = localStorage.getItem('ai-chat-theme');
console.log('テーマLocalStorage:', themeData ? '✅設定済み' : '❌未設定');

const sessionCount = Object.keys(localStorage).filter(k => k.includes('session')).length;
console.log('セッション数:', sessionCount, sessionCount > 10 ? '(多すぎ - 要整理)' : '(正常)');
`);

console.log('\n// 2. 背景強制修復');
console.log(`
// 背景を強制設定
document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
document.documentElement.style.setProperty('--theme-background-size', 'cover');
document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

// LocalStorageにテーマ保存
localStorage.setItem('ai-chat-theme', JSON.stringify({
  currentTheme: 'ocean-sunset',
  customBackground: null
}));

console.log('✅ 背景修復完了');
`);

console.log('\n// 3. 会話戻り問題修復');
console.log(`
// 古いセッションを削除
const sessionKeys = Object.keys(localStorage).filter(k => k.includes('session'));
if (sessionKeys.length > 5) {
  sessionKeys.slice(5).forEach(key => {
    localStorage.removeItem(key);
    console.log('削除:', key);
  });
  console.log('✅ 古いセッション削除完了');
}

// セッションストレージクリア
sessionStorage.clear();
console.log('✅ セッションストレージクリア完了');
`);

console.log('\n// 4. 完全リセット（最終手段）');
console.log(`
// 完全リセット実行
if (confirm('すべての設定をリセットしますか？')) {
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ 完全リセット完了');
  location.reload();
}
`);

console.log('\n// 5. ワンクリック修復');
console.log(`
// すべてまとめて修復
(function() {
  // 背景修復
  document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  localStorage.setItem('ai-chat-theme', JSON.stringify({currentTheme: 'ocean-sunset'}));
  
  // セッション整理
  const sessions = Object.keys(localStorage).filter(k => k.includes('session'));
  if (sessions.length > 5) sessions.slice(5).forEach(k => localStorage.removeItem(k));
  
  // 画面更新
  setTimeout(() => location.reload(), 1000);
  
  console.log('🎉 ワンクリック修復実行中...');
})();
`);

console.log('\n=== 使用方法 ===');
console.log('1. ブラウザでhttp://localhost:3004を開く');
console.log('2. F12キーで開発者ツールを開く');
console.log('3. 上記のコードをConsoleタブで実行');
console.log('4. 「ワンクリック修復」が最も簡単です');
