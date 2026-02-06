import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../stores/authStore';
import { CTSpinner } from '../../../components/atoms/CTSpinner';
import { CTButton } from '../../../components/atoms/CTButton';
import { CTSearchBar } from '../../../components/molecules/CTSearchBar';
import { CTEmptyState } from '../../../components/molecules/CTEmptyState';
import { cn } from '../../../lib/cn';

// ─── Types ────────────────────────────────────────────────────────────
interface AttendanceMember {
  id: string;
  name: string;
  photo_url: string | null;
  position: string | null;
  isPresent: boolean;
}

const EVENT_TYPES = [
  { key: 'worship', label: '주일오전' },
  { key: 'meeting', label: '주일오후' },
  { key: 'training', label: '수요예배' },
  { key: 'cell_group', label: '금요예배' },
  { key: 'other', label: '새벽예배' },
];

const POSITION_LABELS: Record<string, string> = {
  elder: '장로',
  ordained_deacon: '안수집사',
  deacon: '집사',
  saint: '성도',
};

// ─── Helpers ──────────────────────────────────────────────────────────
function formatDateKR(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = days[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Component ────────────────────────────────────────────────────────
export default function AttendanceScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState('worship');
  const [members, setMembers] = useState<AttendanceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Fetch Data ─────────────────────────────────────────────────────
  const fetchAttendanceData = useCallback(async () => {
    if (!member?.church_id) return;
    setIsLoading(true);
    try {
      // Fetch all active members
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, name, photo_url, position')
        .eq('church_id', member.church_id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (memberError) throw memberError;

      // Fetch existing attendance for this date/event
      const dateStr = toDateString(selectedDate);
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendances')
        .select('member_id')
        .eq('church_id', member.church_id)
        .eq('event_date', dateStr)
        .eq('event_type', selectedEvent);

      if (attendanceError) throw attendanceError;

      const presentIds = new Set(
        (attendanceData ?? []).map((a) => a.member_id)
      );

      const mappedMembers: AttendanceMember[] = (memberData ?? []).map(
        (m: any) => ({
          id: m.id,
          name: m.name,
          photo_url: m.photo_url,
          position: m.position,
          isPresent: presentIds.has(m.id),
        })
      );

      setMembers(mappedMembers);
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [member?.church_id, selectedDate, selectedEvent]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // ─── Handlers ───────────────────────────────────────────────────────
  function shiftDate(days: number) {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  }

  function toggleMember(memberId: string) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, isPresent: !m.isPresent } : m
      )
    );
  }

  function selectAll() {
    setMembers((prev) => prev.map((m) => ({ ...m, isPresent: true })));
  }

  function deselectAll() {
    setMembers((prev) => prev.map((m) => ({ ...m, isPresent: false })));
  }

  async function handleSave() {
    if (!member?.church_id) return;

    const presentMembers = members.filter((m) => m.isPresent);

    Alert.alert(
      '출석 저장',
      `출석 ${presentMembers.length}명 / 전체 ${members.length}명\n저장하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '저장',
          onPress: async () => {
            setIsSaving(true);
            try {
              const dateStr = toDateString(selectedDate);

              // Delete existing records for this date/event
              await supabase
                .from('attendances')
                .delete()
                .eq('church_id', member.church_id)
                .eq('event_date', dateStr)
                .eq('event_type', selectedEvent);

              // Insert present members
              if (presentMembers.length > 0) {
                const records = presentMembers.map((m) => ({
                  church_id: member.church_id,
                  member_id: m.id,
                  event_date: dateStr,
                  event_type: selectedEvent,
                  check_method: 'manual' as const,
                }));

                const { error } = await supabase
                  .from('attendances')
                  .insert(records);

                if (error) throw error;
              }

              Alert.alert('완료', '출석이 저장되었습니다.');
            } catch {
              Alert.alert('오류', '저장에 실패했습니다.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  }

  // ─── Filtered + Stats ──────────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, searchQuery]);

  const presentCount = members.filter((m) => m.isPresent).length;
  const totalCount = members.length;
  const percentage =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // ─── Render Member Row ──────────────────────────────────────────────
  const renderMember = useCallback(
    ({ item }: { item: AttendanceMember }) => (
      <TouchableOpacity
        onPress={() => toggleMember(item.id)}
        className={cn(
          'flex-row items-center gap-3 px-4 py-3 border-b border-gray-100',
          item.isPresent ? 'bg-green-50' : 'bg-white'
        )}
        activeOpacity={0.6}
        style={{ minHeight: 56 }}
      >
        {/* Checkbox */}
        <View
          className={cn(
            'w-6 h-6 rounded-md border-2 items-center justify-center',
            item.isPresent
              ? 'bg-ct-primary border-ct-primary'
              : 'border-gray-300 bg-white'
          )}
        >
          {item.isPresent && (
            <Text className="text-white text-xs font-bold">{'\u2713'}</Text>
          )}
        </View>

        {/* Name + Position */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-medium text-gray-800">{item.name}</Text>
            {item.position && (
              <Text className="text-xs text-gray-400">
                {POSITION_LABELS[item.position] || ''}
              </Text>
            )}
          </View>
        </View>

        {/* Status */}
        {item.isPresent && (
          <View className="bg-green-100 rounded-full px-2 py-0.5">
            <Text className="text-xs font-medium text-green-700">출석</Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    []
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '출석체크',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/admin/attendance-qr' as any)}
              className="mr-2"
              style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text className="text-ct-primary text-sm font-medium">QR</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-gray-50">
        {/* Date Picker */}
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => shiftDate(-1)}
              className="w-11 h-11 items-center justify-center rounded-full bg-gray-100"
            >
              <Text className="text-lg text-gray-600">{'\u276E'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedDate(new Date())}
              className="px-4 py-2"
            >
              <Text className="text-base font-semibold text-gray-900 text-center">
                {formatDateKR(selectedDate)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => shiftDate(1)}
              className="w-11 h-11 items-center justify-center rounded-full bg-gray-100"
            >
              <Text className="text-lg text-gray-600">{'\u276F'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Event Type Selector */}
        <View className="bg-white border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
          >
            {EVENT_TYPES.map((event) => {
              const isSelected = selectedEvent === event.key;
              return (
                <TouchableOpacity
                  key={event.key}
                  onPress={() => setSelectedEvent(event.key)}
                  className={cn(
                    'px-3.5 py-2 rounded-full border',
                    isSelected
                      ? 'bg-ct-primary border-ct-primary'
                      : 'bg-white border-gray-200'
                  )}
                  style={{ minHeight: 44 }}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-white' : 'text-gray-600'
                    )}
                  >
                    {event.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Search Bar */}
        <View className="bg-white px-4 py-2 border-b border-gray-100">
          <CTSearchBar
            placeholder="이름 검색"
            onSearch={(q) => setSearchQuery(q)}
          />
        </View>

        {/* Summary Bar */}
        <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
          <View className="flex-row items-center gap-3">
            <Text className="text-sm text-gray-600">
              출석{' '}
              <Text className="font-bold text-ct-primary">{presentCount}</Text>
              {' / '}
              {totalCount}명
            </Text>
            <View className="bg-gray-200 rounded-full h-2 w-24">
              <View
                className="bg-ct-primary rounded-full h-2"
                style={{ width: `${percentage}%` }}
              />
            </View>
            <Text className="text-sm font-semibold text-ct-primary">
              {percentage}%
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={selectAll}
              className="px-2.5 py-1.5 rounded-md bg-gray-100"
              style={{ minHeight: 36 }}
            >
              <Text className="text-xs text-gray-600">전체 출석</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={deselectAll}
              className="px-2.5 py-1.5 rounded-md bg-gray-100"
              style={{ minHeight: 36 }}
            >
              <Text className="text-xs text-gray-600">전체 초기화</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Member List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center pt-12">
            <CTSpinner />
          </View>
        ) : (
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item.id}
            renderItem={renderMember}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchAttendanceData();
                }}
                tintColor="#228B22"
              />
            }
            ListEmptyComponent={
              <CTEmptyState
                title={searchQuery ? '검색 결과가 없습니다' : '교인이 없습니다'}
                description={searchQuery ? '다른 검색어를 시도해보세요' : '교인을 먼저 등록해주세요'}
              />
            }
          />
        )}

        {/* Save Button (fixed bottom) */}
        {!isLoading && members.length > 0 && (
          <View className="bg-white px-4 py-3 border-t border-gray-200">
            <CTButton
              fullWidth
              onPress={handleSave}
              isLoading={isSaving}
            >
              출석 저장 ({presentCount}/{totalCount})
            </CTButton>
          </View>
        )}
      </View>
    </>
  );
}
