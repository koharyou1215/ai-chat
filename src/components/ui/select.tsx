'use client';

import React from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export function Select({ value, onValueChange, children, className = '' }: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {children}
      </select>
    </div>
  );
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  return (
    <div className={`w-full ${className}`}>
      {children}
    </div>
  );
}

export function SelectContent({ children }: SelectContentProps) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: SelectItemProps) {
  return (
    <option value={value}>
      {children}
    </option>
  );
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return <>{placeholder}</>;
}