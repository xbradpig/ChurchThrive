'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTCard } from '@/components/molecules/CTCard';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTModal } from '@/components/organisms/CTModal';
import { toast } from '@/components/organisms/CTToast';
import { ROLE_LABELS } from '@churchthrive/shared';
import type { CellGroup, Member } from '@churchthrive/shared';
import {

  ArrowLeftIcon,
  TrashIcon,
  UserPlusIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export const runtime = 'edge';

export default function CellGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const supabase = createClient();

  const [group, setGroup] = useState<CellGroup | null>(null);
  const [leader, setLeader] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroupData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch cell group
      const { data: groupData, error } = await supabase
        .from('cell_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setGroup(groupData);

      // Fetch leader
      if (groupData?.leader_id) {
        const { data: leaderData } = await supabase
          .from('members')
          .select('*')
          .eq('id', groupData.leader_id)
          .single();
        setLeader(leaderData);
      }

      // Fetch members in this cell group
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('cell_group_id', groupId)
        .eq('status', 'active')
        .order('name', { ascending: true });

      setMembers(memberData || []);
    } catch (error) {
      console.error('Failed to fetch cell group:', error);
      toast.error('구역 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, supabase]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  async function openAddMember() {
    setShowAddMember(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentMember } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!currentMember) return;

      // Fetch members not in any cell group
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('church_id', currentMember.church_id)
        .eq('status', 'active')
        .is('cell_group_id', null)
        .order('name', { ascending: true });

      setAvailableMembers(data || []);
    } catch (error) {
      console.error('Failed to fetch available members:', error);
    }
  }

  async function handleAddMember() {
    if (!selectedMemberId) return;
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ cell_group_id: groupId })
        .eq('id', selectedMemberId);

      if (error) throw error;
      toast.success('멤버가 추가되었습니다.');
      setShowAddMember(false);
      setSelectedMemberId('');
      await fetchGroupData();
    } catch {
      toast.error('멤버 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const { error } = await supabase
        .from('members')
        .update({ cell_group_id: null })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('멤버가 구역에서 제거되었습니다.');
      await fetchGroupData();
    } catch {
      toast.error('멤버 제거에 실패했습니다.');
    }
  }

  async function handleDeleteGroup() {
    setIsDeleting(true);
    try {
      // First remove all member assignments
      const { error: memberError } = await supabase
        .from('members')
        .update({ cell_group_id: null })
        .eq('cell_group_id', groupId);

      if (memberError) throw memberError;

      const { error } = await supabase
        .from('cell_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      toast.success('구역이 삭제되었습니다.');
      router.push('/admin/cell-groups');
    } catch {
      toast.error('구역 삭제에 실패했습니다.');
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

  if (!group) {
    return (
      <div className="ct-container py-6 text-center">
        <p className="text-gray-500">구역을 찾을 수 없습니다.</p>
        <CTButton variant="ghost" className="mt-4" onClick={() => router.push('/admin/cell-groups')}>
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
          <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
            {group.name}
          </h1>
        </div>
        <CTButton
          variant="danger"
          size="sm"
          leftIcon={<TrashIcon />}
          onClick={() => setShowDeleteModal(true)}
        >
          삭제
        </CTButton>
      </div>

      <div className="space-y-6">
        {/* Group Info */}
        <CTCard title="구역 정보">
          <div className="space-y-3">
            {/* Leader */}
            {leader && (
              <div className="flex items-center gap-3">
                <UserCircleIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex items-center gap-2">
                  <CTAvatar name={leader.name} src={leader.photo_url} size="xs" />
                  <span className="text-ct-sm text-gray-700">{leader.name}</span>
                  <CTBadge label="구역장" color="blue" size="sm" />
                </div>
              </div>
            )}

            {group.meeting_day && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="text-ct-sm text-gray-700">{group.meeting_day}</span>
              </div>
            )}

            {group.meeting_time && (
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="text-ct-sm text-gray-700">{group.meeting_time}</span>
              </div>
            )}

            {group.meeting_place && (
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="text-ct-sm text-gray-700">{group.meeting_place}</span>
              </div>
            )}

            {group.description && (
              <p className="text-ct-sm text-gray-500 pt-2 border-t border-gray-100">
                {group.description}
              </p>
            )}
          </div>
        </CTCard>

        {/* Members */}
        <CTCard
          title={`구역원 (${members.length}명)`}
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
              등록된 구역원이 없습니다
            </p>
          ) : (
            <div className="space-y-1 -mx-4">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
                >
                  <CTAvatar name={m.name} src={m.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-ct-md font-medium text-gray-800 truncate">
                      {m.name}
                    </p>
                    <p className="text-ct-xs text-gray-400">
                      {ROLE_LABELS[m.role as keyof typeof ROLE_LABELS]}
                    </p>
                  </div>
                  {leader && m.id === leader.id && (
                    <CTBadge label="구역장" color="blue" size="sm" />
                  )}
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-ct-md hover:bg-red-50 transition-colors"
                    title="구역에서 제거"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CTCard>
      </div>

      {/* Add Member Modal */}
      <CTModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title="구역원 추가"
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
        <div>
          <p className="text-ct-sm text-gray-500 mb-3">
            구역에 배정되지 않은 교인 중에서 선택합니다.
          </p>
          <CTSelect
            options={availableMembers.map(m => ({
              value: m.id,
              label: m.name,
            }))}
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            placeholder="교인을 선택하세요"
          />
        </div>
      </CTModal>

      {/* Delete Modal */}
      <CTModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="구역 삭제"
        footer={
          <>
            <CTButton variant="ghost" onClick={() => setShowDeleteModal(false)}>
              취소
            </CTButton>
            <CTButton variant="danger" isLoading={isDeleting} onClick={handleDeleteGroup}>
              삭제
            </CTButton>
          </>
        }
      >
        <p className="text-ct-md text-gray-600">
          &ldquo;{group.name}&rdquo; 구역을 삭제하시겠습니까?
          구역원의 구역 배정이 해제됩니다.
        </p>
      </CTModal>
    </div>
  );
}
