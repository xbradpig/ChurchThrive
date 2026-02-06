import { View, Text, Image } from 'react-native';
import { cn } from '../../lib/cn';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CTAvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { container: string; text: string; px: number }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', px: 24 },
  sm: { container: 'w-8 h-8', text: 'text-xs', px: 32 },
  md: { container: 'w-10 h-10', text: 'text-sm', px: 40 },
  lg: { container: 'w-12 h-12', text: 'text-base', px: 48 },
  xl: { container: 'w-16 h-16', text: 'text-xl', px: 64 },
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 2) : parts.map(p => p[0]).join('').slice(0, 2);
}

export function CTAvatar({ src, name = '', size = 'md', className }: CTAvatarProps) {
  const { container, text, px } = sizeMap[size];

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        className={cn('rounded-full', container, className)}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <View className={cn(
      'rounded-full items-center justify-center bg-ct-primary-100',
      container,
      className
    )}>
      <Text className={cn('font-medium text-ct-primary-700', text)}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
