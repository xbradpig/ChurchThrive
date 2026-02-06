import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../stores/authStore';
import { CTFormField } from '../../../components/molecules/CTFormField';
import { CTInput } from '../../../components/atoms/CTInput';
import { CTButton } from '../../../components/atoms/CTButton';

export default function NewMemberScreen() {
  const router = useRouter();
  const { member: currentMember } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name || name.length < 2) {
      Alert.alert('오류', '이름을 2자 이상 입력해주세요.');
      return;
    }
    if (!phone) {
      Alert.alert('오류', '전화번호를 입력해주세요.');
      return;
    }
    if (!currentMember?.church_id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('members').insert({
        church_id: currentMember.church_id,
        name,
        phone,
        email: email || null,
        role: 'member',
        status: 'active',
      });

      if (error) {
        Alert.alert('오류', '교인 등록에 실패했습니다.');
        return;
      }

      Alert.alert('완료', '교인이 등록되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('오류', '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: '교인 등록' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 bg-gray-50 p-4" keyboardShouldPersistTaps="handled">
          <View className="bg-white rounded-xl p-4 gap-4 shadow-sm">
            <CTFormField label="이름" isRequired>
              <CTInput
                placeholder="홍길동"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </CTFormField>

            <CTFormField label="전화번호" isRequired>
              <CTInput
                placeholder="010-1234-5678"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </CTFormField>

            <CTFormField label="이메일">
              <CTInput
                placeholder="email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </CTFormField>
          </View>

          <View className="mt-6 gap-3">
            <CTButton variant="primary" fullWidth isLoading={isSubmitting} onPress={handleSubmit}>
              등록
            </CTButton>
            <CTButton variant="ghost" fullWidth onPress={() => router.back()}>
              취소
            </CTButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
