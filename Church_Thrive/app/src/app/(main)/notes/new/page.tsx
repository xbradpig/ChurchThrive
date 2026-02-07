'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { detectBibleVerses, formatVerseRef, SERVICE_TYPE_LABELS } from '@churchthrive/shared';
import { CTButton } from '@/components/atoms/CTButton';
import { CTInput } from '@/components/atoms/CTInput';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTFormField } from '@/components/molecules/CTFormField';
import { CTTag } from '@/components/atoms/CTTag';
import { CTToggle } from '@/components/atoms/CTToggle';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { toast } from '@/components/organisms/CTToast';
import { saveAudioChunk, clearAudioChunks } from '@/lib/offline/audio-storage';
import {
  ArrowLeftIcon,
  BookmarkIcon,
  ShareIcon,
  BoldIcon,
  MicrophoneIcon,
  StopIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

// Toolbar icon fallbacks (Heroicons does not have Bold/Italic/etc so we use text)
function ToolbarIcon({ label }: { label: string }) {
  return (
    <span className="text-ct-sm font-semibold leading-none">{label}</span>
  );
}

interface SermonOption {
  id: string;
  title: string;
  sermon_date: string;
  service_type: string;
}

interface ContentBlock {
  type: 'heading' | 'paragraph' | 'quote' | 'bible_verse' | 'highlight' | 'bullet' | 'numbered';
  text: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function NewNotePage() {
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [title, setTitle] = useState('');
  const [sermonId, setSermonId] = useState('');
  const [content, setContent] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sermons, setSermons] = useState<SermonOption[]>([]);
  const [sermonsLoading, setSermonsLoading] = useState(true);
  const [detectedVerses, setDetectedVerses] = useState<string[]>([]);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkIndexRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Temp ID for audio storage
  const tempNoteId = useRef(`temp-${Date.now()}`);

  // Fetch available sermons
  useEffect(() => {
    async function fetchSermons() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: currentMember } = await supabase
          .from('members')
          .select('church_id')
          .eq('user_id', user.id)
          .single();

        if (!currentMember) return;

        const { data, error } = await supabase
          .from('sermons')
          .select('id, title, sermon_date, service_type')
          .eq('church_id', currentMember.church_id)
          .order('sermon_date', { ascending: false })
          .limit(50);

        if (error) throw error;
        setSermons(data || []);
      } catch (error) {
        console.error('Failed to fetch sermons:', error);
      } finally {
        setSermonsLoading(false);
      }
    }
    fetchSermons();
  }, [supabase]);

  // Bible verse detection (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) {
        try {
          const verses = detectBibleVerses(content);
          setDetectedVerses(verses.map((v) => formatVerseRef(v)));
        } catch {
          // detectBibleVerses might fail on partial input
          setDetectedVerses([]);
        }
      } else {
        setDetectedVerses([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [content]);

  // Parse content into content blocks for JSONB storage
  function parseContentBlocks(text: string): ContentBlock[] {
    const lines = text.split('\n');
    const blocks: ContentBlock[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('## ')) {
        blocks.push({ type: 'heading', text: trimmed.slice(3) });
      } else if (trimmed.startsWith('> ')) {
        blocks.push({ type: 'quote', text: trimmed.slice(2) });
      } else if (trimmed.startsWith('- ')) {
        blocks.push({ type: 'bullet', text: trimmed.slice(2) });
      } else if (/^\d+\.\s/.test(trimmed)) {
        blocks.push({ type: 'numbered', text: trimmed.replace(/^\d+\.\s/, '') });
      } else if (trimmed.startsWith('==') && trimmed.endsWith('==')) {
        blocks.push({ type: 'highlight', text: trimmed.slice(2, -2) });
      } else {
        blocks.push({ type: 'paragraph', text: trimmed });
      }
    }

    return blocks;
  }

  // Insert text at cursor position in textarea
  function insertAtCursor(textToInsert: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const newContent = before + textToInsert + after;
    setContent(newContent);

    // Restore cursor position
    requestAnimationFrame(() => {
      textarea.selectionStart = start + textToInsert.length;
      textarea.selectionEnd = start + textToInsert.length;
      textarea.focus();
    });
  }

  // Wrap selected text with markers
  function wrapSelection(prefix: string, suffix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const before = content.slice(0, start);
    const after = content.slice(end);
    const newContent = before + prefix + selected + suffix + after;
    setContent(newContent);

    requestAnimationFrame(() => {
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = end + prefix.length;
      textarea.focus();
    });
  }

  // Audio recording handlers
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      chunkIndexRef.current = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // Save to IndexedDB for crash recovery
          saveAudioChunk(tempNoteId.current, chunkIndexRef.current, event.data);
          chunkIndexRef.current += 1;
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('마이크 접근 권한이 필요합니다.');
    }
  }

  function pauseRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function resumeRecording() {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function deleteRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    audioChunksRef.current = [];
    clearAudioChunks(tempNoteId.current);
  }

  // Save handler
  async function handleSave() {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: currentMember } = await supabase
        .from('members')
        .select('id, church_id')
        .eq('user_id', user.id)
        .single();

      if (!currentMember) return;

      const contentBlocks = parseContentBlocks(content);

      // Upload audio if exists
      let uploadedAudioUrl: string | null = null;
      if (audioBlob) {
        const fileName = `notes/${currentMember.church_id}/${currentMember.id}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(fileName, audioBlob, { contentType: 'audio/webm' });

        if (uploadError) {
          console.error('Audio upload failed:', uploadError);
          toast.error('오디오 업로드에 실패했습니다.');
        } else {
          const { data: urlData } = supabase.storage
            .from('audio')
            .getPublicUrl(fileName);
          uploadedAudioUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('sermon_notes').insert({
        sermon_id: sermonId || null,
        member_id: currentMember.id,
        church_id: currentMember.church_id,
        title: title.trim(),
        content: contentBlocks,
        plain_text: content,
        audio_url: uploadedAudioUrl,
        is_shared: isShared,
        detected_verses: detectedVerses,
        tags: [],
      });

      if (error) {
        console.error('Failed to save note:', error);
        toast.error('노트 저장에 실패했습니다.');
        return;
      }

      // Clean up IndexedDB audio chunks
      clearAudioChunks(tempNoteId.current);

      toast.success('말씀노트가 저장되었습니다.');
      router.push('/notes');
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
            새 말씀노트
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <CTButton
            variant="primary"
            size="sm"
            leftIcon={<BookmarkIcon className="w-4 h-4" />}
            onClick={handleSave}
            isLoading={isSubmitting}
          >
            저장
          </CTButton>
        </div>
      </div>

      <div className="bg-white rounded-ct-lg shadow-ct-1 p-6 space-y-6">
        {/* Sermon Selection */}
        <CTFormField label="설교 선택" helperText="연결할 설교를 선택하세요 (선택사항)">
          {sermonsLoading ? (
            <div className="flex items-center gap-2 h-10">
              <CTSpinner size="sm" />
              <span className="text-ct-sm text-gray-400">설교 목록 불러오는 중...</span>
            </div>
          ) : (
            <CTSelect
              options={[
                { value: '', label: '설교 선택 안함' },
                ...sermons.map((s) => ({
                  value: s.id,
                  label: `${s.title} (${s.sermon_date})`,
                })),
              ]}
              value={sermonId}
              onChange={(e) => setSermonId(e.target.value)}
            />
          )}
        </CTFormField>

        {/* Title */}
        <CTFormField label="제목" isRequired>
          <CTInput
            placeholder="말씀노트 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </CTFormField>

        {/* Template Quick Insert */}
        <div>
          <label className="block text-ct-sm font-medium text-gray-700 mb-2">
            빠른 삽입
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '서론', text: '## 서론\n\n' },
              { label: '본론', text: '## 본론\n\n' },
              { label: '결론', text: '## 결론\n\n' },
              { label: '적용', text: '## 적용\n\n' },
              { label: '묵상', text: '## 묵상\n\n' },
            ].map((tmpl) => (
              <CTButton
                key={tmpl.label}
                variant="outline"
                size="sm"
                onClick={() => insertAtCursor(tmpl.text)}
              >
                {tmpl.label}
              </CTButton>
            ))}
          </div>
        </div>

        {/* Editor Toolbar */}
        <div>
          <label className="block text-ct-sm font-medium text-gray-700 mb-2">
            내용
          </label>
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-200 rounded-t-ct-md">
            <button
              type="button"
              onClick={() => wrapSelection('**', '**')}
              className="p-2 rounded-ct-md hover:bg-gray-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="굵게"
            >
              <ToolbarIcon label="B" />
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('*', '*')}
              className="p-2 rounded-ct-md hover:bg-gray-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="기울임"
            >
              <span className="text-ct-sm font-semibold italic leading-none">I</span>
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('\n## ')}
              className="p-2 rounded-ct-md hover:bg-gray-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="제목"
            >
              <ToolbarIcon label="H" />
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('\n> ')}
              className="p-2 rounded-ct-md hover:bg-gray-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="인용"
            >
              <ToolbarIcon label="&ldquo;" />
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('[', '](성경구절)')}
              className="p-2 rounded-ct-md hover:bg-gray-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="성경구절"
            >
              <ToolbarIcon label="Verse" />
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('==', '==')}
              className="p-2 rounded-ct-md hover:bg-gray-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="강조"
            >
              <span className="text-ct-sm font-semibold leading-none bg-yellow-200 px-1 rounded">H</span>
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
            <button
              type="button"
              onClick={() => insertAtCursor('\n- ')}
              className="p-2 rounded-ct-md hover:bg-gray-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="목록"
            >
              <ToolbarIcon label="&bull;" />
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('\n1. ')}
              className="p-2 rounded-ct-md hover:bg-gray-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="번호 목록"
            >
              <ToolbarIcon label="1." />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="말씀 내용을 자유롭게 기록하세요...&#10;&#10;## 서론 (제목은 ## 으로 시작)&#10;> 인용구는 > 로 시작&#10;==강조할 내용== 은 == 으로 감싸기&#10;&#10;성경구절은 자동으로 감지됩니다 (예: 요한복음 3:16)"
            rows={16}
            className="w-full rounded-b-ct-md border border-t-0 border-gray-200 bg-[var(--ct-color-gray-50)] px-4 py-3 text-ct-md placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-ct-primary/40 focus:border-transparent focus:bg-white transition-colors"
          />
        </div>

        {/* Detected Bible Verses */}
        {detectedVerses.length > 0 && (
          <div>
            <label className="block text-ct-sm font-medium text-gray-700 mb-2">
              감지된 성경구절
            </label>
            <div className="flex flex-wrap gap-2">
              {detectedVerses.map((verse, idx) => (
                <CTTag key={idx} label={verse} color="blue" size="md" />
              ))}
            </div>
          </div>
        )}

        {/* Audio Recording Section */}
        <div>
          <label className="block text-ct-sm font-medium text-gray-700 mb-2">
            음성 녹음
          </label>
          <div className="border border-gray-200 rounded-ct-lg p-4 bg-gray-50">
            {!isRecording && !audioUrl && (
              <div className="flex flex-col items-center gap-3 py-4">
                <button
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center text-white shadow-ct-2 transition-colors"
                  aria-label="녹음 시작"
                >
                  <MicrophoneIcon className="w-8 h-8" />
                </button>
                <p className="text-ct-sm text-gray-500">
                  버튼을 눌러 설교 음성을 녹음하세요
                </p>
              </div>
            )}

            {isRecording && (
              <div className="flex flex-col items-center gap-4 py-4">
                {/* Recording indicator */}
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-ct-md font-mono font-medium text-gray-800">
                    {formatDuration(recordingDuration)}
                  </span>
                  {isPaused && (
                    <span className="text-ct-xs text-yellow-600 font-medium">
                      일시정지
                    </span>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  {isPaused ? (
                    <button
                      onClick={resumeRecording}
                      className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-ct-1 transition-colors"
                      aria-label="녹음 재개"
                    >
                      <PlayIcon className="w-6 h-6" />
                    </button>
                  ) : (
                    <button
                      onClick={pauseRecording}
                      className="w-12 h-12 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-white shadow-ct-1 transition-colors"
                      aria-label="일시정지"
                    >
                      <PauseIcon className="w-6 h-6" />
                    </button>
                  )}
                  <button
                    onClick={stopRecording}
                    className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-800 flex items-center justify-center text-white shadow-ct-1 transition-colors"
                    aria-label="녹음 중지"
                  >
                    <StopIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {audioUrl && !isRecording && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MicrophoneIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-ct-sm font-medium text-gray-700">
                    녹음 완료 ({formatDuration(recordingDuration)})
                  </span>
                </div>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio
                  controls
                  src={audioUrl}
                  className="w-full h-10"
                />
                <CTButton
                  variant="ghost"
                  size="sm"
                  onClick={deleteRecording}
                  className="text-red-500"
                >
                  녹음 삭제
                </CTButton>
              </div>
            )}
          </div>
        </div>

        {/* Share Toggle */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-ct-lg">
          <div>
            <p className="text-ct-md font-medium text-gray-800">노트 공유</p>
            <p className="text-ct-sm text-gray-500 mt-0.5">
              공유하면 담당 목회자가 피드백을 남길 수 있습니다
            </p>
          </div>
          <CTToggle isOn={isShared} onChange={setIsShared} />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <CTButton variant="ghost" type="button" onClick={() => router.back()}>
            취소
          </CTButton>
          <CTButton
            variant="primary"
            onClick={handleSave}
            isLoading={isSubmitting}
            leftIcon={<BookmarkIcon className="w-4 h-4" />}
          >
            저장
          </CTButton>
        </div>
      </div>
    </div>
  );
}
