import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../stores/authStore';
import { CTSearchBar } from '../../../components/molecules/CTSearchBar';
import { CTSpinner } from '../../../components/atoms/CTSpinner';
import { CTEmptyState } from '../../../components/molecules/CTEmptyState';
import { formatDate } from '@churchthrive/shared';
import type { SermonNote } from '@churchthrive/shared';

export default function NotesScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!member) return;
    try {
      let query = supabase
        .from('sermon_notes')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data } = await query;
      setNotes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [member, search]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const renderNote = useCallback(({ item }: { item: SermonNote }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/notes/${item.id}` as any)}
      className="bg-white px-4 py-3 border-b border-gray-100"
      activeOpacity={0.6}
    >
      <Text className="text-base font-medium text-gray-800" numberOfLines={1}>
        {item.title}
      </Text>
      <Text className="text-xs text-gray-400 mt-1">
        {formatDate(item.created_at, 'relative')}
        {item.audio_url && ' \u00B7 🎙 녹음'}
      </Text>
    </TouchableOpacity>
  ), [router]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '말씀노트',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/notes/new' as any)}
              className="mr-2"
            >
              <Text className="text-ct-primary font-semibold text-base">+ 새 노트</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-3 pb-2 bg-white">
          <CTSearchBar placeholder="노트 검색" onSearch={setSearch} onChange={setSearch} />
        </View>

        {isLoading ? (
          <CTSpinner className="flex-1 mt-12" />
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={renderNote}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchNotes(); }} tintColor="#228B22" />}
            ListEmptyComponent={
              <CTEmptyState
                title={search ? '검색 결과가 없습니다' : '아직 노트가 없습니다'}
                description="예배 중 말씀노트를 작성해보세요"
                actionLabel="새 노트 작성"
                onAction={() => router.push('/(tabs)/notes/new' as any)}
              />
            }
          />
        )}
      </View>
    </>
  );
}
