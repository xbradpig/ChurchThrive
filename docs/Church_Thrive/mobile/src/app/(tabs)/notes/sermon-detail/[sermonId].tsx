import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../../../lib/supabase/client';
import { useAuthStore } from '../../../../stores/authStore';
import { CTSpinner } from '../../../../components/atoms/CTSpinner';
import { CTBadge } from '../../../../components/atoms/CTBadge';
import { CTTag } from '../../../../components/atoms/CTTag';
import { CTButton } from '../../../../components/atoms/CTButton';
import { CTCard } from '../../../../components/molecules/CTCard';
import { CTEmptyState } from '../../../../components/molecules/CTEmptyState';
import { formatDate } from '@churchthrive/shared';
import type { SermonNote } from '@churchthrive/shared';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  sunday_morning: '주일오전예배',
  sunday_afternoon: '주일오후예배',
  wednesday: '수요예배',
  friday: '금요기도회',
  dawn: '새벽기도',
  special: '특별집회',
  revival: '부흥회',
};

interface Sermon {
  id: string;
  church_id: string;
  title: string;
  preacher: string;
  service_type: string;
  date: string;
  bible_verses: string[] | null;
  summary: string | null;
  outline: string | null;
  created_at: string;
}

export default function SermonDetailScreen() {
  const { sermonId } = useLocalSearchParams<{ sermonId: string }>();
  const router = useRouter();
  const { member } = useAuthStore();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!sermonId) return;
    try {
      // Fetch sermon details
      const { data: sermonData, error: sermonError } = await supabase
        .from('sermons')
        .select('*')
        .eq('id', sermonId)
        .single();

      if (sermonError) throw sermonError;
      setSermon(sermonData as Sermon);

      // Fetch notes linked to this sermon
      if (member?.id) {
        const { data: noteData } = await supabase
          .from('sermon_notes')
          .select('*')
          .eq('sermon_id', sermonId)
          .eq('member_id', member.id)
          .order('created_at', { ascending: false });

        setNotes((noteData as SermonNote[]) ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch sermon detail:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sermonId, member?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleWriteNote() {
    router.push({
      pathname: '/(tabs)/notes/new' as any,
      params: { sermonId: sermon?.id, sermonTitle: sermon?.title },
    });
  }

  if (isLoading || !sermon) {
    return (
      <>
        <Stack.Screen options={{ title: '설교 상세' }} />
        <CTSpinner className="flex-1 mt-20" />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: sermon.title }} />
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchData();
            }}
            tintColor="#228B22"
          />
        }
      >
        {/* Sermon Info Card */}
        <View className="bg-white p-5 mb-2">
          <View className="flex-row items-center gap-2 mb-3">
            <CTBadge
              label={
                SERVICE_TYPE_LABELS[sermon.service_type] ??
                sermon.service_type
              }
              color="blue"
              size="sm"
            />
            <Text className="text-sm text-gray-400">
              {formatDate(sermon.date)}
            </Text>
          </View>

          <Text className="text-xl font-bold text-gray-900 mb-2">
            {sermon.title}
          </Text>

          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-sm text-gray-500">설교자</Text>
            <Text className="text-sm font-medium text-gray-700">
              {sermon.preacher}
            </Text>
          </View>

          {/* Bible Verses */}
          {sermon.bible_verses && sermon.bible_verses.length > 0 && (
            <View className="mb-3">
              <Text className="text-sm text-gray-500 mb-2">본문</Text>
              <View className="flex-row flex-wrap gap-2">
                {sermon.bible_verses.map((verse, idx) => (
                  <CTTag key={idx} label={verse} color="purple" />
                ))}
              </View>
            </View>
          )}

          {/* Summary */}
          {sermon.summary && (
            <View className="mt-2 p-3 bg-gray-50 rounded-lg">
              <Text className="text-sm text-gray-500 mb-1">요약</Text>
              <Text className="text-base text-gray-700 leading-6">
                {sermon.summary}
              </Text>
            </View>
          )}

          {/* Outline */}
          {sermon.outline && (
            <View className="mt-3 p-3 bg-ct-primary-50 rounded-lg border-l-4 border-ct-primary">
              <Text className="text-sm text-ct-primary mb-1">설교 개요</Text>
              <Text className="text-base text-gray-700 leading-6">
                {sermon.outline}
              </Text>
            </View>
          )}
        </View>

        {/* Write Note CTA */}
        <View className="px-4 py-4">
          <CTButton fullWidth onPress={handleWriteNote}>
            {'\uD83D\uDCDD'} 이 설교 노트 작성
          </CTButton>
        </View>

        {/* My Notes for this Sermon */}
        <View className="bg-white">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">
              내 노트 ({notes.length})
            </Text>
          </View>

          {notes.length === 0 ? (
            <CTEmptyState
              title="아직 노트가 없습니다"
              description="이 설교에 대한 말씀노트를 작성해보세요"
              actionLabel="노트 작성"
              onAction={handleWriteNote}
            />
          ) : (
            notes.map((note) => (
              <TouchableOpacity
                key={note.id}
                onPress={() =>
                  router.push(`/(tabs)/notes/${note.id}` as any)
                }
                className="px-4 py-3 border-b border-gray-100"
                activeOpacity={0.6}
              >
                <Text
                  className="text-base font-medium text-gray-800"
                  numberOfLines={1}
                >
                  {note.title}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">
                  {formatDate(note.created_at, 'relative')}
                  {note.audio_url && ' \u00B7 \uD83C\uDF99 녹음'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </>
  );
}
