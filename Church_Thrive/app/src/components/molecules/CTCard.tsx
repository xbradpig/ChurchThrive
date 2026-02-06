import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface CTCardProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingMap = { sm: 'p-3', md: 'p-4', lg: 'p-6' };

export function CTCard({ title, subtitle, children, actions, onClick, padding = 'md', className }: CTCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-white rounded-ct-lg shadow-ct-1',
        onClick && 'hover:shadow-ct-2 transition-shadow cursor-pointer text-left w-full',
        paddingMap[padding],
        className
      )}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="text-ct-md font-semibold text-[var(--ct-color-text-heading)]">{title}</h3>}
          {subtitle && <p className="text-ct-sm text-[var(--ct-color-text-secondary)] mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
      {actions && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          {actions}
        </div>
      )}
    </Component>
  );
}
