'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTEmptyState } from '@/components/molecules/CTEmptyState';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { toast } from '@/components/organisms/CTToast';
import { formatDate } from '@churchthrive/shared';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AccessRequestWithUser {
  id: string;
  user_id: string;
  church_id: string;
  status: string;
  requested_at: string;
  user_email?: string;
  user_name?: string;
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<AccessRequestWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('access_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    setRequests(data || []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleApprove(request: AccessRequestWithUser) {
    try {
      // Create member record
      const { error: memberError } = await supabase.from('members').insert({
        church_id: request.church_id,
        user_id: request.user_id,
        name: request.user_name || '새 교인',
        phone: '000-0000-0000',
        role: 'member',
        status: 'active',
      });

      if (memberError) { toast.error('승인 실패'); return; }

      // Update request status
      await supabase.from('access_requests').update({
        status: 'approved',
        responded_at: new Date().toISOString(),
      }).eq('id', request.id);

      toast.success('가입이 승인되었습니다.');
      fetchRequests();
    } catch {
      toast.error('오류가 발생했습니다.');
    }
  }

  async function handleReject(requestId: string) {
    await supabase.from('access_requests').update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    }).eq('id', requestId);
    toast.success('가입 요청을 거절했습니다.');
    fetchRequests();
  }

  if (isLoading) return <div className="ct-container py-12 flex justify-center"><CTSpinner size="lg" /></div>;

  return (
    <div className="ct-container py-6">
      <h1 className="text-ct-2xl font-bold mb-6">가입 승인 대기</h1>

      {requests.length === 0 ? (
        <CTEmptyState title="대기 중인 요청이 없습니다" description="새로운 가입 요청이 있으면 여기에 표시됩니다." />
      ) : (
        <div className="bg-white rounded-ct-lg shadow-ct-1">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <CTAvatar name={req.user_name} size="md" />
                <div>
                  <p className="text-ct-md font-medium">{req.user_name || '이름 없음'}</p>
                  <p className="text-ct-xs text-gray-400">{formatDate(req.requested_at, 'relative')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <CTButton variant="danger" size="sm" leftIcon={<XMarkIcon className="w-4 h-4" />} onClick={() => handleReject(req.id)}>
                  거절
                </CTButton>
                <CTButton variant="primary" size="sm" leftIcon={<CheckIcon className="w-4 h-4" />} onClick={() => handleApprove(req)}>
                  승인
                </CTButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
