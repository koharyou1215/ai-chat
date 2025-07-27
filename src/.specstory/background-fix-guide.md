# 🔧 チャットアプリ背景問題 修正手順書

## 📋 現在の状況
- 背景が真っ黒で変わらない
- テーマ設定が反映されない可能性

## ✅ 順番に実行する対処法

### 1. 【最優先】ブラウザでCSS変数を確認

**手順:**
1. チャットアプリをブラウザで開く
2. F12キーで開発者ツールを開く
3. Console タブをクリック
4. 以下のコードを入力して実行:

```javascript
// CSS変数の確認
const root = document.documentElement;
const style = getComputedStyle(root);
console.log('--theme-background:', style.getPropertyValue('--theme-background'));
console.log('--theme-background-image:', style.getPropertyValue('--theme-background-image'));
```

**期待される結果:**
- 値が表示される → CSS変数は設定済み
- 空文字/未設定 → CSS変数の問題

---

### 2. LocalStorageの設定値確認

**Console で実行:**
```javascript
// テーマ設定の確認
const themeData = localStorage.getItem('ai-chat-theme');
if (themeData) {
    console.log('テーマ設定:', JSON.parse(themeData));
} else {
    console.log('テーマ設定が保存されていません');
}
```

**問題がある場合の対処:**
```javascript
// 設定をリセット
localStorage.removeItem('ai-chat-theme');
location.reload(); // ページリロード
```

---

### 3. bg.mp4ファイルの存在確認

**Console で実行:**
```javascript
// 背景動画の確認
fetch('/bg.mp4', {method: 'HEAD'})
  .then(response => {
    if (response.ok) {
        console.log('✅ bg.mp4 ファイル存在');
    } else {
        console.log('❌ bg.mp4 ファイルなし');
    }
  })
  .catch(error => console.log('❌ ファイルアクセスエラー:', error));
```

---

### 4. z-index階層の確認

**Console で実行:**
```javascript
// z-index の確認
document.querySelectorAll('*').forEach(el => {
    const zIndex = getComputedStyle(el).zIndex;
    if (zIndex !== 'auto' && zIndex !== '0') {
        console.log(el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''), 'z-index:', zIndex);
    }
});
```

**修正方法:**
- 背景動画のz-indexが高すぎる場合は下げる
- 他の要素が背景を隠している場合は調整

---

### 5. 【緊急修正】手動でテーマを適用

**Console で実行:**
```javascript
// 強制的に背景を適用
const root = document.documentElement;
root.style.setProperty('--theme-background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
root.style.setProperty('--theme-background-image', 'none');

// body要素に直接適用
document.body.style.background = 'var(--theme-background)';
document.body.style.backgroundSize = 'cover';

console.log('テスト背景を適用しました');
```

---

## 🚨 緊急時の最終手段

### 完全リセット:
```javascript
// すべてをリセット
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 直接CSS適用:
```javascript
// CSSを直接body要素に適用
document.body.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    background-size: cover !important;
    background-attachment: fixed !important;
`;
```

---

## 📝 確認チェックリスト

- [ ] CSS変数が設定されている
- [ ] LocalStorageにテーマデータがある  
- [ ] bg.mp4ファイルが存在する
- [ ] z-index の競合がない
- [ ] 手動適用で背景が変わる

## 🔄 次のステップ

1. 上記で問題を特定
2. 対応するファイル修正
3. テーマ設定機能の動作確認
4. 壁紙変更処理の実装確認

---

**📞 サポート情報:**
- このファイルと一緒に作成された `debug-script.js` を使用
- ブラウザConsoleで `window.debugBackground.runFullDiagnostic()` を実行
