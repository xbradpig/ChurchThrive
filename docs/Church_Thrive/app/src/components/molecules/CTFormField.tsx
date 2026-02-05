import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface CTFormFieldProps {
  label?: string;
  isRequired?: boolean;
  helperText?: string;
  errorMessage?: string;
  children: ReactNode;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export function CTFormField({
  label,
  isRequired,
  helperText,
  errorMessage,
  children,
  direction = 'vertical',
  className,
}: CTFormFieldProps) {
  return (
    <div className={cn(
      direction === 'horizontal' ? 'sm:flex sm:items-start sm:gap-4' : 'space-y-1.5',
      className
    )}>
      {label && (
        <label className={cn(
          'block text-ct-sm font-medium text-gray-700',
          direction === 'horizontal' && 'sm:w-[120px] sm:pt-2.5 sm:shrink-0'
        )}>
          {label}
          {isRequired && <span className="text-ct-error ml-0.5">*</span>}
        </label>
      )}
      <div className="flex-1">
        {children}
        {errorMessage ? (
          <p className="mt-1 text-ct-xs text-ct-error flex items-center gap-1">
            <span>&#9888;</span> {errorMessage}
          </p>
        ) : helperText ? (
          <p className="mt-1 text-ct-xs text-gray-400">{helperText}</p>
        ) : null}
      </div>
    </div>
  );
}
