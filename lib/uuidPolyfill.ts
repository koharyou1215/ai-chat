import { v4 as uuidv4 } from 'uuid';

// グローバルの crypto.randomUUID が未実装の環境向けポリフィル
if (typeof globalThis !== 'undefined') {
  const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (!g.crypto) g.crypto = {};
  if (typeof g.crypto.randomUUID !== 'function') {
    g.crypto.randomUUID = uuidv4;
  }
} 