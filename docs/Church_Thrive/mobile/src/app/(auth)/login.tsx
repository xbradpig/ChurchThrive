import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase/client';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

type LoginMethod = 'email' | 'phone';

export default function LoginScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailLogin() {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('로그인 실패', error.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : error.message
        );
      }
      // Auth state change listener in _layout will handle navigation
    } catch {
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleKakaoLogin() {
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'churchthrive' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo: redirectUrl },
      });
      if (error) {
        Alert.alert('오류', '카카오 로그인에 실패했습니다.');
        return;
      }
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          const params = new URL(result.url).searchParams;
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        }
      }
    } catch {
      Alert.alert('오류', '카카오 로그인 중 오류가 발생했습니다.');
    }
  }

  async function handlePhoneOtp() {
    if (!phone) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+82${phone.replace(/^0/, '')}`,
      });
      if (error) {
        Alert.alert('오류', '인증번호 발송에 실패했습니다.');
        return;
      }
      Alert.alert('인증번호 발송', '입력하신 번호로 인증번호가 발송되었습니다.');
      // Navigate to OTP screen (simplified)
    } catch {
      Alert.alert('오류', '인증번호 발송 중 오류가 발생했습니다.');
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
          {/* Logo */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-ct-primary">ChurchThrive</Text>
            <Text className="text-sm text-gray-500 mt-2">
              교회의 건강한 성장을 돕는 올인원 플랫폼
            </Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            {/* Method Tabs */}
            <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
              {(['email', 'phone'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMethod(m)}
                  className={`flex-1 py-2.5 rounded-lg items-center ${
                    method === m ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    method === m ? 'text-ct-primary' : 'text-gray-500'
                  }`}>
                    {m === 'email' ? '이메일' : '전화번호'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Email Login */}
            {method === 'email' && (
              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1.5">이메일</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="h-12 px-3 border border-gray-300 rounded-lg text-base"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1.5">비밀번호</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="8자 이상"
                    secureTextEntry
                    className="h-12 px-3 border border-gray-300 rounded-lg text-base"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleEmailLogin}
                  disabled={isLoading}
                  className={`h-12 rounded-lg items-center justify-center ${
                    isLoading ? 'bg-gray-300' : 'bg-ct-primary'
                  }`}
                >
                  <Text className="text-white font-semibold text-base">
                    {isLoading ? '로그인 중...' : '로그인'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Phone Login */}
            {method === 'phone' && (
              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1.5">전화번호</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="010-1234-5678"
                    keyboardType="phone-pad"
                    className="h-12 px-3 border border-gray-300 rounded-lg text-base"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>
                <TouchableOpacity
                  onPress={handlePhoneOtp}
                  disabled={isLoading}
                  className={`h-12 rounded-lg items-center justify-center ${
                    isLoading ? 'bg-gray-300' : 'bg-ct-primary'
                  }`}
                >
                  <Text className="text-white font-semibold text-base">
                    {isLoading ? '발송 중...' : '인증번호 받기'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="text-xs text-gray-400 mx-3">또는</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Kakao Login */}
            <TouchableOpacity
              onPress={handleKakaoLogin}
              className="h-12 bg-[#FEE500] rounded-lg flex-row items-center justify-center"
            >
              <Text className="text-[#191919] font-semibold text-base ml-2">
                카카오 로그인
              </Text>
            </TouchableOpacity>
          </View>

          {/* Links */}
          <View className="items-center mt-6 gap-2">
            <TouchableOpacity>
              <Text className="text-sm text-gray-500">비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-sm text-gray-500">
                아직 회원이 아니신가요? <Text className="text-ct-primary font-medium">회원가입</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
