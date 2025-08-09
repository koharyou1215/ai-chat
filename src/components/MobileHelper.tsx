'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Wifi, WifiOff, Battery, BatteryCharging } from 'lucide-react';

// BatteryManager型定義
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

interface MobileHelperProps {
  children: React.ReactNode;
}

export default function MobileHelper({ children }: MobileHelperProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // モバイルデバイス判定
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    // オンライン状態監視
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // バッテリー状態監視
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as Navigator & { getBattery(): Promise<BatteryManager> }).getBattery();
          setBatteryLevel(battery.level * 100);
          setIsCharging(battery.charging);

          battery.addEventListener('levelchange', () => {
            setBatteryLevel(battery.level * 100);
          });

          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
          });
        } catch {
          console.log('バッテリー情報が取得できません');
        }
      }
    };

    checkMobile();
    getBatteryInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="mobile-helper">
      {/* モバイル用ステータスバー */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm px-4 py-2 flex items-center justify-between text-white text-xs safe-area-top">
        <div className="flex items-center gap-2">
          <Smartphone size={12} />
          <span>AI Chat</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* ネットワーク状態 */}
          {isOnline ? (
            <Wifi size={12} className="text-green-400" />
          ) : (
            <WifiOff size={12} className="text-red-400" />
          )}
          
          {/* バッテリー状態 */}
          {batteryLevel !== null && (
            <div className="flex items-center gap-1">
              {isCharging ? (
                <BatteryCharging size={12} className="text-green-400" />
              ) : (
                <Battery size={12} className={batteryLevel < 20 ? 'text-red-400' : 'text-white'} />
              )}
              <span className="text-xs">{Math.round(batteryLevel)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="pt-8">
        {children}
      </div>

      {/* モバイル用の追加スタイル */}
      <style jsx>{`
        .mobile-helper {
          /* iPhone Safari用の追加スタイル */
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        
        /* 安全エリア対応 */
        @supports (padding: max(0px)) {
          .mobile-helper {
            padding-top: max(0px, env(safe-area-inset-top));
            padding-bottom: max(0px, env(safe-area-inset-bottom));
            padding-left: max(0px, env(safe-area-inset-left));
            padding-right: max(0px, env(safe-area-inset-right));
          }
        }
      `}</style>
    </div>
  );
} 