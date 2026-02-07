import { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../stores/authStore';
import { CTFormField } from '../../../components/molecules/CTFormField';
import { CTInput } from '../../../components/atoms/CTInput';
import { CTButton } from '../../../components/atoms/CTButton';

export default function NewNoteScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  async function toggleRecording() {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      // In production: stop expo-av recording and save audio
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingDuration(0);
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      // In production: start expo-av recording
    }
  }

  function formatDuration(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  async function handleSave() {
    if (!title) {
      Alert.alert('오류', '제목을 입력해주세요.');
      return;
    }
    if (!member) return;

    setIsSubmitting(true);
    try {
      const contentBlocks = content
        .split('\n')
        .filter(line => line.trim())
        .map((line, idx) => ({
          id: `block-${idx}`,
          type: 'paragraph' as const,
          content: line,
        }));

      const { error } = await supabase.from('sermon_notes').insert({
        church_id: member.church_id,
        member_id: member.id,
        title,
        content: contentBlocks,
      });

      if (error) {
        Alert.alert('오류', '저장에 실패했습니다.');
        return;
      }

      Alert.alert('완료', '노트가 저장되었습니다.', [
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
          title: '새 말씀노트',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={isSubmitting} className="mr-2">
              <Text className={`font-semibold text-base ${isSubmitting ? 'text-gray-400' : 'text-ct-primary'}`}>
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
        <ScrollView className="flex-1 bg-gray-50 p-4" keyboardShouldPersistTaps="handled">
          {/* Recording section */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm items-center">
            <TouchableOpacity
              onPress={toggleRecording}
              className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${
                isRecording ? 'bg-ct-error' : 'bg-ct-primary'
              }`}
            >
              <Text className="text-white text-2xl">{isRecording ? '\u23F9' : '\uD83C\uDF99'}</Text>
            </TouchableOpacity>
            <Text className="text-sm text-gray-500">
              {isRecording ? `녹음 중 ${formatDuration(recordingDuration)}` : '탭하여 녹음 시작'}
            </Text>
          </View>

          {/* Note form */}
          <View className="bg-white rounded-xl p-4 shadow-sm gap-4">
            <CTFormField label="제목" isRequired>
              <CTInput
                placeholder="예: 2024년 1월 첫째주 설교"
                value={title}
                onChangeText={setTitle}
              />
            </CTFormField>

            {/* Template buttons */}
            <View className="flex-row gap-2">
              {['서론', '본론', '결론', '적용'].map((section) => (
                <TouchableOpacity
                  key={section}
                  onPress={() => setContent(prev => prev + (prev ? '\n\n' : '') + `[${section}]\n`)}
                  className="px-3 py-1.5 bg-gray-100 rounded-full"
                >
                  <Text className="text-xs text-gray-600 font-medium">{section}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              multiline
              value={content}
              onChangeText={setContent}
              placeholder="말씀을 기록하세요..."
              textAlignVertical="top"
              className="min-h-[200px] text-base text-gray-800 leading-relaxed"
              placeholderTextColor="#A0AEC0"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
