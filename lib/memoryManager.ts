import { ChatMemo } from '../types/character';

export class MemoryManager {
  /**
   * キャラクター専用のメモリを取得
   */
  static getCharacterMemories(memos: ChatMemo[], characterId: string): ChatMemo[] {
    return memos.filter(memo => 
      memo.characterId === characterId && 
      memo.isAiMemory === true
    );
  }

  /**
   * 重要度順でソートされたメモリを取得
   */
  static getSortedMemories(memos: ChatMemo[], characterId: string, limit?: number): ChatMemo[] {
    const characterMemos = this.getCharacterMemories(memos, characterId);
    
    // 重要度（高い順）→更新日（新しい順）でソート
    const sorted = characterMemos.sort((a, b) => {
      const importanceA = a.importance || 1;
      const importanceB = b.importance || 1;
      
      if (importanceA !== importanceB) {
        return importanceB - importanceA; // 重要度高い順
      }
      
      return b.updatedAt - a.updatedAt; // 更新日新しい順
    });
    
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * AIが参照するメモリの概要を生成
   */
  static generateMemorySummary(memos: ChatMemo[], characterId: string, maxLength: number = 1000): string {
    const memories = this.getSortedMemories(memos, characterId, 10); // 最大10件
    
    if (memories.length === 0) {
      return '';
    }

    let summary = '【キャラクター記憶】\n';
    let currentLength = summary.length;

    for (const memory of memories) {
      const memoryText = `• ${memory.note}`;
      
      if (currentLength + memoryText.length > maxLength) {
        break;
      }
      
      summary += memoryText + '\n';
      currentLength += memoryText.length + 1;
    }

    return summary.trim();
  }

  /**
   * メモの重要度を自動判定
   */
  static calculateImportance(note: string, tags: string[]): number {
    let importance = 1;

    // タグベースの重要度判定
    const highImportanceTags = ['重要', '設定', '性格', '過去', '秘密', '関係性'];
    const mediumImportanceTags = ['感情', 'ストーリー', '伏線', '好み'];
    
    const hasHighTags = tags.some(tag => highImportanceTags.includes(tag));
    const hasMediumTags = tags.some(tag => mediumImportanceTags.includes(tag));

    if (hasHighTags) {
      importance += 2;
    } else if (hasMediumTags) {
      importance += 1;
    }

    // 内容ベースの重要度判定
    const highImportanceKeywords = ['嫌い', '好き', '大切', '重要', '秘密', '過去', '家族', '友達'];
    const keywordMatches = highImportanceKeywords.filter(keyword => 
      note.toLowerCase().includes(keyword)
    ).length;

    importance += Math.min(keywordMatches, 2); // 最大2ポイント追加

    // 長いメモは重要度が高い傾向
    if (note.length > 100) {
      importance += 1;
    }

    return Math.min(importance, 5); // 最大5
  }

  /**
   * 古いメモリを整理（容量制限）
   */
  static pruneOldMemories(memos: ChatMemo[], characterId: string, maxMemories: number = 50): ChatMemo[] {
    const characterMemos = this.getCharacterMemories(memos, characterId);
    
    if (characterMemos.length <= maxMemories) {
      return memos; // 整理不要
    }

    // 重要度とタイムスタンプでソート
    const sorted = this.getSortedMemories(memos, characterId);
    const toKeep = sorted.slice(0, maxMemories);
    const toKeepIds = new Set(toKeep.map(m => m.id));

    // 対象キャラクター以外のメモ + 保持するメモ
    return memos.filter(memo => 
      memo.characterId !== characterId || toKeepIds.has(memo.id)
    );
  }

  /**
   * メモを検索
   */
  static searchMemories(
    memos: ChatMemo[], 
    characterId: string, 
    query: string
  ): ChatMemo[] {
    const characterMemos = this.getCharacterMemories(memos, characterId);
    
    if (!query.trim()) {
      return characterMemos;
    }

    const lowerQuery = query.toLowerCase();
    
    return characterMemos.filter(memo =>
      memo.note.toLowerCase().includes(lowerQuery) ||
      memo.content.toLowerCase().includes(lowerQuery) ||
      memo.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 関連メモリを取得（タグベース）
   */
  static getRelatedMemories(
    memos: ChatMemo[], 
    characterId: string, 
    tags: string[], 
    limit: number = 5
  ): ChatMemo[] {
    const characterMemos = this.getCharacterMemories(memos, characterId);
    
    // タグの一致度でスコア計算
    const scored = characterMemos.map(memo => {
      const matchingTags = memo.tags.filter(tag => tags.includes(tag));
      const score = matchingTags.length;
      return { memo, score };
    });

    // スコア順でソート、スコア0は除外
    const filtered = scored
      .filter(item => item.score > 0)
      .sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score; // スコア高い順
        }
        return b.memo.updatedAt - a.memo.updatedAt; // 新しい順
      });

    return filtered.slice(0, limit).map(item => item.memo);
  }
} 