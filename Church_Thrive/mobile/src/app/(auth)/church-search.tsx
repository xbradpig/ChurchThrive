import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase/client';
import type { Church } from '@churchthrive/shared';

export default function ChurchSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Church[]>([]);
  const [selected, setSelected] = useState<Church | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = useCallback(async () => {
    if (query.length < 2) return;
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('churches')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);
      setResults(data || []);
    } catch {
      Alert.alert('오류', '검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  async function handleJoinRequest() {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('access_requests').insert({
        church_id: selected.id,
        user_id: user.id,
      });

      if (error) {
        Alert.alert('오류', '가입 요청 중 오류가 발생했습니다.');
        return;
      }

      router.replace('/(auth)/pending');
    } catch {
      Alert.alert('오류', '요청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-6">
      <View className="items-center mb-6">
        <Text className="text-xl font-semibold">교회 선택</Text>
        <Text className="text-sm text-gray-500 mt-1">소속 교회를 검색하여 선택해주세요</Text>
      </View>

      <View className="flex-row gap-2 mb-4">
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          placeholder="교회명으로 검색"
          className="flex-1 h-12 px-3 bg-white border border-gray-300 rounded-lg text-base"
          placeholderTextColor="#A0AEC0"
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={handleSearch}
          disabled={isSearching || query.length < 2}
          className={`h-12 px-4 rounded-lg justify-center ${
            isSearching || query.length < 2 ? 'bg-gray-300' : 'bg-ct-primary'
          }`}
        >
          <Text className="text-white font-medium">{isSearching ? '...' : '검색'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelected(item)}
            className={`p-4 bg-white rounded-lg mb-2 border ${
              selected?.id === item.id
                ? 'border-ct-primary bg-ct-primary-50'
                : 'border-gray-200'
            }`}
          >
            <Text className="text-base font-medium">{item.name}</Text>
            {item.address && <Text className="text-sm text-gray-500 mt-0.5">{item.address}</Text>}
            {item.denomination && <Text className="text-xs text-gray-400 mt-0.5">{item.denomination}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length >= 2 && !isSearching ? (
            <View className="items-center py-8">
              <Text className="text-sm text-gray-500">검색 결과가 없습니다</Text>
            </View>
          ) : null
        }
      />

      {selected && (
        <TouchableOpacity
          onPress={handleJoinRequest}
          disabled={isSubmitting}
          className={`h-12 rounded-lg items-center justify-center mt-4 ${
            isSubmitting ? 'bg-gray-300' : 'bg-ct-primary'
          }`}
        >
          <Text className="text-white font-semibold text-base">
            {isSubmitting ? '요청 중...' : `${selected.name} 가입 요청`}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
