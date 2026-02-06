'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface CTSelectOption {
  value: string;
  label: string;
}

interface CTSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: CTSelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  isError?: boolean;
}

const sizeStyles = {
  sm: 'h-8 px-2.5 text-ct-sm',
  md: 'h-10 px-3 text-ct-md',
  lg: 'h-12 px-4 text-ct-lg',
};

const CTSelect = forwardRef<HTMLSelectElement, CTSelectProps>(
  ({ className, options, placeholder = '선택하세요', size = 'md', isError, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full appearance-none rounded-ct-md border bg-[var(--ct-color-gray-50)] pr-10 transition-colors',
            'hover:border-gray-400 hover:bg-white',
            'focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white',
            isError
              ? 'border-ct-error focus:ring-ct-error/40'
              : 'border-gray-300 focus:ring-ct-primary/40',
            sizeStyles[size],
            className
          )}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    );
  }
);

CTSelect.displayName = 'CTSelect';
export { CTSelect, type CTSelectProps, type CTSelectOption };
