'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CTStatCard } from '@/components/molecules/CTStatCard';
import { CTCard } from '@/components/molecules/CTCard';
import { CTButton } from '@/components/atoms/CTButton';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { formatDate, truncate } from '@churchthrive/shared';
import {
  UsersIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  MegaphoneIcon,
  PlusIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalMembers: number;
  weeklyAttendanceRate: number;
  newMembersThisMonth: number;
  activeAnnouncements: number;
}

interface RecentAnnouncement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_published: boolean;
  created_at: string;
}

interface WeeklyAttendance {
  label: string;
  count: number;
  total: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    weeklyAttendanceRate: 0,
    newMembersThisMonth: 0,
    activeAnnouncements: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<RecentAnnouncement[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
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
      const churchId = member.church_id;

      // Total members
      const { count: totalMembers } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('status', 'active');

      // New members this month
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);
      const { count: newMembers } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .gte('created_at', firstOfMonth.toISOString());

      // Active announcements
      const { count: activeAnn } = await supabase
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('is_published', true);

      // Recent announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id, title, content, is_pinned, is_published, created_at')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Weekly attendance (last 4 weeks)
      const weeks: WeeklyAttendance[] = [];
      const weekLabels = ['4주 전', '3주 전', '2주 전', '이번 주'];
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(start.getDate() - start.getDay() - i * 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const { count: attendCount } = await supabase
          .from('attendances')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .gte('event_date', start.toISOString().split('T')[0])
          .lt('event_date', end.toISOString().split('T')[0]);

        weeks.push({
          label: weekLabels[3 - i],
          count: attendCount || 0,
          total: totalMembers || 1,
        });
      }

      const currentWeekRate = weeks[3]
        ? Math.round((weeks[3].count / Math.max(weeks[3].total, 1)) * 100)
        : 0;

      setStats({
        totalMembers: totalMembers || 0,
        weeklyAttendanceRate: currentWeekRate,
        newMembersThisMonth: newMembers || 0,
        activeAnnouncements: activeAnn || 0,
      });
      setRecentAnnouncements(announcements || []);
      setWeeklyData(weeks);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CTSpinner size="lg" />
      </div>
    );
  }

  const maxAttendance = Math.max(...weeklyData.map(w => w.count), 1);

  return (
    <div className="ct-container py-6">
      <div className="mb-6">
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
          교회행정 대시보드
        </h1>
        <p className="text-ct-sm text-[var(--ct-color-text-secondary)] mt-1">
          교회 전체 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CTStatCard
          label="전체 교인수"
          value={stats.totalMembers}
          icon={<UsersIcon className="w-5 h-5 text-blue-600" />}
          color="blue"
        />
        <CTStatCard
          label="이번주 출석률"
          value={`${stats.weeklyAttendanceRate}%`}
          icon={<CalendarDaysIcon className="w-5 h-5 text-green-600" />}
          color="green"
        />
        <CTStatCard
          label="이번달 새가족"
          value={stats.newMembersThisMonth}
          icon={<UserPlusIcon className="w-5 h-5 text-yellow-600" />}
          color="yellow"
        />
        <CTStatCard
          label="활동 공지"
          value={stats.activeAnnouncements}
          icon={<MegaphoneIcon className="w-5 h-5 text-red-600" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Announcements */}
        <CTCard title="최근 공지사항">
          {recentAnnouncements.length === 0 ? (
            <p className="text-ct-sm text-gray-400 py-4 text-center">
              등록된 공지사항이 없습니다
            </p>
          ) : (
            <div className="space-y-1 -mx-4">
              {recentAnnouncements.map((ann) => (
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
                      {truncate(ann.content, 40)} &middot; {formatDate(ann.created_at, 'relative')}
                    </p>
                  </div>
                  {!ann.is_published && (
                    <CTBadge label="미게시" color="gray" size="sm" />
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <CTButton
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => router.push('/admin/announcements')}
            >
              전체 보기
            </CTButton>
          </div>
        </CTCard>

        {/* Weekly Attendance Chart */}
        <CTCard title="주간 출석 현황">
          <div className="flex items-end gap-3 h-40 mt-2">
            {weeklyData.map((week) => {
              const heightPct = Math.max((week.count / maxAttendance) * 100, 4);
              return (
                <div key={week.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-ct-xs font-medium text-gray-600">
                    {week.count}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-10 rounded-t-ct-md bg-ct-primary transition-all duration-300"
                      style={{ height: `${heightPct}%`, minHeight: '4px' }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{week.label}</span>
                </div>
              );
            })}
          </div>
        </CTCard>
      </div>

      {/* Quick Actions */}
      <CTCard title="빠른 작업">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CTButton
            variant="outline"
            size="lg"
            leftIcon={<PlusIcon />}
            fullWidth
            onClick={() => router.push('/admin/announcements/new')}
          >
            공지 작성
          </CTButton>
          <CTButton
            variant="outline"
            size="lg"
            leftIcon={<ClipboardDocumentCheckIcon />}
            fullWidth
            onClick={() => router.push('/admin/attendance')}
          >
            출석 체크
          </CTButton>
          <CTButton
            variant="outline"
            size="lg"
            leftIcon={<UserPlusIcon />}
            fullWidth
            onClick={() => router.push('/members/new')}
          >
            교인 추가
          </CTButton>
        </div>
      </CTCard>
    </div>
  );
}
