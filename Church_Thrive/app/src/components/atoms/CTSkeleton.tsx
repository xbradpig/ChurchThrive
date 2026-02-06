import { cn } from '@/lib/cn';

interface CTSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function CTSkeleton({ className, variant = 'text', width, height }: CTSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded-ct-md h-4',
        variant === 'rectangular' && 'rounded-ct-md',
        className
      )}
      style={{ width, height }}
    />
  );
}
