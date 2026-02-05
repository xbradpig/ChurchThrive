'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Announcement } from '@churchthrive/shared';

interface AnnouncementFilter {
  search: string;
  status: 'all' | 'published' | 'unpublished' | 'pinned';
  page: number;
  pageSize: number;
}

export function useAnnouncements(initialFilter?: Partial<AnnouncementFilter>) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<AnnouncementFilter>({
    search: '',
    status: 'all',
    page: 1,
    pageSize: 20,
    ...initialFilter,
  });

  const supabase = createClient();

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('announcements')
        .select('*', { count: 'exact' });

      // Search
      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`);
      }

      // Status filter
      if (filter.status === 'published') {
        query = query.eq('is_published', true);
      } else if (filter.status === 'unpublished') {
        query = query.eq('is_published', false);
      } else if (filter.status === 'pinned') {
        query = query.eq('is_pinned', true);
      }

      // Sort: pinned first, then by created_at desc
      query = query
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      // Pagination
      const from = ((filter.page || 1) - 1) * (filter.pageSize || 20);
      const to = from + (filter.pageSize || 20) - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      setAnnouncements(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, supabase]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const updateFilter = useCallback((updates: Partial<AnnouncementFilter>) => {
    setFilter(prev => ({ ...prev, ...updates, page: updates.page || 1 }));
  }, []);

  const create = useCallback(async (data: {
    title: string;
    content: string;
    target_groups?: string[];
    is_pinned?: boolean;
    is_published?: boolean;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: member } = await supabase
        .from('members')
        .select('church_id, id')
        .eq('user_id', user.id)
        .single();

      if (!member) throw new Error('Member not found');

      const { error } = await supabase.from('announcements').insert({
        ...data,
        church_id: member.church_id,
        author_id: member.id,
        target_groups: data.target_groups || null,
        is_pinned: data.is_pinned || false,
        is_published: data.is_published || false,
        published_at: data.is_published ? new Date().toISOString() : null,
      });

      if (error) throw error;
      await fetchAnnouncements();
      return { success: true };
    } catch (error) {
      console.error('Failed to create announcement:', error);
      return { success: false, error };
    }
  }, [supabase, fetchAnnouncements]);

  const update = useCallback(async (id: string, data: {
    title?: string;
    content?: string;
    target_groups?: string[];
    is_pinned?: boolean;
    is_published?: boolean;
  }) => {
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (data.is_published !== undefined) {
        updateData.published_at = data.is_published ? new Date().toISOString() : null;
      }

      const { error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await fetchAnnouncements();
      return { success: true };
    } catch (error) {
      console.error('Failed to update announcement:', error);
      return { success: false, error };
    }
  }, [supabase, fetchAnnouncements]);

  const remove = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAnnouncements();
      return { success: true };
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      return { success: false, error };
    }
  }, [supabase, fetchAnnouncements]);

  const togglePin = useCallback(async (id: string, currentValue: boolean) => {
    return update(id, { is_pinned: !currentValue });
  }, [update]);

  const togglePublish = useCallback(async (id: string, currentValue: boolean) => {
    return update(id, { is_published: !currentValue });
  }, [update]);

  const totalPages = Math.ceil(total / (filter.pageSize || 20));

  return {
    announcements,
    total,
    totalPages,
    isLoading,
    filter,
    updateFilter,
    create,
    update,
    remove,
    togglePin,
    togglePublish,
    refresh: fetchAnnouncements,
  };
}
