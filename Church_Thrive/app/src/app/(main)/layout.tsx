'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  EllipsisHorizontalIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  EllipsisHorizontalIcon as EllipsisHorizontalIconSolid,
} from '@heroicons/react/24/solid';
import { PWAInstallBanner } from '@/components/features/PWAInstallBanner';
import { SWUpdateBanner } from '@/components/features/SWUpdateBanner';
import { OfflineIndicator } from '@/components/features/OfflineIndicator';

const NAV_ITEMS = [
  { href: '/dashboard', label: '홈', Icon: HomeIcon, ActiveIcon: HomeIconSolid },
  { href: '/members', label: '교인', Icon: UsersIcon, ActiveIcon: UsersIconSolid },
  { href: '/notes', label: '말씀노트', Icon: BookOpenIcon, ActiveIcon: BookOpenIconSolid },
  { href: '/admin/announcements', label: '행정', Icon: ClipboardDocumentListIcon, ActiveIcon: ClipboardDocumentListIconSolid },
  { href: '/settings', label: '더보기', Icon: EllipsisHorizontalIcon, ActiveIcon: EllipsisHorizontalIconSolid },
];

const SIDEBAR_ITEMS = [
  { href: '/dashboard', label: '홈', Icon: HomeIcon },
  {
    label: '교인관리', Icon: UsersIcon,
    children: [
      { href: '/members', label: '교인 목록' },
      { href: '/members/families', label: '가족 관리' },
      { href: '/members/import', label: '임포트' },
    ],
  },
  {
    label: '말씀노트', Icon: BookOpenIcon,
    children: [
      { href: '/notes', label: '내 노트' },
      { href: '/notes/new', label: '새 노트 작성' },
      { href: '/notes/sermons', label: '설교 아카이브' },
    ],
  },
  {
    label: '교회행정', Icon: ClipboardDocumentListIcon,
    children: [
      { href: '/admin/announcements', label: '공지사항' },
      { href: '/admin/organization', label: '조직도' },
      { href: '/admin/attendance', label: '출석관리' },
      { href: '/admin/cells', label: '구역관리' },
    ],
  },
  {
    label: '설정', Icon: EllipsisHorizontalIcon,
    children: [
      { href: '/settings/profile', label: '내 프로필' },
      { href: '/settings/church', label: '교회 설정' },
      { href: '/settings/notifications', label: '알림 설정' },
    ],
  },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-dvh bg-[var(--ct-color-bg-secondary)]">
      {/* PWA Overlays */}
      <SWUpdateBanner />
      <OfflineIndicator />
      <PWAInstallBanner />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-100">
            <Link href="/dashboard" className="text-ct-lg font-bold text-ct-primary">
              ChurchThrive
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 flex flex-col">
            <div className="flex-1 space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              if ('children' in item && item.children) {
                const isParentActive = item.children.some(c => isActive(c.href));
                return (
                  <div key={item.label} className="space-y-0.5">
                    <div className={`flex items-center gap-3 px-3 py-2 text-ct-sm font-medium rounded-ct-md ${
                      isParentActive ? 'text-ct-primary' : 'text-gray-600'
                    }`}>
                      <item.Icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block pl-11 pr-3 py-2 text-ct-sm rounded-ct-md transition-colors ${
                          isActive(child.href)
                            ? 'bg-ct-primary-50 text-ct-primary font-medium'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`flex items-center gap-3 px-3 py-2 text-ct-sm font-medium rounded-ct-md transition-colors ${
                    isActive(item.href!)
                      ? 'bg-ct-primary-50 text-ct-primary'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 mt-4 text-ct-sm font-medium rounded-ct-md text-red-600 hover:bg-red-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              로그아웃
            </button>
          </nav>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[var(--ct-z-backdrop)]">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-ct-4 z-10">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <span className="text-ct-lg font-bold text-ct-primary">ChurchThrive</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <nav className="py-4 px-3 space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                if ('children' in item && item.children) {
                  return (
                    <div key={item.label} className="space-y-0.5">
                      <div className="flex items-center gap-3 px-3 py-2 text-ct-sm font-medium text-gray-600">
                        <item.Icon className="w-5 h-5" />
                        {item.label}
                      </div>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`block pl-11 pr-3 py-2 text-ct-sm rounded-ct-md ${
                            isActive(child.href) ? 'bg-ct-primary-50 text-ct-primary font-medium' : 'text-gray-500'
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-ct-sm font-medium rounded-ct-md ${
                      isActive(item.href!) ? 'bg-ct-primary-50 text-ct-primary' : 'text-gray-600'
                    }`}
                  >
                    <item.Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile Logout Button */}
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-3 py-2 mt-4 text-ct-sm font-medium rounded-ct-md text-red-600 hover:bg-red-50 transition-colors w-full"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                로그아웃
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-[var(--ct-z-sticky)] bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600"
              aria-label="메뉴 열기"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <span className="text-ct-md font-semibold text-ct-primary">ChurchThrive</span>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Content */}
        <main className="pb-20 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Tab Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[var(--ct-z-fixed)] bg-white border-t border-gray-200 safe-area-pb">
          <div className="flex items-center justify-around h-16">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = active ? item.ActiveIcon : item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-16 h-full gap-0.5 ${
                    active ? 'text-ct-primary' : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
