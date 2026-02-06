import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface CTStatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  change?: { value: number; label?: string };
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
  className?: string;
}

const colorMap = {
  green: 'bg-green-50',
  blue: 'bg-blue-50',
  yellow: 'bg-yellow-50',
  red: 'bg-red-50',
  gray: 'bg-gray-50',
};

export function CTStatCard({ label, value, icon, change, color = 'gray', className }: CTStatCardProps) {
  return (
    <div className={cn('bg-white rounded-ct-lg shadow-ct-1 p-4', className)}>
      <div className="flex items-start justify-between">
        <p className="text-ct-xs text-gray-500">{label}</p>
        {icon && (
          <div className={cn('w-8 h-8 rounded-ct-md flex items-center justify-center', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-ct-2xl font-bold mt-1 text-[var(--ct-color-text-heading)]">{value}</p>
      {change && (
        <p className={cn('text-ct-xs mt-1', change.value >= 0 ? 'text-ct-success' : 'text-ct-error')}>
          {change.value >= 0 ? '\u2191' : '\u2193'} {Math.abs(change.value)}%
          {change.label && <span className="text-gray-400 ml-1">{change.label}</span>}
        </p>
      )}
    </div>
  );
}
