'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { CTCard } from '@/components/molecules/CTCard';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTCheckbox } from '@/components/atoms/CTCheckbox';
import { CTButton } from '@/components/atoms/CTButton';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTModal } from '@/components/organisms/CTModal';
import { toast } from '@/components/organisms/CTToast';
import { ROLE_LABELS, ROLES, ASSIGNABLE_ROLES, isSuperAdmin } from '@churchthrive/shared';
import type { Member, UserRole } from '@churchthrive/shared';
import {
  ShieldCheckIcon,
  UsersIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const ROLE_COLORS: Record<string, 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'purple'> = {
  superadmin: 'purple',
  admin: 'red',
  pastor: 'blue',
  staff: 'green',
  leader: 'yellow',
  member: 'gray',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  superadmin: '시스템 전체 관리 권한',
  admin: '교회 관리 전체 권한',
  pastor: '교인관리, 말씀노트 피드백',
  staff: '교인관리, 출석, 공지',
  leader: '구역/셀 관리',
  member: '기본 교인 권한',
};

export default function RolesPage() {
  const supabase = createClient();
  const { member: currentMember } = useAuthStore();

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkRole, setBulkRole] = useState<UserRole>('member');
  const [isAssigning, setIsAssigning] = useState(false);
  const [changingRole, setChangingRole] = useState<{ memberId: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('member');

  // Check if current user is superadmin
  const isSuperAdminUser = currentMember?.role && isSuperAdmin(currentMember.role as UserRole);

  // Get roles that current user can assign
  const getAssignableRoles = useCallback(() => {
    if (isSuperAdminUser) {
      return ROLES; // Superadmin can assign all roles including superadmin
    }
    return ASSIGNABLE_ROLES; // Others can only assign regular roles
  }, [isSuperAdminUser]);

  // Get roles to display in the list
  const getDisplayRoles = useCallback(() => {
    if (isSuperAdminUser) {
      return ROLES; // Superadmin sees all roles
    }
    return ASSIGNABLE_ROLES; // Others don't see superadmin role
  }, [isSuperAdminUser]);

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
  getDisplayRoles().forEach(role => {
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
    // Prevent non-superadmin from assigning superadmin role
    if (role === 'superadmin' && !isSuperAdminUser) {
      toast.error('시스템관리자 권한을 부여할 수 없습니다.');
      return;
    }

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

    // Prevent non-superadmin from assigning superadmin role
    if (bulkRole === 'superadmin' && !isSuperAdminUser) {
      toast.error('시스템관리자 권한을 부여할 수 없습니다.');
      return;
    }

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
        {getDisplayRoles().map((role) => {
          const roleMembers = membersByRole[role] || [];
          const isSuperAdminRole = role === 'superadmin';

          return (
            <CTCard key={role} padding="sm">
              {/* Role header */}
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <div className="flex items-center gap-3">
                  {isSuperAdminRole && (
                    <StarIcon className="w-4 h-4 text-purple-500" />
                  )}
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
                        disabled={m.role === 'superadmin' && !isSuperAdminUser}
                      />
                      <CTAvatar name={m.name} src={m.photo_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-ct-sm font-medium text-gray-800 truncate">
                            {m.name}
                          </p>
                          {m.role === 'superadmin' && (
                            <StarIcon className="w-3.5 h-3.5 text-purple-500" />
                          )}
                        </div>
                      </div>
                      <CTSelect
                        options={getAssignableRoles().map(r => ({
                          value: r,
                          label: ROLE_LABELS[r],
                        }))}
                        value={m.role}
                        onChange={(e) => {
                          const targetRole = e.target.value as UserRole;
                          setChangingRole({ memberId: m.id, currentRole: m.role });
                          setNewRole(targetRole);
                          // Show confirmation if changing from/to admin or superadmin
                          if (m.role === 'admin' || m.role === 'superadmin' ||
                              targetRole === 'admin' || targetRole === 'superadmin') {
                            setChangingRole({ memberId: m.id, currentRole: m.role });
                            setNewRole(targetRole);
                          } else {
                            handleChangeRole(m.id, targetRole);
                          }
                        }}
                        disabled={m.role === 'superadmin' && !isSuperAdminUser}
                        size="sm"
                        className="w-32"
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
            options={getAssignableRoles().map(r => ({
              value: r,
              label: ROLE_LABELS[r],
            }))}
            value={bulkRole}
            onChange={(e) => setBulkRole(e.target.value as UserRole)}
          />
        </div>
      </CTModal>

      {/* Role Change Confirmation (for admin/superadmin changes) */}
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
        <div className="space-y-3">
          <p className="text-ct-md text-gray-600">
            이 교인의 역할을 <strong>&ldquo;{ROLE_LABELS[newRole]}&rdquo;</strong>(으)로 변경하시겠습니까?
          </p>
          {(newRole === 'superadmin' || newRole === 'admin') && (
            <div className="p-3 bg-yellow-50 rounded-ct-md border border-yellow-200">
              <p className="text-ct-sm text-yellow-800">
                <strong>주의:</strong> {newRole === 'superadmin' ? '시스템관리자' : '담임목사'} 권한은
                {newRole === 'superadmin' ? ' 모든 교회의 시스템 설정을 변경' : ' 교회의 모든 설정을 변경'}할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </CTModal>
    </div>
  );
}
