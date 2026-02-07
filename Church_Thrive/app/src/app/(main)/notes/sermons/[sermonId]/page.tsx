'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SERVICE_TYPE_LABELS } from '@churchthrive/shared';
import { CTButton } from '@/components/atoms/CTButton';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTTag } from '@/components/atoms/CTTag';
import { CTCard } from '@/components/molecules/CTCard';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { CTEmptyState } from '@/components/molecules/CTEmptyState';
import {

  ArrowLeftIcon,
  PencilIcon,
  CalendarDaysIcon,
  UserIcon,
  BookOpenIcon,
  DocumentTextIcon,
  PlusIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

export const runtime = 'edge';

interface SermonDetail {
  id: string;
  church_id: string;
  title: string;
  service_type: string;
  sermon_date: string;
  preacher_name: string | null;
  preacher_id: string | null;
  bible_verses: string[] | null;
  tags: string[] | null;
  created_at: string;
}

interface SermonNote {
  id: string;
  title: string;
  plain_text: string | null;
  is_shared: boolean;
  created_at: string;
  members: {
    id: string;
    name: string;
    photo_url: string | null;
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

function truncateContent(text: string | null, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export default function SermonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sermonId = params.sermonId as string;
  const supabase = createClient();

  const [sermon, setSermon] = useState<SermonDetail | null>(null);
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [currentMemberRole, setCurrentMemberRole] = useState<string | null>(null);

  const fetchSermonDetail = useCallback(async () => {
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

      // Fetch sermon
      const { data: sermonData, error: sermonError } = await supabase
        .from('sermons')
        .select('*')
        .eq('id', sermonId)
        .single();

      if (sermonError) throw sermonError;
      setSermon(sermonData);

      // Fetch notes for this sermon
      // If pastor/admin: show all shared notes + own notes
      // If member: show only own notes
      const isPastorOrAdmin =
        currentMember?.role === 'admin' || currentMember?.role === 'pastor';

      let notesQuery = supabase
        .from('sermon_notes')
        .select(`
          id, title, plain_text, is_shared, created_at,
          members(id, name, photo_url)
        `)
        .eq('sermon_id', sermonId)
        .order('created_at', { ascending: false });

      if (!isPastorOrAdmin && currentMember) {
        // Regular members can only see their own notes
        notesQuery = notesQuery.eq('member_id', currentMember.id);
      } else if (isPastorOrAdmin && currentMember) {
        // Pastors see shared notes + own notes
        notesQuery = notesQuery.or(
          `is_shared.eq.true,member_id.eq.${currentMember.id}`
        );
      }

      const { data: notesData, error: notesError } = await notesQuery;

      if (notesError) throw notesError;
      setNotes((notesData || []) as SermonNote[]);
    } catch (error) {
      console.error('Failed to fetch sermon detail:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sermonId, supabase]);

  useEffect(() => {
    fetchSermonDetail();
  }, [fetchSermonDetail]);

  if (isLoading) {
    return (
      <div className="ct-container py-6 flex items-center justify-center min-h-[50vh]">
        <CTSpinner size="lg" />
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="ct-container py-6">
        <p className="text-center text-gray-500">설교를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isPastorOrAdmin =
    currentMemberRole === 'admin' || currentMemberRole === 'pastor';

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/notes/sermons')}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        {isPastorOrAdmin && (
          <CTButton
            variant="outline"
            size="sm"
            leftIcon={<PencilIcon className="w-4 h-4" />}
            onClick={() => {
              // Future: sermon edit page
            }}
          >
            수정
          </CTButton>
        )}
      </div>

      {/* Sermon Info Card */}
      <CTCard padding="lg" className="mb-6">
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)] mb-4">
          {sermon.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {sermon.service_type && (
            <CTBadge
              label={
                SERVICE_TYPE_LABELS[
                  sermon.service_type as keyof typeof SERVICE_TYPE_LABELS
                ] || sermon.service_type
              }
              color={SERVICE_TYPE_COLORS[sermon.service_type] || 'gray'}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-ct-sm text-gray-600 mb-4">
          {sermon.preacher_name && (
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span>{sermon.preacher_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
            <span>{formatDate(sermon.sermon_date)}</span>
          </div>
        </div>

        {/* Bible Verses */}
        {sermon.bible_verses && sermon.bible_verses.length > 0 && (
          <div>
            <h3 className="text-ct-sm font-medium text-gray-700 mb-2">
              성경 본문
            </h3>
            <div className="flex flex-wrap gap-2">
              {sermon.bible_verses.map((verse, idx) => (
                <CTTag key={idx} label={verse} color="blue" size="md" />
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {sermon.tags && sermon.tags.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {sermon.tags.map((tag, idx) => (
                <CTTag key={idx} label={tag} color="gray" size="sm" />
              ))}
            </div>
          </div>
        )}
      </CTCard>

      {/* Notes Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-ct-lg font-semibold text-[var(--ct-color-text-heading)]">
              {isPastorOrAdmin ? '공유된 말씀노트' : '내 말씀노트'}
            </h2>
            {notes.length > 0 && (
              <CTBadge count={notes.length} color="blue" size="sm" />
            )}
          </div>
          <CTButton
            variant="outline"
            size="sm"
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => router.push('/notes/new')}
          >
            노트 작성
          </CTButton>
        </div>

        {notes.length === 0 ? (
          <div className="bg-white rounded-ct-lg shadow-ct-1">
            <CTEmptyState
              icon={<BookOpenIcon className="w-16 h-16" />}
              title="아직 노트가 없습니다"
              description={
                isPastorOrAdmin
                  ? '아직 이 설교에 대한 공유된 노트가 없습니다.'
                  : '이 설교에 대한 말씀노트를 작성해보세요.'
              }
              actionLabel="노트 작성"
              onAction={() => router.push('/notes/new')}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className="w-full bg-white rounded-ct-lg shadow-ct-1 p-4 text-left hover:shadow-ct-2 transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Author Avatar */}
                  {note.members && (
                    <CTAvatar
                      src={note.members.photo_url}
                      name={note.members.name}
                      size="sm"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-ct-md font-medium text-gray-800 truncate">
                          {note.title || '제목 없음'}
                        </h3>
                        <p className="text-ct-sm text-gray-500 mt-0.5">
                          {note.members?.name || '알 수 없음'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {note.is_shared && (
                          <ShareIcon className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-ct-xs text-gray-400">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                    </div>

                    {note.plain_text && (
                      <p className="text-ct-sm text-gray-500 mt-2 line-clamp-2">
                        {truncateContent(note.plain_text)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
