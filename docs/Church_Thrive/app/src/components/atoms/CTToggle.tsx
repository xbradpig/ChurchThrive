'use client';

import { cn } from '@/lib/cn';

interface CTToggleProps {
  isOn: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function CTToggle({ isOn, onChange, label, size = 'md', disabled }: CTToggleProps) {
  const trackSize = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
  const thumbSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';
  const translateX = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  return (
    <label className={cn('inline-flex items-center gap-2', disabled && 'opacity-60 cursor-not-allowed')}>
      <button
        role="switch"
        aria-checked={isOn}
        disabled={disabled}
        onClick={() => !disabled && onChange(!isOn)}
        className={cn(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-150',
          trackSize,
          isOn ? 'bg-ct-primary' : 'bg-gray-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-primary focus-visible:ring-offset-2'
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transition-transform duration-150',
            thumbSize,
            'mt-[3px] ml-[3px]',
            isOn && translateX
          )}
        />
      </button>
      {label && <span className="text-ct-md text-[var(--ct-color-text-primary)]">{label}</span>}
    </label>
  );
}
