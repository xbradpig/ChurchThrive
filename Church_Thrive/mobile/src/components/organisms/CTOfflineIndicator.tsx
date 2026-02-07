import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export function CTOfflineIndicator() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View className="bg-yellow-500 py-1.5 items-center">
      <Text className="text-white text-sm font-medium">
        오프라인 상태입니다
      </Text>
    </View>
  );
}
