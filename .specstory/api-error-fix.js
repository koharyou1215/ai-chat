// APIエラー対応と修復スクリプト

console.log('🔧 APIエラー修復開始...');

// 1. Geminiをデフォルトプロバイダーに設定
localStorage.setItem('ai-chat-settings', JSON.stringify({
  provider: 'gemini',
  model: 'gemini-2.0-flash-exp',
  openRouterApiKey: '', // クリア
  temperature: 0.7,
  maxTokens: 1024
}));

// 2. 背景問題を修復
document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
document.documentElement.style.setProperty('--theme-background-size', 'cover');

// 3. 404エラーファイルの参照を削除
const videoElements = document.querySelectorAll('video[src*="bg.mp4"]');
videoElements.forEach(video => {
  video.style.display = 'none';
  console.log('背景動画要素を非表示にしました');
});

// 4. セッション過多をクリア
const sessionKeys = Object.keys(localStorage).filter(k => k.includes('session'));
if (sessionKeys.length > 5) {
  sessionKeys.slice(5).forEach(key => localStorage.removeItem(key));
  console.log(`✅ ${sessionKeys.length - 5}個の古いセッションを削除`);
}

// 5. テーマ設定を正常化
localStorage.setItem('ai-chat-theme', JSON.stringify({
  currentTheme: 'ocean-sunset',
  customBackground: null
}));

console.log('✅ 修復完了！');
console.log('📋 設定内容:');
console.log('  - プロバイダー: Gemini');
console.log('  - モデル: gemini-2.0-flash-exp');
console.log('  - 背景: デフォルトグラデーション');
console.log('  - セッション: 整理完了');

// ページリロード
setTimeout(() => {
  location.reload();
}, 2000);
