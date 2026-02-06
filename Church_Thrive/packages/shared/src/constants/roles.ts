import type { UserRole } from '../types/auth';

export const ROLES: UserRole[] = ['admin', 'pastor', 'staff', 'leader', 'member'];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '담임목사',
  pastor: '교역자',
  staff: '사무간사',
  leader: '사역리더',
  member: '교인',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  pastor: 4,
  staff: 3,
  leader: 2,
  member: 1,
};

export function isRoleAtLeast(currentRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
}
