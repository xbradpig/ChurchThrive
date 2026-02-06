import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../stores/authStore';
import { CTSearchBar } from '../../../components/molecules/CTSearchBar';
import { CTSpinner } from '../../../components/atoms/CTSpinner';
import { CTBadge } from '../../../components/atoms/CTBadge';
import { CTTag } from '../../../components/atoms/CTTag';
import { CTEmptyState } from '../../../components/molecules/CTEmptyState';
import { formatDate } from '@churchthrive/shared';

interface Sermon {
  id: string;
  church_id: string;
  title: string;
  preacher: string;
  service_type: string;
  date: string;
  bible_verses: string[] | null;
  summary: string | null;
  note_count: number;
  created_at: string;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  sunday_morning: '주일오전',
  sunday_afternoon: '주일오후',
  wednesday: '수요예배',
  friday: '금요기도',
  dawn: '새벽기도',
  special: '특별집회',
  revival: '부흥회',
};

const SERVICE_TYPE_COLORS: Record<string, 'blue' | 'green' | 'yellow' | 'gray'> = {
  sunday_morning: 'blue',
  sunday_afternoon: 'blue',
  wednesday: 'green',
  friday: 'green',
  dawn: 'yellow',
  special: 'gray',
  revival: 'gray',
};

const FILTER_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'sunday_morning', label: '주일오전' },
  { key: 'sunday_afternoon', label: '주일오후' },
  { key: 'wednesday', label: '수요예배' },
  { key: 'friday', label: '금요기도' },
  { key: 'special', label: '특별집회' },
];

export default function SermonsScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const fetchSermons = useCallback(async () => {
    if (!member?.church_id) return;
    try {
      let query = supabase
        .from('sermons')
        .select('*')
        .eq('church_id', member.church_id)
        .order('date', { ascending: false })
        .limit(50);

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,preacher.ilike.%${search}%`
        );
      }

      if (selectedFilter !== 'all') {
        query = query.eq('service_type', selectedFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSermons((data as Sermon[]) ?? []);
    } catch (err) {
      console.error('Failed to fetch sermons:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [member?.church_id, search, selectedFilter]);

  useEffect(() => {
    fetchSermons();
  }, [fetchSermons]);

  const renderSermon = useCallback(
    ({ item }: { item: Sermon }) => (
      <TouchableOpacity
        onPress={() =>
          router.push(`/(tabs)/notes/sermon-detail/${item.id}` as any)
        }
        className="bg-white px-4 py-3 border-b border-gray-100"
        activeOpacity={0.6}
      >
        <View className="flex-row items-center gap-2 mb-1">
          <CTBadge
            label={
              SERVICE_TYPE_LABELS[item.service_type] ?? item.service_type
            }
            color={SERVICE_TYPE_COLORS[item.service_type] ?? 'gray'}
            size="sm"
          />
          <Text className="text-xs text-gray-400">
            {formatDate(item.date)}
          </Text>
        </View>

        <Text
          className="text-base font-medium text-gray-800 mb-1"
          numberOfLines={1}
        >
          {item.title}
        </Text>

        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-gray-500">{item.preacher}</Text>
        </View>

        {item.bible_verses && item.bible_verses.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {item.bible_verses.slice(0, 3).map((verse, idx) => (
              <CTTag key={idx} label={verse} color="purple" size="sm" />
            ))}
            {item.bible_verses.length > 3 && (
              <Text className="text-xs text-gray-400 self-center">
                +{item.bible_verses.length - 3}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    ),
    [router]
  );

  return (
    <>
      <Stack.Screen options={{ title: '설교 아카이브' }} />
      <View className="flex-1 bg-gray-50">
        {/* Search */}
        <View className="px-4 pt-3 pb-2 bg-white">
          <CTSearchBar
            placeholder="설교 제목, 설교자 검색"
            onSearch={setSearch}
            onChange={setSearch}
          />
        </View>

        {/* Filter Chips */}
        <View className="bg-white border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              gap: 8,
            }}
          >
            {FILTER_OPTIONS.map((filter) => {
              const isSelected = selectedFilter === filter.key;
              return (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setSelectedFilter(filter.key)}
                  className={`px-3.5 py-2 rounded-full border ${
                    isSelected
                      ? 'bg-ct-primary border-ct-primary'
                      : 'bg-white border-gray-200'
                  }`}
                  style={{ minHeight: 44 }}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sermon List */}
        {isLoading ? (
          <CTSpinner className="flex-1 mt-12" />
        ) : (
          <FlatList
            data={sermons}
            keyExtractor={(item) => item.id}
            renderItem={renderSermon}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchSermons();
                }}
                tintColor="#228B22"
              />
            }
            ListEmptyComponent={
              <CTEmptyState
                title={
                  search || selectedFilter !== 'all'
                    ? '검색 결과가 없습니다'
                    : '설교가 없습니다'
                }
                description="등록된 설교가 표시됩니다"
              />
            }
          />
        )}
      </View>
    </>
  );
}
