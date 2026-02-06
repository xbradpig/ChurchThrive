import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from '../../lib/cn';
import type { ReactNode } from 'react';

interface CTListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  onPress?: () => void;
  isActive?: boolean;
  isDivided?: boolean;
  className?: string;
}

export function CTListItem({
  title,
  subtitle,
  meta,
  leftElement,
  rightElement,
  onPress,
  isActive,
  isDivided = true,
  className,
}: CTListItemProps) {
  const content = (
    <View className={cn(
      'flex-row items-center gap-3 px-4 py-3',
      isDivided && 'border-b border-gray-100',
      isActive && 'bg-ct-primary-50 border-l-[3px] border-l-ct-primary',
      className
    )}>
      {leftElement && <View className="shrink-0">{leftElement}</View>}
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-800" numberOfLines={1}>{title}</Text>
        {subtitle && <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>{subtitle}</Text>}
        {meta && <Text className="text-xs text-gray-400 mt-0.5">{meta}</Text>}
      </View>
      {rightElement && <View className="shrink-0">{rightElement}</View>}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.6}>{content}</TouchableOpacity>;
  }
  return content;
}
