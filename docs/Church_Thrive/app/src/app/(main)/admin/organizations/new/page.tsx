'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { organizationSchema, type OrganizationFormData, ORG_TYPE_LABELS } from '@churchthrive/shared';
import type { Organization } from '@churchthrive/shared';
import { CTFormField } from '@/components/molecules/CTFormField';
import { CTInput } from '@/components/atoms/CTInput';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTTextArea } from '@/components/atoms/CTTextArea';
import { CTButton } from '@/components/atoms/CTButton';
import { toast } from '@/components/organisms/CTToast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NewOrganizationPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentOrgs, setParentOrgs] = useState<Organization[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      type: 'department',
      parent_id: null,
      description: '',
      sort_order: 0,
    },
  });

  const fetchParentOrgs = useCallback(async () => {
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
        .from('organizations')
        .select('*')
        .eq('church_id', member.church_id)
        .order('sort_order', { ascending: true });

      setParentOrgs(data || []);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchParentOrgs();
  }, [fetchParentOrgs]);

  async function onSubmit(data: OrganizationFormData) {
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

      const { error } = await supabase.from('organizations').insert({
        name: data.name,
        type: data.type,
        parent_id: data.parent_id || null,
        description: data.description || null,
        sort_order: data.sort_order,
        church_id: member.church_id,
      });

      if (error) throw error;

      toast.success('조직이 추가되었습니다.');
      router.push('/admin/organizations');
    } catch {
      toast.error('조직 추가에 실패했습니다.');
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
          조직 추가
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-ct-lg shadow-ct-1 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <CTFormField label="조직명" isRequired errorMessage={errors.name?.message}>
            <CTInput
              placeholder="예: 찬양팀"
              {...register('name')}
              isError={!!errors.name}
            />
          </CTFormField>

          <CTFormField label="조직 유형" isRequired errorMessage={errors.type?.message}>
            <CTSelect
              options={Object.entries(ORG_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              {...register('type')}
              isError={!!errors.type}
            />
          </CTFormField>

          <CTFormField label="상위 조직" helperText="없으면 최상위 조직으로 생성됩니다">
            <CTSelect
              options={[
                { value: '', label: '없음 (최상위)' },
                ...parentOrgs.map(org => ({
                  value: org.id,
                  label: `${org.name} (${ORG_TYPE_LABELS[org.type]})`,
                })),
              ]}
              {...register('parent_id')}
            />
          </CTFormField>

          <CTFormField label="정렬 순서" helperText="숫자가 작을수록 먼저 표시됩니다">
            <CTInput
              type="number"
              placeholder="0"
              {...register('sort_order', { valueAsNumber: true })}
            />
          </CTFormField>
        </div>

        <CTFormField label="설명">
          <CTTextArea
            placeholder="조직에 대한 설명을 입력하세요"
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
