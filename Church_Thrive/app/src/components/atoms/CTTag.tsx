'use client';

import { cn } from '@/lib/cn';
import { XMarkIcon } from '@heroicons/react/24/outline';

type TagColor = 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple';

interface CTTagProps {
  label: string;
  color?: TagColor;
  size?: 'sm' | 'md';
  isRemovable?: boolean;
  isSelected?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}

const colorStyles: Record<TagColor, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function CTTag({ label, color = 'gray', size = 'md', isRemovable, isSelected, onRemove, onClick }: CTTagProps) {
  return (
    <span
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-ct-xs',
        isSelected ? 'bg-ct-primary-50 text-ct-primary border-ct-primary' : colorStyles[color],
        onClick && 'cursor-pointer hover:opacity-80'
      )}
    >
      {isSelected && <span className="w-3 h-3">&#10003;</span>}
      {label}
      {isRemovable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          className="w-3.5 h-3.5 hover:opacity-70"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}
