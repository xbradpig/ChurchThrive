import type { UserRole } from '../types/auth';

export const ROLES: UserRole[] = ['superadmin', 'admin', 'pastor', 'staff', 'leader', 'member'];

// Roles that can be assigned by church admins (excludes superadmin)
export const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'pastor', 'staff', 'leader', 'member'];

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: '시스템관리자',
  admin: '담임목사',
  pastor: '교역자',
  staff: '사무간사',
  leader: '사역리더',
  member: '교인',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  superadmin: 6,
  admin: 5,
  pastor: 4,
  staff: 3,
  leader: 2,
  member: 1,
};

export function isRoleAtLeast(currentRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === 'superadmin';
}
