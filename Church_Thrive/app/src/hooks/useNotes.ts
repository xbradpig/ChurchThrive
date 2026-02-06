'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NoteListFilter } from '@churchthrive/shared';

export interface NoteWithSermon {
  id: string;
  sermon_id: string | null;
  member_id: string;
  title: string;
  content: Record<string, unknown>[] | null;
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
}

export function useNotes(initialFilter?: Partial<NoteListFilter>) {
  const [notes, setNotes] = useState<NoteWithSermon[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<NoteListFilter>({
    search: '',
    sermonId: null,
    serviceType: null,
    dateFrom: null,
    dateTo: null,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    pageSize: 12,
    ...initialFilter,
  });

  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentMember } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!currentMember) return;

      let query = supabase
        .from('sermon_notes')
        .select(`
          *,
          sermons(id, title, preacher_name, sermon_date, service_type, bible_verses)
        `, { count: 'exact' })
        .eq('member_id', currentMember.id);

      // Search
      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,plain_text.ilike.%${filter.search}%`);
      }

      // Filters
      if (filter.sermonId) {
        query = query.eq('sermon_id', filter.sermonId);
      }

      if (filter.dateFrom) {
        query = query.gte('created_at', filter.dateFrom);
      }

      if (filter.dateTo) {
        query = query.lte('created_at', `${filter.dateTo}T23:59:59`);
      }

      // Sort
      query = query.order(filter.sortBy || 'created_at', {
        ascending: filter.sortOrder === 'asc',
      });

      // Pagination
      const from = ((filter.page || 1) - 1) * (filter.pageSize || 12);
      const to = from + (filter.pageSize || 12) - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      // If service type filter is set, filter in-memory (join filter limitation)
      let filtered = (data || []) as NoteWithSermon[];
      if (filter.serviceType) {
        filtered = filtered.filter(
          (n) => n.sermons?.service_type === filter.serviceType
        );
      }

      setNotes(filtered);
      setTotal(count || 0);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, supabase]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const updateFilter = useCallback((updates: Partial<NoteListFilter>) => {
    setFilter((prev) => ({ ...prev, ...updates, page: updates.page || 1 }));
  }, []);

  const totalPages = Math.ceil(total / (filter.pageSize || 12));

  return {
    notes,
    total,
    totalPages,
    isLoading,
    filter,
    updateFilter,
    refresh: fetchNotes,
  };
}
