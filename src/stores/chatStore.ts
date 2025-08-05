import { create } from 'zustand';
import { Character, CharacterTracker, ChatMessage, TrackerValue } from '../../types/character';

// 永続化キー
const STORAGE_KEYS = {
  trackerValues: 'ai-chat-tracker-values', // Record<sessionId, Record<trackerName, TrackerValue>>
};

type SessionTrackerValues = Record<string, TrackerValue>;
type TrackerStateMap = Record<string, SessionTrackerValues>; // sessionId -> trackers

interface ChatState {
  // 既存
  messages: ChatMessage[];
  currentChat: string | null;
  setMessages: (messages: ChatMessage[]) => void;
  setCurrentChat: (chatId: string | null) => void;

  // 追加: トラッカー管理
  trackerValues: TrackerStateMap;

  initializeTrackersForSession: (sessionId: string, character: Character) => void;
  updateTrackerValue: (sessionId: string, name: string, value: number | string | boolean) => void;
  getTrackerValues: (sessionId: string) => SessionTrackerValues;
  analyzeMessageForTrackerUpdates: (sessionId: string, message: ChatMessage, character: Character) => void;

  // 内部ユーティリティ
  _loadPersisted: () => void;
  _persist: (trackerValues: TrackerStateMap) => void;
}

// ユーティリティ: 値をTrackerValueへ正規化
function toTrackerValue(raw: number | string | boolean, type: CharacterTracker['type']): TrackerValue {
  if (type === 'numeric' && typeof raw === 'number') {
    return { type: 'numeric', value: raw };
  }
  if (type === 'boolean' && typeof raw === 'boolean') {
    return { type: 'boolean', value: raw };
  }
  if (type === 'state' && typeof raw === 'string') {
    return { type: 'state', value: raw };
  }
  // fallback は text として扱う
  return { type: 'text', value: String(raw) };
}

// ユーティリティ: min/max クリップ
function clamp(val: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

// 簡易解析: AIメッセージから数値型トラッカーを自動調整（ルールベース）
function applyHeuristics(
  trackers: CharacterTracker[],
  existing: SessionTrackerValues,
  messageText: string
): SessionTrackerValues {
  const next: SessionTrackerValues = { ...existing };

  // ルール定義（将来LLM解析に置換可）
  const rules: {
    nameIncludes?: string[];
    inc?: number;
    dec?: number;
    whenIncludes?: string[];
  }[] = [
    { nameIncludes: ['affection', 'affection_level'], inc: 2, whenIncludes: ['好き', '嬉しい', '楽しい', 'ありがとう'] },
    { nameIncludes: ['trust', 'trust_level'], inc: 1, whenIncludes: ['信じる', '任せて', '頼り', '安心'] },
    { nameIncludes: ['mood'], inc: 1, whenIncludes: ['楽しい', 'ワクワク', '嬉しい'] },
    { nameIncludes: ['mood'], dec: 1, whenIncludes: ['悲しい', 'つらい', '怒る', '不安'] },
  ];

  const lower = messageText.toLowerCase();

  trackers.forEach((t) => {
    const current = next[t.name];
    if (t.type !== 'numeric') return;

    const base =
      current && current.type === 'numeric' && typeof current.value === 'number'
        ? current.value
        : t.initial_value || 0;

    let value = base;

    rules.forEach((r) => {
      if (!r.nameIncludes || !r.whenIncludes) return;
      const nameHit = r.nameIncludes.some((k) => t.name.includes(k));
      const textHit = r.whenIncludes.some((kw) => lower.includes(kw) || messageText.includes(kw));
      if (nameHit && textHit) {
        if (r.inc) value += r.inc;
        if (r.dec) value -= r.dec;
      }
    });

    value = clamp(value, t.min_value ?? 0, t.max_value ?? 100);
    next[t.name] = toTrackerValue(value, 'numeric');
  });

  return next;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // 既存
  messages: [],
  currentChat: null,
  setMessages: (messages) => set({ messages }),
  setCurrentChat: (currentChat) => set({ currentChat }),

  // 追加
  trackerValues: {},

  _loadPersisted: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.trackerValues);
      if (raw) {
        const parsed = JSON.parse(raw) as TrackerStateMap;
        set({ trackerValues: parsed });
      }
    } catch (e) {
      console.warn('Tracker persistence load failed:', e);
    }
  },

  _persist: (trackerValues: TrackerStateMap) => {
    try {
      localStorage.setItem(STORAGE_KEYS.trackerValues, JSON.stringify(trackerValues));
    } catch (e) {
      console.warn('Tracker persistence save failed:', e);
    }
  },

  initializeTrackersForSession: (sessionId, character) => {
    const state = get();
    // 初回ロード
    if (Object.keys(state.trackerValues).length === 0) {
      state._loadPersisted();
    }

    const current = { ...state.trackerValues };
    if (current[sessionId]) {
      // 既に存在する場合は何もしない（必要なら再初期化ロジックへ変更可）
      set({ trackerValues: current });
      return;
    }

    const tv: SessionTrackerValues = {};
    (character.trackers || []).forEach((t) => {
      switch (t.type) {
        case 'numeric':
          tv[t.name] = toTrackerValue(t.initial_value ?? 0, 'numeric');
          break;
        case 'state':
          tv[t.name] = toTrackerValue(t.initial_state ?? '', 'state');
          break;
        case 'boolean':
          tv[t.name] = toTrackerValue(t.initial_boolean ?? false, 'boolean');
          break;
        case 'text':
          tv[t.name] = toTrackerValue(t.initial_text ?? '', 'text');
          break;
      }
    });

    current[sessionId] = tv;
    set({ trackerValues: current });
    state._persist(current);
  },

  updateTrackerValue: (sessionId, name, value) => {
    const state = get();
    const map = { ...state.trackerValues };
    const session = { ...(map[sessionId] || {}) };

    // 型は既存値から推定、無ければ数値/真偽/文字列の順に決定
    const existing = session[name];
    let type: CharacterTracker['type'] = 'text';
    if (typeof value === 'number') type = 'numeric';
    else if (typeof value === 'boolean') type = 'boolean';
    else if (typeof value === 'string') type = 'text';
    if (existing) type = existing.type;

    session[name] = toTrackerValue(value as number | string | boolean, type);
    map[sessionId] = session;

    set({ trackerValues: map });
    state._persist(map);
  },

  getTrackerValues: (sessionId) => {
    const state = get();
    if (Object.keys(state.trackerValues).length === 0) {
      state._loadPersisted();
    }
    return get().trackerValues[sessionId] || {};
  },

  analyzeMessageForTrackerUpdates: (sessionId, message, character) => {
    // 対象はAIメッセージのみ（必要であればユーザーも解析可）
    if (message.role !== 'assistant') return;

    const state = get();
    const map = { ...state.trackerValues };
    const current = { ...(map[sessionId] || {}) };

    const updated = applyHeuristics(character.trackers || [], current, message.content || '');
    map[sessionId] = updated;
    set({ trackerValues: map });
    state._persist(map);
  },
}));
