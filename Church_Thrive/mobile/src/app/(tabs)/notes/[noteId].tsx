import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import { CTCard } from '../../../components/molecules/CTCard';
import { CTSpinner } from '../../../components/atoms/CTSpinner';
import { formatDate } from '@churchthrive/shared';
import type { SermonNote, NoteContentBlock } from '@churchthrive/shared';

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const router = useRouter();
  const [note, setNote] = useState<SermonNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sermon_notes')
        .select('*')
        .eq('id', noteId)
        .single();
      setNote(data);
      setIsLoading(false);
    }
    load();
  }, [noteId]);

  if (isLoading || !note) {
    return <CTSpinner className="flex-1 mt-20" />;
  }

  const contentBlocks = (note.content as NoteContentBlock[]) || [];

  return (
    <>
      <Stack.Screen
        options={{
          title: note.title,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/notes/${noteId}/edit` as any)}
              className="mr-2"
            >
              <Text className="text-ct-primary font-semibold">수정</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-gray-50 p-4">
        <CTCard padding="lg">
          <Text className="text-xl font-bold text-gray-900 mb-1">{note.title}</Text>
          <Text className="text-xs text-gray-400 mb-4">{formatDate(note.created_at)}</Text>

          {note.audio_url && (
            <View className="bg-gray-50 rounded-lg p-3 mb-4 flex-row items-center gap-3">
              <TouchableOpacity className="w-10 h-10 bg-ct-primary rounded-full items-center justify-center">
                <Text className="text-white text-lg">{'\u25B6'}</Text>
              </TouchableOpacity>
              <Text className="text-sm text-gray-500">오디오 녹음</Text>
            </View>
          )}

          <View className="gap-3">
            {contentBlocks.map((block) => {
              if (block.type === 'heading') {
                return <Text key={block.id} className="text-lg font-semibold text-gray-900 mt-2">{block.content}</Text>;
              }
              if (block.type === 'bible_verse') {
                return (
                  <View key={block.id} className="bg-ct-primary-50 rounded-lg p-3 border-l-4 border-ct-primary">
                    <Text className="text-sm text-ct-primary-700">{block.content}</Text>
                    {block.metadata?.verseRef && (
                      <Text className="text-xs text-ct-primary mt-1">- {block.metadata.verseRef}</Text>
                    )}
                  </View>
                );
              }
              if (block.type === 'quote') {
                return (
                  <View key={block.id} className="border-l-4 border-gray-300 pl-3 py-1">
                    <Text className="text-sm text-gray-600 italic">{block.content}</Text>
                  </View>
                );
              }
              return <Text key={block.id} className="text-base text-gray-700 leading-relaxed">{block.content}</Text>;
            })}
          </View>
        </CTCard>
      </ScrollView>
    </>
  );
}
