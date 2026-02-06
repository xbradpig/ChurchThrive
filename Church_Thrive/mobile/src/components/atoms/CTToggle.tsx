import { View, Text, Switch } from 'react-native';
import { cn } from '../../lib/cn';

interface CTToggleProps {
  isOn: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function CTToggle({ isOn, onChange, label, disabled, className }: CTToggleProps) {
  return (
    <View className={cn('flex-row items-center gap-2', disabled && 'opacity-60', className)}>
      <Switch
        value={isOn}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: '#CBD5E0', true: '#9AE6B4' }}
        thumbColor={isOn ? '#228B22' : '#FFFFFF'}
      />
      {label && <Text className="text-base text-gray-700">{label}</Text>}
    </View>
  );
}
