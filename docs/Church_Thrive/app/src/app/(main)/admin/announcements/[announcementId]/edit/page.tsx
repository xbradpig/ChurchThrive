'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { announcementSchema, type AnnouncementFormData, ROLE_LABELS } from '@churchthrive/shared';
import type { Announcement } from '@churchthrive/shared';
import { CTFormField } from '@/components/molecules/CTFormField';
import { CTInput } from '@/components/atoms/CTInput';
import { CTTextArea } from '@/components/atoms/CTTextArea';
import { CTCheckbox } from '@/components/atoms/CTCheckbox';
import { CTToggle } from '@/components/atoms/CTToggle';
import { CTButton } from '@/components/atoms/CTButton';
import { CTCard } from '@/components/molecules/CTCard';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { toast } from '@/components/organisms/CTToast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const TARGET_GROUP_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'pastor', label: ROLE_LABELS.pastor },
  { value: 'staff', label: ROLE_LABELS.staff },
  { value: 'leader', label: ROLE_LABELS.leader },
  { value: 'member', label: ROLE_LABELS.member },
];

export default function EditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const announcementId = params.announcementId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      target_groups: ['all'],
      is_pinned: false,
      is_published: false,
    },
  });

  const watchedPublished = watch('is_published');

  const fetchAnnouncement = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', announcementId)
        .single();

      if (error) throw error;
      if (data) {
        reset({
          title: data.title,
          content: data.content,
          target_groups: data.target_groups || ['all'],
          is_pinned: data.is_pinned,
          is_published: data.is_published,
        });
      }
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
      toast.error('공지사항을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [announcementId, reset]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  async function onSubmit(data: AnnouncementFormData) {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const updateData: Record<string, unknown> = {
        title: data.title,
        content: data.content,
        target_groups: data.target_groups,
        is_pinned: data.is_pinned,
        is_published: data.is_published,
      };

      if (data.is_published) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', announcementId);

      if (error) throw error;

      toast.success('공지사항이 수정되었습니다.');
      router.push(`/admin/announcements/${announcementId}`);
    } catch {
      toast.error('수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CTSpinner size="lg" />
      </div>
    );
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
          공지사항 수정
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-ct-lg shadow-ct-1 p-6 space-y-5">
          <CTFormField label="제목" isRequired errorMessage={errors.title?.message}>
            <CTInput
              placeholder="공지사항 제목을 입력하세요"
              {...register('title')}
              isError={!!errors.title}
            />
          </CTFormField>

          <CTFormField label="내용" isRequired errorMessage={errors.content?.message}>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <CTTextArea
                  placeholder="공지사항 내용을 입력하세요"
                  rows={10}
                  value={field.value}
                  onChange={field.onChange}
                  isError={!!errors.content}
                  showCount
                  maxLength={5000}
                />
              )}
            />
          </CTFormField>

          <CTFormField label="대상 그룹">
            <Controller
              name="target_groups"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-3">
                  {TARGET_GROUP_OPTIONS.map((option) => (
                    <CTCheckbox
                      key={option.value}
                      label={option.label}
                      checked={field.value?.includes(option.value)}
                      onChange={(e) => {
                        const current = field.value || [];
                        if (e.target.checked) {
                          if (option.value === 'all') {
                            field.onChange(['all']);
                          } else {
                            field.onChange(
                              [...current.filter(v => v !== 'all'), option.value]
                            );
                          }
                        } else {
                          field.onChange(current.filter(v => v !== option.value));
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            />
          </CTFormField>
        </div>

        {/* Options */}
        <CTCard>
          <div className="space-y-4">
            <Controller
              name="is_pinned"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-ct-md font-medium text-gray-800">상단 고정</p>
                    <p className="text-ct-sm text-gray-400">
                      공지사항 목록 최상단에 고정됩니다
                    </p>
                  </div>
                  <CTToggle isOn={field.value} onChange={field.onChange} />
                </div>
              )}
            />
            <div className="border-t border-gray-100" />
            <Controller
              name="is_published"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-ct-md font-medium text-gray-800">게시 상태</p>
                    <p className="text-ct-sm text-gray-400">
                      활성화하면 교인에게 공개됩니다
                    </p>
                  </div>
                  <CTToggle isOn={field.value} onChange={field.onChange} />
                </div>
              )}
            />
          </div>
        </CTCard>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <CTButton variant="ghost" type="button" onClick={() => router.back()}>
            취소
          </CTButton>
          <CTButton variant="primary" type="submit" isLoading={isSubmitting}>
            {watchedPublished ? '수정 및 게시' : '저장'}
          </CTButton>
        </div>
      </form>
    </div>
  );
}
