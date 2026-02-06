import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import { CTSearchBar } from '../../../components/molecules/CTSearchBar';
import { CTAvatar } from '../../../components/atoms/CTAvatar';
import { CTBadge } from '../../../components/atoms/CTBadge';
import { CTSpinner } from '../../../components/atoms/CTSpinner';
import { CTEmptyState } from '../../../components/molecules/CTEmptyState';
import { isChosungOnly, formatPhone, POSITION_LABELS } from '@churchthrive/shared';
import type { Member } from '@churchthrive/shared';

const STATUS_COLORS: Record<string, 'green' | 'yellow' | 'gray'> = {
  active: 'green', pending: 'yellow', inactive: 'gray',
};

export default function MembersScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      let query = supabase
        .from('members')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true })
        .limit(50);

      if (search) {
        if (isChosungOnly(search)) {
          query = query.like('name_chosung', `${search}%`);
        } else {
          query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
        }
      }

      const { data } = await query;
      setMembers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchMembers();
  }, [fetchMembers]);

  const renderMember = useCallback(({ item }: { item: Member }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/members/${item.id}` as any)}
      className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100"
      activeOpacity={0.6}
    >
      <CTAvatar src={item.photo_url} name={item.name} size="md" />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-medium text-gray-800">{item.name}</Text>
          {item.position && (
            <Text className="text-xs text-gray-400">
              {POSITION_LABELS[item.position as keyof typeof POSITION_LABELS]}
            </Text>
          )}
        </View>
        <Text className="text-sm text-gray-500 mt-0.5">{formatPhone(item.phone)}</Text>
      </View>
      <CTBadge color={STATUS_COLORS[item.status] || 'gray'} dot />
      <Text className="text-gray-300 text-lg">{'>'}</Text>
    </TouchableOpacity>
  ), [router]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '교인관리',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/members/new' as any)}
              className="mr-2"
            >
              <Text className="text-ct-primary font-semibold text-base">+ 추가</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-3 pb-2 bg-white">
          <CTSearchBar
            placeholder="이름, 전화번호, 초성 검색"
            onSearch={setSearch}
            onChange={setSearch}
          />
        </View>

        {isLoading ? (
          <CTSpinner className="flex-1 mt-12" />
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={renderMember}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#228B22" />}
            ListEmptyComponent={
              <CTEmptyState
                title={search ? '검색 결과가 없습니다' : '교인이 없습니다'}
                description={search ? '다른 검색어를 시도해보세요' : '첫 교인을 등록해보세요'}
                actionLabel="교인 추가"
                onAction={() => router.push('/(tabs)/members/new' as any)}
              />
            }
          />
        )}
      </View>
    </>
  );
}
