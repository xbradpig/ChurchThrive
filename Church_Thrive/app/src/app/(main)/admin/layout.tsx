'use client';

/**
 * Admin Layout - 단순화된 버전
 *
 * 사이드바는 (main)/layout.tsx에서 통합 관리되므로,
 * 이 레이아웃은 children만 렌더링합니다.
 *
 * 모바일에서는 admin 페이지 전용 수평 탭 네비게이션을 표시합니다.
 */

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
  { href: '/admin/announcements', label: '공지', Icon: MegaphoneIcon, exact: false },
  { href: '/admin/organizations', label: '조직도', Icon: BuildingOffice2Icon, exact: false },
  { href: '/admin/cell-groups', label: '구역/셀', Icon: UserGroupIcon, exact: false },
  { href: '/admin/attendance', label: '출석', Icon: ClipboardDocumentCheckIcon, exact: false },
  { href: '/admin/roles', label: '직분', Icon: ShieldCheckIcon, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile horizontal navigation - admin 페이지 전용 */}
      <div className="lg:hidden sticky top-14 z-[var(--ct-z-sticky)] bg-white border-b border-gray-200">
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
      {children}
    </>
  );
}
