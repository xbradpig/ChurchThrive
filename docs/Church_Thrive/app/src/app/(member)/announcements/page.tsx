'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
}

export default function AnnouncementsPage() {
  const { church } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      if (!church?.id) return;

      const supabase = createClient();
      const { data } = await supabase
        .from('announcements')
        .select('id, title, content, created_at, is_pinned')
        .eq('church_id', church.id)
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (data) {
        setAnnouncements(data);
      }
      setIsLoading(false);
    }

    fetchAnnouncements();
  }, [church?.id]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function truncateContent(content: string, maxLength: number = 100) {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-1 -ml-1 text-gray-600">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">공지사항</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">등록된 공지사항이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <Link
                key={announcement.id}
                href={`/announcements/${announcement.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-ct-primary/30 transition-colors"
              >
                <div className="flex items-start gap-2">
                  {announcement.is_pinned && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-medium rounded flex-shrink-0 mt-0.5">
                      중요
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-1">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {truncateContent(announcement.content)}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(announcement.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
