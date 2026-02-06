'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CTButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-ct-primary text-white hover:bg-ct-primary-600 active:bg-ct-primary-700 shadow-ct-1 hover:shadow-ct-2',
  secondary: 'bg-ct-sky text-white hover:bg-blue-600 active:bg-blue-700 shadow-ct-1',
  outline: 'border border-ct-primary text-ct-primary hover:bg-ct-primary-50 active:bg-ct-primary-100',
  ghost: 'text-[var(--ct-color-text-primary)] hover:bg-gray-100 active:bg-gray-200',
  danger: 'bg-ct-error text-white hover:bg-red-600 active:bg-red-700 shadow-ct-1',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-ct-sm gap-1.5',
  md: 'h-10 px-4 text-ct-md gap-2',
  lg: 'h-12 px-6 text-ct-lg gap-2.5',
};

const iconSizes: Record<ButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const CTButton = forwardRef<HTMLButtonElement, CTButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, fullWidth, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-ct-md transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-primary focus-visible:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none',
          'active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg className={cn('animate-spin', iconSizes[size])} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            {leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>}
            {children}
            {rightIcon && <span className={iconSizes[size]}>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

CTButton.displayName = 'CTButton';
export { CTButton, type CTButtonProps };
