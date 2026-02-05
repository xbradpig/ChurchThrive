import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import type { ReactNode } from 'react';

interface CTBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function CTBottomSheet({ isOpen, onClose, title, children }: CTBottomSheetProps) {
  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-2xl max-h-[80%]" onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {title && (
            <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100">
              <Text className="text-base font-semibold">{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text className="text-gray-400 text-lg">&#10005;</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="p-4">{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
