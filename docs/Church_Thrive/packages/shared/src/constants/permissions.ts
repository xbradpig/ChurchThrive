import type { UserRole } from '../types/auth';

export type Permission =
  // Member management
  | 'members:read'
  | 'members:create'
  | 'members:update'
  | 'members:delete'
  | 'members:import'
  | 'members:export'
  | 'members:approve'
  // Notes
  | 'notes:read'
  | 'notes:create'
  | 'notes:update'
  | 'notes:delete'
  | 'notes:feedback'
  // Admin
  | 'announcements:read'
  | 'announcements:create'
  | 'announcements:update'
  | 'announcements:delete'
  | 'attendance:read'
  | 'attendance:check'
  | 'attendance:manage'
  | 'organization:read'
  | 'organization:manage'
  | 'cells:read'
  | 'cells:manage'
  // Settings
  | 'church:settings'
  | 'church:members:manage';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'members:read', 'members:create', 'members:update', 'members:delete',
    'members:import', 'members:export', 'members:approve',
    'notes:read', 'notes:create', 'notes:update', 'notes:delete', 'notes:feedback',
    'announcements:read', 'announcements:create', 'announcements:update', 'announcements:delete',
    'attendance:read', 'attendance:check', 'attendance:manage',
    'organization:read', 'organization:manage',
    'cells:read', 'cells:manage',
    'church:settings', 'church:members:manage',
  ],
  pastor: [
    'members:read', 'members:create', 'members:update',
    'members:approve',
    'notes:read', 'notes:create', 'notes:update', 'notes:delete', 'notes:feedback',
    'announcements:read', 'announcements:create', 'announcements:update',
    'attendance:read', 'attendance:check', 'attendance:manage',
    'organization:read', 'organization:manage',
    'cells:read', 'cells:manage',
  ],
  staff: [
    'members:read', 'members:create', 'members:update',
    'members:import', 'members:export',
    'notes:read', 'notes:create', 'notes:update',
    'announcements:read', 'announcements:create',
    'attendance:read', 'attendance:check', 'attendance:manage',
    'organization:read',
    'cells:read',
  ],
  leader: [
    'members:read',
    'notes:read', 'notes:create', 'notes:update',
    'announcements:read',
    'attendance:read', 'attendance:check',
    'cells:read',
  ],
  member: [
    'notes:read', 'notes:create', 'notes:update',
    'announcements:read',
    'attendance:read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
