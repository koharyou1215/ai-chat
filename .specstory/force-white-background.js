// 背景を強制的に白にリセットするスクリプト

console.log('🔧 背景を強制的に白背景にリセット中...');

// 1. ローカルストレージから古いテーマ設定を削除
const keysToRemove = [
  'ai-chat-theme',
  'ai-chat-settings', 
  'customBackground',
  'currentTheme',
  'theme-data'
];

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ 削除: ${key}`);
});

// 2. CSS変数を強制的に白背景に設定
const cssProps = [
  '--theme-background',
  '--theme-background-image',
  '--theme-background-size',
  '--theme-background-position',
  '--theme-background-attachment'
];

cssProps.forEach(prop => {
  document.documentElement.style.removeProperty(prop);
  console.log(`✅ CSS変数削除: ${prop}`);
});

// 3. 強制的に白背景を適用
document.documentElement.style.setProperty('--theme-background', '#ffffff', 'important');
document.documentElement.style.setProperty('--theme-background-size', 'auto', 'important');
document.body.style.background = '#ffffff';
document.body.style.backgroundImage = 'none';

console.log('✅ 白背景を強制適用');

// 4. 動画要素があれば削除
const videos = document.querySelectorAll('video');
videos.forEach(video => {
  video.style.display = 'none';
  console.log('✅ 動画要素を非表示');
});

// 5. 背景関連のスタイルを持つ要素をリセット
const elementsWithBg = document.querySelectorAll('[style*="background"]');
elementsWithBg.forEach(el => {
  if (el !== document.body && !el.closest('.message') && !el.closest('.character')) {
    el.style.background = 'transparent';
    console.log('✅ 背景要素をリセット');
  }
});

console.log('🎉 背景リセット完了！ページをリロードしてください。');
