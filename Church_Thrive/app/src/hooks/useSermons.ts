'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Sermon } from '@churchthrive/shared';

export interface SermonListFilter {
  search: string;
  serviceType: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  preacher: string | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface SermonWithNoteCount extends Sermon {
  note_count: number;
}

export function useSermons(initialFilter?: Partial<SermonListFilter>) {
  const [sermons, setSermons] = useState<SermonWithNoteCount[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<SermonListFilter>({
    search: '',
    serviceType: null,
    dateFrom: null,
    dateTo: null,
    preacher: null,
    sortBy: 'sermon_date',
    sortOrder: 'desc',
    page: 1,
    pageSize: 12,
    ...initialFilter,
  });

  const supabase = createClient();

  const fetchSermons = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get current user's church_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentMember } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!currentMember) return;

      let query = supabase
        .from('sermons')
        .select(`
          *,
          sermon_notes(count)
        `, { count: 'exact' })
        .eq('church_id', currentMember.church_id);

      // Search
      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,preacher_name.ilike.%${filter.search}%`);
      }

      // Filters
      if (filter.serviceType) {
        query = query.eq('service_type', filter.serviceType);
      }

      if (filter.dateFrom) {
        query = query.gte('sermon_date', filter.dateFrom);
      }

      if (filter.dateTo) {
        query = query.lte('sermon_date', filter.dateTo);
      }

      if (filter.preacher) {
        query = query.ilike('preacher_name', `%${filter.preacher}%`);
      }

      // Sort
      query = query.order(filter.sortBy || 'sermon_date', {
        ascending: filter.sortOrder === 'asc',
      });

      // Pagination
      const from = ((filter.page || 1) - 1) * (filter.pageSize || 12);
      const to = from + (filter.pageSize || 12) - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      // Map note counts from the aggregated join
      const mapped: SermonWithNoteCount[] = (data || []).map((sermon: any) => ({
        ...sermon,
        note_count: sermon.sermon_notes?.[0]?.count ?? 0,
      }));

      setSermons(mapped);
      setTotal(count || 0);
    } catch (error) {
      console.error('Failed to fetch sermons:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, supabase]);

  useEffect(() => {
    fetchSermons();
  }, [fetchSermons]);

  const updateFilter = useCallback((updates: Partial<SermonListFilter>) => {
    setFilter((prev) => ({ ...prev, ...updates, page: updates.page || 1 }));
  }, []);

  const totalPages = Math.ceil(total / (filter.pageSize || 12));

  return {
    sermons,
    total,
    totalPages,
    isLoading,
    filter,
    updateFilter,
    refresh: fetchSermons,
  };
}
