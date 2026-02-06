'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSermons } from '@/hooks/useSermons';
import { CTSearchBar } from '@/components/molecules/CTSearchBar';
import { CTButton } from '@/components/atoms/CTButton';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTTag } from '@/components/atoms/CTTag';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTEmptyState } from '@/components/molecules/CTEmptyState';
import { SERVICE_TYPE_LABELS } from '@churchthrive/shared';
import {
  PlusIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const SERVICE_TYPE_COLORS: Record<string, 'blue' | 'green' | 'yellow' | 'gray'> = {
  sunday_worship: 'blue',
  wednesday_worship: 'green',
  friday_prayer: 'yellow',
  dawn_prayer: 'gray',
  special: 'blue',
  revival: 'green',
  other: 'gray',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export default function SermonsPage() {
  const router = useRouter();
  const { sermons, total, totalPages, isLoading, filter, updateFilter } = useSermons();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/notes')}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
              설교 아카이브
            </h1>
            <p className="text-ct-sm text-gray-500 mt-1">전체 {total}개</p>
          </div>
        </div>
        <CTButton
          variant="primary"
          size="sm"
          leftIcon={<PlusIcon className="w-4 h-4" />}
          onClick={() => router.push('/notes/sermons/new')}
        >
          설교 등록
        </CTButton>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <CTSearchBar
            placeholder="설교 제목, 설교자 검색"
            onSearch={(query) => updateFilter({ search: query })}
          />
        </div>
        <CTButton
          variant="ghost"
          size="md"
          leftIcon={<FunnelIcon className="w-5 h-5" />}
          onClick={() => setShowFilters(!showFilters)}
        >
          필터
        </CTButton>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-4 bg-white rounded-ct-lg shadow-ct-1">
          <CTSelect
            options={[
              { value: '', label: '전체 예배' },
              { value: 'sunday_worship', label: '주일예배' },
              { value: 'wednesday_worship', label: '수요예배' },
              { value: 'friday_prayer', label: '금요기도' },
              { value: 'dawn_prayer', label: '새벽기도' },
              { value: 'special', label: '특별집회' },
              { value: 'revival', label: '부흥회' },
              { value: 'other', label: '기타' },
            ]}
            value={filter.serviceType || ''}
            onChange={(e) => updateFilter({ serviceType: e.target.value || null })}
            size="sm"
          />
          <div>
            <label className="block text-ct-xs text-gray-500 mb-1">시작일</label>
            <input
              type="date"
              value={filter.dateFrom || ''}
              onChange={(e) => updateFilter({ dateFrom: e.target.value || null })}
              className="w-full h-8 px-2.5 text-ct-sm rounded-ct-md border border-gray-300 bg-[var(--ct-color-gray-50)] focus:outline-none focus:ring-2 focus:ring-ct-primary/40"
            />
          </div>
          <div>
            <label className="block text-ct-xs text-gray-500 mb-1">종료일</label>
            <input
              type="date"
              value={filter.dateTo || ''}
              onChange={(e) => updateFilter({ dateTo: e.target.value || null })}
              className="w-full h-8 px-2.5 text-ct-sm rounded-ct-md border border-gray-300 bg-[var(--ct-color-gray-50)] focus:outline-none focus:ring-2 focus:ring-ct-primary/40"
            />
          </div>
        </div>
      )}

      {/* Sermon List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <CTSpinner size="lg" />
        </div>
      ) : sermons.length === 0 ? (
        <div className="bg-white rounded-ct-lg shadow-ct-1">
          <CTEmptyState
            icon={<BookOpenIcon className="w-16 h-16" />}
            title="등록된 설교가 없습니다"
            description={
              filter.search
                ? '검색 결과가 없습니다. 다른 검색어를 시도해보세요.'
                : '첫 설교를 등록하여 아카이브를 시작하세요.'
            }
            actionLabel="설교 등록"
            onAction={() => router.push('/notes/sermons/new')}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sermons.map((sermon) => (
              <button
                key={sermon.id}
                onClick={() => router.push(`/notes/sermons/${sermon.id}`)}
                className="bg-white rounded-ct-lg shadow-ct-1 p-4 text-left hover:shadow-ct-2 transition-shadow w-full"
              >
                {/* Title */}
                <h3 className="text-ct-md font-semibold text-[var(--ct-color-text-heading)] line-clamp-2 mb-2">
                  {sermon.title}
                </h3>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {sermon.service_type && (
                    <CTBadge
                      label={
                        SERVICE_TYPE_LABELS[
                          sermon.service_type as keyof typeof SERVICE_TYPE_LABELS
                        ] || sermon.service_type
                      }
                      color={SERVICE_TYPE_COLORS[sermon.service_type] || 'gray'}
                      size="sm"
                    />
                  )}
                </div>

                {/* Preacher & Date */}
                <div className="flex flex-wrap items-center gap-3 text-ct-sm text-gray-500 mb-3">
                  {sermon.preacher_name && (
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      <span>{sermon.preacher_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{formatDate(sermon.sermon_date)}</span>
                  </div>
                </div>

                {/* Bible Verses */}
                {sermon.bible_verses && sermon.bible_verses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {sermon.bible_verses.slice(0, 3).map((verse, idx) => (
                      <CTTag key={idx} label={verse} color="blue" size="sm" />
                    ))}
                    {sermon.bible_verses.length > 3 && (
                      <CTTag
                        label={`+${sermon.bible_verses.length - 3}`}
                        color="gray"
                        size="sm"
                      />
                    )}
                  </div>
                )}

                {/* Note Count */}
                <div className="flex items-center gap-1 text-ct-xs text-gray-400">
                  <DocumentTextIcon className="w-3.5 h-3.5" />
                  <span>노트 {sermon.note_count}개</span>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <p className="text-ct-sm text-gray-500">
                {((filter.page || 1) - 1) * (filter.pageSize || 12) + 1}-
                {Math.min(
                  (filter.page || 1) * (filter.pageSize || 12),
                  total
                )}
                {' '}/ {total}개
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
        </>
      )}
    </div>
  );
}
