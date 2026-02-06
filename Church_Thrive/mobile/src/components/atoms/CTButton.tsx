import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { cn } from '../../lib/cn';
import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CTButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  onPress?: () => void;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: { container: 'bg-ct-primary', text: 'text-white' },
  secondary: { container: 'bg-ct-sky', text: 'text-white' },
  outline: { container: 'border border-ct-primary bg-transparent', text: 'text-ct-primary' },
  ghost: { container: 'bg-transparent', text: 'text-gray-700' },
  danger: { container: 'bg-ct-error', text: 'text-white' },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'h-8 px-3', text: 'text-sm' },
  md: { container: 'h-11 px-4', text: 'text-base' },
  lg: { container: 'h-12 px-6', text: 'text-lg' },
};

export function CTButton({
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth,
  onPress,
  children,
  className,
}: CTButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      className={cn(
        'flex-row items-center justify-center rounded-lg',
        vStyle.container,
        sStyle.container,
        fullWidth && 'w-full',
        isDisabled && 'opacity-60',
        className
      )}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? '#228B22' : '#FFFFFF'} />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={cn('font-semibold', vStyle.text, sStyle.text)}>
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
