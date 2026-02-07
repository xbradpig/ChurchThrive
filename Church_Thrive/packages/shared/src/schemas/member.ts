import { z } from 'zod';

export const memberSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상 입력해주세요').max(20, '이름은 20자 이하로 입력해주세요'),
  phone: z.string().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, '올바른 전화번호를 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female']).optional().nullable(),
  baptism_date: z.string().optional().or(z.literal('')),
  position: z.enum(['elder', 'ordained_deacon', 'deacon', 'saint']).optional().nullable(),
  cell_group_id: z.string().uuid().optional().nullable(),
  role: z.enum(['admin', 'pastor', 'staff', 'leader', 'member']).default('member'),
});

export const memberSearchSchema = z.object({
  query: z.string().optional(),
  position: z.enum(['elder', 'ordained_deacon', 'deacon', 'saint']).optional().nullable(),
  role: z.enum(['admin', 'pastor', 'staff', 'leader', 'member']).optional().nullable(),
  status: z.enum(['pending', 'active', 'inactive', 'transferred']).optional().nullable(),
  cellGroupId: z.string().uuid().optional().nullable(),
  sortBy: z.enum(['name', 'joined_at', 'created_at']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export const qrRegistrationSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상 입력해주세요'),
  phone: z.string().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, '올바른 전화번호를 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요').optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female']).optional().nullable(),
  address: z.string().optional().or(z.literal('')),
  how_did_you_hear: z.string().optional().or(z.literal('')),
  prayer_request: z.string().optional().or(z.literal('')),
});

export type MemberFormData = z.infer<typeof memberSchema>;
export type MemberSearchParams = z.infer<typeof memberSearchSchema>;
export type QrRegistrationData = z.infer<typeof qrRegistrationSchema>;
