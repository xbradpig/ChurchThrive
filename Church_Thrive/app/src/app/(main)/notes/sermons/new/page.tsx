'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { sermonSchema } from '@churchthrive/shared';
import { CTButton } from '@/components/atoms/CTButton';
import { CTInput } from '@/components/atoms/CTInput';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTFormField } from '@/components/molecules/CTFormField';
import { CTTag } from '@/components/atoms/CTTag';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { toast } from '@/components/organisms/CTToast';
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface MemberOption {
  id: string;
  name: string;
  role: string;
}

interface SermonFormData {
  title: string;
  service_type: string;
  sermon_date: string;
  preacher_id?: string;
  preacher_name?: string;
  bible_verses: string[];
  tags: string[];
}

export default function NewSermonPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [verseInput, setVerseInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SermonFormData>({
    resolver: zodResolver(sermonSchema),
    defaultValues: {
      title: '',
      service_type: 'sunday_worship',
      sermon_date: new Date().toISOString().split('T')[0],
      preacher_id: '',
      preacher_name: '',
      bible_verses: [],
      tags: [],
    },
  });

  const bibleVerses = watch('bible_verses') || [];
  const tags = watch('tags') || [];

  // Fetch pastor/admin members for preacher selection
  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: currentMember } = await supabase
          .from('members')
          .select('church_id, role')
          .eq('user_id', user.id)
          .single();

        if (!currentMember) return;

        // Check authorization
        if (currentMember.role !== 'admin' && currentMember.role !== 'pastor') {
          toast.error('설교 등록 권한이 없습니다.');
          router.push('/notes/sermons');
          return;
        }

        const { data, error } = await supabase
          .from('members')
          .select('id, name, role')
          .eq('church_id', currentMember.church_id)
          .in('role', ['admin', 'pastor'])
          .order('name');

        if (error) throw error;
        setMembers(data || []);
      } catch (error) {
        console.error('Failed to fetch members:', error);
      } finally {
        setMembersLoading(false);
      }
    }
    fetchMembers();
  }, [supabase, router]);

  function addVerse() {
    const trimmed = verseInput.trim();
    if (!trimmed) return;
    if (bibleVerses.includes(trimmed)) {
      toast.error('이미 추가된 구절입니다.');
      return;
    }
    setValue('bible_verses', [...bibleVerses, trimmed]);
    setVerseInput('');
  }

  function removeVerse(verse: string) {
    setValue(
      'bible_verses',
      bibleVerses.filter((v) => v !== verse)
    );
  }

  function addTag() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      toast.error('이미 추가된 태그입니다.');
      return;
    }
    setValue('tags', [...tags, trimmed]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setValue(
      'tags',
      tags.filter((t) => t !== tag)
    );
  }

  async function onSubmit(data: SermonFormData) {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: currentMember } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!currentMember) return;

      // Get preacher name from selected member
      let preacherName = data.preacher_name || '';
      if (data.preacher_id) {
        const selectedMember = members.find((m) => m.id === data.preacher_id);
        if (selectedMember) {
          preacherName = selectedMember.name;
        }
      }

      const { error } = await supabase.from('sermons').insert({
        church_id: currentMember.church_id,
        title: data.title.trim(),
        service_type: data.service_type,
        sermon_date: data.sermon_date,
        preacher_id: data.preacher_id || null,
        preacher_name: preacherName || null,
        bible_verses: data.bible_verses,
        tags: data.tags,
      });

      if (error) {
        console.error('Failed to create sermon:', error);
        toast.error('설교 등록에 실패했습니다.');
        return;
      }

      toast.success('설교가 등록되었습니다.');
      router.push('/notes/sermons');
    } catch (error) {
      console.error('Failed to create sermon:', error);
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (membersLoading) {
    return (
      <div className="ct-container py-6 flex items-center justify-center min-h-[50vh]">
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
          className="p-2 -ml-2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
          설교 등록
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-ct-lg shadow-ct-1 p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Title */}
          <CTFormField
            label="설교 제목"
            isRequired
            errorMessage={errors.title?.message}
            className="sm:col-span-2"
          >
            <CTInput
              placeholder="설교 제목을 입력하세요"
              {...register('title')}
              isError={!!errors.title}
            />
          </CTFormField>

          {/* Service Type */}
          <CTFormField
            label="예배 유형"
            isRequired
            errorMessage={errors.service_type?.message}
          >
            <CTSelect
              options={[
                { value: 'sunday_worship', label: '주일예배' },
                { value: 'wednesday_worship', label: '수요예배' },
                { value: 'friday_prayer', label: '금요기도' },
                { value: 'dawn_prayer', label: '새벽기도' },
                { value: 'special', label: '특별집회' },
                { value: 'revival', label: '부흥회' },
                { value: 'other', label: '기타' },
              ]}
              {...register('service_type')}
              isError={!!errors.service_type}
            />
          </CTFormField>

          {/* Sermon Date */}
          <CTFormField
            label="설교 날짜"
            isRequired
            errorMessage={errors.sermon_date?.message}
          >
            <CTInput
              type="date"
              {...register('sermon_date')}
              isError={!!errors.sermon_date}
            />
          </CTFormField>

          {/* Preacher */}
          <CTFormField label="설교자" errorMessage={errors.preacher_id?.message}>
            <CTSelect
              options={[
                { value: '', label: '설교자 선택' },
                ...members.map((m) => ({
                  value: m.id,
                  label: `${m.name} (${m.role === 'admin' ? '담임목사' : '교역자'})`,
                })),
              ]}
              {...register('preacher_id')}
            />
          </CTFormField>

          {/* Manual preacher name (if not from members) */}
          <CTFormField
            label="설교자 이름 (직접 입력)"
            helperText="목록에 없는 경우 직접 입력"
          >
            <CTInput
              placeholder="설교자 이름"
              {...register('preacher_name')}
            />
          </CTFormField>
        </div>

        {/* Bible Verses */}
        <CTFormField label="성경 본문">
          <div className="flex gap-2">
            <div className="flex-1">
              <CTInput
                placeholder="예: 요한복음 3:16-18"
                value={verseInput}
                onChange={(e) => setVerseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addVerse();
                  }
                }}
              />
            </div>
            <CTButton
              type="button"
              variant="outline"
              size="md"
              onClick={addVerse}
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              추가
            </CTButton>
          </div>
          {bibleVerses.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {bibleVerses.map((verse, idx) => (
                <CTTag
                  key={idx}
                  label={verse}
                  color="blue"
                  size="md"
                  isRemovable
                  onRemove={() => removeVerse(verse)}
                />
              ))}
            </div>
          )}
        </CTFormField>

        {/* Tags */}
        <CTFormField label="태그">
          <div className="flex gap-2">
            <div className="flex-1">
              <CTInput
                placeholder="태그를 입력하세요"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
            </div>
            <CTButton
              type="button"
              variant="outline"
              size="md"
              onClick={addTag}
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              추가
            </CTButton>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, idx) => (
                <CTTag
                  key={idx}
                  label={tag}
                  color="gray"
                  size="md"
                  isRemovable
                  onRemove={() => removeTag(tag)}
                />
              ))}
            </div>
          )}
        </CTFormField>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <CTButton variant="ghost" type="button" onClick={() => router.back()}>
            취소
          </CTButton>
          <CTButton variant="primary" type="submit" isLoading={isSubmitting}>
            등록
          </CTButton>
        </div>
      </form>
    </div>
  );
}
