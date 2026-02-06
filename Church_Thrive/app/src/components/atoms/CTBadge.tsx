import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

type BadgeColor = 'green' | 'blue' | 'yellow' | 'red' | 'gray';

interface CTBadgeProps {
  label?: string;
  count?: number;
  color?: BadgeColor;
  size?: 'sm' | 'md';
  dot?: boolean;
  children?: ReactNode;
}

const colorStyles: Record<BadgeColor, string> = {
  green: 'bg-green-50 text-green-800',
  blue: 'bg-blue-50 text-blue-800',
  yellow: 'bg-yellow-50 text-yellow-800',
  red: 'bg-red-50 text-red-800',
  gray: 'bg-gray-100 text-gray-600',
};

const dotColors: Record<BadgeColor, string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  gray: 'bg-gray-400',
};

export function CTBadge({ label, count, color = 'gray', size = 'md', dot, children }: CTBadgeProps) {
  if (dot) {
    return <span className={cn('inline-block w-2 h-2 rounded-full', dotColors[color])} />;
  }

  if (count !== undefined) {
    return (
      <span className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        'min-w-[20px] px-1.5',
        size === 'sm' ? 'h-5 text-[10px]' : 'h-6 text-ct-xs',
        colorStyles[color]
      )}>
        {count > 99 ? '99+' : count}
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium px-2.5',
      size === 'sm' ? 'h-6 text-[11px]' : 'h-7 text-ct-xs',
      colorStyles[color]
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[color])} />
      {label || children}
    </span>
  );
}
