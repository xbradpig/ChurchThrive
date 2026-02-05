import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface CTListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  isDivided?: boolean;
  className?: string;
}

export function CTListItem({
  title,
  subtitle,
  meta,
  leftElement,
  rightElement,
  onClick,
  isActive,
  isDivided = true,
  className,
}: CTListItemProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 w-full text-left transition-colors',
        isDivided && 'border-b border-gray-100',
        onClick && 'hover:bg-gray-50 cursor-pointer',
        isActive && 'bg-ct-primary-50 border-l-[3px] border-l-ct-primary',
        className
      )}
    >
      {leftElement && <div className="shrink-0">{leftElement}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-ct-md font-medium text-[var(--ct-color-text-primary)] truncate">{title}</p>
        {subtitle && (
          <p className="text-ct-sm text-[var(--ct-color-text-secondary)] truncate mt-0.5">{subtitle}</p>
        )}
        {meta && (
          <p className="text-ct-xs text-gray-400 mt-0.5">{meta}</p>
        )}
      </div>
      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </Component>
  );
}
