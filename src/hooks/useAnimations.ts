/**
 * アニメーション制御フック
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export interface UseAnimationsReturn {
  enableAnimations: boolean;
  fadeIn: (element: HTMLElement, delay?: number) => void;
  fadeOut: (element: HTMLElement, duration?: number) => Promise<void>;
  slideIn: (element: HTMLElement, direction?: 'left' | 'right' | 'up' | 'down', delay?: number) => void;
  bounceIn: (element: HTMLElement, delay?: number) => void;
  pulse: (element: HTMLElement, duration?: number) => void;
  shake: (element: HTMLElement) => void;
  observeIntersection: (callback: IntersectionObserverCallback) => IntersectionObserver;
}

export const useAnimations = (): UseAnimationsReturn => {
  const { settings } = useSettingsStore();
  const enableAnimations = settings.enableAnimations;

  // フェードイン効果
  const fadeIn = useCallback((element: HTMLElement, delay = 0) => {
    if (!enableAnimations) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay);
  }, [enableAnimations]);

  // フェードアウト効果
  const fadeOut = useCallback((element: HTMLElement, duration = 300): Promise<void> => {
    return new Promise((resolve) => {
      if (!enableAnimations) {
        element.style.opacity = '0';
        resolve();
        return;
      }
      
      element.style.transition = `opacity ${duration}ms ease-out`;
      element.style.opacity = '0';
      
      setTimeout(resolve, duration);
    });
  }, [enableAnimations]);

  // スライドイン効果
  const slideIn = useCallback((element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up', delay = 0) => {
    if (!enableAnimations) return;
    
    let transform = '';
    switch (direction) {
      case 'left':
        transform = 'translateX(-100%)';
        break;
      case 'right':
        transform = 'translateX(100%)';
        break;
      case 'up':
        transform = 'translateY(30px)';
        break;
      case 'down':
        transform = 'translateY(-30px)';
        break;
    }
    
    element.style.opacity = '0';
    element.style.transform = transform;
    element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0, 0)';
    }, delay);
  }, [enableAnimations]);

  // バウンスイン効果
  const bounceIn = useCallback((element: HTMLElement, delay = 0) => {
    if (!enableAnimations) return;
    
    element.style.opacity = '0';
    element.style.transform = 'scale(0.3)';
    element.style.transition = 'opacity 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55), transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    }, delay);
  }, [enableAnimations]);

  // パルス効果
  const pulse = useCallback((element: HTMLElement, duration = 1000) => {
    if (!enableAnimations) return;
    
    element.style.transition = `transform ${duration / 2}ms ease-in-out`;
    element.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, duration / 2);
  }, [enableAnimations]);

  // シェイク効果
  const shake = useCallback((element: HTMLElement) => {
    if (!enableAnimations) return;
    
    const keyframes = [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' }
    ];
    
    const options = {
      duration: 400,
      easing: 'ease-in-out'
    };
    
    element.animate(keyframes, options);
  }, [enableAnimations]);

  // インtersェクション観察者
  const observeIntersection = useCallback((callback: IntersectionObserverCallback): IntersectionObserver => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    return new IntersectionObserver(callback, options);
  }, []);

  return {
    enableAnimations,
    fadeIn,
    fadeOut,
    slideIn,
    bounceIn,
    pulse,
    shake,
    observeIntersection,
  };
};