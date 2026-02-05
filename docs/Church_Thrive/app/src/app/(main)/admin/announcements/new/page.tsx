'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { announcementSchema, type AnnouncementFormData, ROLE_LABELS } from '@churchthrive/shared';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { CTFormField } from '@/components/molecules/CTFormField';
import { CTInput } from '@/components/atoms/CTInput';
import { CTTextArea } from '@/components/atoms/CTTextArea';
import { CTCheckbox } from '@/components/atoms/CTCheckbox';
import { CTToggle } from '@/components/atoms/CTToggle';
import { CTButton } from '@/components/atoms/CTButton';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTCard } from '@/components/molecules/CTCard';
import { toast } from '@/components/organisms/CTToast';
import {
  ArrowLeftIcon,
  EyeIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

const TARGET_GROUP_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'pastor', label: ROLE_LABELS.pastor },
  { value: 'staff', label: ROLE_LABELS.staff },
  { value: 'leader', label: ROLE_LABELS.leader },
  { value: 'member', label: ROLE_LABELS.member },
];

export default function NewAnnouncementPage() {
  const router = useRouter();
  const { create } = useAnnouncements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const {
    register,
    handleSubmit,
    control,
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

  const watchedValues = watch();

  async function onSubmit(data: AnnouncementFormData) {
    setIsSubmitting(true);
    try {
      const result = await create({
        title: data.title,
        content: data.content,
        target_groups: data.target_groups,
        is_pinned: data.is_pinned,
        is_published: data.is_published,
      });

      if (result.success) {
        toast.success(data.is_published ? '공지가 게시되었습니다.' : '공지가 저장되었습니다.');
        router.push('/admin/announcements');
      } else {
        toast.error('공지 작성에 실패했습니다.');
      }
    } catch {
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-ct-md hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
            공지 작성
          </h1>
        </div>
        <CTButton
          variant="ghost"
          size="sm"
          leftIcon={isPreview ? <PencilSquareIcon /> : <EyeIcon />}
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? '편집' : '미리보기'}
        </CTButton>
      </div>

      {isPreview ? (
        /* Preview Mode */
        <div className="bg-white rounded-ct-lg shadow-ct-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            {watchedValues.is_pinned && <CTBadge label="고정" color="blue" size="sm" />}
            {watchedValues.is_published ? (
              <CTBadge label="게시중" color="green" size="sm" />
            ) : (
              <CTBadge label="미게시" color="gray" size="sm" />
            )}
          </div>
          <h2 className="text-ct-xl font-bold text-[var(--ct-color-text-heading)] mb-4">
            {watchedValues.title || '(제목 없음)'}
          </h2>
          <div className="prose max-w-none text-ct-md text-gray-700 whitespace-pre-wrap">
            {watchedValues.content || '(내용 없음)'}
          </div>
          {watchedValues.target_groups && watchedValues.target_groups.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-ct-xs text-gray-400 mb-2">대상 그룹</p>
              <div className="flex flex-wrap gap-1.5">
                {watchedValues.target_groups.map((group) => {
                  const option = TARGET_GROUP_OPTIONS.find(o => o.value === group);
                  return (
                    <CTBadge key={group} label={option?.label || group} color="blue" size="sm" />
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <CTButton variant="ghost" onClick={() => setIsPreview(false)}>
              편집으로 돌아가기
            </CTButton>
            <CTButton
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              {watchedValues.is_published ? '게시' : '저장'}
            </CTButton>
          </div>
        </div>
      ) : (
        /* Edit Mode */
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
                      <p className="text-ct-md font-medium text-gray-800">즉시 게시</p>
                      <p className="text-ct-sm text-gray-400">
                        저장과 동시에 교인에게 공개됩니다
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
              {watchedValues.is_published ? '게시' : '저장'}
            </CTButton>
          </div>
        </form>
      )}
    </div>
  );
}
