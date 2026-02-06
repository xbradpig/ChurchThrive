import { View } from 'react-native';
import { cn } from '../../lib/cn';

interface CTSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function CTSkeleton({ className, variant = 'text' }: CTSkeletonProps) {
  return (
    <View className={cn(
      'bg-gray-200',
      variant === 'circular' && 'rounded-full w-10 h-10',
      variant === 'text' && 'rounded-lg h-4 w-full',
      variant === 'rectangular' && 'rounded-lg h-20 w-full',
      className
    )} />
  );
}
