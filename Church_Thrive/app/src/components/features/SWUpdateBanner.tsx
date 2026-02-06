'use client';

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export function SWUpdateBanner() {
  const { isUpdateAvailable, applyUpdate } = useServiceWorker();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-ct-primary text-white">
      <div className="ct-container flex items-center justify-between py-2.5">
        <p className="text-ct-sm font-medium">
          새로운 버전이 있습니다.
        </p>
        <button
          onClick={applyUpdate}
          className="inline-flex items-center gap-1.5 text-ct-sm font-semibold bg-white/20 hover:bg-white/30 rounded-ct-md px-3 py-1.5 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          업데이트
        </button>
      </div>
    </div>
  );
}
