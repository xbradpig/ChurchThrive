import { ROLE_PERMISSIONS, type Permission } from '../constants/permissions';
import { type UserRole } from '../types/auth';

export function usePermission(role: UserRole | null | undefined) {
  const can = (permission: Permission): boolean => {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role];
    return permissions?.includes(permission) ?? false;
  };

  const canAny = (...permissions: Permission[]): boolean => {
    return permissions.some(p => can(p));
  };

  const canAll = (...permissions: Permission[]): boolean => {
    return permissions.every(p => can(p));
  };

  const isAdmin = role === 'admin';
  const isPastor = role === 'admin' || role === 'pastor';
  const isStaff = role === 'admin' || role === 'pastor' || role === 'staff';
  const isLeader = isStaff || role === 'leader';

  return { can, canAny, canAll, isAdmin, isPastor, isStaff, isLeader, role };
}
