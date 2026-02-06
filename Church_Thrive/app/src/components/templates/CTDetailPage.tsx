import type { ReactNode } from 'react';
import { CTButton } from '../atoms/CTButton';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';

interface CTDetailPageProps {
  title: string;
  onBack?: () => void;
  onEdit?: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

export function CTDetailPage({ title, onBack, onEdit, actions, children }: CTDetailPageProps) {
  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-ct-md hover:bg-gray-100">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <CTButton variant="outline" size="md" leftIcon={<PencilIcon />} onClick={onEdit}>
              수정
            </CTButton>
          )}
          {actions}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
