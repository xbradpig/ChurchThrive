import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../stores/authStore';
import { CTAvatar } from '../../components/atoms/CTAvatar';
import { CTBadge } from '../../components/atoms/CTBadge';
import { formatDate } from '@churchthrive/shared';

interface DashboardStats {
  noteCount: number;
  weeklyAttendance: boolean;
  newAnnouncementCount: number;
}

interface RecentAnnouncement {
  id: string;
  title: string;
  is_pinned: boolean;
  created_at: string;
}

interface RecentNote {
  id: string;
  title: string;
  created_at: string;
  audio_url: string | null;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { member, church } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    noteCount: 0,
    weeklyAttendance: false,
    newAnnouncementCount: 0,
  });
  const [announcements, setAnnouncements] = useState<RecentAnnouncement[]>([]);
  const [notes, setNotes] = useState<RecentNote[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!member?.church_id || !member?.id) return;
    try {
      const [notesRes, announcementsRes, attendanceRes] = await Promise.all([
        // My notes count
        supabase
          .from('sermon_notes')
          .select('id', { count: 'exact' })
          .eq('member_id', member.id),
        // Recent announcements
        supabase
          .from('announcements')
          .select('id, title, is_pinned, created_at')
          .eq('church_id', member.church_id)
          .eq('is_published', true)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5),
        // This week's attendance for me
        (() => {
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return supabase
            .from('attendance_records')
            .select('id')
            .eq('member_id', member.id)
            .eq('status', 'present')
            .gte('date', startOfWeek.toISOString().split('T')[0])
            .limit(1);
        })(),
      ]);

      // New announcements in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newAnnouncements = (announcementsRes.data ?? []).filter(
        (a) => new Date(a.created_at) >= sevenDaysAgo
      );

      setStats({
        noteCount: notesRes.count ?? 0,
        weeklyAttendance: (attendanceRes.data ?? []).length > 0,
        newAnnouncementCount: newAnnouncements.length,
      });

      setAnnouncements(
        (announcementsRes.data ?? []).slice(0, 3) as RecentAnnouncement[]
      );

      // Fetch recent notes
      const { data: recentNotes } = await supabase
        .from('sermon_notes')
        .select('id, title, created_at, audio_url')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setNotes((recentNotes as RecentNote[]) ?? []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [member?.church_id, member?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const quickActions = [
    {
      label: '말씀노트 작성',
      route: '/(tabs)/notes/new',
      emoji: '\uD83D\uDCDD',
      color: 'bg-green-50',
    },
    {
      label: '교인 검색',
      route: '/(tabs)/members',
      emoji: '\uD83D\uDD0D',
      color: 'bg-blue-50',
    },
    {
      label: '출석 체크',
      route: '/(tabs)/admin/attendance',
      emoji: '\u2705',
      color: 'bg-yellow-50',
    },
    {
      label: '공지사항',
      route: '/(tabs)/admin/announcements',
      emoji: '\uD83D\uDCE2',
      color: 'bg-red-50',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchDashboardData();
            }}
            tintColor="#228B22"
          />
        }
      >
        {/* Greeting Header */}
        <View className="flex-row items-center gap-3 px-4 pt-4 pb-2">
          <CTAvatar
            src={member?.photo_url}
            name={member?.name ?? ''}
            size="lg"
          />
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              안녕하세요, {member?.name ?? '사용자'}님
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {church?.name ?? '교회'}
            </Text>
          </View>
        </View>

        {/* Quick Stats - Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 10,
          }}
        >
          <View className="bg-white rounded-xl px-4 py-3 shadow-sm w-[120px]">
            <Text className="text-xs text-gray-500">내 노트</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-0.5">
              {stats.noteCount}
            </Text>
          </View>
          <View className="bg-white rounded-xl px-4 py-3 shadow-sm w-[120px]">
            <Text className="text-xs text-gray-500">이번주 출석</Text>
            <Text
              className={`text-2xl font-bold mt-0.5 ${
                stats.weeklyAttendance ? 'text-ct-primary' : 'text-gray-400'
              }`}
            >
              {stats.weeklyAttendance ? '\u2713' : '-'}
            </Text>
          </View>
          <View className="bg-white rounded-xl px-4 py-3 shadow-sm w-[120px]">
            <Text className="text-xs text-gray-500">새 공지</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-0.5">
              {stats.newAnnouncementCount}
            </Text>
          </View>
        </ScrollView>

        {/* Quick Actions Grid (2x2) */}
        <View className="px-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            바로가기
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.route}
                onPress={() => router.push(action.route as any)}
                className={`items-center gap-2 py-4 rounded-xl ${action.color}`}
                style={{ width: '47%', minHeight: 80 }}
                activeOpacity={0.7}
              >
                <Text className="text-2xl">{action.emoji}</Text>
                <Text className="text-sm font-medium text-gray-700">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Announcements */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-gray-900">
              최근 공지사항
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push('/(tabs)/admin/announcements' as any)
              }
            >
              <Text className="text-sm text-ct-primary">전체보기</Text>
            </TouchableOpacity>
          </View>

          {announcements.length === 0 ? (
            <View className="bg-white rounded-xl p-6 shadow-sm items-center">
              <Text className="text-sm text-gray-400">
                공지사항이 없습니다
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {announcements.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() =>
                    router.push(
                      `/(tabs)/admin/announcements/${item.id}` as any
                    )
                  }
                  className={`flex-row items-center px-4 py-3 ${
                    idx > 0 ? 'border-t border-gray-100' : ''
                  }`}
                  activeOpacity={0.6}
                  style={{ minHeight: 48 }}
                >
                  {item.is_pinned && (
                    <Text className="text-xs mr-1.5">{'\uD83D\uDCCC'}</Text>
                  )}
                  <Text
                    className="text-sm text-gray-800 flex-1 font-medium"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-xs text-gray-400 ml-2">
                    {formatDate(item.created_at, 'relative')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recent Notes */}
        <View className="px-4 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-gray-900">
              최근 말씀노트
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/notes' as any)}
            >
              <Text className="text-sm text-ct-primary">전체보기</Text>
            </TouchableOpacity>
          </View>

          {notes.length === 0 ? (
            <View className="bg-white rounded-xl p-6 shadow-sm items-center">
              <Text className="text-sm text-gray-400">
                아직 노트가 없습니다
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/notes/new' as any)}
                className="mt-2"
              >
                <Text className="text-sm text-ct-primary font-medium">
                  첫 노트 작성하기
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {notes.map((note, idx) => (
                <TouchableOpacity
                  key={note.id}
                  onPress={() =>
                    router.push(`/(tabs)/notes/${note.id}` as any)
                  }
                  className={`px-4 py-3 ${
                    idx > 0 ? 'border-t border-gray-100' : ''
                  }`}
                  activeOpacity={0.6}
                  style={{ minHeight: 48 }}
                >
                  <Text
                    className="text-sm font-medium text-gray-800"
                    numberOfLines={1}
                  >
                    {note.title}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {formatDate(note.created_at, 'relative')}
                    {note.audio_url && ' \u00B7 \uD83C\uDF99 녹음'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
