'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import {
  MegaphoneIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const ADMIN_NAV = [
  { href: '/admin', label: '대시보드', Icon: ChartBarIcon, exact: true },
  { href: '/admin/announcements', label: '공지사항', Icon: MegaphoneIcon, exact: false },
  { href: '/admin/organizations', label: '조직도', Icon: BuildingOffice2Icon, exact: false },
  { href: '/admin/cell-groups', label: '구역/셀', Icon: UserGroupIcon, exact: false },
  { href: '/admin/attendance', label: '출석관리', Icon: ClipboardDocumentCheckIcon, exact: false },
  { href: '/admin/roles', label: '직분관리', Icon: ShieldCheckIcon, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)]">
      {/* Desktop side navigation */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-gray-200 bg-white">
        <nav className="sticky top-16 py-4 px-3 space-y-1">
          <p className="px-3 py-2 text-ct-xs font-semibold text-gray-400 uppercase tracking-wider">
            교회행정
          </p>
          {ADMIN_NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-ct-md text-ct-sm font-medium transition-colors',
                  'min-h-[44px]',
                  active
                    ? 'bg-ct-primary-50 text-ct-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                )}
              >
                <item.Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile horizontal navigation */}
      <div className="lg:hidden fixed top-14 left-0 right-0 z-[var(--ct-z-sticky)] bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto px-2 gap-1 py-1.5 scrollbar-hide">
          {ADMIN_NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-ct-md text-ct-xs font-medium whitespace-nowrap transition-colors',
                  'min-h-[44px]',
                  active
                    ? 'bg-ct-primary-50 text-ct-primary'
                    : 'text-gray-500 hover:bg-gray-50'
                )}
              >
                <item.Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0 lg:pt-0 pt-14">
        {children}
      </div>
    </div>
  );
}
