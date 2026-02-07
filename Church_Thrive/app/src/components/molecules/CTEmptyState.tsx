import type { ReactNode } from 'react';
import { CTButton } from '../atoms/CTButton';

interface CTEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function CTEmptyState({ icon, title, description, actionLabel, onAction }: CTEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="w-16 h-16 mb-4 text-gray-300">{icon}</div>}
      <h3 className="text-ct-md font-medium text-gray-600">{title}</h3>
      {description && <p className="text-ct-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <CTButton variant="primary" size="md" onClick={onAction} className="mt-4">
          {actionLabel}
        </CTButton>
      )}
    </div>
  );
}
