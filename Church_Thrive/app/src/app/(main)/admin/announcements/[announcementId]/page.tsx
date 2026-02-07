'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTTag } from '@/components/atoms/CTTag';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTModal } from '@/components/organisms/CTModal';
import { toast } from '@/components/organisms/CTToast';
import { formatDate, ROLE_LABELS } from '@churchthrive/shared';
import type { Announcement, Member } from '@churchthrive/shared';
import {

  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export const runtime = 'edge';

const TARGET_GROUP_LABELS: Record<string, string> = {
  all: '전체',
  admin: ROLE_LABELS.admin,
  pastor: ROLE_LABELS.pastor,
  staff: ROLE_LABELS.staff,
  leader: ROLE_LABELS.leader,
  member: ROLE_LABELS.member,
};

export default function AnnouncementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const announcementId = params.announcementId as string;
  const supabase = createClient();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [author, setAuthor] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncement = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', announcementId)
        .single();

      if (error) throw error;
      setAnnouncement(data);

      // Fetch author info
      if (data?.author_id) {
        const { data: authorData } = await supabase
          .from('members')
          .select('*')
          .eq('id', data.author_id)
          .single();
        setAuthor(authorData);
      }
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
      toast.error('공지사항을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [announcementId, supabase]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;
      toast.success('공지사항이 삭제되었습니다.');
      router.push('/admin/announcements');
    } catch {
      toast.error('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CTSpinner size="lg" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="ct-container py-6 text-center">
        <p className="text-gray-500">공지사항을 찾을 수 없습니다.</p>
        <CTButton variant="ghost" className="mt-4" onClick={() => router.push('/admin/announcements')}>
          목록으로 돌아가기
        </CTButton>
      </div>
    );
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
            공지사항
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <CTButton
            variant="outline"
            size="md"
            leftIcon={<PencilIcon />}
            onClick={() => router.push(`/admin/announcements/${announcementId}/edit`)}
          >
            수정
          </CTButton>
          <CTButton
            variant="danger"
            size="md"
            leftIcon={<TrashIcon />}
            onClick={() => setShowDeleteModal(true)}
          >
            삭제
          </CTButton>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-ct-lg shadow-ct-1 overflow-hidden">
        {/* Status badges */}
        <div className="flex items-center gap-2 px-6 pt-6">
          {announcement.is_pinned && (
            <CTBadge label="고정" color="blue" size="sm" />
          )}
          {announcement.is_published ? (
            <CTBadge label="게시중" color="green" size="sm" />
          ) : (
            <CTBadge label="미게시" color="gray" size="sm" />
          )}
        </div>

        {/* Title */}
        <div className="px-6 pt-3">
          <h2 className="text-ct-xl font-bold text-[var(--ct-color-text-heading)]">
            {announcement.title}
          </h2>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-3 text-ct-xs text-gray-400">
          {author && (
            <span className="flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              {author.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            {formatDate(announcement.created_at, 'long')}
          </span>
          {announcement.published_at && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="w-3.5 h-3.5" />
              게시일: {formatDate(announcement.published_at, 'short')}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mx-6" />

        {/* Content */}
        <div className="px-6 py-6">
          <div className="prose max-w-none text-ct-md text-gray-700 whitespace-pre-wrap leading-relaxed">
            {announcement.content}
          </div>
        </div>

        {/* Target groups */}
        {announcement.target_groups && announcement.target_groups.length > 0 && (
          <div className="px-6 pb-6">
            <div className="border-t border-gray-100 pt-4">
              <p className="text-ct-xs font-medium text-gray-400 mb-2">대상 그룹</p>
              <div className="flex flex-wrap gap-1.5">
                {announcement.target_groups.map((group) => (
                  <CTTag
                    key={group}
                    label={TARGET_GROUP_LABELS[group] || group}
                    color="blue"
                    size="sm"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="px-6 pb-6">
          <div className="border-t border-gray-100 pt-4 flex items-center gap-4 text-ct-xs text-gray-400">
            <span>작성일: {formatDate(announcement.created_at, 'long')}</span>
            <span>수정일: {formatDate(announcement.updated_at, 'long')}</span>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <CTModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="공지사항 삭제"
        footer={
          <>
            <CTButton variant="ghost" onClick={() => setShowDeleteModal(false)}>
              취소
            </CTButton>
            <CTButton variant="danger" isLoading={isDeleting} onClick={handleDelete}>
              삭제
            </CTButton>
          </>
        }
      >
        <p className="text-ct-md text-gray-600">
          &ldquo;{announcement.title}&rdquo; 공지사항을 삭제하시겠습니까?
          삭제된 공지사항은 복구할 수 없습니다.
        </p>
      </CTModal>
    </div>
  );
}
