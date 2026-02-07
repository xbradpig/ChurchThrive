'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTInput } from '@/components/atoms/CTInput';
import { ArrowLeftIcon, CameraIcon } from '@heroicons/react/24/outline';

export default function ProfileEditPage() {
  const router = useRouter();
  const { member, setMember } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setPhone(member.phone || '');
    }
  }, [member]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member?.id) return;

    setIsSubmitting(true);
    setMessage(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('members')
      .update({
        name,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id)
      .select()
      .single();

    if (error) {
      setMessage({ type: 'error', text: '저장에 실패했습니다. 다시 시도해주세요.' });
    } else {
      setMember(data);
      setMessage({ type: 'success', text: '프로필이 저장되었습니다.' });
    }
    setIsSubmitting(false);
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
        <h1 className="text-ct-xl font-bold">내 정보 수정</h1>
      </div>

      {/* Profile Photo */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[var(--ct-color-primary-50,#e8f5e8)] flex items-center justify-center overflow-hidden">
            {member?.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.name || '프로필'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-ct-3xl font-bold text-ct-primary">
                {member?.name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 w-8 h-8 bg-ct-primary rounded-full flex items-center justify-center text-white shadow-ct-2 hover:bg-ct-primary-600 transition-colors"
            aria-label="프로필 사진 변경"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-ct-lg shadow-ct-1 p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-ct-sm font-medium text-gray-700 mb-1.5">
              이름
            </label>
            <CTInput
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-ct-sm font-medium text-gray-700 mb-1.5">
              연락처
            </label>
            <CTInput
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-ct-sm font-medium text-gray-700 mb-1.5">
              이메일
            </label>
            <CTInput
              id="email"
              type="email"
              value={member?.email || ''}
              disabled
              readOnly
            />
            <p className="mt-1 text-ct-xs text-gray-500">
              이메일은 변경할 수 없습니다.
            </p>
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
