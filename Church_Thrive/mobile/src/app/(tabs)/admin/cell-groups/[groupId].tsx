import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../../../lib/supabase/client';
import { useAuthStore } from '../../../../stores/authStore';
import { CTSpinner } from '../../../../components/atoms/CTSpinner';
import { CTAvatar } from '../../../../components/atoms/CTAvatar';
import { CTBadge } from '../../../../components/atoms/CTBadge';
import { CTButton } from '../../../../components/atoms/CTButton';
import { CTEmptyState } from '../../../../components/molecules/CTEmptyState';
import { formatDate, POSITION_LABELS } from '@churchthrive/shared';
import type { Member } from '@churchthrive/shared';

interface CellGroupDetail {
  id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  leader_name: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
  member_count: number;
  created_at: string;
}

const DAY_LABELS: Record<string, string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일',
};

export default function CellGroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { member } = useAuthStore();
  const [group, setGroup] = useState<CellGroupDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGroupDetail = useCallback(async () => {
    if (!groupId) return;
    try {
      // Fetch group info
      const { data: groupData, error: groupError } = await supabase
        .from('cell_groups')
        .select('*, members!cell_groups_leader_id_fkey(name)')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      setGroup({
        ...groupData,
        leader_name: groupData.members?.name ?? null,
      } as CellGroupDetail);

      // Fetch group members
      const { data: memberData, error: memberError } = await supabase
        .from('cell_group_members')
        .select('member_id, members(*)')
        .eq('cell_group_id', groupId);

      if (memberError) throw memberError;

      const groupMembers = (memberData ?? [])
        .map((item: any) => item.members)
        .filter(Boolean) as Member[];

      setMembers(groupMembers);
    } catch (err) {
      console.error('Failed to fetch group detail:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetail();
  }, [fetchGroupDetail]);

  function handleDeleteGroup() {
    if (!group) return;
    Alert.alert(
      '그룹 삭제',
      `"${group.name}" 그룹을 삭제하시겠습니까?\n소속 교인들의 그룹 배정이 해제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('cell_groups')
                .delete()
                .eq('id', group.id);
              if (error) throw error;
              Alert.alert('완료', '그룹이 삭제되었습니다.', [
                { text: '확인', onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  }

  const renderMember = useCallback(
    ({ item }: { item: Member }) => {
      const isLeader = group?.leader_id === item.id;
      return (
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/members/${item.id}` as any)}
          className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100"
          activeOpacity={0.6}
        >
          <CTAvatar src={item.photo_url} name={item.name} size="md" />
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-medium text-gray-800">
                {item.name}
              </Text>
              {isLeader && (
                <CTBadge label="리더" color="green" size="sm" />
              )}
              {item.position && (
                <Text className="text-xs text-gray-400">
                  {POSITION_LABELS[
                    item.position as keyof typeof POSITION_LABELS
                  ] ?? ''}
                </Text>
              )}
            </View>
            {item.phone && (
              <Text className="text-sm text-gray-500 mt-0.5">
                {item.phone}
              </Text>
            )}
          </View>
          <Text className="text-gray-300 text-lg">{'>'}</Text>
        </TouchableOpacity>
      );
    },
    [router, group?.leader_id]
  );

  if (isLoading || !group) {
    return (
      <>
        <Stack.Screen options={{ title: '그룹 상세' }} />
        <CTSpinner className="flex-1 mt-20" />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: group.name }} />
      <View className="flex-1 bg-gray-50">
        {/* Group Info Header */}
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchGroupDetail();
              }}
              tintColor="#228B22"
            />
          }
        >
          <View className="bg-white p-4 mb-2">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {group.name}
            </Text>
            {group.description && (
              <Text className="text-sm text-gray-500 mb-3">
                {group.description}
              </Text>
            )}

            <View className="gap-2">
              {group.leader_name && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-gray-400 w-16">리더</Text>
                  <Text className="text-sm text-gray-700">
                    {group.leader_name}
                  </Text>
                </View>
              )}
              {(group.meeting_day || group.meeting_time) && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-gray-400 w-16">모임</Text>
                  <Text className="text-sm text-gray-700">
                    {group.meeting_day
                      ? DAY_LABELS[group.meeting_day] ?? group.meeting_day
                      : ''}
                    {group.meeting_time ? ` ${group.meeting_time}` : ''}
                  </Text>
                </View>
              )}
              {group.meeting_location && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-gray-400 w-16">장소</Text>
                  <Text className="text-sm text-gray-700">
                    {group.meeting_location}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-gray-400 w-16">인원</Text>
                <Text className="text-sm text-gray-700">
                  {members.length}명
                </Text>
              </View>
            </View>
          </View>

          {/* Member List */}
          <View className="bg-white">
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-base font-semibold text-gray-900">
                소속 교인 ({members.length})
              </Text>
            </View>
            {members.length === 0 ? (
              <CTEmptyState
                title="소속 교인이 없습니다"
                description="교인 관리에서 그룹을 배정해주세요"
              />
            ) : (
              members.map((m) => (
                <View key={m.id}>{renderMember({ item: m })}</View>
              ))
            )}
          </View>

          {/* Actions */}
          <View className="p-4 gap-3">
            <CTButton
              variant="danger"
              fullWidth
              onPress={handleDeleteGroup}
            >
              그룹 삭제
            </CTButton>
          </View>

          <View className="h-4" />
        </ScrollView>
      </View>
    </>
  );
}
