import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PendingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
      <View className="bg-white rounded-2xl p-8 items-center shadow-sm w-full">
        <View className="w-16 h-16 bg-ct-primary-50 rounded-full items-center justify-center mb-4">
          <Text className="text-2xl">&#x23F3;</Text>
        </View>
        <Text className="text-xl font-semibold mb-2">승인 대기 중</Text>
        <Text className="text-sm text-gray-500 text-center leading-relaxed">
          가입 요청이 접수되었습니다.{'\n'}
          교회 관리자의 승인 후{'\n'}
          서비스를 이용하실 수 있습니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}
