import { View, Text } from 'react-native';
import { cn } from '../../lib/cn';

type BadgeColor = 'green' | 'blue' | 'yellow' | 'red' | 'gray';

interface CTBadgeProps {
  label?: string;
  count?: number;
  color?: BadgeColor;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const colorStyles: Record<BadgeColor, { bg: string; text: string; dot: string }> = {
  green: { bg: 'bg-green-50', text: 'text-green-800', dot: 'bg-green-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-500' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  red: { bg: 'bg-red-50', text: 'text-red-800', dot: 'bg-red-500' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export function CTBadge({ label, count, color = 'gray', size = 'md', dot }: CTBadgeProps) {
  const styles = colorStyles[color];

  if (dot) {
    return <View className={cn('w-2 h-2 rounded-full', styles.dot)} />;
  }

  if (count !== undefined) {
    return (
      <View className={cn(
        'rounded-full items-center justify-center px-1.5',
        size === 'sm' ? 'h-5 min-w-[20px]' : 'h-6 min-w-[24px]',
        styles.bg
      )}>
        <Text className={cn('font-medium', size === 'sm' ? 'text-[10px]' : 'text-xs', styles.text)}>
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    );
  }

  return (
    <View className={cn(
      'flex-row items-center rounded-full px-2.5 gap-1',
      size === 'sm' ? 'h-6' : 'h-7',
      styles.bg
    )}>
      <View className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
      <Text className={cn('font-medium', size === 'sm' ? 'text-[11px]' : 'text-xs', styles.text)}>
        {label}
      </Text>
    </View>
  );
}
