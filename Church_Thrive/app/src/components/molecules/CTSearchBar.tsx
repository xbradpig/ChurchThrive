'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CTSearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch?: (query: string) => void;
  onChange?: (value: string) => void;
  enableChosungSearch?: boolean;
  autoFocus?: boolean;
  className?: string;
  debounceMs?: number;
}

export function CTSearchBar({
  placeholder = '검색',
  value: controlledValue,
  onSearch,
  onChange,
  autoFocus,
  className,
  debounceMs = 300,
}: CTSearchBarProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch?.(newValue);
    }, debounceMs);
  }, [onChange, onSearch, debounceMs]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange?.('');
    onSearch?.('');
  }, [onChange, onSearch]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full h-11 pl-10 pr-10 bg-gray-50 rounded-full text-ct-md',
          'border border-transparent',
          'placeholder:text-gray-400',
          'focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-ct-primary/20',
          'transition-colors'
        )}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearch?.(value);
          }
        }}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
          aria-label="검색어 지우기"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
