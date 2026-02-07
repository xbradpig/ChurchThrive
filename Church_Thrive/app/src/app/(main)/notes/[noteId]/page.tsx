'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SERVICE_TYPE_LABELS } from '@churchthrive/shared';
import { CTButton } from '@/components/atoms/CTButton';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTTag } from '@/components/atoms/CTTag';
import { CTCard } from '@/components/molecules/CTCard';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTInput } from '@/components/atoms/CTInput';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { toast } from '@/components/organisms/CTToast';
import {

  ArrowLeftIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftIcon,
  CalendarDaysIcon,
  UserIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

export const runtime = 'edge';

interface ContentBlock {
  type: 'heading' | 'paragraph' | 'quote' | 'bible_verse' | 'highlight' | 'bullet' | 'numbered';
  text: string;
}

interface NoteDetail {
  id: string;
  sermon_id: string | null;
  member_id: string;
  title: string;
  content: ContentBlock[] | null;
  plain_text: string | null;
  audio_url: string | null;
  is_shared: boolean;
  detected_verses: string[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  sermons: {
    id: string;
    title: string;
    preacher_name: string | null;
    sermon_date: string;
    service_type: string;
    bible_verses: string[] | null;
  } | null;
  members: {
    id: string;
    name: string;
    photo_url: string | null;
  } | null;
}

interface Feedback {
  id: string;
  note_id: string;
  member_id: string;
  content: string;
  created_at: string;
  members: {
    id: string;
    name: string;
    photo_url: string | null;
    role: string;
  } | null;
}

const SERVICE_TYPE_COLORS: Record<string, 'blue' | 'green' | 'yellow' | 'gray'> = {
  sunday_worship: 'blue',
  wednesday_worship: 'green',
  friday_prayer: 'yellow',
  dawn_prayer: 'gray',
  special: 'blue',
  revival: 'green',
  other: 'gray',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function renderContentBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 key={index} className="text-ct-lg font-bold text-[var(--ct-color-text-heading)] mt-6 mb-3">
          {block.text}
        </h2>
      );
    case 'paragraph':
      return (
        <p key={index} className="text-ct-md text-gray-700 leading-relaxed mb-3">
          {block.text}
        </p>
      );
    case 'quote':
      return (
        <blockquote
          key={index}
          className="border-l-4 border-ct-primary pl-4 py-2 my-3 bg-ct-primary-50/30 rounded-r-ct-md"
        >
          <p className="text-ct-md text-gray-700 italic">{block.text}</p>
        </blockquote>
      );
    case 'bible_verse':
      return (
        <div
          key={index}
          className="flex items-start gap-2 p-3 my-3 bg-blue-50 rounded-ct-md border border-blue-100"
        >
          <BookOpenIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-ct-md text-blue-800">{block.text}</p>
        </div>
      );
    case 'highlight':
      return (
        <p key={index} className="text-ct-md text-gray-800 bg-yellow-100 px-3 py-2 my-3 rounded-ct-md font-medium">
          {block.text}
        </p>
      );
    case 'bullet':
      return (
        <li key={index} className="text-ct-md text-gray-700 ml-5 list-disc mb-1">
          {block.text}
        </li>
      );
    case 'numbered':
      return (
        <li key={index} className="text-ct-md text-gray-700 ml-5 list-decimal mb-1">
          {block.text}
        </li>
      );
    default:
      return (
        <p key={index} className="text-ct-md text-gray-700 mb-3">
          {block.text}
        </p>
      );
  }
}

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.noteId as string;
  const supabase = createClient();

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [currentMemberRole, setCurrentMemberRole] = useState<string | null>(null);
  const feedbackEndRef = useRef<HTMLDivElement>(null);

  // Fetch note and feedbacks
  const fetchNote = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentMember } = await supabase
        .from('members')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (currentMember) {
        setCurrentMemberId(currentMember.id);
        setCurrentMemberRole(currentMember.role);
      }

      const { data: noteData, error: noteError } = await supabase
        .from('sermon_notes')
        .select(`
          *,
          sermons(id, title, preacher_name, sermon_date, service_type, bible_verses),
          members(id, name, photo_url)
        `)
        .eq('id', noteId)
        .single();

      if (noteError) throw noteError;
      setNote(noteData as NoteDetail);

      // Fetch feedbacks
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('note_feedbacks')
        .select(`
          *,
          members(id, name, photo_url, role)
        `)
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });

      if (feedbackError) throw feedbackError;
      setFeedbacks((feedbackData || []) as Feedback[]);
    } catch (error) {
      console.error('Failed to fetch note:', error);
      toast.error('노트를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [noteId, supabase]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  // Real-time subscription for feedbacks
  useEffect(() => {
    const channel = supabase
      .channel(`note-feedback-${noteId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'note_feedbacks',
          filter: `note_id=eq.${noteId}`,
        },
        async (payload) => {
          // Fetch the new feedback with member info
          const { data } = await supabase
            .from('note_feedbacks')
            .select(`
              *,
              members(id, name, photo_url, role)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setFeedbacks((prev) => [...prev, data as Feedback]);
            feedbackEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId, supabase]);

  // Send feedback
  async function handleSendFeedback() {
    if (!feedbackText.trim() || !currentMemberId) return;

    setIsSendingFeedback(true);
    try {
      const { error } = await supabase.from('note_feedbacks').insert({
        note_id: noteId,
        member_id: currentMemberId,
        content: feedbackText.trim(),
      });

      if (error) throw error;

      setFeedbackText('');
    } catch (error) {
      console.error('Failed to send feedback:', error);
      toast.error('피드백 전송에 실패했습니다.');
    } finally {
      setIsSendingFeedback(false);
    }
  }

  // Delete note
  async function handleDelete() {
    if (!confirm('정말 이 노트를 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('sermon_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast.success('노트가 삭제되었습니다.');
      router.push('/notes');
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('노트 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  }

  // Share to KakaoTalk
  function handleShareKakao() {
    try {
      const w = window as any;
      if (w.Kakao && w.Kakao.Link) {
        w.Kakao.Link.sendDefault({
          objectType: 'text',
          text: `[말씀노트] ${note?.title || ''}`,
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
          buttonTitle: '말씀노트 보기',
        });
      } else {
        // Fallback: copy link
        navigator.clipboard.writeText(window.location.href);
        toast.success('링크가 클립보드에 복사되었습니다.');
      }
    } catch (error) {
      console.error('Share failed:', error);
      navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 클립보드에 복사되었습니다.');
    }
  }

  if (isLoading) {
    return (
      <div className="ct-container py-6 flex items-center justify-center min-h-[50vh]">
        <CTSpinner size="lg" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="ct-container py-6">
        <p className="text-center text-gray-500">노트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isOwner = currentMemberId === note.member_id;
  const isPastorOrAdmin = currentMemberRole === 'admin' || currentMemberRole === 'pastor';
  const canFeedback = isPastorOrAdmin && note.is_shared;

  return (
    <div className="ct-container py-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {note.is_shared && (
            <CTButton
              variant="outline"
              size="sm"
              leftIcon={<ShareIcon className="w-4 h-4" />}
              onClick={handleShareKakao}
            >
              공유
            </CTButton>
          )}
          {isOwner && (
            <>
              <CTButton
                variant="outline"
                size="sm"
                leftIcon={<PencilIcon className="w-4 h-4" />}
                onClick={() => router.push(`/notes/${noteId}/edit`)}
              >
                수정
              </CTButton>
              <CTButton
                variant="danger"
                size="sm"
                leftIcon={<TrashIcon className="w-4 h-4" />}
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                삭제
              </CTButton>
            </>
          )}
        </div>
      </div>

      {/* Note Header Card */}
      <CTCard padding="lg" className="mb-6">
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)] mb-3">
          {note.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-ct-sm text-gray-500 mb-4">
          {/* Author */}
          {note.members && (
            <div className="flex items-center gap-1.5">
              <CTAvatar src={note.members.photo_url} name={note.members.name} size="sm" />
              <span>{note.members.name}</span>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-1">
            <CalendarDaysIcon className="w-4 h-4" />
            <span>{formatDate(note.created_at)}</span>
          </div>

          {/* Share status */}
          {note.is_shared && (
            <CTBadge label="공유됨" color="blue" size="sm" />
          )}
        </div>

        {/* Sermon info */}
        {note.sermons && (
          <div className="p-3 bg-gray-50 rounded-ct-md">
            <div className="flex items-start gap-2">
              <BookOpenIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-ct-md font-medium text-gray-800">
                  {note.sermons.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <CTBadge
                    label={
                      SERVICE_TYPE_LABELS[
                        note.sermons.service_type as keyof typeof SERVICE_TYPE_LABELS
                      ] || note.sermons.service_type
                    }
                    color={SERVICE_TYPE_COLORS[note.sermons.service_type] || 'gray'}
                    size="sm"
                  />
                  {note.sermons.preacher_name && (
                    <span className="text-ct-xs text-gray-500">
                      {note.sermons.preacher_name}
                    </span>
                  )}
                  <span className="text-ct-xs text-gray-400">
                    {formatDate(note.sermons.sermon_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CTCard>

      {/* Content */}
      <CTCard padding="lg" className="mb-6">
        {note.content && Array.isArray(note.content) && note.content.length > 0 ? (
          <div className="prose-sm max-w-none">
            {(note.content as ContentBlock[]).map((block, idx) =>
              renderContentBlock(block, idx)
            )}
          </div>
        ) : note.plain_text ? (
          <div className="whitespace-pre-wrap text-ct-md text-gray-700 leading-relaxed">
            {note.plain_text}
          </div>
        ) : (
          <p className="text-ct-sm text-gray-400 italic">내용이 없습니다.</p>
        )}
      </CTCard>

      {/* Detected Bible Verses */}
      {note.detected_verses && note.detected_verses.length > 0 && (
        <CTCard padding="md" className="mb-6">
          <h3 className="text-ct-sm font-semibold text-gray-700 mb-2">
            성경구절
          </h3>
          <div className="flex flex-wrap gap-2">
            {note.detected_verses.map((verse, idx) => (
              <CTTag key={idx} label={verse} color="blue" size="md" />
            ))}
          </div>
        </CTCard>
      )}

      {/* Audio Player */}
      {note.audio_url && (
        <CTCard padding="md" className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MicrophoneIcon className="w-5 h-5 text-gray-500" />
            <h3 className="text-ct-sm font-semibold text-gray-700">
              음성 녹음
            </h3>
          </div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={note.audio_url} className="w-full h-10" />
        </CTCard>
      )}

      {/* Feedback Section */}
      {(canFeedback || feedbacks.length > 0) && (
        <CTCard padding="lg" className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500" />
            <h3 className="text-ct-md font-semibold text-[var(--ct-color-text-heading)]">
              목회자 피드백
            </h3>
            {feedbacks.length > 0 && (
              <CTBadge count={feedbacks.length} color="blue" size="sm" />
            )}
          </div>

          {/* Feedback Thread */}
          <div className="space-y-4 mb-4">
            {feedbacks.length === 0 && (
              <p className="text-ct-sm text-gray-400 text-center py-4">
                아직 피드백이 없습니다.
              </p>
            )}
            {feedbacks.map((fb) => (
              <div key={fb.id} className="flex items-start gap-3">
                <CTAvatar
                  src={fb.members?.photo_url}
                  name={fb.members?.name || ''}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-ct-sm font-medium text-gray-800">
                      {fb.members?.name || '알 수 없음'}
                    </span>
                    {(fb.members?.role === 'admin' || fb.members?.role === 'pastor') && (
                      <CTBadge label="목회자" color="blue" size="sm" />
                    )}
                    <span className="text-ct-xs text-gray-400">
                      {formatDateTime(fb.created_at)}
                    </span>
                  </div>
                  <p className="text-ct-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {fb.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={feedbackEndRef} />
          </div>

          {/* Feedback Input */}
          {canFeedback && (
            <div className="flex items-end gap-2 pt-3 border-t border-gray-100">
              <div className="flex-1">
                <CTInput
                  placeholder="피드백을 입력하세요..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendFeedback();
                    }
                  }}
                />
              </div>
              <CTButton
                variant="primary"
                size="md"
                onClick={handleSendFeedback}
                isLoading={isSendingFeedback}
                disabled={!feedbackText.trim()}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </CTButton>
            </div>
          )}
        </CTCard>
      )}

      {/* Footer metadata */}
      <div className="text-ct-xs text-gray-400 text-center">
        작성일: {formatDateTime(note.created_at)}
        {note.updated_at !== note.created_at && (
          <> &middot; 수정일: {formatDateTime(note.updated_at)}</>
        )}
      </div>
    </div>
  );
}
