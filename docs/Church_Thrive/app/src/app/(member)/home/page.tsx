'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpenIcon,
  BellIcon,
  CalendarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';

interface Announcement {
  id: string;
  title: string;
  created_at: string;
  is_pinned: boolean;
}

interface Sermon {
  id: string;
  title: string;
  bible_verse: string | null;
  sermon_date: string;
}

export default function MemberHomePage() {
  const { member, church } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentSermon, setRecentSermon] = useState<Sermon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!church?.id) return;

      const supabase = createClient();

      // Fetch recent announcements
      const { data: announcementData } = await supabase
        .from('announcements')
        .select('id, title, created_at, is_pinned')
        .eq('church_id', church.id)
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);

      if (announcementData) {
        setAnnouncements(announcementData);
      }

      // Fetch recent sermon
      const { data: sermonData } = await supabase
        .from('sermons')
        .select('id, title, bible_verse, sermon_date')
        .eq('church_id', church.id)
        .order('sermon_date', { ascending: false })
        .limit(1)
        .single();

      if (sermonData) {
        setRecentSermon(sermonData);
      }

      setIsLoading(false);
    }

    fetchData();
  }, [church?.id]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-ct-primary to-green-600 rounded-2xl p-6 text-white">
        <p className="text-green-100 text-sm">{getGreeting()}</p>
        <h1 className="text-2xl font-bold mt-1">
          {member?.name || '성도'}님
        </h1>
        <p className="text-green-100 text-sm mt-2">
          {church?.name}에 오신 것을 환영합니다
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/notes/new"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-ct-primary/30 hover:bg-green-50/50 transition-colors"
        >
          <div className="w-10 h-10 bg-ct-primary/10 rounded-lg flex items-center justify-center">
            <BookOpenIcon className="w-5 h-5 text-ct-primary" />
          </div>
          <div>
            <p className="font-medium text-gray-900">말씀노트</p>
            <p className="text-xs text-gray-500">오늘의 노트 작성</p>
          </div>
        </Link>
        <Link
          href="/announcements"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-ct-primary/30 hover:bg-green-50/50 transition-colors"
        >
          <div className="w-10 h-10 bg-ct-primary/10 rounded-lg flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-ct-primary" />
          </div>
          <div>
            <p className="font-medium text-gray-900">공지사항</p>
            <p className="text-xs text-gray-500">{announcements.length}개의 새 공지</p>
          </div>
        </Link>
      </div>

      {/* Recent Sermon */}
      {recentSermon && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">최근 설교</h2>
          </div>
          <Link
            href={`/notes/sermons/${recentSermon.id}`}
            className="block p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 line-clamp-2">
                  {recentSermon.title}
                </h3>
                {recentSermon.bible_verse && (
                  <p className="text-sm text-ct-primary mt-1">
                    {recentSermon.bible_verse}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {formatDate(recentSermon.sermon_date)}
                </div>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </Link>
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">공지사항</h2>
            <Link href="/announcements" className="text-sm text-ct-primary">
              전체보기
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {announcements.map((announcement) => (
              <Link
                key={announcement.id}
                href={`/announcements/${announcement.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {announcement.is_pinned && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-medium rounded">
                      중요
                    </span>
                  )}
                  <h3 className="font-medium text-gray-900 line-clamp-1 flex-1">
                    {announcement.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(announcement.created_at)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {announcements.length === 0 && !recentSermon && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BellIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">아직 등록된 콘텐츠가 없습니다</p>
        </div>
      )}
    </div>
  );
}
