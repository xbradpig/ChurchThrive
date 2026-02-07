import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from '../../lib/cn';
import type { ReactNode } from 'react';

interface CTCardProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  actions?: ReactNode;
  onPress?: () => void;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingMap = { sm: 'p-3', md: 'p-4', lg: 'p-6' };

export function CTCard({ title, subtitle, children, actions, onPress, padding = 'md', className }: CTCardProps) {
  const content = (
    <View className={cn('bg-white rounded-xl shadow-sm', paddingMap[padding], className)}>
      {(title || subtitle) && (
        <View className="mb-3">
          {title && <Text className="text-base font-semibold text-gray-900">{title}</Text>}
          {subtitle && <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>}
        </View>
      )}
      {children}
      {actions && (
        <View className="mt-3 pt-3 border-t border-gray-100 flex-row items-center gap-2">
          {actions}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}
