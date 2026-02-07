'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMembers } from '@/hooks/useMembers';
import { CTSearchBar } from '@/components/molecules/CTSearchBar';
import { CTButton } from '@/components/atoms/CTButton';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTEmptyState } from '@/components/molecules/CTEmptyState';
import { formatPhone, POSITION_LABELS, ROLE_LABELS } from '@churchthrive/shared';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  QrCodeIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLORS: Record<string, 'green' | 'yellow' | 'gray' | 'blue'> = {
  active: 'green',
  pending: 'yellow',
  inactive: 'gray',
  transferred: 'blue',
};

const STATUS_LABELS: Record<string, string> = {
  active: '활동',
  pending: '대기',
  inactive: '비활동',
  transferred: '이적',
};

export default function MembersPage() {
  const router = useRouter();
  const { members, total, totalPages, isLoading, filter, updateFilter } = useMembers();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">교인 관리</h1>
          <p className="text-ct-sm text-gray-500 mt-1">전체 {total}명</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CTButton variant="outline" size="sm" leftIcon={<QrCodeIcon className="w-4 h-4" />} onClick={() => router.push('/members/qr')}>
            QR 등록
          </CTButton>
          <CTButton variant="outline" size="sm" leftIcon={<ArrowUpTrayIcon className="w-4 h-4" />} onClick={() => router.push('/members/import')}>
            엑셀 임포트
          </CTButton>
          <CTButton variant="primary" size="sm" leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => router.push('/members/new')}>
            교인 추가
          </CTButton>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <CTSearchBar
            placeholder="이름, 전화번호, 초성 검색 (예: ㅎㄱㄷ)"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-4 bg-white rounded-ct-lg shadow-ct-1">
          <CTSelect
            options={[
              { value: '', label: '전체 직분' },
              { value: 'elder', label: '장로' },
              { value: 'ordained_deacon', label: '안수집사' },
              { value: 'deacon', label: '집사' },
              { value: 'saint', label: '성도' },
            ]}
            value={filter.position || ''}
            onChange={(e) => updateFilter({ position: e.target.value || null })}
            size="sm"
          />
          <CTSelect
            options={[
              { value: '', label: '전체 역할' },
              { value: 'admin', label: '담임목사' },
              { value: 'pastor', label: '교역자' },
              { value: 'staff', label: '사무간사' },
              { value: 'leader', label: '사역리더' },
              { value: 'member', label: '교인' },
            ]}
            value={filter.role || ''}
            onChange={(e) => updateFilter({ role: e.target.value || null })}
            size="sm"
          />
          <CTSelect
            options={[
              { value: 'active', label: '활동' },
              { value: 'pending', label: '대기' },
              { value: 'inactive', label: '비활동' },
              { value: '', label: '전체 상태' },
            ]}
            value={filter.status || ''}
            onChange={(e) => updateFilter({ status: e.target.value || null })}
            size="sm"
          />
          <CTSelect
            options={[
              { value: 'name-asc', label: '이름순' },
              { value: 'joined_at-desc', label: '최근 등록순' },
              { value: 'created_at-desc', label: '최근 생성순' },
            ]}
            value={`${filter.sortBy}-${filter.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [string, 'asc' | 'desc'];
              updateFilter({ sortBy: sortBy as any, sortOrder });
            }}
            size="sm"
          />
        </div>
      )}

      {/* Member List */}
      <div className="bg-white rounded-ct-lg shadow-ct-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <CTSpinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <CTEmptyState
            title="교인이 없습니다"
            description={filter.search ? '검색 결과가 없습니다. 다른 검색어를 시도해보세요.' : '첫 교인을 등록해보세요.'}
            actionLabel="교인 추가"
            onAction={() => router.push('/members/new')}
          />
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_100px_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-ct-xs font-medium text-gray-500 uppercase">
              <span>이름</span>
              <span>전화번호</span>
              <span>직분</span>
              <span>역할</span>
              <span>상태</span>
            </div>

            {/* Member rows */}
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => router.push(`/members/${member.id}`)}
                className="w-full flex items-center gap-3 sm:grid sm:grid-cols-[1fr_120px_100px_100px_80px] sm:gap-4 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Name + Avatar */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CTAvatar src={member.photo_url} name={member.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-ct-md font-medium text-gray-800 truncate">{member.name}</p>
                    <p className="text-ct-xs text-gray-400 sm:hidden">{formatPhone(member.phone)}</p>
                  </div>
                </div>

                {/* Phone (desktop) */}
                <span className="hidden sm:block text-ct-sm text-gray-600">{formatPhone(member.phone)}</span>

                {/* Position */}
                <span className="hidden sm:block text-ct-sm text-gray-600">
                  {member.position ? POSITION_LABELS[member.position as keyof typeof POSITION_LABELS] : '-'}
                </span>

                {/* Role */}
                <span className="hidden sm:block text-ct-sm text-gray-600">
                  {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}
                </span>

                {/* Status */}
                <div className="sm:block">
                  <CTBadge
                    label={STATUS_LABELS[member.status] || member.status}
                    color={STATUS_COLORS[member.status] || 'gray'}
                    size="sm"
                  />
                </div>
              </button>
            ))}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-ct-sm text-gray-500">
              {((filter.page || 1) - 1) * (filter.pageSize || 20) + 1}-
              {Math.min((filter.page || 1) * (filter.pageSize || 20), total)}
              {' '}/ {total}명
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
    </div>
  );
}
