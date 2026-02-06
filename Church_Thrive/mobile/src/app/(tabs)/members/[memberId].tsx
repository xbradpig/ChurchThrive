import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import { CTAvatar } from '../../../components/atoms/CTAvatar';
import { CTBadge } from '../../../components/atoms/CTBadge';
import { CTButton } from '../../../components/atoms/CTButton';
import { CTCard } from '../../../components/molecules/CTCard';
import { CTSpinner } from '../../../components/atoms/CTSpinner';
import { formatPhone, formatDate, POSITION_LABELS, ROLE_LABELS, GENDER_LABELS } from '@churchthrive/shared';
import type { Member } from '@churchthrive/shared';

export default function MemberDetailScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();
      setMember(data);
      setIsLoading(false);
    }
    load();
  }, [memberId]);

  if (isLoading || !member) {
    return <CTSpinner className="flex-1 mt-20" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: member.name }} />
      <ScrollView className="flex-1 bg-gray-50 p-4">
        {/* Profile */}
        <CTCard padding="lg" className="mb-4">
          <View className="items-center">
            <CTAvatar src={member.photo_url} name={member.name} size="xl" />
            <Text className="text-2xl font-bold mt-3">{member.name}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              {member.position && (
                <Text className="text-sm text-gray-500">
                  {POSITION_LABELS[member.position as keyof typeof POSITION_LABELS]}
                </Text>
              )}
              <CTBadge
                label={member.status === 'active' ? '활동' : '대기'}
                color={member.status === 'active' ? 'green' : 'yellow'}
                size="sm"
              />
            </View>
          </View>

          <View className="mt-4 gap-2">
            <InfoRow label="전화번호" value={formatPhone(member.phone)} />
            {member.email && <InfoRow label="이메일" value={member.email} />}
            {member.address && <InfoRow label="주소" value={member.address} />}
            {member.gender && <InfoRow label="성별" value={GENDER_LABELS[member.gender as keyof typeof GENDER_LABELS]} />}
            {member.birth_date && <InfoRow label="생년월일" value={formatDate(member.birth_date)} />}
            {member.baptism_date && <InfoRow label="세례일" value={formatDate(member.baptism_date)} />}
            <InfoRow label="역할" value={ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]} />
          </View>
        </CTCard>

        <CTButton
          variant="outline"
          fullWidth
          onPress={() => router.push(`/(tabs)/members/${memberId}/edit` as any)}
        >
          정보 수정
        </CTButton>

        <Text className="text-xs text-gray-400 text-center mt-4">
          등록일: {member.joined_at ? formatDate(member.joined_at) : formatDate(member.created_at)}
        </Text>
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-100">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm text-gray-800 font-medium">{value}</Text>
    </View>
  );
}
