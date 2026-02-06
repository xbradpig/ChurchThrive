'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface CTCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

const CTCheckbox = forwardRef<HTMLInputElement, CTCheckboxProps>(
  ({ className, label, size = 'md', ...props }, ref) => {
    return (
      <label className={cn('inline-flex items-center gap-2 cursor-pointer', className)}>
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            sizes[size],
            'rounded border-gray-300 text-ct-primary',
            'focus:ring-2 focus:ring-ct-primary/40 focus:ring-offset-2',
            'cursor-pointer'
          )}
          {...props}
        />
        {label && <span className="text-ct-md text-[var(--ct-color-text-primary)]">{label}</span>}
      </label>
    );
  }
);

CTCheckbox.displayName = 'CTCheckbox';
export { CTCheckbox, type CTCheckboxProps };
