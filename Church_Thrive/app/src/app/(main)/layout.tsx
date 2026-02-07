'use client';

import { useState, useEffect } from 'react';
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
import { useNavigation } from '@/hooks/useNavigation';
import { useAuthStore } from '@/stores/authStore';
import type { MenuItem } from '@/lib/navigation/menu-config';

// 모바일 하단 탭 네비게이션 아이콘 매핑
const NAV_ICONS: Record<string, { Icon: typeof HomeIcon; ActiveIcon: typeof HomeIconSolid }> = {
  '/dashboard': { Icon: HomeIcon, ActiveIcon: HomeIconSolid },
  '/home': { Icon: HomeIcon, ActiveIcon: HomeIconSolid },
  '/members': { Icon: UsersIcon, ActiveIcon: UsersIconSolid },
  '/notes': { Icon: BookOpenIcon, ActiveIcon: BookOpenIconSolid },
  '/admin/announcements': { Icon: ClipboardDocumentListIcon, ActiveIcon: ClipboardDocumentListIconSolid },
  '/announcements': { Icon: ClipboardDocumentListIcon, ActiveIcon: ClipboardDocumentListIconSolid },
  '/settings': { Icon: EllipsisHorizontalIcon, ActiveIcon: EllipsisHorizontalIconSolid },
  '/profile': { Icon: EllipsisHorizontalIcon, ActiveIcon: EllipsisHorizontalIconSolid },
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { menuItems, bottomNavItems, role } = useNavigation();
  const { member, initialize, isLoading } = useAuthStore();

  // authStore 초기화
  useEffect(() => {
    initialize();
  }, [initialize]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  function isActive(href: string) {
    if (href === '/dashboard' || href === '/home') return pathname === href;
    return pathname.startsWith(href);
  }

  // 역할 표시 문자열
  function getRoleDisplayName(role: string | null | undefined): string {
    const roleNames: Record<string, string> = {
      admin: '관리자',
      pastor: '목회자',
      staff: '스태프',
      leader: '리더',
      member: '교인',
    };
    return roleNames[role ?? ''] ?? '교인';
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
              {menuItems.map((item) => {
                if ('children' in item && item.children && item.children.length > 0) {
                  const isParentActive = item.children.some(c => c.href && isActive(c.href));
                  return (
                    <div key={item.label} className="space-y-0.5">
                      <div className={`flex items-center gap-3 px-3 py-2 text-ct-sm font-medium rounded-ct-md ${
                        isParentActive ? 'text-ct-primary' : 'text-gray-600'
                      }`}>
                        {item.Icon && <item.Icon className="w-5 h-5" />}
                        {item.label}
                      </div>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href!}
                          className={`block pl-11 pr-3 py-2 text-ct-sm rounded-ct-md transition-colors ${
                            child.href && isActive(child.href)
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
                      item.href && isActive(item.href)
                        ? 'bg-ct-primary-50 text-ct-primary'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.Icon && <item.Icon className="w-5 h-5" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* User Info & Logout */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              {member && (
                <div className="px-3 py-2 mb-2">
                  <p className="text-ct-sm font-medium text-gray-800 truncate">
                    {member.name}
                  </p>
                  <p className="text-ct-xs text-gray-500">
                    {getRoleDisplayName(role)}
                  </p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 w-full text-ct-sm font-medium rounded-ct-md text-red-600 hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                로그아웃
              </button>
            </div>
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
            <nav className="py-4 px-3 space-y-1 flex flex-col h-[calc(100%-4rem)]">
              <div className="flex-1 overflow-y-auto space-y-1">
                {menuItems.map((item) => {
                  if ('children' in item && item.children && item.children.length > 0) {
                    return (
                      <div key={item.label} className="space-y-0.5">
                        <div className="flex items-center gap-3 px-3 py-2 text-ct-sm font-medium text-gray-600">
                          {item.Icon && <item.Icon className="w-5 h-5" />}
                          {item.label}
                        </div>
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href!}
                            onClick={() => setSidebarOpen(false)}
                            className={`block pl-11 pr-3 py-2 text-ct-sm rounded-ct-md ${
                              child.href && isActive(child.href) ? 'bg-ct-primary-50 text-ct-primary font-medium' : 'text-gray-500'
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
                        item.href && isActive(item.href) ? 'bg-ct-primary-50 text-ct-primary' : 'text-gray-600'
                      }`}
                    >
                      {item.Icon && <item.Icon className="w-5 h-5" />}
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile User Info & Logout */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                {member && (
                  <div className="px-3 py-2 mb-2">
                    <p className="text-ct-sm font-medium text-gray-800 truncate">
                      {member.name}
                    </p>
                    <p className="text-ct-xs text-gray-500">
                      {getRoleDisplayName(role)}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-ct-sm font-medium rounded-ct-md text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  로그아웃
                </button>
              </div>
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
            {bottomNavItems.map((item) => {
              const active = isActive(item.href);
              const icons = NAV_ICONS[item.href] ?? { Icon: HomeIcon, ActiveIcon: HomeIconSolid };
              const Icon = active ? icons.ActiveIcon : icons.Icon;
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
