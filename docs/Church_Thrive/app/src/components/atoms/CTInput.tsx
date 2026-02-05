'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type InputSize = 'sm' | 'md' | 'lg';

interface CTInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  isError?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 px-2.5 text-ct-sm',
  md: 'h-10 px-3 text-ct-md',
  lg: 'h-12 px-4 text-ct-lg',
};

const CTInput = forwardRef<HTMLInputElement, CTInputProps>(
  ({ className, size = 'md', isError, leftIcon, rightIcon, disabled, readOnly, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            'w-full rounded-ct-md border bg-[var(--ct-color-gray-50)] transition-colors',
            'placeholder:text-gray-400',
            'hover:border-gray-400 hover:bg-white',
            'focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white',
            isError
              ? 'border-ct-error focus:ring-ct-error/40'
              : 'border-gray-300 focus:ring-ct-primary/40',
            disabled && 'opacity-60 cursor-not-allowed bg-gray-100',
            readOnly && 'bg-gray-50 cursor-default',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            sizeStyles[size],
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

CTInput.displayName = 'CTInput';
export { CTInput, type CTInputProps };
