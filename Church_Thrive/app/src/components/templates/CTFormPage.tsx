import type { ReactNode } from 'react';
import { CTButton } from '../atoms/CTButton';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface CTFormPageProps {
  title: string;
  onBack?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  children: ReactNode;
}

export function CTFormPage({ title, onBack, onSubmit, isSubmitting, submitLabel = '저장', children }: CTFormPageProps) {
  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-ct-md hover:bg-gray-100">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">{title}</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-ct-lg shadow-ct-1 p-6">
        {children}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        {onBack && (
          <CTButton variant="ghost" onClick={onBack}>취소</CTButton>
        )}
        <CTButton variant="primary" isLoading={isSubmitting} onClick={onSubmit}>
          {submitLabel}
        </CTButton>
      </div>
    </div>
  );
}
