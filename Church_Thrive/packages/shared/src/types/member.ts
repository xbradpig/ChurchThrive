import type { Database } from './database';

export type Member = Database['public']['Tables']['members']['Row'];
export type MemberInsert = Database['public']['Tables']['members']['Insert'];
export type MemberUpdate = Database['public']['Tables']['members']['Update'];

export type MemberPosition = 'elder' | 'ordained_deacon' | 'deacon' | 'saint';
export type MemberGender = 'male' | 'female';

export type Family = Database['public']['Tables']['families']['Row'];
export type FamilyMember = Database['public']['Tables']['family_members']['Row'];
export type FamilyRelationship = 'head' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';

export interface MemberWithFamily extends Member {
  families?: {
    family: Family;
    relationship: FamilyRelationship;
    members: (FamilyMember & { member: Member })[];
  }[];
}

export interface MemberListFilter {
  search?: string;
  position?: MemberPosition | null;
  role?: string | null;
  status?: string | null;
  cellGroupId?: string | null;
  sortBy?: 'name' | 'joined_at' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface MemberListResult {
  data: Member[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const POSITION_LABELS: Record<MemberPosition, string> = {
  elder: '장로',
  ordained_deacon: '안수집사',
  deacon: '집사',
  saint: '성도',
};

export const GENDER_LABELS: Record<MemberGender, string> = {
  male: '남',
  female: '여',
};

export const RELATIONSHIP_LABELS: Record<FamilyRelationship, string> = {
  head: '세대주',
  spouse: '배우자',
  child: '자녀',
  parent: '부모',
  sibling: '형제자매',
  other: '기타',
};
