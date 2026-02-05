import { cn } from '@/lib/cn';
import { getInitials } from '@churchthrive/shared';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CTAvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]' },
  sm: { container: 'w-8 h-8', text: 'text-ct-xs' },
  md: { container: 'w-10 h-10', text: 'text-ct-sm' },
  lg: { container: 'w-12 h-12', text: 'text-ct-md' },
  xl: { container: 'w-16 h-16', text: 'text-ct-xl' },
};

export function CTAvatar({ src, name = '', size = 'md', className }: CTAvatarProps) {
  const { container, text } = sizeMap[size];
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', container, className)}
      />
    );
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center bg-ct-primary-100 text-ct-primary-700 font-medium',
      container,
      text,
      className
    )}>
      {initials}
    </div>
  );
}
