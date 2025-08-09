'use client';
import { mdToHtml } from '../lib/markdown';

interface Props {
  md: string;
  className?: string;
}

export default function FormattedText({ md, className = '' }: Props) {
  // undefined、null、または空文字列の場合は安全に処理
  const safeText = md || '';
  const html = mdToHtml(safeText);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
} 