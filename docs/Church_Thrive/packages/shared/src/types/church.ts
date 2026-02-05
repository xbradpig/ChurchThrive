import type { Database } from './database';

export type Church = Database['public']['Tables']['churches']['Row'];
export type ChurchInsert = Database['public']['Tables']['churches']['Insert'];
export type ChurchUpdate = Database['public']['Tables']['churches']['Update'];

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type OrgRole = Database['public']['Tables']['org_roles']['Row'];
export type Announcement = Database['public']['Tables']['announcements']['Row'];
export type Attendance = Database['public']['Tables']['attendances']['Row'];
export type CellGroup = Database['public']['Tables']['cell_groups']['Row'];
export type AccessRequest = Database['public']['Tables']['access_requests']['Row'];

export type SubscriptionTier = 'free' | 'basic' | 'standard' | 'premium';
export type OrgType = 'committee' | 'department' | 'group' | 'team';
export type EventType = 'worship' | 'meeting' | 'training' | 'cell_group' | 'other';

export const SUBSCRIPTION_LABELS: Record<SubscriptionTier, string> = {
  free: '무료',
  basic: '베이직',
  standard: '스탠다드',
  premium: '프리미엄',
};

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  committee: '위원회',
  department: '부서',
  group: '소그룹',
  team: '팀',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  worship: '예배',
  meeting: '모임',
  training: '훈련',
  cell_group: '구역모임',
  other: '기타',
};

export interface OrganizationTree extends Organization {
  children: OrganizationTree[];
  members: OrgRole[];
}

export interface AttendanceStats {
  date: string;
  eventType: EventType;
  totalMembers: number;
  attendedCount: number;
  attendanceRate: number;
}
