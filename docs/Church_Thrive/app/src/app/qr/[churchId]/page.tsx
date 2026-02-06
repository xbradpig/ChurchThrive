'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { qrRegistrationSchema, type QrRegistrationData } from '@churchthrive/shared';
import { CTFormField } from '@/components/molecules/CTFormField';
import { CTInput } from '@/components/atoms/CTInput';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTTextArea } from '@/components/atoms/CTTextArea';
import { CTButton } from '@/components/atoms/CTButton';

export const runtime = 'edge';

export default function QrRegisterPage() {
  const params = useParams();
  const churchId = params.churchId as string;
  const [churchName, setChurchName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<QrRegistrationData>({
    resolver: zodResolver(qrRegistrationSchema),
  });

  useEffect(() => {
    supabase.from('churches').select('name').eq('id', churchId).single()
      .then(({ data }) => setChurchName(data?.name || ''));
  }, [churchId, supabase]);

  async function onSubmit(data: QrRegistrationData) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('members').insert({
        church_id: churchId,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        birth_date: data.birth_date || null,
        gender: data.gender || null,
        address: data.address || null,
        role: 'member',
        status: 'pending',
      });

      if (error) {
        alert('등록에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      setIsComplete(true);
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--ct-color-bg-secondary)] p-4">
        <div className="w-full max-w-md bg-white rounded-ct-xl shadow-ct-2 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
            <span className="text-3xl" role="img" aria-label="complete">&#x2705;</span>
          </div>
          <h2 className="text-ct-xl font-semibold mb-2">등록 완료</h2>
          <p className="text-ct-sm text-gray-500">
            {churchName}에 새가족 등록이 완료되었습니다.<br />
            담당자 확인 후 연락드리겠습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--ct-color-bg-secondary)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-ct-2xl font-bold text-ct-primary">{churchName || 'ChurchThrive'}</h1>
          <p className="text-ct-sm text-gray-500 mt-1">새가족 등록</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-ct-xl shadow-ct-2 p-6 space-y-4">
          <CTFormField label="이름" isRequired errorMessage={errors.name?.message}>
            <CTInput placeholder="이름을 입력해주세요" {...register('name')} isError={!!errors.name} />
          </CTFormField>

          <CTFormField label="전화번호" isRequired errorMessage={errors.phone?.message}>
            <CTInput type="tel" placeholder="010-1234-5678" {...register('phone')} isError={!!errors.phone} />
          </CTFormField>

          <CTFormField label="이메일">
            <CTInput type="email" placeholder="email@example.com" {...register('email')} />
          </CTFormField>

          <CTFormField label="성별">
            <CTSelect
              options={[
                { value: 'male', label: '남' },
                { value: 'female', label: '여' },
              ]}
              placeholder="선택하세요"
              {...register('gender')}
            />
          </CTFormField>

          <CTFormField label="생년월일">
            <CTInput type="date" {...register('birth_date')} />
          </CTFormField>

          <CTFormField label="주소">
            <CTInput placeholder="주소" {...register('address')} />
          </CTFormField>

          <CTFormField label="방문 경로">
            <CTInput placeholder="어떻게 교회를 알게 되셨나요?" {...register('how_did_you_hear')} />
          </CTFormField>

          <CTFormField label="기도 제목">
            <CTTextArea placeholder="기도 제목이 있으시면 적어주세요" {...register('prayer_request')} />
          </CTFormField>

          <CTButton variant="primary" type="submit" fullWidth isLoading={isSubmitting}>
            등록하기
          </CTButton>
        </form>
      </div>
    </div>
  );
}
