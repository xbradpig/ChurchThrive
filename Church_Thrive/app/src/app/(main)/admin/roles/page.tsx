'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CTCard } from '@/components/molecules/CTCard';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTCheckbox } from '@/components/atoms/CTCheckbox';
import { CTButton } from '@/components/atoms/CTButton';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTModal } from '@/components/organisms/CTModal';
import { toast } from '@/components/organisms/CTToast';
import { ROLE_LABELS, ROLES } from '@churchthrive/shared';
import type { Member, UserRole } from '@churchthrive/shared';
import {
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const ROLE_COLORS: Record<string, 'red' | 'blue' | 'green' | 'yellow' | 'gray'> = {
  admin: 'red',
  pastor: 'blue',
  staff: 'green',
  leader: 'yellow',
  member: 'gray',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: '교회 관리 전체 권한',
  pastor: '교인관리, 말씀노트 피드백',
  staff: '교인관리, 출석, 공지',
  leader: '구역/셀 관리',
  member: '기본 교인 권한',
};

export default function RolesPage() {
  const supabase = createClient();

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkRole, setBulkRole] = useState<UserRole>('member');
  const [isAssigning, setIsAssigning] = useState(false);
  const [changingRole, setChangingRole] = useState<{ memberId: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('member');

  const fetchMembers = useCallback(async () => {
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

      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('church_id', member.church_id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      setMembers(data || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Group members by role
  const membersByRole: Record<string, Member[]> = {};
  ROLES.forEach(role => {
    membersByRole[role] = members.filter(m => m.role === role);
  });

  function toggleSelect(memberId: string) {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }

  async function handleChangeRole(memberId: string, role: UserRole) {
    try {
      const { error } = await supabase
        .from('members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('역할이 변경되었습니다.');
      setChangingRole(null);
      await fetchMembers();
    } catch {
      toast.error('역할 변경에 실패했습니다.');
    }
  }

  async function handleBulkAssign() {
    if (selectedMembers.size === 0) return;
    setIsAssigning(true);
    try {
      const memberIds = Array.from(selectedMembers);
      for (const id of memberIds) {
        const { error } = await supabase
          .from('members')
          .update({ role: bulkRole })
          .eq('id', id);
        if (error) throw error;
      }

      toast.success(`${memberIds.length}명의 역할이 변경되었습니다.`);
      setSelectedMembers(new Set());
      setShowBulkAssign(false);
      await fetchMembers();
    } catch {
      toast.error('일괄 변경에 실패했습니다.');
    } finally {
      setIsAssigning(false);
    }
  }

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
            직분/역할 관리
          </h1>
          <p className="text-ct-sm text-gray-500 mt-1">전체 {members.length}명</p>
        </div>
        {selectedMembers.size > 0 && (
          <CTButton
            variant="primary"
            size="md"
            leftIcon={<ShieldCheckIcon />}
            onClick={() => setShowBulkAssign(true)}
          >
            선택 ({selectedMembers.size}명) 일괄 변경
          </CTButton>
        )}
      </div>

      {/* Role Groups */}
      <div className="space-y-6">
        {ROLES.map((role) => {
          const roleMembers = membersByRole[role] || [];
          return (
            <CTCard key={role} padding="sm">
              {/* Role header */}
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <div className="flex items-center gap-3">
                  <CTBadge
                    label={ROLE_LABELS[role]}
                    color={ROLE_COLORS[role] || 'gray'}
                  />
                  <span className="text-ct-xs text-gray-400">
                    {ROLE_DESCRIPTIONS[role]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-ct-xs text-gray-500">
                  <UsersIcon className="w-4 h-4" />
                  {roleMembers.length}명
                </div>
              </div>

              {/* Members in this role */}
              {roleMembers.length === 0 ? (
                <p className="text-ct-sm text-gray-400 py-3 text-center">
                  해당 역할의 교인이 없습니다
                </p>
              ) : (
                <div className="bg-white rounded-ct-md border border-gray-100 overflow-hidden">
                  {roleMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <CTCheckbox
                        checked={selectedMembers.has(m.id)}
                        onChange={() => toggleSelect(m.id)}
                      />
                      <CTAvatar name={m.name} src={m.photo_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-ct-sm font-medium text-gray-800 truncate">
                          {m.name}
                        </p>
                      </div>
                      <CTSelect
                        options={ROLES.map(r => ({
                          value: r,
                          label: ROLE_LABELS[r],
                        }))}
                        value={m.role}
                        onChange={(e) => {
                          setChangingRole({ memberId: m.id, currentRole: m.role });
                          setNewRole(e.target.value as UserRole);
                          // Show confirmation if changing from/to admin
                          if (m.role === 'admin' || e.target.value === 'admin') {
                            setChangingRole({ memberId: m.id, currentRole: m.role });
                            setNewRole(e.target.value as UserRole);
                          } else {
                            handleChangeRole(m.id, e.target.value as UserRole);
                          }
                        }}
                        size="sm"
                        className="w-28"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CTCard>
          );
        })}
      </div>

      {/* Bulk Assign Modal */}
      <CTModal
        isOpen={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        title="일괄 역할 변경"
        footer={
          <>
            <CTButton variant="ghost" onClick={() => setShowBulkAssign(false)}>
              취소
            </CTButton>
            <CTButton variant="primary" isLoading={isAssigning} onClick={handleBulkAssign}>
              변경
            </CTButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-ct-md text-gray-600">
            선택한 {selectedMembers.size}명의 역할을 일괄 변경합니다.
          </p>
          <CTSelect
            options={ROLES.map(r => ({
              value: r,
              label: ROLE_LABELS[r],
            }))}
            value={bulkRole}
            onChange={(e) => setBulkRole(e.target.value as UserRole)}
          />
        </div>
      </CTModal>

      {/* Role Change Confirmation (for admin changes) */}
      <CTModal
        isOpen={!!changingRole}
        onClose={() => setChangingRole(null)}
        title="역할 변경 확인"
        footer={
          <>
            <CTButton variant="ghost" onClick={() => setChangingRole(null)}>
              취소
            </CTButton>
            <CTButton
              variant="primary"
              onClick={() => {
                if (changingRole) {
                  handleChangeRole(changingRole.memberId, newRole);
                }
              }}
            >
              변경
            </CTButton>
          </>
        }
      >
        <p className="text-ct-md text-gray-600">
          이 교인의 역할을 &ldquo;{ROLE_LABELS[newRole]}&rdquo;(으)로 변경하시겠습니까?
        </p>
      </CTModal>
    </div>
  );
}
