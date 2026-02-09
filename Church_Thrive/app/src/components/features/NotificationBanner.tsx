'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { CTButton } from '@/components/atoms/CTButton';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function NotificationBanner() {
  const [isDismissed, setIsDismissed] = useState(true);
  const { isSupported, permission, isLoading, requestPermission } = usePushNotifications();

  // Check if we should show the banner
  useEffect(() => {
    // Don't show if not supported or already granted/denied
    if (!isSupported || permission !== 'default') {
      setIsDismissed(true);
      return;
    }

    // Check if user has dismissed before (stored in localStorage)
    const dismissed = localStorage.getItem('notification-banner-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
        return;
      }
    }

    // Show after a delay
    const timer = setTimeout(() => {
      setIsDismissed(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSupported, permission]);

  function handleDismiss() {
    setIsDismissed(true);
    localStorage.setItem('notification-banner-dismissed', new Date().toISOString());
  }

  async function handleEnable() {
    const success = await requestPermission();
    if (success) {
      setIsDismissed(true);
    }
  }

  if (isDismissed || !isSupported || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[var(--ct-z-toast)] max-w-md mx-auto animate-slide-up">
      <div className="bg-white rounded-ct-xl shadow-ct-4 p-4 border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-ct-primary-50 rounded-full flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-ct-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-ct-md font-semibold text-gray-800 mb-1">
              알림을 켜시겠습니까?
            </h3>
            <p className="text-ct-sm text-gray-500 mb-3">
              교회 공지사항, 심방 일정 등 중요한 소식을 놓치지 마세요.
            </p>
            <div className="flex gap-2">
              <CTButton
                variant="primary"
                size="sm"
                onClick={handleEnable}
                isLoading={isLoading}
              >
                알림 켜기
              </CTButton>
              <CTButton
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                나중에
              </CTButton>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 text-gray-400 hover:text-gray-600"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
