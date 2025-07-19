// タッチジェスチャー管理ユーティリティ
export class TouchGestureManager {
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private isTracking: boolean = false;

  constructor(
    private onSwipeLeft?: () => void,
    private onSwipeRight?: () => void,
    private onSwipeUp?: () => void,
    private onSwipeDown?: () => void,
    private onTap?: () => void
  ) {}

  handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.startTime = Date.now();
      this.isTracking = true;
    }
  };

  handleTouchMove = (e: TouchEvent) => {
    if (!this.isTracking) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - this.startX;
    const deltaY = currentY - this.startY;
    
    // 縦方向のスクロールが大きい場合はジェスチャーを無効化
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      this.isTracking = false;
    }
  };

  handleTouchEnd = (e: TouchEvent) => {
    if (!this.isTracking) return;
    
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    // タップ判定（短時間で小さな移動）
    if (duration < 300 && Math.abs(e.changedTouches[0].clientX - this.startX) < 10 && Math.abs(e.changedTouches[0].clientY - this.startY) < 10) {
      this.onTap?.();
      this.isTracking = false;
      return;
    }
    
    const deltaX = e.changedTouches[0].clientX - this.startX;
    const deltaY = e.changedTouches[0].clientY - this.startY;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      // 水平スワイプ
      if (deltaX > 0) {
        this.onSwipeRight?.();
      } else {
        this.onSwipeLeft?.();
      }
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
      // 垂直スワイプ
      if (deltaY > 0) {
        this.onSwipeDown?.();
      } else {
        this.onSwipeUp?.();
      }
    }
    
    this.isTracking = false;
  };

  attach(element: HTMLElement) {
    element.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    element.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    element.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }

  detach(element: HTMLElement) {
    element.removeEventListener('touchstart', this.handleTouchStart);
    element.removeEventListener('touchmove', this.handleTouchMove);
    element.removeEventListener('touchend', this.handleTouchEnd);
  }
}

// モバイルデバイス判定
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// iPhone Safari判定
export const isIPhoneSafari = () => {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
};

// 安全エリア対応
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0'),
    bottom: parseInt(style.getPropertyValue('--sab') || '0'),
    left: parseInt(style.getPropertyValue('--sal') || '0'),
    right: parseInt(style.getPropertyValue('--sar') || '0')
  };
}; 