import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from '../../lib/cn';

type TagColor = 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple';

interface CTTagProps {
  label: string;
  color?: TagColor;
  size?: 'sm' | 'md';
  isSelected?: boolean;
  isRemovable?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}

const colorStyles: Record<TagColor, string> = {
  green: 'bg-green-50 border-green-200',
  blue: 'bg-blue-50 border-blue-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  red: 'bg-red-50 border-red-200',
  gray: 'bg-gray-50 border-gray-200',
  purple: 'bg-purple-50 border-purple-200',
};

const textColors: Record<TagColor, string> = {
  green: 'text-green-700',
  blue: 'text-blue-700',
  yellow: 'text-yellow-700',
  red: 'text-red-700',
  gray: 'text-gray-700',
  purple: 'text-purple-700',
};

export function CTTag({ label, color = 'gray', size = 'md', isSelected, isRemovable, onPress, onRemove }: CTTagProps) {
  const content = (
    <View className={cn(
      'flex-row items-center rounded-full border px-2.5 gap-1',
      size === 'sm' ? 'h-6' : 'h-7',
      isSelected ? 'bg-ct-primary-50 border-ct-primary' : colorStyles[color]
    )}>
      {isSelected && <Text className="text-ct-primary text-xs">&#10003;</Text>}
      <Text className={cn(
        'font-medium',
        size === 'sm' ? 'text-[11px]' : 'text-xs',
        isSelected ? 'text-ct-primary' : textColors[color]
      )}>
        {label}
      </Text>
      {isRemovable && (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-gray-400 text-xs ml-0.5">&#10005;</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }

  return content;
}
