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
import { CTBadge } from '../../../../components/atoms/CTBadge';
import { CTEmptyState } from '../../../../components/molecules/CTEmptyState';
import { formatDate } from '@churchthrive/shared';

interface Announcement {
  id: string;
  church_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_published: boolean;
  target_groups: string[] | null;
  author_id: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    if (!member?.church_id) return;
    try {
      let query = supabase
        .from('announcements')
        .select('*, members!announcements_author_id_fkey(name)')
        .eq('church_id', member.church_id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: Announcement[] = (data ?? []).map((item: any) => ({
        ...item,
        author_name: item.members?.name ?? '알 수 없음',
      }));
      setAnnouncements(mapped);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [member?.church_id, search]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDelete = useCallback(
    (id: string, title: string) => {
      Alert.alert('삭제 확인', `"${title}" 공지를 삭제하시겠습니까?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);
              if (error) throw error;
              setAnnouncements((prev) => prev.filter((a) => a.id !== id));
            } catch {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]);
    },
    []
  );

  const renderAnnouncement = useCallback(
    ({ item }: { item: Announcement }) => (
      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/admin/announcements/${item.id}` as any)}
        className="bg-white px-4 py-3 border-b border-gray-100"
        activeOpacity={0.6}
        onLongPress={() => handleDelete(item.id, item.title)}
      >
        <View className="flex-row items-center gap-2 mb-1">
          {item.is_pinned && (
            <Text className="text-xs">
              {'\uD83D\uDCCC'}
            </Text>
          )}
          <Text
            className="text-base font-medium text-gray-800 flex-1"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View className="flex-row gap-1.5">
            {item.is_published ? (
              <CTBadge label="게시됨" color="green" size="sm" />
            ) : (
              <CTBadge label="미게시" color="gray" size="sm" />
            )}
          </View>
        </View>
        <Text
          className="text-sm text-gray-500 leading-5"
          numberOfLines={2}
        >
          {item.content}
        </Text>
        <View className="flex-row items-center mt-1.5 gap-2">
          <Text className="text-xs text-gray-400">
            {item.author_name}
          </Text>
          <Text className="text-xs text-gray-300">|</Text>
          <Text className="text-xs text-gray-400">
            {formatDate(item.created_at, 'relative')}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [router, handleDelete]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '공지사항',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/admin/announcements/new' as any)}
              className="mr-2"
            >
              <Text className="text-ct-primary font-semibold text-base">
                + 새 공지
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-3 pb-2 bg-white">
          <CTSearchBar
            placeholder="공지사항 검색"
            onSearch={setSearch}
            onChange={setSearch}
          />
        </View>

        {isLoading ? (
          <CTSpinner className="flex-1 mt-12" />
        ) : (
          <FlatList
            data={announcements}
            keyExtractor={(item) => item.id}
            renderItem={renderAnnouncement}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchAnnouncements();
                }}
                tintColor="#228B22"
              />
            }
            ListEmptyComponent={
              <CTEmptyState
                title={search ? '검색 결과가 없습니다' : '공지사항이 없습니다'}
                description="새 공지사항을 작성해보세요"
                actionLabel="공지 작성"
                onAction={() =>
                  router.push('/(tabs)/admin/announcements/new' as any)
                }
              />
            }
          />
        )}
      </View>
    </>
  );
}
