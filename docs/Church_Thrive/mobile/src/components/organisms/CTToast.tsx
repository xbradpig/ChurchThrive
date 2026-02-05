import { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { cn } from '../../lib/cn';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface CTToastProps {
  type: ToastType;
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const styleMap: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: 'bg-green-50', text: 'text-green-800', icon: '\u2713' },
  error: { bg: 'bg-red-50', text: 'text-red-800', icon: '\u2717' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-800', icon: '\u26A0' },
  info: { bg: 'bg-blue-50', text: 'text-blue-800', icon: '\u2139' },
};

export function CTToast({ type, message, visible, onDismiss, duration = 3000 }: CTToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, duration]);

  if (!visible) return null;

  const style = styleMap[type];

  return (
    <Animated.View
      style={{ opacity }}
      className={cn('absolute top-12 left-4 right-4 z-50 rounded-xl p-4 flex-row items-center gap-3 shadow-lg', style.bg)}
    >
      <Text className={cn('text-base', style.text)}>{style.icon}</Text>
      <Text className={cn('flex-1 text-sm', style.text)}>{message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <Text className="text-gray-400">&#10005;</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
