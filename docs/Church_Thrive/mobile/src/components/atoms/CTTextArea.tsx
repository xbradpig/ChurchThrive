import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { cn } from '../../lib/cn';

interface CTTextAreaProps extends Omit<TextInputProps, 'className'> {
  isError?: boolean;
  showCount?: boolean;
  maxLength?: number;
  className?: string;
}

export function CTTextArea({
  isError,
  showCount,
  maxLength,
  value,
  className,
  ...props
}: CTTextAreaProps) {
  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <View>
      <TextInput
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={value}
        maxLength={maxLength}
        placeholderTextColor="#A0AEC0"
        className={cn(
          'w-full min-h-[100px] rounded-lg border bg-gray-50 px-3 py-2.5 text-base',
          isError ? 'border-ct-error' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {showCount && maxLength && (
        <Text className={cn(
          'text-xs mt-1 text-right',
          charCount > maxLength * 0.9 ? 'text-ct-error' : 'text-gray-400'
        )}>
          {charCount}/{maxLength}
        </Text>
      )}
    </View>
  );
}
