import { z } from 'zod';

export const sermonSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이하로 입력해주세요'),
  bible_verses: z.array(z.string()).optional(),
  sermon_date: z.string().min(1, '날짜를 선택해주세요'),
  service_type: z.enum([
    'sunday_morning', 'sunday_evening', 'wednesday',
    'friday', 'dawn', 'special', 'other',
  ]).default('sunday_morning'),
  preacher_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const sermonNoteSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  sermon_id: z.string().uuid().optional().nullable(),
  content: z.any(),
  is_shared: z.boolean().default(false),
});

export const noteFeedbackSchema = z.object({
  content: z.string().min(1, '피드백 내용을 입력해주세요').max(2000),
  parent_id: z.string().uuid().optional().nullable(),
});

export type SermonFormData = z.infer<typeof sermonSchema>;
export type SermonNoteFormData = z.infer<typeof sermonNoteSchema>;
export type NoteFeedbackFormData = z.infer<typeof noteFeedbackSchema>;
