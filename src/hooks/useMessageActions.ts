/**
 * メッセージアクション管理フック
 */
import { useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useMemoStore } from '../stores/memoStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useCharacterStore } from '../stores/characterStore';
import { usePersonaStore } from '../stores/personaStore';

export interface UseMessageActionsReturn {
  handleRegenerate: (messageId: string) => Promise<void>;
  handleContinue: (messageId: string) => Promise<void>;
  handleAddMemo: (messageId: string, content: string) => void;
  handleReturnToPoint: (messageId: string) => void;
  handleCopyMessage: (content: string) => void;
  handlePlayAudio: (messageId: string, content: string) => Promise<void>;
}

export const useMessageActions = (): UseMessageActionsReturn => {
  const { messages, setMessages } = useChatStore();
  const { addMemo } = useMemoStore();
  const { settings } = useSettingsStore();
  const { currentCharacter } = useCharacterStore();
  const { currentPersona } = usePersonaStore();

  // メッセージ再生成
  const handleRegenerate = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') return;

    // 対象メッセージの直前のユーザーメッセージを取得
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }

    if (userMessageIndex < 0) return;

    const userMessage = messages[userMessageIndex];
    
    // 対象メッセージ以降を削除
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);

    // TODO: AI API呼び出しを実装（既存のsendMessage関数を使用）
    console.log('再生成:', userMessage.content);
  }, [messages, setMessages]);

  // メッセージ続き
  const handleContinue = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') return;

    const currentMessage = messages[messageIndex];
    
    // TODO: 続きのテキスト生成API呼び出し
    console.log('続き生成:', currentMessage.content);
  }, [messages]);

  // メモ追加
  const handleAddMemo = useCallback((messageId: string, content: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    addMemo({
      content,
      messageId,
      characterId: currentCharacter?.["file-name"],
      personaId: currentPersona?.id,
      tags: [],
      isImportant: false,
    });

    console.log('メモ追加:', content);
  }, [messages, currentCharacter, currentPersona, addMemo]);

  // 特定地点に戻る
  const handleReturnToPoint = useCallback((messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // 対象メッセージ以降を削除
    const newMessages = messages.slice(0, messageIndex + 1);
    setMessages(newMessages);

    console.log('リターン実行:', messageId);
  }, [messages, setMessages]);

  // メッセージコピー
  const handleCopyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      console.log('コピー完了');
    } catch (err) {
      console.error('コピー失敗:', err);
    }
  }, []);

  // 音声再生
  const handlePlayAudio = useCallback(async (messageId: string, content: string) => {
    if (settings.voiceProvider === 'none') {
      console.log('音声機能が無効です');
      return;
    }

    // TODO: 音声合成API呼び出し
    console.log('音声再生:', content.substring(0, 50) + '...');
  }, [settings.voiceProvider]);

  return {
    handleRegenerate,
    handleContinue,
    handleAddMemo,
    handleReturnToPoint,
    handleCopyMessage,
    handlePlayAudio,
  };
};