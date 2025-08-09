/**
 * モーダル開閉ロジックの共通ユーティリティ
 */

import { useCallback, useEffect, useRef } from 'react';

export interface ModalState {
  isOpen: boolean;
  data?: unknown;
  props?: Record<string, unknown>;
}

export interface ModalOptions {
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  preventBodyScroll?: boolean;
  focusManagement?: boolean;
  zIndex?: number;
}

export interface ModalHookResult {
  isOpen: boolean;
  open: (data?: unknown, props?: Record<string, unknown>) => void;
  close: () => void;
  toggle: () => void;
  data?: unknown;
  props?: Record<string, unknown>;
}

/**
 * モーダル管理フック
 */
export function useModal(options: ModalOptions = {}): ModalHookResult {
  const [state, setState] = React.useState<ModalState>({
    isOpen: false,
    data: undefined,
    props: undefined
  });

  const {
    closeOnEscape = true,
    closeOnBackdropClick = true,
    preventBodyScroll = true,
    focusManagement = true
  } = options;

  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const open = useCallback((data?: unknown, props?: Record<string, unknown>) => {
    if (focusManagement) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }

    setState({ isOpen: true, data, props });

    if (preventBodyScroll) {
      document.body.style.overflow = 'hidden';
    }
  }, [focusManagement, preventBodyScroll]);

  const close = useCallback(() => {
    setState({ isOpen: false, data: undefined, props: undefined });

    if (preventBodyScroll) {
      document.body.style.overflow = '';
    }

    if (focusManagement && previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
    }
  }, [preventBodyScroll, focusManagement]);

  const toggle = useCallback(() => {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }, [state.isOpen, open, close]);

  // ESCキーでクローズ
  useEffect(() => {
    if (!closeOnEscape || !state.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeOnEscape, state.isOpen, close]);

  // フォーカス管理
  useEffect(() => {
    if (!focusManagement || !state.isOpen) return;

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const modal = document.querySelector('[data-modal="true"]');
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleFocusTrap);
    return () => document.removeEventListener('keydown', handleFocusTrap);
  }, [focusManagement, state.isOpen]);

  return {
    isOpen: state.isOpen,
    open,
    close,
    toggle,
    data: state.data,
    props: state.props
  };
}

/**
 * 複数モーダルの管理クラス
 */
export class ModalManager {
  private modals = new Map<string, ModalState>();
  private subscribers = new Set<(modals: Map<string, ModalState>) => void>();
  private zIndexCounter = 1000;

  /**
   * モーダルを開く
   */
  open(id: string, data?: unknown, props?: Record<string, unknown>): void {
    this.modals.set(id, {
      isOpen: true,
      data,
      props: {
        ...props,
        zIndex: this.zIndexCounter++
      }
    });
    this.notify();
  }

  /**
   * モーダルを閉じる
   */
  close(id: string): void {
    this.modals.set(id, {
      isOpen: false,
      data: undefined,
      props: undefined
    });
    this.notify();
  }

  /**
   * 全モーダルを閉じる
   */
  closeAll(): void {
    for (const id of this.modals.keys()) {
      this.close(id);
    }
  }

  /**
   * モーダル状態を取得
   */
  getState(id: string): ModalState {
    return this.modals.get(id) || { isOpen: false };
  }

  /**
   * 開いているモーダルの数を取得
   */
  getOpenCount(): number {
    return Array.from(this.modals.values()).filter(modal => modal.isOpen).length;
  }

  /**
   * 最前面のモーダルIDを取得
   */
  getTopModalId(): string | null {
    let topId: string | null = null;
    let maxZIndex = 0;

    for (const [id, state] of this.modals.entries()) {
      if (state.isOpen && state.props?.zIndex && state.props.zIndex > maxZIndex) {
        maxZIndex = state.props.zIndex as number;
        topId = id;
      }
    }

    return topId;
  }

  /**
   * 変更を購読
   */
  subscribe(callback: (modals: Map<string, ModalState>) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(): void {
    for (const callback of this.subscribers) {
      callback(new Map(this.modals));
    }
  }
}

/**
 * グローバルモーダルマネージャーのインスタンス
 */
export const globalModalManager = new ModalManager();

/**
 * モーダル背景のクリックハンドラー
 */
export function createBackdropClickHandler(
  onClose: () => void,
  closeOnBackdropClick: boolean = true
) {
  return (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };
}

/**
 * モーダルアニメーションのCSS クラス
 */
export const modalAnimationClasses = {
  overlay: {
    enter: 'animate-fadeIn',
    exit: 'animate-fadeOut'
  },
  modal: {
    enter: 'animate-slideInFromBottom',
    exit: 'animate-slideOutToBottom'
  }
};

/**
 * モーダルのデフォルトスタイル
 */
export const defaultModalStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative' as const,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
  }
};

/**
 * モーダルコンポーネント用の共通Props
 */
export interface ModalComponentProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  preventBodyScroll?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
}

/**
 * モーダルサイズのスタイル
 */
export const modalSizeStyles = {
  sm: { maxWidth: '400px' },
  md: { maxWidth: '600px' },
  lg: { maxWidth: '800px' },
  xl: { maxWidth: '1200px' },
  full: { width: '95vw', height: '95vh', maxWidth: 'none', maxHeight: 'none' }
};

/**
 * モーダルの状態をローカルストレージに保存
 */
export function saveModalState(id: string, state: ModalState): void {
  try {
    const savedStates = JSON.parse(localStorage.getItem('modalStates') || '{}');
    savedStates[id] = {
      ...state,
      // isOpenは保存しない（ページリロード時に開いてほしくない）
      isOpen: false
    };
    localStorage.setItem('modalStates', JSON.stringify(savedStates));
  } catch (error) {
    console.warn('Failed to save modal state:', error);
  }
}

/**
 * ローカルストレージからモーダル状態を復元
 */
export function loadModalState(id: string): ModalState {
  try {
    const savedStates = JSON.parse(localStorage.getItem('modalStates') || '{}');
    return savedStates[id] || { isOpen: false };
  } catch (error) {
    console.warn('Failed to load modal state:', error);
    return { isOpen: false };
  }
}