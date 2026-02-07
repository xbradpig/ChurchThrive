'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { CTButton } from '@/components/atoms/CTButton';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useOffline } from '@/hooks/useOffline';
import { useAuthStore } from '@/stores/authStore';
import {
  UserCircleIcon,
  BellIcon,
  DevicePhoneMobileIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  ArrowRightStartOnRectangleIcon,
  TrashIcon,
  WifiIcon,
  ArrowPathIcon,
  PencilIcon,
  KeyIcon,
  DocumentTextIcon,
  LockClosedIcon,
  CloudArrowDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  label: string;
  description?: string;
  type: 'link' | 'toggle' | 'button' | 'info';
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  value?: boolean;
  onClick?: () => void;
  detail?: string;
  variant?: 'default' | 'danger' | 'primary';
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // PWA / Offline state
  const { canInstall, isInstalled, install } = usePWAInstall();
  const { clearAllCaches } = useServiceWorker();
  const { isOnline, lastSyncedAt, sync } = useOffline();
  const { member, church } = useAuthStore();

  // Offline mode toggle
  const [offlineMode, setOfflineMode] = useState(false);

  // Clear cache handling
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = useCallback(async () => {
    await clearAllCaches();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  }, [clearAllCaches]);

  const handleInstallPWA = useCallback(async () => {
    await install();
  }, [install]);

  const handleOfflineSync = useCallback(async () => {
    await sync();
  }, [sync]);

  // User data from auth store
  const user = {
    name: member?.name || '사용자',
    email: member?.email || '',
    role: member?.role || '',
    church: church?.name || '',
    avatarUrl: member?.photo_url || null,
  };

  const lastSyncText = lastSyncedAt
    ? `마지막 동기화: ${lastSyncedAt.toLocaleTimeString('ko-KR')}`
    : '동기화 기록 없음';

  // ─── Sections ─────────────────────────────────────────────────────────────

  const sections: SettingsSection[] = [
    {
      id: 'account',
      title: '계정 관리',
      icon: UserCircleIcon,
      items: [
        {
          id: 'edit-profile',
          label: '내 정보 수정',
          description: '이름, 연락처, 프로필 사진 변경',
          type: 'link',
          href: '/settings/profile',
          icon: PencilIcon,
        },
        {
          id: 'change-password',
          label: '비밀번호 변경',
          description: '계정 비밀번호를 변경합니다',
          type: 'link',
          href: '/settings/password',
          icon: KeyIcon,
        },
      ],
    },
    {
      id: 'notifications',
      title: '알림 설정',
      icon: BellIcon,
      items: [
        {
          id: 'notification-settings',
          label: '알림 설정',
          description: '푸시 알림, 공지사항, 기도 요청, 일정 알림 관리',
          type: 'link',
          href: '/settings/notifications',
          icon: BellIcon,
        },
      ],
    },
    {
      id: 'app',
      title: '앱 설정',
      icon: DevicePhoneMobileIcon,
      items: [
        {
          id: 'offline-mode',
          label: '오프라인 모드',
          description: offlineMode
            ? '오프라인에서 사용할 데이터를 미리 다운로드합니다'
            : '사용하면 오프라인에서도 주요 기능을 이용할 수 있습니다',
          type: 'toggle',
          value: offlineMode,
          onClick: () => setOfflineMode(!offlineMode),
        },
        {
          id: 'sync-now',
          label: '지금 동기화',
          description: lastSyncText,
          type: 'button',
          onClick: handleOfflineSync,
          icon: ArrowPathIcon,
          variant: 'primary',
        },
        {
          id: 'clear-cache',
          label: cacheCleared ? '캐시 삭제 완료' : '캐시 삭제',
          description: '저장된 캐시 데이터를 모두 삭제합니다',
          type: 'button',
          onClick: handleClearCache,
          icon: cacheCleared ? CheckCircleIcon : TrashIcon,
          variant: 'default',
        },
        ...(canInstall && !isInstalled
          ? [
              {
                id: 'install-pwa',
                label: '홈 화면에 추가',
                description: '앱처럼 바로 실행할 수 있습니다',
                type: 'button' as const,
                onClick: handleInstallPWA,
                icon: CloudArrowDownIcon,
                variant: 'primary' as const,
              },
            ]
          : []),
        ...(isInstalled
          ? [
              {
                id: 'installed',
                label: '앱이 설치되었습니다',
                type: 'info' as const,
                icon: CheckCircleIcon,
                detail: '',
              },
            ]
          : []),
      ],
    },
    {
      id: 'about',
      title: '정보',
      icon: InformationCircleIcon,
      items: [
        {
          id: 'version',
          label: '앱 버전',
          type: 'info',
          detail: 'v1.0.0',
        },
        {
          id: 'terms',
          label: '이용약관',
          type: 'link',
          href: '/terms',
          icon: DocumentTextIcon,
        },
        {
          id: 'privacy',
          label: '개인정보처리방침',
          type: 'link',
          href: '/privacy',
          icon: LockClosedIcon,
        },
      ],
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="ct-container py-6 max-w-2xl">
      {/* Page Header */}
      <h1 className="text-ct-2xl font-bold mb-6">설정</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-ct-lg shadow-ct-1 p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[var(--ct-color-primary-50,#e8f5e8)] flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-ct-2xl font-bold text-ct-primary">
                {user.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-ct-lg font-bold text-gray-900 truncate">{user.name}</h2>
            <p className="text-ct-sm text-gray-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--ct-color-primary-50,#e8f5e8)] text-ct-primary">
                {user.role}
              </span>
              <span className="text-ct-sm text-gray-400">{user.church}</span>
            </div>
          </div>

          {/* Edit button */}
          <Link
            href="/settings/profile"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-ct-md hover:bg-gray-50"
            aria-label="프로필 편집"
          >
            <PencilIcon className="w-5 h-5" />
          </Link>
        </div>

        {/* Connection status */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-ct-sm text-gray-500">
            {isOnline ? '온라인' : '오프라인'}
          </span>
          {isOnline && (
            <WifiIcon className="w-4 h-4 text-green-500 ml-auto" />
          )}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id}>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <section.icon className="w-4 h-4 text-gray-500" />
              <h3 className="text-ct-sm font-semibold text-gray-500 uppercase tracking-wide">
                {section.title}
              </h3>
            </div>

            {/* Section items */}
            <div className="bg-white rounded-ct-lg shadow-ct-1 divide-y divide-gray-100 overflow-hidden">
              {section.items.map((item) => (
                <SettingsRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sign Out */}
      <div className="mt-8 mb-4">
        <CTButton
          variant="danger"
          fullWidth
          leftIcon={<ArrowRightStartOnRectangleIcon className="w-5 h-5" />}
          onClick={() => {
            // Sign out logic would go here
            if (window.confirm('로그아웃 하시겠습니까?')) {
              window.location.href = '/auth/login';
            }
          }}
        >
          로그아웃
        </CTButton>
      </div>

      {/* Footer */}
      <p className="text-center text-ct-xs text-gray-400 pb-4">
        ChurchThrive v1.0.0
      </p>
    </div>
  );
}

// ─── Settings Row Component ─────────────────────────────────────────────────

function SettingsRow({ item }: { item: SettingsItem }) {
  if (item.type === 'link') {
    return (
      <Link
        href={item.href || '#'}
        className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
      >
        {item.icon && (
          <item.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-ct-md font-medium text-gray-800">{item.label}</p>
          {item.description && (
            <p className="text-ct-sm text-gray-500 mt-0.5">{item.description}</p>
          )}
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
      </Link>
    );
  }

  if (item.type === 'toggle') {
    return (
      <button
        onClick={item.onClick}
        className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-ct-md font-medium text-gray-800">{item.label}</p>
          {item.description && (
            <p className="text-ct-sm text-gray-500 mt-0.5">{item.description}</p>
          )}
        </div>
        <ToggleSwitch enabled={item.value || false} />
      </button>
    );
  }

  if (item.type === 'button') {
    return (
      <button
        onClick={item.onClick}
        className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-gray-50 transition-colors group"
      >
        {item.icon && (
          <item.icon
            className={`w-5 h-5 flex-shrink-0 ${
              item.variant === 'primary'
                ? 'text-ct-primary'
                : item.variant === 'danger'
                  ? 'text-red-500'
                  : 'text-gray-400'
            }`}
          />
        )}
        <div className="flex-1 min-w-0">
          <p
            className={`text-ct-md font-medium ${
              item.variant === 'primary'
                ? 'text-ct-primary'
                : item.variant === 'danger'
                  ? 'text-red-600'
                  : 'text-gray-800'
            }`}
          >
            {item.label}
          </p>
          {item.description && (
            <p className="text-ct-sm text-gray-500 mt-0.5">{item.description}</p>
          )}
        </div>
      </button>
    );
  }

  // info type
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {item.icon && (
        <item.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-ct-md font-medium text-gray-800">{item.label}</p>
        {item.description && (
          <p className="text-ct-sm text-gray-500 mt-0.5">{item.description}</p>
        )}
      </div>
      {item.detail && (
        <span className="text-ct-sm text-gray-400 flex-shrink-0">{item.detail}</span>
      )}
    </div>
  );
}

// ─── Toggle Switch ──────────────────────────────────────────────────────────

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
