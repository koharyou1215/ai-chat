'use client';
import { mdToHtml } from '../lib/markdown';

interface Props {
  md: string;
  className?: string;
}

export default function FormattedText({ md, className = '' }: Props) {
  const html = mdToHtml(md);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
} 