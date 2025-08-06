'use client';

import { useState, useEffect } from 'react';
import { CharacterTracker, TrackerValue } from '../types/character';
import { Heart, Shield, Smile, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CharacterTrackerDisplayProps {
  trackers: CharacterTracker[];
  currentValues: Record<string, TrackerValue>;
  onChange: (name: string, value: number | string | boolean) => void;
  readOnly?: boolean;
  compact?: boolean;
}

// トラッカーアイコンのマッピング
const getTrackerIcon = (name: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    affection: <Heart className="w-4 h-4" />,
    trust: <Shield className="w-4 h-4" />,
    mood: <Smile className="w-4 h-4" />,
    default: <TrendingUp className="w-4 h-4" />
  };
  
  return iconMap[name] || iconMap.default;
};

// 値の色分け
const getValueColor = (value: number, maxValue: number = 100) => {
  const percentage = (value / maxValue) * 100;
  if (percentage >= 80) return 'text-green-600 bg-green-100';
  if (percentage >= 60) return 'text-blue-600 bg-blue-100';
  if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
  if (percentage >= 20) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

// プログレスバーの色
const getProgressColor = (value: number, maxValue: number = 100) => {
  const percentage = (value / maxValue) * 100;
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

export default function CharacterTrackerDisplay({ 
  trackers, 
  currentValues, 
  onChange, 
  readOnly = false,
  compact = false 
}: CharacterTrackerDisplayProps) {
  const [animatingTrackers, setAnimatingTrackers] = useState<Set<string>>(new Set());
  const [previousValues, setPreviousValues] = useState<Record<string, TrackerValue>>({});

  // 値が変更された時のアニメーション
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    trackers.forEach(tracker => {
      const currentValue = currentValues[tracker.name];
      const previousValue = previousValues[tracker.name];
      
      // 値が実際に変化した場合のみアニメーション
      if (currentValue && previousValue && 
          currentValue.value !== previousValue.value) {
        setAnimatingTrackers(prev => new Set([...prev, tracker.name]));
        const timeout = setTimeout(() => {
          setAnimatingTrackers(prev => {
            const next = new Set(prev);
            next.delete(tracker.name);
            return next;
          });
        }, 1500); // アニメーション時間を1.5秒に延長
        timeouts.push(timeout);
      }
    });

    // 前回の値を更新
    setPreviousValues(currentValues);

    return () => timeouts.forEach(clearTimeout);
  }, [currentValues, trackers, previousValues]);

  if (!trackers || trackers.length === 0) {
    return null;
  }

  const handleValueChange = (trackerName: string, delta: number) => {
    if (readOnly) return;
    
    const tracker = trackers.find(t => t.name === trackerName);
    if (!tracker || tracker.type !== 'numeric') return;

    const currentTrackerValue = currentValues[trackerName];
    const currentValue = (currentTrackerValue?.type === 'numeric' && typeof currentTrackerValue.value === 'number') 
      ? currentTrackerValue.value 
      : tracker.initial_value || 0;
    const maxValue = tracker.max_value || 100;
    const newValue = Math.max(tracker.min_value || 0, Math.min(maxValue, currentValue + delta));
    
    onChange(trackerName, newValue);
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {trackers.map(tracker => {
          const trackerValue = currentValues[tracker.name];
          
          // 表示値を取得
          let displayValue: string;
          let numericValue = 0;
          
          if (!trackerValue) {
            // 初期値を使用
            if (tracker.type === 'numeric') {
              displayValue = String(tracker.initial_value || 0);
              numericValue = tracker.initial_value || 0;
            } else if (tracker.type === 'state') {
              displayValue = tracker.initial_state || '不明';
            } else if (tracker.type === 'boolean') {
              displayValue = tracker.initial_boolean ? 'はい' : 'いいえ';
            } else {
              displayValue = tracker.initial_text || '';
            }
          } else {
            if (tracker.type === 'numeric' && typeof trackerValue.value === 'number') {
              displayValue = String(trackerValue.value);
              numericValue = trackerValue.value;
            } else if (tracker.type === 'state' && typeof trackerValue.value === 'string') {
              displayValue = trackerValue.value;
            } else if (tracker.type === 'boolean' && typeof trackerValue.value === 'boolean') {
              displayValue = trackerValue.value ? 'はい' : 'いいえ';
            } else {
              displayValue = String(trackerValue.value);
            }
          }
          
          const maxValue = tracker.max_value || 100;
          
          return (
            <div
              key={tracker.name}
              className={`group flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                tracker.type === 'numeric' ? getValueColor(numericValue, maxValue) : 'text-blue-600 bg-blue-100'
              } ${
                animatingTrackers.has(tracker.name) 
                  ? 'animate-pulse scale-110 shadow-lg ring-2 ring-white/50' 
                  : 'scale-100'
              } ${
                !readOnly && tracker.type === 'numeric' ? 'hover:scale-105 hover:shadow-md' : ''
              }`}
            >
              {getTrackerIcon(tracker.name)}
              <span>{tracker.display_name}</span>
              <span className="font-bold">{displayValue}</span>
              
              {/* コンパクトモード用の簡易編集ボタン */}
              {!readOnly && tracker.type === 'numeric' && (
                <div className="ml-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleValueChange(tracker.name, -1);
                    }}
                    className="w-4 h-4 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="1減らす"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleValueChange(tracker.name, 1);
                    }}
                    className="w-4 h-4 flex items-center justify-center text-green-500 hover:bg-green-50 rounded-full transition-colors"
                    title="1増やす"
                  >
                    <TrendingUp className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        パラメータ
      </h3>
      
      <div className="space-y-3">
        {trackers.map(tracker => {
          const trackerValue = currentValues[tracker.name];
          
          // 表示値を取得
          let displayValue: string;
          let numericValue = 0;
          const maxValue = tracker.max_value || 100;
          
          if (!trackerValue) {
            // 初期値を使用
            if (tracker.type === 'numeric') {
              displayValue = `${tracker.initial_value || 0} / ${maxValue}`;
              numericValue = tracker.initial_value || 0;
            } else if (tracker.type === 'state') {
              displayValue = tracker.initial_state || '不明';
            } else if (tracker.type === 'boolean') {
              displayValue = tracker.initial_boolean ? 'はい' : 'いいえ';
            } else {
              displayValue = tracker.initial_text || '';
            }
          } else {
            if (tracker.type === 'numeric' && typeof trackerValue.value === 'number') {
              displayValue = `${trackerValue.value} / ${maxValue}`;
              numericValue = trackerValue.value;
            } else if (tracker.type === 'state' && typeof trackerValue.value === 'string') {
              displayValue = trackerValue.value;
            } else if (tracker.type === 'boolean' && typeof trackerValue.value === 'boolean') {
              displayValue = trackerValue.value ? 'はい' : 'いいえ';
            } else {
              displayValue = String(trackerValue.value);
            }
          }
          
          const percentage = tracker.type === 'numeric' ? (numericValue / maxValue) * 100 : 0;
          
          return (
            <div key={tracker.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`p-1 rounded ${
                    tracker.type === 'numeric' ? getValueColor(numericValue, maxValue) : 'text-blue-600 bg-blue-100'
                  }`}>
                    {getTrackerIcon(tracker.name)}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {tracker.display_name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-2 py-1 rounded ${
                    tracker.type === 'numeric' ? getValueColor(numericValue, maxValue) : 'text-blue-600 bg-blue-100'
                  } ${
                    animatingTrackers.has(tracker.name) ? 'animate-bounce' : ''
                  }`}>
                    {displayValue}
                  </span>
                  
                  {!readOnly && tracker.type === 'numeric' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleValueChange(tracker.name, -5)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="5減らす"
                      >
                        <TrendingDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleValueChange(tracker.name, -1)}
                        className="p-1 text-gray-500 hover:bg-gray-50 rounded transition-colors"
                        title="1減らす"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleValueChange(tracker.name, 1)}
                        className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors"
                        title="1増やす"
                      >
                        <TrendingUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleValueChange(tracker.name, 5)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="5増やす"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* プログレスバー (数値型のみ) */}
              {tracker.type === 'numeric' && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${getProgressColor(numericValue, maxValue)} ${
                      animatingTrackers.has(tracker.name) ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${Math.max(2, percentage)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}