import { TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '../../lib/cn';
import type { ReactNode } from 'react';

interface CTInputProps extends Omit<TextInputProps, 'className'> {
  isError?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-12 px-3 text-base',
  lg: 'h-14 px-4 text-lg',
};

export function CTInput({
  isError,
  leftIcon,
  rightIcon,
  size = 'md',
  className,
  editable = true,
  ...props
}: CTInputProps) {
  return (
    <View className="relative">
      {leftIcon && (
        <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
          {leftIcon}
        </View>
      )}
      <TextInput
        editable={editable}
        placeholderTextColor="#A0AEC0"
        className={cn(
          'w-full rounded-lg border bg-gray-50',
          isError ? 'border-ct-error' : 'border-gray-300',
          !editable && 'opacity-60 bg-gray-100',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          sizeStyles[size],
          className
        )}
        {...props}
      />
      {rightIcon && (
        <View className="absolute right-3 top-0 bottom-0 justify-center">
          {rightIcon}
        </View>
      )}
    </View>
  );
}
