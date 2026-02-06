'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { cellGroupSchema, type CellGroupFormData } from '@churchthrive/shared';
import type { Member } from '@churchthrive/shared';
import { CTFormField } from '@/components/molecules/CTFormField';
import { CTInput } from '@/components/atoms/CTInput';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTTextArea } from '@/components/atoms/CTTextArea';
import { CTButton } from '@/components/atoms/CTButton';
import { toast } from '@/components/organisms/CTToast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const DAY_OPTIONS = [
  { value: '', label: '선택하세요' },
  { value: '월요일', label: '월요일' },
  { value: '화요일', label: '화요일' },
  { value: '수요일', label: '수요일' },
  { value: '목요일', label: '목요일' },
  { value: '금요일', label: '금요일' },
  { value: '토요일', label: '토요일' },
  { value: '주일', label: '주일' },
];

export default function NewCellGroupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CellGroupFormData>({
    resolver: zodResolver(cellGroupSchema),
    defaultValues: {
      name: '',
      leader_id: null,
      description: '',
      meeting_day: '',
      meeting_time: '',
      meeting_place: '',
    },
  });

  const fetchMembers = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!member) return;

      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('church_id', member.church_id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      setMemberOptions(data || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function onSubmit(data: CellGroupFormData) {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: member } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!member) return;

      const { error } = await supabase.from('cell_groups').insert({
        name: data.name,
        leader_id: data.leader_id || null,
        description: data.description || null,
        meeting_day: data.meeting_day || null,
        meeting_time: data.meeting_time || null,
        meeting_place: data.meeting_place || null,
        church_id: member.church_id,
      });

      if (error) throw error;

      toast.success('구역이 추가되었습니다.');
      router.push('/admin/cell-groups');
    } catch {
      toast.error('구역 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-ct-md hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
          구역 추가
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-ct-lg shadow-ct-1 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <CTFormField label="구역명" isRequired errorMessage={errors.name?.message}>
            <CTInput
              placeholder="예: 1구역, 사랑셀"
              {...register('name')}
              isError={!!errors.name}
            />
          </CTFormField>

          <CTFormField label="구역장" helperText="구역을 이끌 리더를 선택하세요">
            <CTSelect
              options={[
                { value: '', label: '선택하세요' },
                ...memberOptions.map(m => ({
                  value: m.id,
                  label: m.name,
                })),
              ]}
              {...register('leader_id')}
            />
          </CTFormField>

          <CTFormField label="모임 요일">
            <CTSelect options={DAY_OPTIONS} {...register('meeting_day')} />
          </CTFormField>

          <CTFormField label="모임 시간">
            <CTInput
              type="time"
              {...register('meeting_time')}
            />
          </CTFormField>

          <CTFormField label="모임 장소" className="sm:col-span-2">
            <CTInput
              placeholder="예: 교회 소예배실, 구역장 가정"
              {...register('meeting_place')}
            />
          </CTFormField>
        </div>

        <CTFormField label="설명">
          <CTTextArea
            placeholder="구역에 대한 간단한 설명"
            rows={3}
            {...register('description')}
          />
        </CTFormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <CTButton variant="ghost" type="button" onClick={() => router.back()}>
            취소
          </CTButton>
          <CTButton variant="primary" type="submit" isLoading={isSubmitting}>
            추가
          </CTButton>
        </div>
      </form>
    </div>
  );
}
