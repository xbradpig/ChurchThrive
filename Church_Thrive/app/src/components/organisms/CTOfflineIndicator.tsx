'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';

export function CTOfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-[var(--ct-z-toast)] bg-yellow-500 text-white text-center py-1.5 text-ct-sm font-medium',
      'animate-slide-down'
    )}>
      오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.
    </div>
  );
}
