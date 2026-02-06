import { ActivityIndicator, View } from 'react-native';
import { cn } from '../../lib/cn';

interface CTSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function CTSpinner({ size = 'md', color = '#228B22', className }: CTSpinnerProps) {
  const rnSize = size === 'sm' ? 'small' : 'large';
  return (
    <View className={cn('items-center justify-center', className)}>
      <ActivityIndicator size={rnSize} color={color} />
    </View>
  );
}
