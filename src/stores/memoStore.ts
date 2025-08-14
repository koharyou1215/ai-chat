import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Memo {
  id: string;
  content: string;
  note: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isAiMemory?: boolean; // AIが参照用に使うかどうか
  importance?: number; // 1-5の重要度
  characterId?: string;
  personaId?: string;
  messageId?: string; // 関連するメッセージのID
  isImportant: boolean;
}

interface MemoStore {
  // 状態
  memos: Memo[];
  isMemoModalOpen: boolean;
  editingMemo: Memo | null;
  
  // アクション
  addMemo: (memo: Omit<Memo, 'id' | 'timestamp'>) => void;
  updateMemo: (memo: Memo) => void;
  deleteMemo: (memoId: string) => void;
  getMemosByCharacter: (characterId: string) => Memo[];
  getMemosByPersona: (personaId: string) => Memo[];
  searchMemos: (query: string) => Memo[];
  setIsMemoModalOpen: (open: boolean) => void;
  setEditingMemo: (memo: Memo | null) => void;
  clearMemos: () => void;
}

export const useMemoStore = create<MemoStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      memos: [],
      isMemoModalOpen: false,
      editingMemo: null,
      
      // アクション
      addMemo: (memoData) => {
        const now = Date.now();
        const newMemo: Memo = {
          ...memoData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          memos: [...state.memos, newMemo]
        }));
      },
      
      updateMemo: (memo: Memo) => {
        set((state) => ({
          memos: state.memos.map(m => m.id === memo.id ? memo : m)
        }));
      },
      
      deleteMemo: (memoId: string) => {
        set((state) => ({
          memos: state.memos.filter(m => m.id !== memoId)
        }));
      },
      
      getMemosByCharacter: (characterId: string) => {
        return get().memos.filter(m => m.characterId === characterId);
      },
      
      getMemosByPersona: (personaId: string) => {
        return get().memos.filter(m => m.personaId === personaId);
      },
      
      searchMemos: (query: string) => {
        const lowerQuery = query.toLowerCase();
        return get().memos.filter(m => 
          m.content.toLowerCase().includes(lowerQuery) ||
          (m.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)))
        );
      },
      
      setIsMemoModalOpen: (open: boolean) => {
        set({ isMemoModalOpen: open });
      },
      
      setEditingMemo: (memo: Memo | null) => {
        set({ editingMemo: memo });
      },
      
      clearMemos: () => {
        set({ memos: [] });
      },
    }),
    {
      name: 'memo-storage',
      partialize: (state) => ({
        memos: state.memos,
      }),
    }
  )
);