import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요').optional(),
  phone: z.string().regex(/^01[0-9]\d{7,8}$/, '올바른 전화번호를 입력해주세요').optional(),
  password: z.string().min(8, '비밀번호는 8자 이상 입력해주세요'),
}).refine(
  (data) => data.email || data.phone,
  { message: '이메일 또는 전화번호를 입력해주세요', path: ['email'] }
);

export const signUpSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상 입력해주세요').max(20),
  email: z.string().email('올바른 이메일을 입력해주세요').optional().or(z.literal('')),
  phone: z.string().regex(/^01[0-9]\d{7,8}$/, '올바른 전화번호를 입력해주세요').optional().or(z.literal('')),
  password: z.string()
    .min(8, '비밀번호는 8자 이상 입력해주세요')
    .regex(/[a-zA-Z]/, '영문자를 포함해주세요')
    .regex(/[0-9]/, '숫자를 포함해주세요'),
  passwordConfirm: z.string(),
}).refine(
  (data) => data.password === data.passwordConfirm,
  { message: '비밀번호가 일치하지 않습니다', path: ['passwordConfirm'] }
).refine(
  (data) => data.email || data.phone,
  { message: '이메일 또는 전화번호를 입력해주세요', path: ['email'] }
);

export const churchSearchSchema = z.object({
  query: z.string().min(2, '검색어를 2자 이상 입력해주세요'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ChurchSearchData = z.infer<typeof churchSearchSchema>;
