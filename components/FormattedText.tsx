'use client';
import { mdToHtml } from '../lib/markdown';

interface Props {
  text: string;
  className?: string;
}

export default function FormattedText({ text, className = '' }: Props) {
  const html = mdToHtml(text);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
} 