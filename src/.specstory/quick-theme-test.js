// ブラウザのアドレスバーで実行可能な診断コード
javascript:(function(){
const root=document.documentElement;
const style=getComputedStyle(root);
const bg=style.getPropertyValue('--theme-background');
const saved=localStorage.getItem('ai-chat-theme');
alert('CSS変数: '+(bg||'未設定')+'\nLocalStorage: '+(saved?'設定済み':'未設定'));
if(!bg){
root.style.setProperty('--theme-background','linear-gradient(135deg,#667eea 0%,#764ba2 100%)');
document.body.style.background='var(--theme-background)';
alert('テストテーマを適用しました！');
}
})();
