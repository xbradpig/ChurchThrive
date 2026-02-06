import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '../../../../lib/supabase/client';
import { useAuthStore } from '../../../../stores/authStore';
import { CTSearchBar } from '../../../../components/molecules/CTSearchBar';
import { CTSpinner } from '../../../../components/atoms/CTSpinner';
import { CTEmptyState } from '../../../../components/molecules/CTEmptyState';
import { CTButton } from '../../../../components/atoms/CTButton';
import { CTInput } from '../../../../components/atoms/CTInput';
import { CTFormField } from '../../../../components/molecules/CTFormField';
import { CTBottomSheet } from '../../../../components/organisms/CTBottomSheet';

interface CellGroup {
  id: string;
  church_id: string;
  name: string;
  leader_id: string | null;
  leader_name: string | null;
  description: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
  member_count: number;
  created_at: string;
}

const DAY_OPTIONS = [
  { key: 'monday', label: '월' },
  { key: 'tuesday', label: '화' },
  { key: 'wednesday', label: '수' },
  { key: 'thursday', label: '목' },
  { key: 'friday', label: '금' },
  { key: 'saturday', label: '토' },
  { key: 'sunday', label: '일' },
];

const DAY_LABELS: Record<string, string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일',
};

export default function CellGroupsScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [groups, setGroups] = useState<CellGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMeetingDay, setNewMeetingDay] = useState('');
  const [newMeetingTime, setNewMeetingTime] = useState('');
  const [newMeetingLocation, setNewMeetingLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!member?.church_id) return;
    try {
      let query = supabase
        .from('cell_groups')
        .select('*, members!cell_groups_leader_id_fkey(name)')
        .eq('church_id', member.church_id)
        .order('name', { ascending: true });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: CellGroup[] = (data ?? []).map((item: any) => ({
        ...item,
        leader_name: item.members?.name ?? null,
      }));
      setGroups(mapped);
    } catch (err) {
      console.error('Failed to fetch cell groups:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [member?.church_id, search]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  function resetForm() {
    setNewName('');
    setNewDescription('');
    setNewMeetingDay('');
    setNewMeetingTime('');
    setNewMeetingLocation('');
  }

  async function handleAddGroup() {
    if (!newName.trim()) {
      Alert.alert('오류', '그룹 이름을 입력해주세요.');
      return;
    }
    if (!member?.church_id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('cell_groups').insert({
        church_id: member.church_id,
        name: newName.trim(),
        description: newDescription.trim() || null,
        meeting_day: newMeetingDay || null,
        meeting_time: newMeetingTime || null,
        meeting_location: newMeetingLocation.trim() || null,
      });

      if (error) throw error;

      resetForm();
      setIsSheetOpen(false);
      fetchGroups();
    } catch {
      Alert.alert('오류', '그룹 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderGroup = useCallback(
    ({ item }: { item: CellGroup }) => (
      <TouchableOpacity
        onPress={() =>
          router.push(`/(tabs)/admin/cell-groups/${item.id}` as any)
        }
        className="bg-white mx-4 mb-3 rounded-xl p-4 shadow-sm"
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-base font-semibold text-gray-900 flex-1">
            {item.name}
          </Text>
          <View className="bg-ct-primary-50 rounded-full px-2 py-0.5">
            <Text className="text-xs font-medium text-ct-primary">
              {item.member_count ?? 0}명
            </Text>
          </View>
        </View>

        {item.leader_name && (
          <View className="flex-row items-center gap-1.5 mb-1">
            <Text className="text-xs text-gray-400">리더</Text>
            <Text className="text-sm text-gray-700">{item.leader_name}</Text>
          </View>
        )}

        {(item.meeting_day || item.meeting_time) && (
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs text-gray-400">모임</Text>
            <Text className="text-sm text-gray-600">
              {item.meeting_day
                ? DAY_LABELS[item.meeting_day] ?? item.meeting_day
                : ''}
              {item.meeting_time ? ` ${item.meeting_time}` : ''}
            </Text>
          </View>
        )}

        {item.meeting_location && (
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <Text className="text-xs text-gray-400">장소</Text>
            <Text className="text-sm text-gray-600">
              {item.meeting_location}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [router]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '구역/셀 그룹',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setIsSheetOpen(true)}
              className="mr-2"
            >
              <Text className="text-ct-primary font-semibold text-base">
                + 추가
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-3 pb-2 bg-white">
          <CTSearchBar
            placeholder="그룹 검색"
            onSearch={setSearch}
            onChange={setSearch}
          />
        </View>

        {isLoading ? (
          <CTSpinner className="flex-1 mt-12" />
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroup}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchGroups();
                }}
                tintColor="#228B22"
              />
            }
            ListEmptyComponent={
              <CTEmptyState
                title={
                  search ? '검색 결과가 없습니다' : '구역/셀 그룹이 없습니다'
                }
                description="새 그룹을 만들어보세요"
                actionLabel="그룹 추가"
                onAction={() => setIsSheetOpen(true)}
              />
            }
          />
        )}
      </View>

      {/* Add Group Bottom Sheet */}
      <CTBottomSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          resetForm();
        }}
        title="그룹 추가"
      >
        <View className="gap-4">
          <CTFormField label="그룹 이름" isRequired>
            <CTInput
              placeholder="예: 1구역, 사랑셀"
              value={newName}
              onChangeText={setNewName}
            />
          </CTFormField>

          <CTFormField label="설명">
            <CTInput
              placeholder="그룹 설명 (선택)"
              value={newDescription}
              onChangeText={setNewDescription}
            />
          </CTFormField>

          <CTFormField label="정기 모임일">
            <View className="flex-row flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => {
                const isSelected = newMeetingDay === day.key;
                return (
                  <TouchableOpacity
                    key={day.key}
                    onPress={() =>
                      setNewMeetingDay(isSelected ? '' : day.key)
                    }
                    className={`w-10 h-10 rounded-full items-center justify-center border ${
                      isSelected
                        ? 'bg-ct-primary border-ct-primary'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CTFormField>

          <CTFormField label="모임 시간">
            <CTInput
              placeholder="예: 오후 7:30"
              value={newMeetingTime}
              onChangeText={setNewMeetingTime}
            />
          </CTFormField>

          <CTFormField label="모임 장소">
            <CTInput
              placeholder="예: 교육관 301호"
              value={newMeetingLocation}
              onChangeText={setNewMeetingLocation}
            />
          </CTFormField>

          <CTButton
            fullWidth
            onPress={handleAddGroup}
            isLoading={isSubmitting}
          >
            추가하기
          </CTButton>
        </View>
      </CTBottomSheet>
    </>
  );
}
