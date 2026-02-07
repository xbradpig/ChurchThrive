import { View, Text } from 'react-native';
import { CTButton } from '../atoms/CTButton';
import type { ReactNode } from 'react';

interface CTEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function CTEmptyState({ icon, title, description, actionLabel, onAction }: CTEmptyStateProps) {
  return (
    <View className="items-center justify-center py-12 px-4">
      {icon && <View className="w-16 h-16 mb-4">{icon}</View>}
      <Text className="text-base font-medium text-gray-600">{title}</Text>
      {description && <Text className="text-sm text-gray-400 mt-1 text-center max-w-[280px]">{description}</Text>}
      {actionLabel && onAction && (
        <View className="mt-4">
          <CTButton variant="primary" size="md" onPress={onAction}>{actionLabel}</CTButton>
        </View>
      )}
    </View>
  );
}
