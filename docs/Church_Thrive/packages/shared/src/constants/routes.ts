export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  REGISTER_CHURCH_SEARCH: '/register/church-search',
  REGISTER_PENDING: '/register/pending',
  FORGOT_PASSWORD: '/forgot-password',
  CHURCH_NEW: '/church/new',

  // Main
  DASHBOARD: '/dashboard',

  // Members
  MEMBERS: '/members',
  MEMBERS_NEW: '/members/new',
  MEMBERS_IMPORT: '/members/import',
  MEMBERS_EXPORT: '/members/export',
  MEMBERS_APPROVALS: '/members/approvals',
  MEMBERS_FAMILIES: '/members/families',
  MEMBERS_QR: '/members/qr',
  MEMBER_DETAIL: (id: string) => `/members/${id}` as const,
  MEMBER_EDIT: (id: string) => `/members/${id}/edit` as const,
  MEMBER_VISITS: (id: string) => `/members/${id}/visits` as const,
  MEMBER_VISIT_NEW: (id: string) => `/members/${id}/visits/new` as const,

  // Notes
  NOTES: '/notes',
  NOTES_NEW: '/notes/new',
  NOTES_SERMONS: '/notes/sermons',
  NOTES_SERMONS_NEW: '/notes/sermons/new',
  NOTES_FEEDBACK: '/notes/feedback',
  NOTE_DETAIL: (id: string) => `/notes/${id}` as const,
  NOTE_EDIT: (id: string) => `/notes/${id}/edit` as const,
  NOTE_SHARE: (id: string) => `/notes/${id}/share` as const,
  SERMON_DETAIL: (id: string) => `/notes/sermons/${id}` as const,

  // Admin
  ANNOUNCEMENTS: '/admin/announcements',
  ANNOUNCEMENTS_NEW: '/admin/announcements/new',
  ANNOUNCEMENT_DETAIL: (id: string) => `/admin/announcements/${id}` as const,
  ANNOUNCEMENT_EDIT: (id: string) => `/admin/announcements/${id}/edit` as const,
  ORGANIZATION: '/admin/organization',
  ORGANIZATION_NEW: '/admin/organization/new',
  ORG_DETAIL: (id: string) => `/admin/organization/${id}` as const,
  ORG_EDIT: (id: string) => `/admin/organization/${id}/edit` as const,
  ATTENDANCE: '/admin/attendance',
  ATTENDANCE_CHECK: '/admin/attendance/check',
  ATTENDANCE_QR: '/admin/attendance/qr',
  ATTENDANCE_STATS: '/admin/attendance/stats',
  CELLS: '/admin/cells',
  CELLS_NEW: '/admin/cells/new',
  CELL_DETAIL: (id: string) => `/admin/cells/${id}` as const,
  CELL_EDIT: (id: string) => `/admin/cells/${id}/edit` as const,
  POSITIONS: '/admin/positions',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_PROFILE_EDIT: '/settings/profile/edit',
  SETTINGS_CHURCH: '/settings/church',
  SETTINGS_CHURCH_HOMEPAGE: '/settings/church/homepage',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_ACCOUNT: '/settings/account',
  SETTINGS_PASTOR_ASSIGNMENTS: '/settings/pastor-assignments',

  // QR (public)
  QR_REGISTER: (churchId: string) => `/qr/${churchId}` as const,

  // API
  AUTH_CALLBACK: '/api/auth/callback',
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.REGISTER_CHURCH_SEARCH,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.CHURCH_NEW,
  ROUTES.AUTH_CALLBACK,
];

export const PENDING_ROUTES = [
  ROUTES.REGISTER_PENDING,
];
