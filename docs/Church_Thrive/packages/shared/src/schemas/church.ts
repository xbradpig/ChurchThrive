import { z } from 'zod';

export const churchSchema = z.object({
  name: z.string().min(2, '교회명은 2자 이상 입력해주세요').max(50),
  denomination: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  senior_pastor: z.string().optional().or(z.literal('')),
  founded_year: z.number().int().optional().nullable(),
});

export const announcementSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  content: z.string().min(1, '내용을 입력해주세요'),
  target_groups: z.array(z.string()).optional(),
  is_pinned: z.boolean().default(false),
  is_published: z.boolean().default(false),
});

export const cellGroupSchema = z.object({
  name: z.string().min(1, '구역명을 입력해주세요').max(50),
  leader_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().or(z.literal('')),
  meeting_day: z.string().optional().or(z.literal('')),
  meeting_time: z.string().optional().or(z.literal('')),
  meeting_place: z.string().optional().or(z.literal('')),
});

export const organizationSchema = z.object({
  name: z.string().min(1, '조직명을 입력해주세요').max(50),
  type: z.enum(['committee', 'department', 'group', 'team']),
  parent_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().or(z.literal('')),
  sort_order: z.number().int().default(0),
});

export type ChurchFormData = z.infer<typeof churchSchema>;
export type AnnouncementFormData = z.infer<typeof announcementSchema>;
export type CellGroupFormData = z.infer<typeof cellGroupSchema>;
export type OrganizationFormData = z.infer<typeof organizationSchema>;
