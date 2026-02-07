import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../../../lib/supabase/client';
import { useAuthStore } from '../../../../stores/authStore';
import { CTSpinner } from '../../../../components/atoms/CTSpinner';
import { CTBadge } from '../../../../components/atoms/CTBadge';
import { CTTag } from '../../../../components/atoms/CTTag';
import { CTButton } from '../../../../components/atoms/CTButton';
import { formatDate } from '@churchthrive/shared';

const TARGET_GROUP_LABELS: Record<string, string> = {
  all: '전체',
  youth: '청년부',
  adult: '장년부',
  children: '교회학교',
  women: '여전도회',
  men: '남선교회',
  choir: '성가대',
  deacons: '집사회',
  elders: '장로회',
};

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

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { member } = useAuthStore();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*, members!announcements_author_id_fkey(name)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setAnnouncement({
          ...data,
          author_name: data.members?.name ?? '알 수 없음',
        } as Announcement);
      } catch (err) {
        console.error('Failed to load announcement:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  function handleDelete() {
    if (!announcement) return;
    Alert.alert('삭제 확인', `"${announcement.title}" 공지를 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('announcements')
              .delete()
              .eq('id', announcement.id);
            if (error) throw error;
            Alert.alert('완료', '공지사항이 삭제되었습니다.', [
              { text: '확인', onPress: () => router.back() },
            ]);
          } catch {
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  }

  async function handleTogglePublish() {
    if (!announcement) return;
    const newStatus = !announcement.is_published;
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_published: newStatus })
        .eq('id', announcement.id);
      if (error) throw error;
      setAnnouncement((prev) =>
        prev ? { ...prev, is_published: newStatus } : prev
      );
    } catch {
      Alert.alert('오류', '상태 변경에 실패했습니다.');
    }
  }

  async function handleTogglePin() {
    if (!announcement) return;
    const newStatus = !announcement.is_pinned;
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_pinned: newStatus })
        .eq('id', announcement.id);
      if (error) throw error;
      setAnnouncement((prev) =>
        prev ? { ...prev, is_pinned: newStatus } : prev
      );
    } catch {
      Alert.alert('오류', '상태 변경에 실패했습니다.');
    }
  }

  if (isLoading || !announcement) {
    return (
      <>
        <Stack.Screen options={{ title: '공지사항' }} />
        <CTSpinner className="flex-1 mt-20" />
      </>
    );
  }

  const isAuthorOrAdmin =
    member?.id === announcement.author_id ||
    member?.role === 'admin' ||
    member?.role === 'staff';

  return (
    <>
      <Stack.Screen options={{ title: '공지사항' }} />
      <ScrollView className="flex-1 bg-gray-50 p-4">
        {/* Main Content Card */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-4">
          {/* Badges Row */}
          <View className="flex-row items-center gap-2 mb-3">
            {announcement.is_pinned && (
              <CTBadge label="고정" color="blue" size="sm" />
            )}
            {announcement.is_published ? (
              <CTBadge label="게시됨" color="green" size="sm" />
            ) : (
              <CTBadge label="미게시" color="gray" size="sm" />
            )}
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 mb-2">
            {announcement.title}
          </Text>

          {/* Meta */}
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-sm text-gray-500">
              {announcement.author_name}
            </Text>
            <Text className="text-sm text-gray-300">|</Text>
            <Text className="text-sm text-gray-500">
              {formatDate(announcement.created_at)}
            </Text>
          </View>

          {/* Content */}
          <Text className="text-base text-gray-700 leading-7">
            {announcement.content}
          </Text>
        </View>

        {/* Target Groups */}
        {announcement.target_groups && announcement.target_groups.length > 0 && (
          <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              대상 그룹
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {announcement.target_groups.map((group) => (
                <CTTag
                  key={group}
                  label={TARGET_GROUP_LABELS[group] ?? group}
                  color="blue"
                  size="sm"
                />
              ))}
            </View>
          </View>
        )}

        {/* Admin Actions */}
        {isAuthorOrAdmin && (
          <View className="bg-white rounded-xl p-4 shadow-sm mb-8 gap-3">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              관리
            </Text>
            <CTButton
              variant="outline"
              fullWidth
              onPress={handleTogglePin}
            >
              {announcement.is_pinned ? '고정 해제' : '상단 고정'}
            </CTButton>
            <CTButton
              variant="outline"
              fullWidth
              onPress={handleTogglePublish}
            >
              {announcement.is_published ? '게시 중지' : '게시하기'}
            </CTButton>
            <CTButton
              variant="danger"
              fullWidth
              onPress={handleDelete}
            >
              삭제
            </CTButton>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </>
  );
}
