'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { CTCard } from '@/components/molecules/CTCard';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTEmptyState } from '@/components/molecules/CTEmptyState';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTModal } from '@/components/organisms/CTModal';
import { toast } from '@/components/organisms/CTToast';
import { ORG_TYPE_LABELS, ROLE_LABELS } from '@churchthrive/shared';
import type { Organization, Member } from '@churchthrive/shared';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  XMarkIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

interface OrgMember {
  id: string;
  role: string;
  member: Member;
}

const ORG_TYPE_COLORS: Record<string, 'blue' | 'green' | 'yellow' | 'gray'> = {
  committee: 'blue',
  department: 'green',
  group: 'yellow',
  team: 'gray',
};

const ORG_ROLE_LABELS: Record<string, string> = {
  head: '팀장',
  secretary: '총무',
  member: '팀원',
};

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  const supabase = createClient();

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [subOrgs, setSubOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [isAdding, setIsAdding] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrgData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch organization
      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (error) throw error;
      setOrg(orgData);

      // Fetch org_roles with member info
      const { data: roles } = await supabase
        .from('org_roles')
        .select('id, role, member_id')
        .eq('organization_id', orgId);

      if (roles && roles.length > 0) {
        const memberIds = roles.map(r => r.member_id);
        const { data: memberData } = await supabase
          .from('members')
          .select('*')
          .in('id', memberIds);

        const orgMembers: OrgMember[] = roles.map(r => ({
          id: r.id,
          role: r.role,
          member: (memberData || []).find(m => m.id === r.member_id)!,
        })).filter(r => r.member);

        setMembers(orgMembers);
      } else {
        setMembers([]);
      }

      // Fetch sub-organizations
      const { data: subOrgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('parent_id', orgId)
        .order('sort_order', { ascending: true });

      setSubOrgs(subOrgData || []);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      toast.error('조직 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, supabase]);

  useEffect(() => {
    fetchOrgData();
  }, [fetchOrgData]);

  async function openAddMember() {
    setShowAddMember(true);
    // Fetch all members for selection
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentMember } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!currentMember) return;

      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('church_id', currentMember.church_id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      // Filter out already added members
      const existingIds = new Set(members.map(m => m.member.id));
      setAllMembers((data || []).filter(m => !existingIds.has(m.id)));
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }

  async function handleAddMember() {
    if (!selectedMemberId) return;
    setIsAdding(true);
    try {
      const { error } = await supabase.from('org_roles').insert({
        organization_id: orgId,
        member_id: selectedMemberId,
        role: selectedRole as 'head' | 'member' | 'secretary',
      });

      if (error) throw error;
      toast.success('멤버가 추가되었습니다.');
      setShowAddMember(false);
      setSelectedMemberId('');
      setSelectedRole('member');
      await fetchOrgData();
    } catch {
      toast.error('멤버 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveMember(orgRoleId: string) {
    try {
      const { error } = await supabase
        .from('org_roles')
        .delete()
        .eq('id', orgRoleId);

      if (error) throw error;
      toast.success('멤버가 제거되었습니다.');
      await fetchOrgData();
    } catch {
      toast.error('멤버 제거에 실패했습니다.');
    }
  }

  async function handleDeleteOrg() {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (error) throw error;
      toast.success('조직이 삭제되었습니다.');
      router.push('/admin/organizations');
    } catch {
      toast.error('조직 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CTSpinner size="lg" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="ct-container py-6 text-center">
        <p className="text-gray-500">조직을 찾을 수 없습니다.</p>
        <CTButton variant="ghost" className="mt-4" onClick={() => router.push('/admin/organizations')}>
          목록으로 돌아가기
        </CTButton>
      </div>
    );
  }

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-ct-md hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
                {org.name}
              </h1>
              <CTBadge
                label={ORG_TYPE_LABELS[org.type]}
                color={ORG_TYPE_COLORS[org.type] || 'gray'}
              />
            </div>
            {org.description && (
              <p className="text-ct-sm text-gray-500 mt-0.5">{org.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CTButton
            variant="danger"
            size="sm"
            leftIcon={<TrashIcon />}
            onClick={() => setShowDeleteModal(true)}
          >
            삭제
          </CTButton>
        </div>
      </div>

      <div className="space-y-6">
        {/* Members Section */}
        <CTCard
          title={`멤버 (${members.length}명)`}
          actions={
            <CTButton
              variant="outline"
              size="sm"
              leftIcon={<UserPlusIcon />}
              onClick={openAddMember}
            >
              멤버 추가
            </CTButton>
          }
        >
          {members.length === 0 ? (
            <p className="text-ct-sm text-gray-400 py-4 text-center">
              등록된 멤버가 없습니다
            </p>
          ) : (
            <div className="space-y-1 -mx-4">
              {members.map((om) => (
                <div
                  key={om.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
                >
                  <CTAvatar name={om.member.name} src={om.member.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-ct-md font-medium text-gray-800 truncate">
                      {om.member.name}
                    </p>
                    <p className="text-ct-xs text-gray-400">
                      {ROLE_LABELS[om.member.role as keyof typeof ROLE_LABELS]}
                    </p>
                  </div>
                  <CTBadge
                    label={ORG_ROLE_LABELS[om.role] || om.role}
                    color={om.role === 'head' ? 'blue' : 'gray'}
                    size="sm"
                  />
                  <button
                    onClick={() => handleRemoveMember(om.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-ct-md hover:bg-red-50 transition-colors"
                    title="멤버 제거"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CTCard>

        {/* Sub-organizations */}
        {subOrgs.length > 0 && (
          <CTCard title={`하위 조직 (${subOrgs.length})`}>
            <div className="space-y-1 -mx-4">
              {subOrgs.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => router.push(`/admin/organizations/${sub.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors text-left"
                >
                  <BuildingOffice2Icon className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-ct-md font-medium text-gray-800 truncate">
                      {sub.name}
                    </p>
                    {sub.description && (
                      <p className="text-ct-xs text-gray-400 truncate">{sub.description}</p>
                    )}
                  </div>
                  <CTBadge
                    label={ORG_TYPE_LABELS[sub.type]}
                    color={ORG_TYPE_COLORS[sub.type] || 'gray'}
                    size="sm"
                  />
                </button>
              ))}
            </div>
          </CTCard>
        )}
      </div>

      {/* Add Member Modal */}
      <CTModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title="멤버 추가"
        footer={
          <>
            <CTButton variant="ghost" onClick={() => setShowAddMember(false)}>
              취소
            </CTButton>
            <CTButton
              variant="primary"
              isLoading={isAdding}
              disabled={!selectedMemberId}
              onClick={handleAddMember}
            >
              추가
            </CTButton>
          </>
        }
      >
        <div className="space-y-4">
          <CTSelect
            options={allMembers.map(m => ({
              value: m.id,
              label: `${m.name} (${ROLE_LABELS[m.role as keyof typeof ROLE_LABELS]})`,
            }))}
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            placeholder="멤버를 선택하세요"
          />
          <CTSelect
            options={[
              { value: 'head', label: '팀장' },
              { value: 'secretary', label: '총무' },
              { value: 'member', label: '팀원' },
            ]}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          />
        </div>
      </CTModal>

      {/* Delete Modal */}
      <CTModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="조직 삭제"
        footer={
          <>
            <CTButton variant="ghost" onClick={() => setShowDeleteModal(false)}>
              취소
            </CTButton>
            <CTButton variant="danger" isLoading={isDeleting} onClick={handleDeleteOrg}>
              삭제
            </CTButton>
          </>
        }
      >
        <p className="text-ct-md text-gray-600">
          &ldquo;{org.name}&rdquo; 조직을 삭제하시겠습니까?
          하위 조직과 멤버 배정이 모두 제거됩니다.
        </p>
      </CTModal>
    </div>
  );
}
