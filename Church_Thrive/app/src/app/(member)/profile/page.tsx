'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { ROLE_LABELS } from '@churchthrive/shared';

const MENU_ITEMS = [
  {
    icon: UserCircleIcon,
    label: '프로필 수정',
    href: '/profile/edit',
  },
  {
    icon: BellIcon,
    label: '알림 설정',
    href: '/profile/notifications',
  },
  {
    icon: ShieldCheckIcon,
    label: '개인정보 처리방침',
    href: '/privacy',
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { member, church, signOut } = useAuthStore();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  const roleLabel = member?.role ? ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] : '교인';

  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-1 -ml-1 text-gray-600">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">내 정보</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="p-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-ct-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-ct-primary">
                {member?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {member?.name || '이름 없음'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {church?.name}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-ct-primary/10 text-ct-primary text-xs font-medium rounded">
                {roleLabel}
              </span>
            </div>
          </div>

          {member?.email && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">이메일</p>
              <p className="text-gray-900">{member.email}</p>
            </div>
          )}

          {member?.phone && (
            <div className="mt-3">
              <p className="text-sm text-gray-500">전화번호</p>
              <p className="text-gray-900">{member.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4">
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              <item.icon className="w-5 h-5 text-gray-400" />
              <span className="flex-1 text-gray-900">{item.label}</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="p-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-4 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          로그아웃
        </button>
      </div>

      {/* Version Info */}
      <div className="px-4 pb-8 text-center">
        <p className="text-xs text-gray-400">
          ChurchThrive v1.0.0
        </p>
      </div>
    </div>
  );
}
