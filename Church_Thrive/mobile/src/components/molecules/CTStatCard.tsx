import { View, Text } from 'react-native';
import { cn } from '../../lib/cn';
import type { ReactNode } from 'react';

interface CTStatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  change?: { value: number; label?: string };
  className?: string;
}

export function CTStatCard({ label, value, icon, change, className }: CTStatCardProps) {
  return (
    <View className={cn('bg-white rounded-xl shadow-sm p-4', className)}>
      <View className="flex-row items-start justify-between">
        <Text className="text-xs text-gray-500">{label}</Text>
        {icon && <View>{icon}</View>}
      </View>
      <Text className="text-2xl font-bold mt-1 text-gray-900">{value}</Text>
      {change && (
        <Text className={cn('text-xs mt-1', change.value >= 0 ? 'text-ct-success' : 'text-ct-error')}>
          {change.value >= 0 ? '\u2191' : '\u2193'} {Math.abs(change.value)}%
          {change.label && <Text className="text-gray-400"> {change.label}</Text>}
        </Text>
      )}
    </View>
  );
}
