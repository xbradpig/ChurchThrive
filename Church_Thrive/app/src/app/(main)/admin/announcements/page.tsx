'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { CTSearchBar } from '@/components/molecules/CTSearchBar';
import { CTTabMenu } from '@/components/molecules/CTTabMenu';
import { CTButton } from '@/components/atoms/CTButton';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTEmptyState } from '@/components/molecules/CTEmptyState';
import { CTModal } from '@/components/organisms/CTModal';
import { toast } from '@/components/organisms/CTToast';
import { formatDate, truncate } from '@churchthrive/shared';
import {
  PlusIcon,
  MegaphoneIcon,
  MapPinIcon,
  TrashIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const TAB_ITEMS = [
  { key: 'all', label: '전체' },
  { key: 'published', label: '게시중' },
  { key: 'unpublished', label: '미게시' },
  { key: 'pinned', label: '고정' },
];

export default function AnnouncementsPage() {
  const router = useRouter();
  const {
    announcements,
    total,
    totalPages,
    isLoading,
    filter,
    updateFilter,
    remove,
    togglePin,
    togglePublish,
  } = useAnnouncements();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await remove(deleteTarget);
      if (result.success) {
        toast.success('공지사항이 삭제되었습니다.');
      } else {
        toast.error('삭제에 실패했습니다.');
      }
    } catch {
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function handleTogglePin(id: string, current: boolean) {
    const result = await togglePin(id, current);
    if (result.success) {
      toast.success(current ? '고정이 해제되었습니다.' : '공지가 고정되었습니다.');
    }
  }

  async function handleTogglePublish(id: string, current: boolean) {
    const result = await togglePublish(id, current);
    if (result.success) {
      toast.success(current ? '게시가 취소되었습니다.' : '공지가 게시되었습니다.');
    }
  }

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
          공지사항
        </h1>
        <CTButton
          variant="primary"
          size="md"
          leftIcon={<PlusIcon />}
          onClick={() => router.push('/admin/announcements/new')}
        >
          공지 작성
        </CTButton>
      </div>

      {/* Search */}
      <div className="mb-4">
        <CTSearchBar
          placeholder="공지사항 검색..."
          onSearch={(query) => updateFilter({ search: query })}
        />
      </div>

      {/* Filter Tabs */}
      <CTTabMenu
        items={TAB_ITEMS.map((tab) => ({
          ...tab,
          count: tab.key === 'all' ? total : undefined,
        }))}
        activeKey={filter.status}
        onChange={(key) => updateFilter({ status: key as typeof filter.status })}
        className="mb-4"
      />

      {/* Announcement List */}
      <div className="bg-white rounded-ct-lg shadow-ct-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <CTSpinner size="lg" />
          </div>
        ) : announcements.length === 0 ? (
          <CTEmptyState
            icon={<MegaphoneIcon className="w-16 h-16" />}
            title="공지사항이 없습니다"
            description={
              filter.search
                ? '검색 결과가 없습니다. 다른 검색어를 시도해보세요.'
                : '첫 공지사항을 작성해보세요.'
            }
            actionLabel="공지 작성"
            onAction={() => router.push('/admin/announcements/new')}
          />
        ) : (
          <>
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 px-4 py-4">
                  {/* Pin indicator */}
                  <div className="pt-0.5">
                    {ann.is_pinned && (
                      <MapPinIcon className="w-5 h-5 text-ct-primary" />
                    )}
                    {!ann.is_pinned && (
                      <div className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content area - clickable */}
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => router.push(`/admin/announcements/${ann.id}`)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-ct-md font-semibold text-[var(--ct-color-text-heading)] truncate">
                        {ann.title}
                      </h3>
                      {ann.is_pinned && (
                        <CTBadge label="고정" color="blue" size="sm" />
                      )}
                      {ann.is_published ? (
                        <CTBadge label="게시중" color="green" size="sm" />
                      ) : (
                        <CTBadge label="미게시" color="gray" size="sm" />
                      )}
                    </div>
                    <p className="text-ct-sm text-[var(--ct-color-text-secondary)] mt-1 line-clamp-2">
                      {truncate(ann.content, 120)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-ct-xs text-gray-400">
                        {formatDate(ann.created_at, 'relative')}
                      </span>
                      {ann.target_groups && ann.target_groups.length > 0 && (
                        <span className="text-ct-xs text-gray-400">
                          대상: {ann.target_groups.join(', ')}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePin(ann.id, ann.is_pinned)}
                      className="w-9 h-9 flex items-center justify-center rounded-ct-md hover:bg-gray-100 transition-colors"
                      title={ann.is_pinned ? '고정 해제' : '고정'}
                    >
                      <MapPinIcon className={`w-4 h-4 ${ann.is_pinned ? 'text-ct-primary' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={() => router.push(`/admin/announcements/${ann.id}/edit`)}
                      className="w-9 h-9 flex items-center justify-center rounded-ct-md hover:bg-gray-100 transition-colors"
                      title="수정"
                    >
                      <PencilIcon className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(ann.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-ct-md hover:bg-red-50 transition-colors"
                      title="삭제"
                    >
                      <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-ct-sm text-gray-500">
              {((filter.page || 1) - 1) * (filter.pageSize || 20) + 1}-
              {Math.min((filter.page || 1) * (filter.pageSize || 20), total)}
              {' '}/ {total}건
            </p>
            <div className="flex gap-1">
              <CTButton
                variant="ghost"
                size="sm"
                disabled={(filter.page || 1) <= 1}
                onClick={() => updateFilter({ page: (filter.page || 1) - 1 })}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </CTButton>
              <CTButton
                variant="ghost"
                size="sm"
                disabled={(filter.page || 1) >= totalPages}
                onClick={() => updateFilter({ page: (filter.page || 1) + 1 })}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </CTButton>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <CTModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="공지사항 삭제"
        footer={
          <>
            <CTButton variant="ghost" onClick={() => setDeleteTarget(null)}>
              취소
            </CTButton>
            <CTButton variant="danger" isLoading={isDeleting} onClick={handleDelete}>
              삭제
            </CTButton>
          </>
        }
      >
        <p className="text-ct-md text-gray-600">
          이 공지사항을 삭제하시겠습니까? 삭제된 공지사항은 복구할 수 없습니다.
        </p>
      </CTModal>
    </div>
  );
}
