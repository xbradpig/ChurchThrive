'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Member, MemberListFilter, MemberListResult } from '@churchthrive/shared';
import { isChosungOnly } from '@churchthrive/shared';

export function useMembers(initialFilter?: Partial<MemberListFilter>) {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<MemberListFilter>({
    search: '',
    position: null,
    role: null,
    status: 'active',
    cellGroupId: null,
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    pageSize: 20,
    ...initialFilter,
  });

  const supabase = createClient();

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('members')
        .select('*', { count: 'exact' });

      // Search
      if (filter.search) {
        if (isChosungOnly(filter.search)) {
          query = query.like('name_chosung', `${filter.search}%`);
        } else {
          query = query.or(`name.ilike.%${filter.search}%,phone.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
        }
      }

      // Filters
      if (filter.position) query = query.eq('position', filter.position);
      if (filter.role) query = query.eq('role', filter.role);
      if (filter.status) query = query.eq('status', filter.status);
      if (filter.cellGroupId) query = query.eq('cell_group_id', filter.cellGroupId);

      // Sort
      query = query.order(filter.sortBy || 'name', { ascending: filter.sortOrder === 'asc' });

      // Pagination
      const from = ((filter.page || 1) - 1) * (filter.pageSize || 20);
      const to = from + (filter.pageSize || 20) - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      setMembers(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateFilter = useCallback((updates: Partial<MemberListFilter>) => {
    setFilter(prev => ({ ...prev, ...updates, page: updates.page || 1 }));
  }, []);

  const totalPages = Math.ceil(total / (filter.pageSize || 20));

  return {
    members,
    total,
    totalPages,
    isLoading,
    filter,
    updateFilter,
    refresh: fetchMembers,
  };
}
