'use client';

import React from 'react';

interface SliderProps {
  value: number;
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className = '' }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([parseFloat(e.target.value)]);
  };

  return (
    <input
      type="range"
      value={value}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${className}`}
    />
  );
}