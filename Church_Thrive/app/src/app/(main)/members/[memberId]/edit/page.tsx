'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { memberSchema, type MemberFormData } from '@churchthrive/shared';
import { CTFormField } from '@/components/molecules/CTFormField';
import { CTInput } from '@/components/atoms/CTInput';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTButton } from '@/components/atoms/CTButton';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { toast } from '@/components/organisms/CTToast';
import type { Member } from '@churchthrive/shared';

export const runtime = 'edge';

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  useEffect(() => {
    async function loadMember() {
      const { data } = await supabase.from('members').select('*').eq('id', memberId).single();
      if (data) {
        reset({
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          address: data.address || '',
          birth_date: data.birth_date || '',
          baptism_date: data.baptism_date || '',
          gender: data.gender as any,
          position: data.position as any,
          role: data.role as any,
          cell_group_id: data.cell_group_id,
        });
      }
      setIsLoading(false);
    }
    loadMember();
  }, [memberId, supabase, reset]);

  async function onSubmit(data: MemberFormData) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          address: data.address || null,
          birth_date: data.birth_date || null,
          baptism_date: data.baptism_date || null,
          gender: data.gender || null,
          position: data.position || null,
          role: data.role,
          cell_group_id: data.cell_group_id || null,
        })
        .eq('id', memberId);

      if (error) {
        toast.error('수정에 실패했습니다.');
        return;
      }

      toast.success('교인 정보가 수정되었습니다.');
      router.push(`/members/${memberId}`);
    } catch {
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="ct-container py-6 flex justify-center">
        <CTSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="ct-container py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">&larr; 뒤로</button>
        <h1 className="text-ct-2xl font-bold">교인 정보 수정</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-ct-lg shadow-ct-1 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <CTFormField label="이름" isRequired errorMessage={errors.name?.message}>
            <CTInput placeholder="홍길동" {...register('name')} isError={!!errors.name} />
          </CTFormField>

          <CTFormField label="전화번호" isRequired errorMessage={errors.phone?.message}>
            <CTInput type="tel" placeholder="010-1234-5678" {...register('phone')} isError={!!errors.phone} />
          </CTFormField>

          <CTFormField label="이메일" errorMessage={errors.email?.message}>
            <CTInput type="email" placeholder="email@example.com" {...register('email')} />
          </CTFormField>

          <CTFormField label="성별">
            <CTSelect
              options={[
                { value: 'male', label: '남' },
                { value: 'female', label: '여' },
              ]}
              placeholder="선택하세요"
              {...register('gender')}
            />
          </CTFormField>

          <CTFormField label="생년월일">
            <CTInput type="date" {...register('birth_date')} />
          </CTFormField>

          <CTFormField label="세례일">
            <CTInput type="date" {...register('baptism_date')} />
          </CTFormField>

          <CTFormField label="직분">
            <CTSelect
              options={[
                { value: 'elder', label: '장로' },
                { value: 'ordained_deacon', label: '안수집사' },
                { value: 'deacon', label: '집사' },
                { value: 'saint', label: '성도' },
              ]}
              placeholder="선택하세요"
              {...register('position')}
            />
          </CTFormField>

          <CTFormField label="역할">
            <CTSelect
              options={[
                { value: 'member', label: '교인' },
                { value: 'leader', label: '사역리더' },
                { value: 'staff', label: '사무간사' },
                { value: 'pastor', label: '교역자' },
                { value: 'admin', label: '담임목사' },
              ]}
              {...register('role')}
            />
          </CTFormField>
        </div>

        <CTFormField label="주소">
          <CTInput placeholder="서울시 강남구..." {...register('address')} />
        </CTFormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <CTButton variant="ghost" type="button" onClick={() => router.back()}>취소</CTButton>
          <CTButton variant="primary" type="submit" isLoading={isSubmitting}>저장</CTButton>
        </div>
      </form>
    </div>
  );
}
