import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../stores/authStore';
import { CTStatCard } from '../../../components/molecules/CTStatCard';

interface AdminMenuItem {
  key: string;
  title: string;
  subtitle: string;
  emoji: string;
  route: string;
  count: number | null;
}

export default function AdminHomeScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    weeklyAttendance: 0,
    attendanceRate: 0,
    newMembers: 0,
    announcementCount: 0,
    cellGroupCount: 0,
    orgCount: 0,
  });

  const fetchStats = useCallback(async () => {
    if (!member?.church_id) return;
    try {
      const [membersRes, announcementsRes, cellGroupsRes, orgsRes] = await Promise.all([
        supabase
          .from('members')
          .select('id, status, created_at', { count: 'exact' })
          .eq('church_id', member.church_id)
          .eq('status', 'active'),
        supabase
          .from('announcements')
          .select('id', { count: 'exact' })
          .eq('church_id', member.church_id)
          .eq('is_published', true),
        supabase
          .from('cell_groups')
          .select('id', { count: 'exact' })
          .eq('church_id', member.church_id),
        supabase
          .from('organizations')
          .select('id', { count: 'exact' })
          .eq('church_id', member.church_id),
      ]);

      const totalMembers = membersRes.count ?? 0;

      // Count new members from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newMembersCount = (membersRes.data ?? []).filter(
        (m) => new Date(m.created_at) >= thirtyDaysAgo
      ).length;

      // Fetch this week's attendance
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { count: attendanceCount } = await supabase
        .from('attendance_records')
        .select('id', { count: 'exact' })
        .eq('church_id', member.church_id)
        .eq('status', 'present')
        .gte('date', startOfWeek.toISOString().split('T')[0]);

      const weeklyAttendance = attendanceCount ?? 0;
      const attendanceRate = totalMembers > 0
        ? Math.round((weeklyAttendance / totalMembers) * 100)
        : 0;

      setStats({
        totalMembers,
        weeklyAttendance,
        attendanceRate,
        newMembers: newMembersCount,
        announcementCount: announcementsRes.count ?? 0,
        cellGroupCount: cellGroupsRes.count ?? 0,
        orgCount: orgsRes.count ?? 0,
      });
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [member?.church_id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const menuItems: AdminMenuItem[] = [
    {
      key: 'announcements',
      title: '공지사항',
      subtitle: '교회 공지 관리',
      emoji: '\uD83D\uDCE2',
      route: '/(tabs)/admin/announcements',
      count: stats.announcementCount,
    },
    {
      key: 'organizations',
      title: '조직도',
      subtitle: '부서 및 조직 관리',
      emoji: '\uD83C\uDFE2',
      route: '/(tabs)/admin/organizations',
      count: stats.orgCount,
    },
    {
      key: 'cell-groups',
      title: '구역/셀',
      subtitle: '구역 및 셀 그룹',
      emoji: '\uD83D\uDC65',
      route: '/(tabs)/admin/cell-groups',
      count: stats.cellGroupCount,
    },
    {
      key: 'attendance',
      title: '출석체크',
      subtitle: '예배 출석 관리',
      emoji: '\u2705',
      route: '/(tabs)/admin/attendance',
      count: null,
    },
    {
      key: 'positions',
      title: '직분관리',
      subtitle: '직분 배정 관리',
      emoji: '\uD83D\uDCCB',
      route: '/(tabs)/members',
      count: null,
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: '교회행정' }} />
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchStats();
            }}
            tintColor="#228B22"
          />
        }
      >
        {/* Quick Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}
        >
          <CTStatCard
            label="전체 교인"
            value={stats.totalMembers}
            className="w-[140px]"
          />
          <CTStatCard
            label="이번주 출석률"
            value={`${stats.attendanceRate}%`}
            className="w-[140px]"
          />
          <CTStatCard
            label="새가족 (30일)"
            value={stats.newMembers}
            className="w-[140px]"
          />
        </ScrollView>

        {/* Admin Menu Grid */}
        <View className="px-4 pt-6 pb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">관리 메뉴</Text>
          <View className="flex-row flex-wrap gap-3">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => router.push(item.route as any)}
                className="bg-white rounded-xl p-4 shadow-sm"
                style={{ width: '47%', minHeight: 110 }}
                activeOpacity={0.7}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <Text className="text-3xl">{item.emoji}</Text>
                  {item.count !== null && (
                    <View className="bg-ct-primary-50 rounded-full px-2 py-0.5">
                      <Text className="text-xs font-medium text-ct-primary">
                        {item.count}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-base font-semibold text-gray-900">
                  {item.title}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
