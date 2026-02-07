import type { Permission } from '@churchthrive/shared';
import {
  HomeIcon,
  UsersIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  DocumentArrowDownIcon,
  PencilSquareIcon,
  ArchiveBoxIcon,
  UserCircleIcon,
  BellIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export interface MenuItem {
  href?: string;
  label: string;
  Icon?: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  children?: MenuItem[];
}

/**
 * 관리자용 메뉴 (admin, pastor, staff)
 * 권한에 따라 필터링됨
 */
export const ADMIN_MENU: MenuItem[] = [
  {
    href: '/dashboard',
    label: '대시보드',
    Icon: ChartBarIcon,
  },
  {
    label: '교인관리',
    Icon: UsersIcon,
    permission: 'members:read',
    children: [
      { href: '/members', label: '교인 목록' },
      { href: '/members/approvals', label: '가입 승인', permission: 'members:approve' },
      { href: '/members/import', label: '임포트', permission: 'members:import' },
    ],
  },
  {
    label: '말씀노트',
    Icon: BookOpenIcon,
    permission: 'notes:read',
    children: [
      { href: '/notes', label: '내 노트' },
      { href: '/notes/new', label: '새 노트 작성', permission: 'notes:create' },
      { href: '/notes/sermons', label: '설교 아카이브' },
    ],
  },
  {
    label: '교회행정',
    Icon: ClipboardDocumentListIcon,
    permission: 'announcements:read',
    children: [
      { href: '/admin/announcements', label: '공지사항' },
      { href: '/admin/organizations', label: '조직도', permission: 'organization:read' },
      { href: '/admin/cell-groups', label: '구역/셀', permission: 'cells:read' },
      { href: '/admin/attendance', label: '출석관리', permission: 'attendance:read' },
      { href: '/admin/roles', label: '직분관리', permission: 'organization:manage' },
    ],
  },
  {
    label: '설정',
    Icon: Cog6ToothIcon,
    children: [
      { href: '/settings', label: '내 프로필' },
      { href: '/settings/church', label: '교회 설정', permission: 'church:settings' },
      { href: '/settings/notifications', label: '알림 설정' },
    ],
  },
];

/**
 * 일반 교인용 메뉴 (leader, member)
 */
export const MEMBER_MENU: MenuItem[] = [
  {
    href: '/home',
    label: '홈',
    Icon: HomeIcon,
  },
  {
    label: '말씀노트',
    Icon: BookOpenIcon,
    children: [
      { href: '/notes', label: '내 노트' },
      { href: '/notes/new', label: '새 노트 작성' },
      { href: '/notes/sermons', label: '설교 아카이브' },
    ],
  },
  {
    href: '/announcements',
    label: '공지사항',
    Icon: MegaphoneIcon,
  },
  {
    href: '/profile',
    label: '내 정보',
    Icon: UserCircleIcon,
  },
];

/**
 * 모바일 하단 탭 네비게이션용 메뉴 (관리자)
 */
export const ADMIN_BOTTOM_NAV = [
  { href: '/dashboard', label: '홈' },
  { href: '/members', label: '교인' },
  { href: '/notes', label: '노트' },
  { href: '/admin/announcements', label: '행정' },
  { href: '/settings', label: '설정' },
];

/**
 * 모바일 하단 탭 네비게이션용 메뉴 (일반)
 */
export const MEMBER_BOTTOM_NAV = [
  { href: '/home', label: '홈' },
  { href: '/notes', label: '노트' },
  { href: '/announcements', label: '공지' },
  { href: '/profile', label: '내정보' },
];
