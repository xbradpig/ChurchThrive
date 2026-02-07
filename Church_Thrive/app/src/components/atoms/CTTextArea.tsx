'use client';

import { forwardRef, type TextareaHTMLAttributes, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

interface CTTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
  showCount?: boolean;
  maxLength?: number;
  autoResize?: boolean;
}

const CTTextArea = forwardRef<HTMLTextAreaElement, CTTextAreaProps>(
  ({ className, isError, showCount, maxLength, autoResize = true, value, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
    const charCount = typeof value === 'string' ? value.length : 0;

    useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [value, autoResize]);

    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          maxLength={maxLength}
          rows={4}
          className={cn(
            'w-full rounded-ct-md border bg-[var(--ct-color-gray-50)] px-3 py-2.5 text-ct-md transition-colors',
            'placeholder:text-gray-400 resize-none',
            'hover:border-gray-400 hover:bg-white',
            'focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white',
            isError
              ? 'border-ct-error focus:ring-ct-error/40'
              : 'border-gray-300 focus:ring-ct-primary/40',
            className
          )}
          {...props}
        />
        {showCount && maxLength && (
          <span className={cn(
            'absolute bottom-2 right-3 text-ct-xs',
            charCount > maxLength * 0.9 ? 'text-ct-error' : 'text-gray-400'
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    );
  }
);

CTTextArea.displayName = 'CTTextArea';
export { CTTextArea, type CTTextAreaProps };
