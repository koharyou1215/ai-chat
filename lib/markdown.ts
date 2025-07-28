import { marked } from 'marked';

// Convert markdown to sanitized HTML allowing basic tags and Tailwind color spans
export function mdToHtml(md: string): string {
  // undefined、null、または空文字列の場合は空文字列を返す
  if (!md || typeof md !== 'string') {
    return '';
  }
  
  const raw = marked.parse(md, { gfm: true, breaks: true });
  // very simple sanitize: remove script tags
  return raw.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
} 