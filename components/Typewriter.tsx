'use client';

import { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number; // ms per character
  onDone?: () => void;
}

export default function Typewriter({ text, speed = 30, onDone }: TypewriterProps) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    let i = 0;
    const chunk = text.length > 5000 ? 5 : 1;
    const interval = setInterval(() => {
      i += chunk;
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onDone]);

  return <span>{display}</span>;
} 