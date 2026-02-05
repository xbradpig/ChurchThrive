'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTCheckbox } from '@/components/atoms/CTCheckbox';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { CTCard } from '@/components/molecules/CTCard';
import { CTSearchBar } from '@/components/molecules/CTSearchBar';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTEmptyState } from '@/components/molecules/CTEmptyState';
import { cn } from '@/lib/cn';
import type { Member } from '@churchthrive/shared';
import {
  CalendarDaysIcon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────
type EventType = 'worship' | 'meeting' | 'training' | 'cell_group' | 'other';

interface AttendanceMember extends Member {
  isPresent: boolean;
}

interface WeeklyStats {
  label: string;
  date: string;
  present: number;
  total: number;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'worship', label: '주일오전' },
  { value: 'meeting', label: '주일오후' },
  { value: 'training', label: '수요예배' },
  { value: 'cell_group', label: '금요예배' },
  { value: 'other', label: '새벽예배' },
];

const POSITION_LABELS: Record<string, string> = {
  elder: '장로',
  ordained_deacon: '안수집사',
  deacon: '집사',
  saint: '성도',
};

// ─── Helpers ──────────────────────────────────────────────────────────
function formatDateKorean(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const day = days[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${day})`;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type TabMode = 'check' | 'history';

// ─── Component ────────────────────────────────────────────────────────
export default function AttendancePage() {
  const router = useRouter();
  const supabase = createClient();

  const [date, setDate] = useState(new Date());
  const [eventType, setEventType] = useState<EventType>('worship');
  const [members, setMembers] = useState<AttendanceMember[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [churchId, setChurchId] = useState<string>('');
  const [tabMode, setTabMode] = useState<TabMode>('check');
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // ─── Fetch Data ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: me } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!me) return;
      setChurchId(me.church_id);

      // Fetch all active members
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('church_id', me.church_id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      // Fetch existing attendance for selected date/event
      const dateStr = toDateString(date);
      const { data: attendanceData } = await supabase
        .from('attendances')
        .select('member_id')
        .eq('church_id', me.church_id)
        .eq('event_date', dateStr)
        .eq('event_type', eventType);

      const presentIds = new Set(
        (attendanceData || []).map((a) => a.member_id)
      );

      const mapped: AttendanceMember[] = (memberData || []).map((m) => ({
        ...m,
        isPresent: presentIds.has(m.id),
      }));

      setMembers(mapped);
      setHasChanges(false);

      // Fetch weekly stats (last 4 weeks)
      const totalMembers = (memberData || []).length;
      const stats: WeeklyStats[] = [];
      const labels = ['4주 전', '3주 전', '2주 전', '이번 주'];

      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const startStr = toDateString(weekStart);
        const endStr = toDateString(weekEnd);

        const { count } = await supabase
          .from('attendances')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', me.church_id)
          .eq('event_type', eventType)
          .gte('event_date', startStr)
          .lt('event_date', endStr);

        stats.push({
          label: labels[3 - i],
          date: startStr,
          present: count || 0,
          total: totalMembers,
        });
      }

      setWeeklyStats(stats);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, date, eventType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Toggle / Bulk ──────────────────────────────────────────────────
  function toggleMember(memberId: string) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, isPresent: !m.isPresent } : m
      )
    );
    setHasChanges(true);
  }

  function bulkCheck(checked: boolean) {
    setMembers((prev) => prev.map((m) => ({ ...m, isPresent: checked })));
    setHasChanges(true);
  }

  function changeDate(days: number) {
    setDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  }

  // ─── Save ───────────────────────────────────────────────────────────
  async function handleSave() {
    if (!churchId) return;
    setIsSaving(true);
    try {
      const dateStr = toDateString(date);

      // Delete existing records for this date/event
      const { error: deleteError } = await supabase
        .from('attendances')
        .delete()
        .eq('church_id', churchId)
        .eq('event_date', dateStr)
        .eq('event_type', eventType);

      if (deleteError) throw deleteError;

      // Insert new records for checked members
      const checkedMembers = members
        .filter((m) => m.isPresent)
        .map((m) => ({
          church_id: churchId,
          member_id: m.id,
          event_date: dateStr,
          event_type: eventType,
          check_method: 'manual' as const,
        }));

      if (checkedMembers.length > 0) {
        const { error: insertError } = await supabase
          .from('attendances')
          .insert(checkedMembers);

        if (insertError) throw insertError;
      }

      setHasChanges(false);
      alert(`출석이 저장되었습니다. (${checkedMembers.length}/${members.length}명)`);
    } catch {
      alert('출석 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  // ─── Filtered / Stats ───────────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.phone?.includes(q)
    );
  }, [members, search]);

  const presentCount = members.filter((m) => m.isPresent).length;
  const totalCount = members.length;
  const attendanceRate =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const maxStat = Math.max(...weeklyStats.map((s) => s.present), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CTSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
            출석 관리
          </h1>
          <p className="text-ct-sm text-gray-500 mt-1">예배 출석을 기록하고 관리합니다</p>
        </div>
        <CTButton
          variant="outline"
          size="sm"
          leftIcon={<QrCodeIcon className="w-4 h-4" />}
          onClick={() => router.push('/admin/attendance/qr')}
        >
          QR 출석
        </CTButton>
      </div>

      {/* Tab switch: Check / History */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-ct-md p-1 w-fit">
        <button
          onClick={() => setTabMode('check')}
          className={cn(
            'px-4 py-2 rounded-ct-md text-ct-sm font-medium transition-colors min-h-[44px]',
            tabMode === 'check'
              ? 'bg-white text-ct-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          출석 체크
        </button>
        <button
          onClick={() => setTabMode('history')}
          className={cn(
            'px-4 py-2 rounded-ct-md text-ct-sm font-medium transition-colors min-h-[44px]',
            tabMode === 'history'
              ? 'bg-white text-ct-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          출석 현황
        </button>
      </div>

      {/* ────── Check Tab ────── */}
      {tabMode === 'check' && (
        <>
          {/* Date Selector */}
          <div className="flex items-center gap-3 mb-4 bg-white rounded-ct-lg shadow-ct-1 p-4">
            <CalendarDaysIcon className="w-5 h-5 text-ct-primary shrink-0" />
            <button
              onClick={() => changeDate(-1)}
              className="flex items-center justify-center rounded-full hover:bg-gray-100 min-w-[44px] min-h-[44px]"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex-1 text-center">
              <input
                type="date"
                value={toDateString(date)}
                onChange={(e) => setDate(new Date(e.target.value + 'T00:00:00'))}
                className="bg-transparent text-ct-md font-semibold text-gray-800 text-center cursor-pointer border-none focus:outline-none"
              />
              <p className="text-ct-xs text-gray-400">{formatDateKorean(date)}</p>
            </div>
            <button
              onClick={() => changeDate(1)}
              className="flex items-center justify-center rounded-full hover:bg-gray-100 min-w-[44px] min-h-[44px]"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            </button>
            <CTButton
              variant="ghost"
              size="sm"
              onClick={() => setDate(new Date())}
            >
              오늘
            </CTButton>
          </div>

          {/* Event Type Tabs */}
          <div className="flex overflow-x-auto gap-2 mb-4 pb-1 scrollbar-hide">
            {EVENT_TYPES.map((et) => (
              <button
                key={et.value}
                onClick={() => setEventType(et.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-ct-sm font-medium whitespace-nowrap transition-colors min-h-[44px]',
                  eventType === et.value
                    ? 'bg-ct-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {et.label}
              </button>
            ))}
          </div>

          {/* Stats Summary Bar */}
          <div className="flex items-center justify-between bg-ct-primary-50 rounded-ct-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-ct-sm font-medium text-green-700">
                  출석 {presentCount}명
                </span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-ct-sm text-gray-600">
                전체 {totalCount}명
              </span>
              <CTBadge
                label={`${attendanceRate}%`}
                color={attendanceRate >= 70 ? 'green' : attendanceRate >= 40 ? 'yellow' : 'red'}
                size="sm"
              />
            </div>
            {hasChanges && (
              <CTBadge label="저장 필요" color="yellow" size="sm" />
            )}
          </div>

          {/* Search + Bulk Actions */}
          <div className="bg-white rounded-ct-lg shadow-ct-1 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="flex-1">
                  <CTSearchBar
                    placeholder="이름, 전화번호 검색"
                    onSearch={setSearch}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CTButton variant="ghost" size="sm" onClick={() => bulkCheck(true)}>
                  전체 출석
                </CTButton>
                <CTButton variant="ghost" size="sm" onClick={() => bulkCheck(false)}>
                  전체 초기화
                </CTButton>
                <span className="text-ct-xs text-gray-400 ml-auto">
                  {presentCount} / {totalCount}명 선택됨
                </span>
              </div>
            </div>

            {/* Member Rows */}
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <CTEmptyState
                  title="교인이 없습니다"
                  description={
                    search
                      ? '검색 결과가 없습니다.'
                      : '등록된 활동 교인이 없습니다.'
                  }
                />
              ) : (
                filteredMembers.map((member) => {
                  const isChecked = member.isPresent;
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors text-left min-h-[56px]',
                        isChecked ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
                      )}
                    >
                      <CTCheckbox
                        checked={isChecked}
                        onChange={() => toggleMember(member.id)}
                        size="lg"
                      />
                      <CTAvatar name={member.name} src={member.photo_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-ct-md font-medium text-gray-800 truncate">
                            {member.name}
                          </p>
                          {member.position && (
                            <span className="text-ct-xs text-gray-400">
                              {POSITION_LABELS[member.position] || ''}
                            </span>
                          )}
                        </div>
                      </div>
                      {isChecked && (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-4 flex justify-center">
            <CTButton
              variant="primary"
              size="lg"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!hasChanges}
              fullWidth
              className="max-w-md shadow-ct-3"
            >
              출석 저장 ({presentCount}명)
            </CTButton>
          </div>
        </>
      )}

      {/* ────── History Tab ────── */}
      {tabMode === 'history' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <CTCard className="text-center">
              <div className="flex flex-col items-center">
                <CheckCircleIcon className="w-6 h-6 text-green-500 mb-1" />
                <p className="text-ct-2xl font-bold text-green-600">{presentCount}</p>
                <p className="text-ct-xs text-gray-400">출석</p>
              </div>
            </CTCard>
            <CTCard className="text-center">
              <div className="flex flex-col items-center">
                <XCircleIcon className="w-6 h-6 text-gray-400 mb-1" />
                <p className="text-ct-2xl font-bold text-gray-600">
                  {totalCount - presentCount}
                </p>
                <p className="text-ct-xs text-gray-400">결석</p>
              </div>
            </CTCard>
            <CTCard className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 mb-1 flex items-center justify-center">
                  <span className="text-ct-sm font-bold text-ct-primary">%</span>
                </div>
                <p className="text-ct-2xl font-bold text-ct-primary">{attendanceRate}%</p>
                <p className="text-ct-xs text-gray-400">출석률</p>
              </div>
            </CTCard>
          </div>

          {/* Weekly Bar Chart */}
          <CTCard title="최근 4주 출석 현황">
            <div className="space-y-4 mt-2">
              {weeklyStats.map((week) => {
                const pct =
                  week.total > 0
                    ? Math.round((week.present / week.total) * 100)
                    : 0;
                return (
                  <div key={week.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-ct-sm font-medium text-gray-700">
                          {week.label}
                        </span>
                        <span className="text-ct-xs text-gray-400 ml-2">{week.date}</span>
                      </div>
                      <span className="text-ct-sm font-semibold text-gray-800">
                        {week.present}명 / {week.total}명 ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          pct >= 70
                            ? 'bg-ct-primary'
                            : pct >= 40
                              ? 'bg-yellow-500'
                              : 'bg-red-400'
                        )}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CTCard>

          {/* Column Chart */}
          <CTCard title="주간 출석 비교">
            <div className="flex items-end gap-4 h-40 mt-2">
              {weeklyStats.map((week) => {
                const heightPct = Math.max((week.present / maxStat) * 100, 4);
                const rate =
                  week.total > 0
                    ? Math.round((week.present / week.total) * 100)
                    : 0;
                return (
                  <div
                    key={week.label}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-ct-xs font-medium text-gray-600">
                      {week.present}명
                    </span>
                    <div className="w-full flex justify-center">
                      <div
                        className="w-12 rounded-t-ct-md bg-ct-primary transition-all duration-300"
                        style={{ height: `${heightPct}%`, minHeight: '4px' }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{week.label}</span>
                    <span className="text-[10px] text-gray-300">{rate}%</span>
                  </div>
                );
              })}
            </div>
          </CTCard>
        </div>
      )}
    </div>
  );
}
