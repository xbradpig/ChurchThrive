'use client';

import { useOffline } from '@/hooks/useOffline';
import { WifiIcon } from '@heroicons/react/24/outline';

export function OfflineIndicator() {
  const { isOnline, isSyncing } = useOffline();

  if (isOnline && !isSyncing) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[55] text-white text-center py-1.5 text-ct-sm font-medium transition-colors ${
        isSyncing ? 'bg-ct-sky' : 'bg-gray-700'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {isSyncing ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            동기화 중...
          </>
        ) : (
          <>
            <WifiIcon className="w-4 h-4" />
            오프라인 모드
          </>
        )}
      </div>
    </div>
  );
}
