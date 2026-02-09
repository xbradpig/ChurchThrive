'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ArrowLeftIcon, BellIcon, BellSlashIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface NotificationPreferences {
  push: boolean;
  announcements: boolean;
  prayers: boolean;
  events: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  push: false,
  announcements: true,
  prayers: true,
  events: true,
};

const STORAGE_KEY = 'ct_notification_preferences';

export default function NotificationsSettingsPage() {
  const { member } = useAuthStore();
  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isLoading: isPushLoading,
    requestPermission,
  } = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && member?.id) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${member.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...parsed,
          });
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [member?.id]);

  const savePreferences = useCallback((newPreferences: NotificationPreferences) => {
    if (!member?.id) return;

    setIsSaving(true);
    setMessage(null);

    try {
      localStorage.setItem(`${STORAGE_KEY}_${member.id}`, JSON.stringify(newPreferences));
      setMessage({ type: 'success', text: '알림 설정이 저장되었습니다.' });
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage({ type: 'error', text: '저장에 실패했습니다.' });
    }
    setIsSaving(false);
  }, [member?.id]);

  const handleToggle = useCallback(async (key: keyof NotificationPreferences) => {
    // Special handling for push notification permission
    if (key === 'push' && !preferences.push) {
      if (!isPushSupported) {
        setMessage({ type: 'error', text: '이 브라우저에서는 푸시 알림을 지원하지 않습니다.' });
        return;
      }

      const success = await requestPermission();
      if (!success) {
        setMessage({ type: 'error', text: '알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.' });
        return;
      }
    }

    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences, savePreferences, isPushSupported, requestPermission]);

  const notificationItems = [
    {
      key: 'push' as const,
      label: '푸시 알림',
      description: '브라우저 푸시 알림을 받습니다',
      icon: preferences.push ? BellIcon : BellSlashIcon,
    },
    {
      key: 'announcements' as const,
      label: '공지사항 알림',
      description: '새로운 공지사항이 등록되면 알림을 받습니다',
    },
    {
      key: 'prayers' as const,
      label: '기도 요청 알림',
      description: '새로운 기도 요청이 등록되면 알림을 받습니다',
    },
    {
      key: 'events' as const,
      label: '일정 알림',
      description: '교회 행사 시작 전 미리 알림을 받습니다',
    },
  ];

  return (
    <div className="ct-container py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="p-2 -ml-2 hover:bg-gray-100 rounded-ct-md transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-ct-xl font-bold">알림 설정</h1>
      </div>

      {/* Description */}
      <p className="text-ct-sm text-gray-600 mb-6">
        받고 싶은 알림을 선택하세요. 설정은 자동으로 저장됩니다.
      </p>

      {/* Notification Toggles */}
      <div className="bg-white rounded-ct-lg shadow-ct-1 divide-y divide-gray-100 overflow-hidden">
        {notificationItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleToggle(item.key)}
            disabled={isSaving}
            className="flex items-center gap-3 px-4 py-4 w-full text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {item.icon && (
              <item.icon className={`w-5 h-5 flex-shrink-0 ${preferences[item.key] ? 'text-ct-primary' : 'text-gray-400'}`} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-ct-md font-medium text-gray-800">{item.label}</p>
              <p className="text-ct-sm text-gray-500 mt-0.5">{item.description}</p>
            </div>
            <ToggleSwitch enabled={preferences[item.key]} />
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-ct-md text-ct-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Push Status */}
      <div className="mt-6 p-4 bg-gray-50 rounded-ct-lg">
        <div className="flex items-start gap-3">
          {pushPermission === 'granted' ? (
            <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
          ) : pushPermission === 'denied' ? (
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
          ) : (
            <BellIcon className="w-5 h-5 text-gray-400 shrink-0" />
          )}
          <div>
            <p className="text-ct-sm font-medium text-gray-700">
              {pushPermission === 'granted'
                ? '푸시 알림이 활성화되어 있습니다'
                : pushPermission === 'denied'
                  ? '푸시 알림이 차단되어 있습니다'
                  : '푸시 알림을 활성화하세요'}
            </p>
            <p className="text-ct-xs text-gray-500 mt-1">
              {pushPermission === 'denied'
                ? '브라우저 설정에서 알림 권한을 허용해주세요.'
                : '푸시 알림을 받으려면 브라우저에서 알림 권한을 허용해야 합니다.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
        enabled ? 'bg-ct-primary' : 'bg-gray-300'
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-0.5 ${
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </div>
  );
}
