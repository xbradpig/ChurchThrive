'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTSearchBar } from '@/components/molecules/CTSearchBar';
import { CTCard } from '@/components/molecules/CTCard';
import { cn } from '@/lib/cn';
import {
  ArrowLeftIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────
type EventType = 'worship' | 'meeting' | 'training' | 'cell_group' | 'other';

interface AttendedMember {
  id: string;
  name: string;
  position: string | null;
  checkedAt: string;
}

interface SearchResult {
  id: string;
  name: string;
  phone: string;
  position: string | null;
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  worship: '주일오전',
  meeting: '주일오후',
  training: '수요예배',
  cell_group: '금요예배',
  other: '새벽예배',
};

const POSITION_LABELS: Record<string, string> = {
  elder: '장로',
  ordained_deacon: '안수집사',
  deacon: '집사',
  saint: '성도',
};

// ─── Helpers ──────────────────────────────────────────────────────────
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Component ────────────────────────────────────────────────────────
export default function QRAttendancePage() {
  const router = useRouter();
  const supabase = createClient();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const [churchId, setChurchId] = useState<string>('');
  const [eventType, setEventType] = useState<EventType>('worship');
  const [sessionToken] = useState(generateSessionToken);
  const [attendedMembers, setAttendedMembers] = useState<AttendedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const today = toDateString(new Date());

  // ─── Init ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
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

        // Load existing attendance for today
        const { data: existing } = await supabase
          .from('attendances')
          .select('member_id, checked_in_at')
          .eq('church_id', me.church_id)
          .eq('event_date', today)
          .eq('event_type', eventType);

        if (existing && existing.length > 0) {
          const memberIds = existing.map((e) => e.member_id);
          const { data: memberData } = await supabase
            .from('members')
            .select('id, name, position')
            .in('id', memberIds);

          const attended: AttendedMember[] = (existing || []).map((e) => {
            const member = (memberData || []).find((m) => m.id === e.member_id);
            return {
              id: e.member_id,
              name: member?.name || '알 수 없음',
              position: member?.position || null,
              checkedAt: e.checked_in_at,
            };
          });
          setAttendedMembers(attended);
        }
      } catch (error) {
        console.error('Failed to init QR page:', error);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [supabase, eventType, today]);

  // ─── Generate QR Code ───────────────────────────────────────────────
  useEffect(() => {
    if (!churchId) return;

    const qrContent = JSON.stringify({
      churchId,
      eventType,
      date: today,
      token: sessionToken,
    });

    // Generate QR as inline SVG data URL using a simple matrix approach
    async function generateQR() {
      try {
        // Dynamically import qrcode library or use a simple encoding approach
        // We use a canvas-based approach with a lightweight QR encoding
        const QRCode = (await import('qrcode')).default;
        const dataUrl = await QRCode.toDataURL(qrContent, {
          width: 300,
          margin: 2,
          color: {
            dark: '#228B22',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(dataUrl);
      } catch {
        // Fallback: show QR content as text if qrcode package not available
        // Build a simple SVG placeholder
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="90" text-anchor="middle" font-size="14" fill="#228B22">QR Code</text>
          <text x="100" y="115" text-anchor="middle" font-size="10" fill="#666">${eventType}</text>
          <text x="100" y="135" text-anchor="middle" font-size="10" fill="#666">${today}</text>
        </svg>`;
        setQrDataUrl(`data:image/svg+xml;base64,${btoa(svg)}`);
      }
    }

    generateQR();
  }, [churchId, eventType, today, sessionToken]);

  // ─── Manual Member Search ──────────────────────────────────────────
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim() || !churchId) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await supabase
          .from('members')
          .select('id, name, phone, position')
          .eq('church_id', churchId)
          .eq('status', 'active')
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(10);

        // Filter out already attended members
        const attendedIds = new Set(attendedMembers.map((m) => m.id));
        setSearchResults(
          (data || []).filter((m) => !attendedIds.has(m.id))
        );
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [supabase, churchId, attendedMembers]
  );

  // ─── Add Attendance Manually ───────────────────────────────────────
  const addAttendance = useCallback(
    async (member: SearchResult) => {
      if (!churchId) return;

      try {
        const { error } = await supabase.from('attendances').insert({
          church_id: churchId,
          member_id: member.id,
          event_date: today,
          event_type: eventType,
          check_method: 'manual' as const,
        });

        if (error) {
          if (error.code === '23505') {
            alert(`${member.name}님은 이미 출석 처리되었습니다.`);
            return;
          }
          throw error;
        }

        setAttendedMembers((prev) => [
          {
            id: member.id,
            name: member.name,
            position: member.position,
            checkedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setSearchQuery('');
        setSearchResults([]);
      } catch (error) {
        console.error('Failed to add attendance:', error);
        alert('출석 등록에 실패했습니다.');
      }
    },
    [supabase, churchId, today, eventType]
  );

  // ─── Render ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CTSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="ct-container py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/attendance')}
          className="flex items-center gap-1 text-ct-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          출석 관리로 돌아가기
        </button>
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
          QR 출석
        </h1>
        <p className="text-ct-sm text-gray-500 mt-1">
          QR 코드를 스캔하거나 수동으로 출석을 등록합니다
        </p>
      </div>

      {/* Event Type Selector */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-1 scrollbar-hide">
        {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setEventType(value as EventType)}
            className={cn(
              'px-4 py-2 rounded-full text-ct-sm font-medium whitespace-nowrap transition-colors min-h-[44px]',
              eventType === value
                ? 'bg-ct-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <CTCard title="QR 코드">
          <div className="flex flex-col items-center py-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="출석 QR 코드"
                className="w-64 h-64 sm:w-72 sm:h-72 rounded-ct-lg border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-ct-lg flex items-center justify-center">
                <CTSpinner size="lg" />
              </div>
            )}
            <div className="text-center mt-4">
              <p className="text-ct-sm font-medium text-gray-700">
                {EVENT_TYPE_LABELS[eventType]} - {today}
              </p>
              <p className="text-ct-xs text-gray-400 mt-1">
                이 QR 코드를 교인에게 보여주세요
              </p>
            </div>
            <CTButton
              variant="outline"
              size="sm"
              leftIcon={<ArrowPathIcon className="w-4 h-4" />}
              className="mt-3"
              onClick={() => {
                // Regenerate handled by state
                window.location.reload();
              }}
            >
              새로고침
            </CTButton>
          </div>
        </CTCard>

        {/* Manual Entry + Attendance Count */}
        <div className="space-y-6">
          {/* Attendance Counter */}
          <CTCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-ct-primary-50 flex items-center justify-center">
                  <QrCodeIcon className="w-6 h-6 text-ct-primary" />
                </div>
                <div>
                  <p className="text-ct-sm text-gray-500">실시간 출석 인원</p>
                  <p className="text-ct-2xl font-bold text-ct-primary">
                    {attendedMembers.length}명
                  </p>
                </div>
              </div>
              <CTBadge
                label={EVENT_TYPE_LABELS[eventType]}
                color="green"
                size="sm"
              />
            </div>
          </CTCard>

          {/* Manual Entry */}
          <CTCard title="수동 출석 등록">
            <div className="space-y-3">
              <CTSearchBar
                placeholder="이름 또는 전화번호로 검색"
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                debounceMs={200}
              />

              {/* Search Results */}
              {isSearching && (
                <div className="flex justify-center py-3">
                  <CTSpinner size="sm" />
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="border rounded-ct-md divide-y divide-gray-100 max-h-[200px] overflow-y-auto">
                  {searchResults.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => addAttendance(member)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors text-left min-h-[44px]"
                    >
                      <div>
                        <span className="text-ct-sm font-medium text-gray-800">
                          {member.name}
                        </span>
                        {member.position && (
                          <span className="text-ct-xs text-gray-400 ml-2">
                            {POSITION_LABELS[member.position] || ''}
                          </span>
                        )}
                      </div>
                      <UserPlusIcon className="w-5 h-5 text-ct-primary" />
                    </button>
                  ))}
                </div>
              )}

              {!isSearching && searchQuery && searchResults.length === 0 && (
                <p className="text-ct-sm text-gray-400 text-center py-3">
                  검색 결과가 없습니다
                </p>
              )}
            </div>
          </CTCard>

          {/* Recent Attendance List */}
          <CTCard title="오늘 출석 현황">
            {attendedMembers.length === 0 ? (
              <p className="text-ct-sm text-gray-400 text-center py-4">
                아직 출석한 교인이 없습니다
              </p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto -mx-4">
                {attendedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-ct-sm font-medium text-gray-800">
                        {member.name}
                      </span>
                      {member.position && (
                        <span className="text-ct-xs text-gray-400 ml-2">
                          {POSITION_LABELS[member.position] || ''}
                        </span>
                      )}
                    </div>
                    <span className="text-ct-xs text-gray-400 shrink-0">
                      {new Date(member.checkedAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CTCard>
        </div>
      </div>
    </div>
  );
}
