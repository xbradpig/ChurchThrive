import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '../../../../lib/supabase/client';
import { useAuthStore } from '../../../../stores/authStore';
import { CTFormField } from '../../../../components/molecules/CTFormField';
import { CTInput } from '../../../../components/atoms/CTInput';
import { CTToggle } from '../../../../components/atoms/CTToggle';
import { CTButton } from '../../../../components/atoms/CTButton';

const TARGET_GROUP_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'youth', label: '청년부' },
  { key: 'adult', label: '장년부' },
  { key: 'children', label: '교회학교' },
  { key: 'women', label: '여전도회' },
  { key: 'men', label: '남선교회' },
  { key: 'choir', label: '성가대' },
  { key: 'deacons', label: '집사회' },
  { key: 'elders', label: '장로회' },
];

interface FormErrors {
  title?: string;
  content?: string;
}

export default function NewAnnouncementScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetGroups, setTargetGroups] = useState<string[]>(['all']);
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const toggleTargetGroup = useCallback((key: string) => {
    setTargetGroups((prev) => {
      if (key === 'all') {
        return ['all'];
      }
      const without = prev.filter((g) => g !== 'all');
      if (without.includes(key)) {
        const result = without.filter((g) => g !== key);
        return result.length === 0 ? ['all'] : result;
      }
      return [...without, key];
    });
  }, []);

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    } else if (title.trim().length < 2) {
      newErrors.title = '제목은 2자 이상 입력해주세요';
    }
    if (!content.trim()) {
      newErrors.content = '내용을 입력해주세요';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    if (!member) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        church_id: member.church_id,
        author_id: member.id,
        title: title.trim(),
        content: content.trim(),
        target_groups: targetGroups,
        is_pinned: isPinned,
        is_published: isPublished,
      });

      if (error) {
        Alert.alert('오류', '저장에 실패했습니다.');
        return;
      }

      Alert.alert('완료', '공지사항이 등록되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('오류', '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '새 공지사항',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSubmitting}
              className="mr-2"
            >
              <Text
                className={`font-semibold text-base ${
                  isSubmitting ? 'text-gray-400' : 'text-ct-primary'
                }`}
              >
                저장
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 bg-gray-50 p-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* Title & Content */}
          <View className="bg-white rounded-xl p-4 shadow-sm gap-4 mb-4">
            <CTFormField
              label="제목"
              isRequired
              errorMessage={errors.title}
            >
              <CTInput
                placeholder="공지사항 제목을 입력하세요"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
                }}
                isError={!!errors.title}
              />
            </CTFormField>

            <CTFormField
              label="내용"
              isRequired
              errorMessage={errors.content}
            >
              <TextInput
                multiline
                value={content}
                onChangeText={(text) => {
                  setContent(text);
                  if (errors.content)
                    setErrors((e) => ({ ...e, content: undefined }));
                }}
                placeholder="공지사항 내용을 입력하세요"
                textAlignVertical="top"
                className={`min-h-[160px] text-base text-gray-800 leading-relaxed p-3 rounded-lg border bg-gray-50 ${
                  errors.content ? 'border-ct-error' : 'border-gray-300'
                }`}
                placeholderTextColor="#A0AEC0"
              />
            </CTFormField>
          </View>

          {/* Target Groups */}
          <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              대상 그룹
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TARGET_GROUP_OPTIONS.map((group) => {
                const isSelected = targetGroups.includes(group.key);
                return (
                  <TouchableOpacity
                    key={group.key}
                    onPress={() => toggleTargetGroup(group.key)}
                    className={`px-3 py-2 rounded-full border ${
                      isSelected
                        ? 'bg-ct-primary-50 border-ct-primary'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    style={{ minHeight: 44 }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-ct-primary' : 'text-gray-600'
                      }`}
                    >
                      {isSelected ? '\u2713 ' : ''}
                      {group.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Settings */}
          <View className="bg-white rounded-xl p-4 shadow-sm mb-8 gap-4">
            <View className="flex-row items-center justify-between" style={{ minHeight: 44 }}>
              <View className="flex-1">
                <Text className="text-base text-gray-800">상단 고정</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  공지사항 목록 상단에 고정됩니다
                </Text>
              </View>
              <CTToggle isOn={isPinned} onChange={setIsPinned} />
            </View>

            <View className="border-t border-gray-100" />

            <View className="flex-row items-center justify-between" style={{ minHeight: 44 }}>
              <View className="flex-1">
                <Text className="text-base text-gray-800">즉시 게시</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  저장 즉시 교인들에게 공개됩니다
                </Text>
              </View>
              <CTToggle isOn={isPublished} onChange={setIsPublished} />
            </View>
          </View>

          {/* Bottom Save Button */}
          <CTButton
            fullWidth
            onPress={handleSave}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            공지사항 저장
          </CTButton>
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
