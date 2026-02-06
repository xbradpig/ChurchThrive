'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTCard } from '@/components/molecules/CTCard';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTEmptyState } from '@/components/molecules/CTEmptyState';
import type { CellGroup, Member } from '@churchthrive/shared';
import {
  PlusIcon,
  UserGroupIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface CellGroupWithDetails extends CellGroup {
  leader?: Member | null;
  memberCount: number;
}

export default function CellGroupsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [groups, setGroups] = useState<CellGroupWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!member) return;

      // Fetch cell groups
      const { data: cellGroups, error } = await supabase
        .from('cell_groups')
        .select('*')
        .eq('church_id', member.church_id)
        .order('name', { ascending: true });

      if (error) throw error;

      // Fetch leaders
      const leaderIds = (cellGroups || [])
        .map(g => g.leader_id)
        .filter(Boolean) as string[];

      let leaders: Member[] = [];
      if (leaderIds.length > 0) {
        const { data: leaderData } = await supabase
          .from('members')
          .select('*')
          .in('id', leaderIds);
        leaders = leaderData || [];
      }

      // Fetch member counts
      const { data: memberCounts } = await supabase
        .from('members')
        .select('cell_group_id')
        .eq('church_id', member.church_id)
        .eq('status', 'active')
        .not('cell_group_id', 'is', null);

      const countMap: Record<string, number> = {};
      (memberCounts || []).forEach((m) => {
        if (m.cell_group_id) {
          countMap[m.cell_group_id] = (countMap[m.cell_group_id] || 0) + 1;
        }
      });

      const groupsWithDetails: CellGroupWithDetails[] = (cellGroups || []).map(g => ({
        ...g,
        leader: leaders.find(l => l.id === g.leader_id) || null,
        memberCount: countMap[g.id] || 0,
      }));

      setGroups(groupsWithDetails);
    } catch (error) {
      console.error('Failed to fetch cell groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
            구역/셀 관리
          </h1>
          <p className="text-ct-sm text-gray-500 mt-1">전체 {groups.length}개 구역</p>
        </div>
        <CTButton
          variant="primary"
          size="md"
          leftIcon={<PlusIcon />}
          onClick={() => router.push('/admin/cell-groups/new')}
        >
          구역 추가
        </CTButton>
      </div>

      {/* Groups Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <CTSpinner size="lg" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-ct-lg shadow-ct-1">
          <CTEmptyState
            icon={<UserGroupIcon className="w-16 h-16" />}
            title="등록된 구역이 없습니다"
            description="구역/셀 그룹을 추가하여 소그룹을 관리해보세요."
            actionLabel="구역 추가"
            onAction={() => router.push('/admin/cell-groups/new')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <CTCard
              key={group.id}
              onClick={() => router.push(`/admin/cell-groups/${group.id}`)}
              className="hover:shadow-ct-2 transition-shadow"
            >
              {/* Group Name & Member Count */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-ct-md font-semibold text-[var(--ct-color-text-heading)]">
                  {group.name}
                </h3>
                <div className="flex items-center gap-1 text-ct-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  <UserGroupIcon className="w-3.5 h-3.5" />
                  {group.memberCount}명
                </div>
              </div>

              {/* Leader */}
              {group.leader && (
                <div className="flex items-center gap-2 mb-3">
                  <CTAvatar name={group.leader.name} src={group.leader.photo_url} size="xs" />
                  <span className="text-ct-sm text-gray-600">
                    {group.leader.name} (리더)
                  </span>
                </div>
              )}

              {/* Meeting Info */}
              <div className="space-y-1.5">
                {group.meeting_day && (
                  <div className="flex items-center gap-2 text-ct-xs text-gray-400">
                    <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{group.meeting_day}</span>
                  </div>
                )}
                {group.meeting_time && (
                  <div className="flex items-center gap-2 text-ct-xs text-gray-400">
                    <ClockIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{group.meeting_time}</span>
                  </div>
                )}
                {group.meeting_place && (
                  <div className="flex items-center gap-2 text-ct-xs text-gray-400">
                    <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{group.meeting_place}</span>
                  </div>
                )}
              </div>
            </CTCard>
          ))}
        </div>
      )}
    </div>
  );
}
