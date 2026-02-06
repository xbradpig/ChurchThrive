import { View, Text } from 'react-native';
import { cn } from '../../lib/cn';
import type { ReactNode } from 'react';

interface CTFormFieldProps {
  label?: string;
  isRequired?: boolean;
  helperText?: string;
  errorMessage?: string;
  children: ReactNode;
  className?: string;
}

export function CTFormField({ label, isRequired, helperText, errorMessage, children, className }: CTFormFieldProps) {
  return (
    <View className={cn('gap-1.5', className)}>
      {label && (
        <Text className="text-sm font-medium text-gray-700">
          {label}
          {isRequired && <Text className="text-ct-error"> *</Text>}
        </Text>
      )}
      {children}
      {errorMessage ? (
        <Text className="text-xs text-ct-error">{errorMessage}</Text>
      ) : helperText ? (
        <Text className="text-xs text-gray-400">{helperText}</Text>
      ) : null}
    </View>
  );
}
