import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase/client';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    if (password !== passwordConfirm) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('오류', '비밀번호는 8자 이상 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) {
        Alert.alert('오류', error.message);
        return;
      }

      router.push('/(auth)/church-search');
    } catch {
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center p-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-ct-primary">ChurchThrive</Text>
          </View>

          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-xl font-semibold text-center mb-6">회원가입</Text>

            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5">이름 *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="홍길동"
                  className="h-12 px-3 border border-gray-300 rounded-lg text-base"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5">이메일 *</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="h-12 px-3 border border-gray-300 rounded-lg text-base"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5">비밀번호 *</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="8자 이상, 영문+숫자"
                  secureTextEntry
                  className="h-12 px-3 border border-gray-300 rounded-lg text-base"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5">비밀번호 확인 *</Text>
                <TextInput
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  placeholder="비밀번호 재입력"
                  secureTextEntry
                  className="h-12 px-3 border border-gray-300 rounded-lg text-base"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              <TouchableOpacity
                onPress={handleRegister}
                disabled={isLoading}
                className={`h-12 rounded-lg items-center justify-center ${
                  isLoading ? 'bg-gray-300' : 'bg-ct-primary'
                }`}
              >
                <Text className="text-white font-semibold text-base">
                  {isLoading ? '가입 중...' : '다음: 교회 선택'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            className="items-center mt-4"
          >
            <Text className="text-sm text-gray-500">
              이미 계정이 있으신가요? <Text className="text-ct-primary font-medium">로그인</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
