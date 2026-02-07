'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTInput } from '@/components/atoms/CTInput';
import {
  ArrowLeftIcon,
  BuildingOffice2Icon,
  BellAlertIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface ChurchSettings {
  description?: string;
  notificationPolicy?: {
    autoNotifyAnnouncements: boolean;
    autoNotifyEvents: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
}

const DEFAULT_POLICY = {
  autoNotifyAnnouncements: true,
  autoNotifyEvents: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export default function ChurchSettingsPage() {
  const router = useRouter();
  const { church, member, setChurch } = useAuthStore();

  // Church info state
  const [churchName, setChurchName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  // Notification policy state
  const [policy, setPolicy] = useState(DEFAULT_POLICY);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Permission check
  const canEdit = member?.role && ['admin', 'pastor'].includes(member.role);

  useEffect(() => {
    if (!canEdit) {
      router.push('/settings');
      return;
    }

    if (church) {
      setChurchName(church.name || '');
      setPhone(church.phone || '');
      setAddress(church.address || '');

      // Load settings from JSON field
      const settings = church.settings as ChurchSettings | null;
      if (settings) {
        setDescription(settings.description || '');
        if (settings.notificationPolicy) {
          setPolicy({
            ...DEFAULT_POLICY,
            ...settings.notificationPolicy,
          });
        }
      }
    }
  }, [church, canEdit, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!church?.id || !canEdit) return;

    setIsSubmitting(true);
    setMessage(null);

    const currentSettings = (church.settings as ChurchSettings) || {};
    const newSettings: ChurchSettings = {
      ...currentSettings,
      description,
      notificationPolicy: policy,
    };

    const supabase = createClient();
    const { data, error } = await supabase
      .from('churches')
      .update({
        name: churchName,
        phone: phone || null,
        address: address || null,
        settings: newSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', church.id)
      .select()
      .single();

    if (error) {
      setMessage({ type: 'error', text: '저장에 실패했습니다. 다시 시도해주세요.' });
    } else {
      setChurch(data);
      setMessage({ type: 'success', text: '교회 설정이 저장되었습니다.' });
    }
    setIsSubmitting(false);
  }, [church?.id, church?.settings, canEdit, churchName, phone, address, description, policy, setChurch]);

  const handlePolicyToggle = (key: 'autoNotifyAnnouncements' | 'autoNotifyEvents') => {
    setPolicy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!canEdit) {
    return (
      <div className="ct-container py-6 max-w-2xl">
        <div className="text-center py-12">
          <p className="text-gray-500">접근 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ct-container py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="p-2 -ml-2 hover:bg-gray-100 rounded-ct-md transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-ct-xl font-bold">교회 설정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Church Logo */}
        <div className="bg-white rounded-ct-lg shadow-ct-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PhotoIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-ct-lg font-semibold">교회 로고</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-ct-lg bg-gray-100 flex items-center justify-center overflow-hidden">
              {church?.logo_url ? (
                <img
                  src={church.logo_url}
                  alt={church.name || '교회 로고'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BuildingOffice2Icon className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <CTButton type="button" variant="outline" size="sm">
              로고 변경
            </CTButton>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-ct-lg shadow-ct-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BuildingOffice2Icon className="w-5 h-5 text-gray-500" />
            <h2 className="text-ct-lg font-semibold">기본 정보</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label htmlFor="church-name" className="block text-ct-sm font-medium text-gray-700 mb-1.5">
                교회 이름
              </label>
              <CTInput
                id="church-name"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                placeholder="교회 이름을 입력하세요"
                required
              />
            </div>

            <div>
              <label htmlFor="church-phone" className="block text-ct-sm font-medium text-gray-700 mb-1.5">
                연락처
              </label>
              <CTInput
                id="church-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="02-0000-0000"
              />
            </div>

            <div>
              <label htmlFor="church-address" className="block text-ct-sm font-medium text-gray-700 mb-1.5">
                주소
              </label>
              <CTInput
                id="church-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="교회 주소를 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="church-description" className="block text-ct-sm font-medium text-gray-700 mb-1.5">
                교회 소개
              </label>
              <textarea
                id="church-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="교회에 대한 간단한 소개를 입력하세요"
                rows={3}
                className="w-full rounded-ct-md border border-gray-300 bg-[var(--ct-color-gray-50)] px-3 py-2 text-ct-md placeholder:text-gray-400 hover:border-gray-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-ct-primary/40 focus:border-transparent focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Notification Policy */}
        <div className="bg-white rounded-ct-lg shadow-ct-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BellAlertIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-ct-lg font-semibold">알림 정책</h2>
          </div>
          <p className="text-ct-sm text-gray-500 mb-4">
            교회 전체에 적용되는 알림 발송 정책을 설정합니다.
          </p>

          <div className="space-y-4">
            {/* Auto notify announcements */}
            <button
              type="button"
              onClick={() => handlePolicyToggle('autoNotifyAnnouncements')}
              className="flex items-center justify-between w-full py-3 text-left"
            >
              <div>
                <p className="text-ct-md font-medium text-gray-800">
                  공지사항 자동 알림
                </p>
                <p className="text-ct-sm text-gray-500">
                  새 공지사항 등록 시 자동으로 푸시 알림을 발송합니다
                </p>
              </div>
              <ToggleSwitch enabled={policy.autoNotifyAnnouncements} />
            </button>

            {/* Auto notify events */}
            <button
              type="button"
              onClick={() => handlePolicyToggle('autoNotifyEvents')}
              className="flex items-center justify-between w-full py-3 text-left border-t border-gray-100"
            >
              <div>
                <p className="text-ct-md font-medium text-gray-800">
                  일정 자동 알림
                </p>
                <p className="text-ct-sm text-gray-500">
                  새 일정 등록 시 자동으로 푸시 알림을 발송합니다
                </p>
              </div>
              <ToggleSwitch enabled={policy.autoNotifyEvents} />
            </button>

            {/* Quiet hours */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-ct-md font-medium text-gray-800 mb-2">
                방해 금지 시간
              </p>
              <p className="text-ct-sm text-gray-500 mb-3">
                이 시간에는 알림을 발송하지 않습니다
              </p>
              <div className="flex items-center gap-3">
                <CTInput
                  type="time"
                  value={policy.quietHoursStart}
                  onChange={(e) => setPolicy((prev) => ({ ...prev, quietHoursStart: e.target.value }))}
                />
                <span className="text-gray-500">~</span>
                <CTInput
                  type="time"
                  value={policy.quietHoursEnd}
                  onChange={(e) => setPolicy((prev) => ({ ...prev, quietHoursEnd: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-ct-md text-ct-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <CTButton type="submit" fullWidth isLoading={isSubmitting}>
          저장
        </CTButton>
      </form>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
        enabled ? 'bg-ct-primary' : 'bg-gray-300'
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-0.5 ${
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </div>
  );
}
