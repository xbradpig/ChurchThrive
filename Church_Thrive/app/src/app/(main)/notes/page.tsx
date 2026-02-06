'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
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
  MicrophoneIcon,
  ShareIcon,
  CalendarDaysIcon,
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

function formatNoteDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function truncateContent(text: string | null, maxLength: number = 80): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export default function NotesPage() {
  const router = useRouter();
  const { notes, total, totalPages, isLoading, filter, updateFilter } = useNotes();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
            내 말씀노트
          </h1>
          <p className="text-ct-sm text-gray-500 mt-1">전체 {total}개</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CTButton
            variant="outline"
            size="sm"
            leftIcon={<BookOpenIcon className="w-4 h-4" />}
            onClick={() => router.push('/notes/sermons')}
          >
            설교 아카이브
          </CTButton>
          <CTButton
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => router.push('/notes/new')}
          >
            새 노트
          </CTButton>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <CTSearchBar
            placeholder="노트 제목, 내용 검색"
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

      {/* Notes Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <CTSpinner size="lg" />
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-ct-lg shadow-ct-1">
          <CTEmptyState
            icon={<BookOpenIcon className="w-16 h-16" />}
            title="말씀노트가 없습니다"
            description={
              filter.search
                ? '검색 결과가 없습니다. 다른 검색어를 시도해보세요.'
                : '첫 말씀노트를 작성해보세요. 설교 말씀을 기록하고 묵상해보세요.'
            }
            actionLabel="새 노트 작성"
            onAction={() => router.push('/notes/new')}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className="bg-white rounded-ct-lg shadow-ct-1 p-4 text-left hover:shadow-ct-2 transition-shadow w-full"
              >
                {/* Note Title */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-ct-md font-semibold text-[var(--ct-color-text-heading)] line-clamp-2">
                    {note.title || '제목 없음'}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    {note.audio_url && (
                      <MicrophoneIcon className="w-4 h-4 text-gray-400" />
                    )}
                    {note.is_shared && (
                      <ShareIcon className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                </div>

                {/* Sermon Info */}
                {note.sermons && (
                  <div className="mb-2">
                    <p className="text-ct-sm text-gray-600 truncate">
                      {note.sermons.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {note.sermons.service_type && (
                        <CTBadge
                          label={
                            SERVICE_TYPE_LABELS[
                              note.sermons.service_type as keyof typeof SERVICE_TYPE_LABELS
                            ] || note.sermons.service_type
                          }
                          color={
                            SERVICE_TYPE_COLORS[note.sermons.service_type] || 'gray'
                          }
                          size="sm"
                        />
                      )}
                      {note.sermons.preacher_name && (
                        <span className="text-ct-xs text-gray-400">
                          {note.sermons.preacher_name}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Preview */}
                <p className="text-ct-sm text-gray-500 line-clamp-2 mb-3">
                  {truncateContent(note.plain_text)}
                </p>

                {/* Verse Tags */}
                {note.detected_verses && note.detected_verses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.detected_verses.slice(0, 3).map((verse, idx) => (
                      <CTTag
                        key={idx}
                        label={verse}
                        color="blue"
                        size="sm"
                      />
                    ))}
                    {note.detected_verses.length > 3 && (
                      <CTTag
                        label={`+${note.detected_verses.length - 3}`}
                        color="gray"
                        size="sm"
                      />
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-1.5 text-ct-xs text-gray-400">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  <span>{formatNoteDate(note.created_at)}</span>
                  {note.is_shared && (
                    <>
                      <span className="mx-1">&middot;</span>
                      <span className="text-blue-500">공유됨</span>
                    </>
                  )}
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
