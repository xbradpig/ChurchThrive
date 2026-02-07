'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePermission, type Permission } from '@churchthrive/shared';
import {
  ADMIN_MENU,
  MEMBER_MENU,
  ADMIN_BOTTOM_NAV,
  MEMBER_BOTTOM_NAV,
  type MenuItem
} from '@/lib/navigation/menu-config';

/**
 * 권한 기반 메뉴 필터링 훅
 *
 * 사용자의 역할과 권한에 따라 표시할 메뉴 항목을 필터링합니다.
 */
export function useNavigation() {
  const { member } = useAuthStore();
  const role = member?.role ?? null;
  const { can } = usePermission(role);

  const isAdmin = useMemo(() => {
    return ['admin', 'pastor', 'staff'].includes(role ?? '');
  }, [role]);

  /**
   * 권한에 따라 메뉴 항목을 필터링합니다.
   * - permission이 없으면 모든 사용자에게 표시
   * - permission이 있으면 해당 권한이 있는 사용자에게만 표시
   * - 하위 메뉴가 있는 경우, 표시할 하위 메뉴가 없으면 상위 메뉴도 숨김
   */
  const filterByPermission = useMemo(() => {
    const filter = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter(item => !item.permission || can(item.permission as Permission))
        .map(item => ({
          ...item,
          children: item.children ? filter(item.children) : undefined,
        }))
        .filter(item => !item.children || item.children.length > 0);
    };
    return filter;
  }, [can]);

  const menuItems = useMemo(() => {
    const baseMenu = isAdmin ? ADMIN_MENU : MEMBER_MENU;
    return filterByPermission(baseMenu);
  }, [isAdmin, filterByPermission]);

  const bottomNavItems = useMemo(() => {
    return isAdmin ? ADMIN_BOTTOM_NAV : MEMBER_BOTTOM_NAV;
  }, [isAdmin]);

  return {
    menuItems,
    bottomNavItems,
    isAdmin,
    role,
  };
}
