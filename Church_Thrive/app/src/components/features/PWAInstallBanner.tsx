'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { CTButton } from '@/components/atoms/CTButton';
import { XMarkIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const DISMISS_KEY = 'ct-pwa-banner-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallBanner() {
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    // Check if previously dismissed within the cooldown period
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DURATION_MS) {
        setDismissed(true);
        return;
      }
    }
    setDismissed(false);
  }, []);

  if (!canInstall || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const handleInstall = async () => {
    const accepted = await install();
    if (accepted) {
      localStorage.removeItem(DISMISS_KEY);
    }
  };

  return (
    <div
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-ct-lg shadow-ct-3 p-4 z-50 border border-gray-200"
      style={{ animation: 'slideUp 0.3s ease-out' }}
      role="complementary"
      aria-label="앱 설치 안내"
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-ct-md bg-[var(--ct-color-primary-50,#e8f5e8)] flex items-center justify-center">
          <DevicePhoneMobileIcon className="w-5 h-5 text-[var(--ct-color-primary-600,#228B22)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-ct-md font-semibold text-gray-800">앱으로 설치하기</p>
          <p className="text-ct-sm text-gray-500 mt-0.5">
            홈 화면에 추가하면 더 빠르게 접근할 수 있어요
          </p>
          <div className="flex gap-2 mt-3">
            <CTButton variant="primary" size="sm" onClick={handleInstall}>
              설치하기
            </CTButton>
            <CTButton variant="ghost" size="sm" onClick={handleDismiss}>
              나중에
            </CTButton>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="닫기"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
