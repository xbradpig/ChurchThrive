'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CTStatCard } from '@/components/molecules/CTStatCard';
import { CTCard } from '@/components/molecules/CTCard';
import { CTButton } from '@/components/atoms/CTButton';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { formatDate, truncate, ROLE_LABELS } from '@churchthrive/shared';
import type { Member, Announcement, CellGroup } from '@churchthrive/shared';
import {
  UsersIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  MegaphoneIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  BookOpenIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface DashboardData {
  member: Member | null;
  churchName: string;
  role: string;
  totalMembers: number;
  weeklyAttendance: number;
  newMembers: number;
  activeAnnouncements: number;
  recentAnnouncements: Announcement[];
  myNotesCount: number;
  myCellGroup: CellGroup | null;
  recentActivity: Array<{
    id: string;
    type: string;
    label: string;
    time: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('members')
        .select('*, churches(*)')
        .eq('user_id', user.id)
        .single();

      if (!member) return;

      const churchName = (member as any)?.churches?.name || '교회';
      const role = member.role || 'member';
      const churchId = member.church_id;
      const isAdmin = ['admin', 'pastor', 'staff'].includes(role);

      let totalMembers = 0;
      let weeklyAttendance = 0;
      let newMembers = 0;
      let activeAnnouncements = 0;
      let recentActivity: DashboardData['recentActivity'] = [];

      if (isAdmin) {
        // Total members
        const { count: mc } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .eq('status', 'active');
        totalMembers = mc || 0;

        // Weekly attendance
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const { count: ac } = await supabase
          .from('attendances')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .gte('event_date', weekStart.toISOString().split('T')[0]);
        weeklyAttendance = ac || 0;

        // New members this month
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);
        const { count: nc } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .gte('created_at', firstOfMonth.toISOString());
        newMembers = nc || 0;

        // Recent activity (latest announcements + members)
        const { data: recentMembers } = await supabase
          .from('members')
          .select('id, name, created_at')
          .eq('church_id', churchId)
          .order('created_at', { ascending: false })
          .limit(3);

        recentActivity = (recentMembers || []).map(m => ({
          id: m.id,
          type: 'member',
          label: `${m.name}님이 등록되었습니다`,
          time: m.created_at,
        }));
      }

      // Active announcements (for all)
      const { count: annCount } = await supabase
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('is_published', true);
      activeAnnouncements = annCount || 0;

      // Recent announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .eq('church_id', churchId)
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      // My notes count
      const { count: notesCount } = await supabase
        .from('sermon_notes')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', member.id);

      // My cell group
      let myCellGroup: CellGroup | null = null;
      if (member.cell_group_id) {
        const { data: cg } = await supabase
          .from('cell_groups')
          .select('*')
          .eq('id', member.cell_group_id)
          .single();
        myCellGroup = cg;
      }

      setData({
        member,
        churchName,
        role,
        totalMembers,
        weeklyAttendance,
        newMembers,
        activeAnnouncements,
        recentAnnouncements: announcements || [],
        myNotesCount: notesCount || 0,
        myCellGroup,
        recentActivity,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <CTSpinner size="lg" />
      </div>
    );
  }

  const isAdmin = ['admin', 'pastor', 'staff'].includes(data.role);

  return (
    <div className="ct-container py-6">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
          {data.churchName}
        </h1>
        <p className="text-ct-sm text-[var(--ct-color-text-secondary)] mt-1">
          안녕하세요, {data.member?.name || '사용자'}님
          <span className="ml-2">
            <CTBadge
              label={ROLE_LABELS[data.role as keyof typeof ROLE_LABELS]}
              color={data.role === 'admin' ? 'red' : data.role === 'pastor' ? 'blue' : 'gray'}
              size="sm"
            />
          </span>
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: '교인 검색', href: '/members', Icon: MagnifyingGlassIcon, color: 'bg-blue-50 text-blue-600' },
          { label: '말씀노트 작성', href: '/notes/new', Icon: PencilSquareIcon, color: 'bg-green-50 text-green-600' },
          { label: '출석 체크', href: '/admin/attendance', Icon: ClipboardDocumentCheckIcon, color: 'bg-yellow-50 text-yellow-600' },
          { label: '공지사항', href: '/admin/announcements', Icon: MegaphoneIcon, color: 'bg-red-50 text-red-600' },
        ].map((action) => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-ct-lg shadow-ct-1
              hover:shadow-ct-2 transition-shadow min-h-[88px] justify-center"
          >
            <div className={`w-10 h-10 rounded-ct-md flex items-center justify-center ${action.color}`}>
              <action.Icon className="w-5 h-5" />
            </div>
            <span className="text-ct-sm font-medium text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Admin Stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <CTStatCard
            label="전체 교인"
            value={data.totalMembers}
            icon={<UsersIcon className="w-5 h-5 text-blue-600" />}
            color="blue"
          />
          <CTStatCard
            label="이번주 출석"
            value={data.weeklyAttendance}
            icon={<CalendarDaysIcon className="w-5 h-5 text-green-600" />}
            color="green"
          />
          <CTStatCard
            label="이번달 새가족"
            value={data.newMembers}
            icon={<UserPlusIcon className="w-5 h-5 text-yellow-600" />}
            color="yellow"
          />
          <CTStatCard
            label="활동 공지"
            value={data.activeAnnouncements}
            icon={<MegaphoneIcon className="w-5 h-5 text-red-600" />}
            color="red"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <CTCard title="공지사항">
          {data.recentAnnouncements.length === 0 ? (
            <p className="text-ct-sm text-gray-400 py-4 text-center">
              등록된 공지사항이 없습니다
            </p>
          ) : (
            <div className="space-y-1 -mx-4">
              {data.recentAnnouncements.map((ann) => (
                <button
                  key={ann.id}
                  onClick={() => router.push(`/admin/announcements/${ann.id}`)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-ct-sm font-medium text-gray-800 truncate">
                        {ann.title}
                      </p>
                      {ann.is_pinned && (
                        <CTBadge label="고정" color="blue" size="sm" />
                      )}
                    </div>
                    <p className="text-ct-xs text-gray-400 mt-0.5">
                      {formatDate(ann.created_at, 'relative')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CTCard>

        {/* Admin: Recent Activity / Member: My Info */}
        {isAdmin ? (
          <CTCard title="최근 활동">
            {data.recentActivity.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <p className="text-ct-sm">아직 활동이 없습니다</p>
                <p className="text-ct-xs mt-1">말씀노트를 작성하거나 교인을 등록해보세요</p>
              </div>
            ) : (
              <div className="space-y-1 -mx-4">
                {data.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === 'member' ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      {item.type === 'member' ? (
                        <UserPlusIcon className="w-4 h-4 text-blue-500" />
                      ) : (
                        <DocumentTextIcon className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ct-sm text-gray-700 truncate">{item.label}</p>
                      <p className="text-ct-xs text-gray-400">{formatDate(item.time, 'relative')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CTCard>
        ) : (
          <div className="space-y-4">
            {/* My Notes */}
            <CTCard
              title="내 말씀노트"
              onClick={() => router.push('/notes')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-ct-md bg-green-50 flex items-center justify-center">
                  <BookOpenIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
                    {data.myNotesCount}
                  </p>
                  <p className="text-ct-xs text-gray-400">작성한 노트</p>
                </div>
              </div>
            </CTCard>

            {/* My Cell Group */}
            {data.myCellGroup && (
              <CTCard
                title="내 구역"
                onClick={() => router.push(`/admin/cell-groups/${data.myCellGroup!.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-ct-md bg-blue-50 flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-ct-md font-semibold text-[var(--ct-color-text-heading)]">
                      {data.myCellGroup.name}
                    </p>
                    {data.myCellGroup.meeting_day && (
                      <p className="text-ct-xs text-gray-400">
                        {data.myCellGroup.meeting_day}
                        {data.myCellGroup.meeting_time && ` ${data.myCellGroup.meeting_time}`}
                      </p>
                    )}
                  </div>
                </div>
              </CTCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
