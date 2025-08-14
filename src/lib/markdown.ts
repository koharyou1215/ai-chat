/**
 * マークダウン処理ライブラリ
 */

export function mdToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    // エスケープ処理
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    
    // 見出し
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    
    // 強調
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    
    // コード
    .replace(/`([^`]*)`/g, '<code class="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // リンク
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" class="text-blue-500 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // 改行処理
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br>');

  // 段落で囲む
  html = '<p class="mb-2">' + html + '</p>';
  
  // 空の段落を削除
  html = html.replace(/<p class="mb-2"><\/p>/g, '');
  
  return html;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}