/**
 * チャット機能のロジックを管理するフック
 */
import { useCallback } from 'react';
import { useMemoStore } from '../stores/memoStore';
import { Message as BaseMessage, ChatSummary } from './useChatState';
import { Character } from '../../types/character';
import { apiRequest } from '../../lib/apiUtils';
import { withErrorHandling } from '../../lib/errorUtils';

type Message = BaseMessage | {
  id: string;
  role: 'system';
  content: string;
  timestamp: number;
};

interface UseChatLogicProps {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsGeneratingImage: (generating: boolean) => void;
  currentCharacter: Character | null;
  settings: any; // TODO: 適切な型定義
}

export function useChatLogic({
  messages,
  setMessages,
  setIsLoading,
  setIsGeneratingImage,
  currentCharacter,
  settings
}: UseChatLogicProps) {
  // メモストアからAIメモリを取得
  const { memos } = useMemoStore();

  /**
   * メッセージ送信
   */
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !currentCharacter) return;


    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    // ユーザーメッセージを追加
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // 重要なAIメモリをsystemロールとして先頭に合成
    let aiMemoryMessages: Message[] = [];
    if (currentCharacter) {
      const aiMemos = memos.filter(m => m.characterId === currentCharacter.name && m.isAiMemory);
      aiMemoryMessages = aiMemos.map(memo => ({
        id: memo.id,
        role: 'system',
        content: memo.content || memo.note || '',
        timestamp: memo.updatedAt || memo.createdAt || Date.now()
      }) as Message);
    }

    // systemメッセージ＋通常メッセージを合成
    const promptMessages = [...aiMemoryMessages, ...newMessages].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const result = await withErrorHandling(async () => {
        const response = await apiRequest({
          url: '/api/simple-chat',
          method: 'POST',
          body: {
            messages: promptMessages,
            character: currentCharacter,
            settings: {
              model: settings.model || 'openai/gpt-4o-mini',
              maxTokens: settings.maxTokens || 1000,
              temperature: settings.temperature || 0.7,
              ...settings
            }
          }
        });

        if (!response.success) {
          throw new Error(response.error || 'チャット送信に失敗しました');
        }

        return response.data;
      });

      if (result.success) {
        const data = result.data as { content?: string; message?: string };
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.content || data.message || '',
          timestamp: Date.now()
        };
        setMessages([...newMessages, assistantMessage]);
      } else if ('error' in result) {
        console.error('チャット送信エラー:', result.error);
        // エラーメッセージを表示
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `エラーが発生しました: ${result.error.message}`,
          timestamp: Date.now()
        };
        setMessages([...newMessages, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, setMessages, setIsLoading, currentCharacter, settings, memos]);

  /**
   * 最後のメッセージを再生成
   */
  const regenerateLastMessage = useCallback(async () => {
    if (messages.length < 2) return;

    // 最後のアシスタントメッセージを削除
    const messagesWithoutLast = messages.slice(0, -1);
    if (messagesWithoutLast[messagesWithoutLast.length - 1]?.role !== 'user') {
      return;
    }

    setMessages(messagesWithoutLast);
    setIsLoading(true);

    try {
      const result = await withErrorHandling(async () => {
        const response = await apiRequest({
          url: '/api/simple-chat',
          method: 'POST',
          body: {
            messages: messagesWithoutLast.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            character: currentCharacter,
            settings: {
              model: settings.model || 'openai/gpt-4o-mini',
              maxTokens: settings.maxTokens || 1000,
              temperature: settings.temperature || 0.7,
              ...settings
            }
          }
        });

        if (!response.success) {
          throw new Error(response.error || '再生成に失敗しました');
        }

        return response.data;
      });

      if (result.success) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.data.content || result.data.message || '',
          timestamp: Date.now()
        };

        setMessages([...messagesWithoutLast, assistantMessage]);
      } else {
        // エラーの場合は元のメッセージに戻す
        setMessages(messages);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, setMessages, setIsLoading, currentCharacter, settings]);

  /**
   * 画像生成
   */
  const generateImage = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    setIsGeneratingImage(true);

    try {
      const result = await withErrorHandling(async () => {
        const response = await apiRequest({
          url: '/api/generate-image',
          method: 'POST',
          body: {
            prompt,
            character: currentCharacter?.name || 'AI',
            settings: settings
          }
        });

        if (!response.success) {
          throw new Error(response.error || '画像生成に失敗しました');
        }

        return response.data;
      });

      if (result.success && result.data.imageUrl) {
        const imageMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `画像を生成しました: ${prompt}`,
          image: result.data.imageUrl,
          timestamp: Date.now()
        };

        setMessages([...messages, imageMessage]);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  }, [messages, setMessages, setIsGeneratingImage, currentCharacter, settings]);

  /**
   * チャット要約生成
   */
  const generateSummary = useCallback(async (): Promise<ChatSummary | null> => {
    if (messages.length === 0) return null;

    try {
      const result = await withErrorHandling(async () => {
        const response = await apiRequest({
          url: '/api/summarize-chat',
          method: 'POST',
          body: {
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp
            })),
            character: currentCharacter
          }
        });

        if (!response.success) {
          throw new Error(response.error || '要約生成に失敗しました');
        }

        return response.data;
      });

      return result.success ? result.data : null;
    } catch (error) {
      console.error('要約生成エラー:', error);
      return null;
    }
  }, [messages, currentCharacter]);

  /**
   * メッセージクリア
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  /**
   * 初期メッセージ設定
   */
  const setInitialMessage = useCallback((character: Character) => {
    if (character.first_message) {
      const initialMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: character.first_message,
        timestamp: Date.now()
      };
      setMessages([initialMessage]);
    } else {
      clearMessages();
    }
  }, [setMessages, clearMessages]);

  return {
    sendMessage,
    regenerateLastMessage,
    generateImage,
    generateSummary,
    clearMessages,
    setInitialMessage
  };
}