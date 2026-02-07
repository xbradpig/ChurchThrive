import { useState, useCallback, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { cn } from '../../lib/cn';

interface CTSearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch?: (query: string) => void;
  onChange?: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function CTSearchBar({
  placeholder = '검색',
  value: controlledValue,
  onSearch,
  onChange,
  debounceMs = 300,
  className,
}: CTSearchBarProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback((text: string) => {
    setInternalValue(text);
    onChange?.(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch?.(text), debounceMs);
  }, [onChange, onSearch, debounceMs]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange?.('');
    onSearch?.('');
  }, [onChange, onSearch]);

  return (
    <View className={cn('relative', className)}>
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#A0AEC0"
        returnKeyType="search"
        onSubmitEditing={() => onSearch?.(value)}
        className="w-full h-11 pl-10 pr-10 bg-gray-50 rounded-full text-base border border-transparent"
      />
      {value ? (
        <TouchableOpacity
          onPress={handleClear}
          className="absolute right-3 top-3"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-gray-400">&#10005;</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
