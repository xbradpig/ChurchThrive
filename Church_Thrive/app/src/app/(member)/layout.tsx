'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BookOpenIcon,
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  BellIcon as BellIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';
import { useAuthStore } from '@/stores/authStore';
import { PWAInstallBanner } from '@/components/features/PWAInstallBanner';
import { SWUpdateBanner } from '@/components/features/SWUpdateBanner';
import { OfflineIndicator } from '@/components/features/OfflineIndicator';
import { ViewModeSwitch } from '@/components/features/ViewModeSwitch';

const NAV_ITEMS = [
  { href: '/home', label: '홈', Icon: HomeIcon, ActiveIcon: HomeIconSolid },
  { href: '/notes', label: '말씀노트', Icon: BookOpenIcon, ActiveIcon: BookOpenIconSolid },
  { href: '/announcements', label: '공지', Icon: BellIcon, ActiveIcon: BellIconSolid },
  { href: '/profile', label: '내정보', Icon: UserCircleIcon, ActiveIcon: UserCircleIconSolid },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { church, member, initialize, isLoading } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  function isActive(href: string) {
    if (href === '/home') return pathname === '/home';
    return pathname.startsWith(href);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ct-color-bg-secondary)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ct-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--ct-color-bg-secondary)]">
      {/* PWA Overlays */}
      <SWUpdateBanner />
      <OfflineIndicator />
      <PWAInstallBanner />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            {church?.logo_url ? (
              <img src={church.logo_url} alt={church.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 bg-ct-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {church?.name?.charAt(0) || 'C'}
                </span>
              </div>
            )}
            <span className="font-semibold text-gray-900 truncate max-w-[140px]">
              {church?.name || 'ChurchThrive'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ViewModeSwitch />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 lg:hidden"
            >
              {menuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <div className="p-4 space-y-2">
              {member && (
                <div className="pb-3 mb-3 border-b border-gray-100">
                  <p className="text-sm text-gray-500">안녕하세요,</p>
                  <p className="font-medium text-gray-900">{member.name}님</p>
                </div>
              )}
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    isActive(item.href)
                      ? 'bg-ct-primary-50 text-ct-primary'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pb-20 lg:pb-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
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
  );
}
