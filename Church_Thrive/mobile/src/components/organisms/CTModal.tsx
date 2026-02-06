import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import type { ReactNode } from 'react';

interface CTModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function CTModal({ isOpen, onClose, title, children, footer }: CTModalProps) {
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center p-4" onPress={onClose}>
        <Pressable className="bg-white rounded-2xl w-full max-w-md max-h-[80%]" onPress={(e) => e.stopPropagation()}>
          {title && (
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-gray-400 text-lg">&#10005;</Text>
              </TouchableOpacity>
            </View>
          )}
          <ScrollView className="px-6 py-4">{children}</ScrollView>
          {footer && (
            <View className="flex-row items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              {footer}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
