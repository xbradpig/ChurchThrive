'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CTBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: 'auto' | 'half' | 'full';
}

const heightMap = {
  auto: 'max-h-[80vh]',
  half: 'h-[50vh]',
  full: 'h-[90vh]',
};

export function CTBottomSheet({ isOpen, onClose, title, children, height = 'auto' }: CTBottomSheetProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--ct-z-modal)] lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn(
        'fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-ct-4 animate-slide-up',
        heightMap[height]
      )}>
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <h3 className="text-ct-md font-semibold">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center" aria-label="닫기">
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
