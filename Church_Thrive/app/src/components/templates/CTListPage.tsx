import type { ReactNode } from 'react';
import { CTSearchBar } from '../molecules/CTSearchBar';
import { CTButton } from '../atoms/CTButton';
import { PlusIcon } from '@heroicons/react/24/outline';

interface CTListPageProps {
  title: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  onAdd?: () => void;
  addLabel?: string;
  filters?: ReactNode;
  children: ReactNode;
  emptyState?: ReactNode;
  isLoading?: boolean;
}

export function CTListPage({
  title,
  onSearch,
  searchPlaceholder,
  onAdd,
  addLabel = '추가',
  filters,
  children,
}: CTListPageProps) {
  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">{title}</h1>
        {onAdd && (
          <CTButton variant="primary" size="md" leftIcon={<PlusIcon />} onClick={onAdd}>
            {addLabel}
          </CTButton>
        )}
      </div>

      {/* Search & Filters */}
      {onSearch && (
        <div className="mb-4">
          <CTSearchBar placeholder={searchPlaceholder} onSearch={onSearch} />
        </div>
      )}
      {filters && <div className="mb-4">{filters}</div>}

      {/* Content */}
      <div className="bg-white rounded-ct-lg shadow-ct-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
