'use client';

import { cn } from '@/lib/cn';

interface CTTabMenuItem {
  key: string;
  label: string;
  count?: number;
}

interface CTTabMenuProps {
  items: CTTabMenuItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function CTTabMenu({ items, activeKey, onChange, className }: CTTabMenuProps) {
  return (
    <div className={cn('flex border-b border-gray-200 overflow-x-auto', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-3 text-ct-sm font-medium whitespace-nowrap',
            'border-b-2 transition-colors -mb-px',
            activeKey === item.key
              ? 'border-ct-primary text-ct-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
              activeKey === item.key ? 'bg-ct-primary-100 text-ct-primary' : 'bg-gray-100 text-gray-500'
            )}>
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
