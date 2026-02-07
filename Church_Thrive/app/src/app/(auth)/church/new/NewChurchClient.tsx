'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// 교단 옵션
const denominations = [
  '대한예수교장로회(합동)',
  '대한예수교장로회(통합)',
  '대한예수교장로회(고신)',
  '대한예수교장로회(합신)',
  '기독교대한감리회',
  '기독교대한성결교회',
  '기독교한국침례회',
  '대한성공회',
  '한국기독교장로회',
  '예수교대한하나님의성회',
  '기타',
];

export default function NewChurchClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    denomination: '',
    address: '',
    phone: '',
    senior_pastor: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();

      // 1. 현재 로그인한 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. 사용자 메타데이터에서 이름 가져오기
      const userName = user.user_metadata?.name || '관리자';

      // 3. 교회 생성
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .insert({
          name: formData.name,
          denomination: formData.denomination || null,
          address: formData.address || null,
          phone: formData.phone || null,
          senior_pastor: formData.senior_pastor || null,
          subscription_tier: 'free',
        })
        .select()
        .single();

      if (churchError) {
        console.error('Church creation error:', churchError);
        setError('교회 등록 중 오류가 발생했습니다: ' + churchError.message);
        return;
      }

      // 4. 생성자를 관리자(admin)로 members 테이블에 추가
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          church_id: church.id,
          user_id: user.id,
          name: userName,
          phone: '000-0000-0000', // 기본값, 나중에 수정 가능
          role: 'admin',
          status: 'active',
        });

      if (memberError) {
        console.error('Member creation error:', memberError);
        // 교회는 생성됐지만 멤버 추가 실패 시 교회 삭제 시도
        await supabase.from('churches').delete().eq('id', church.id);
        setError('교회 관리자 설정 중 오류가 발생했습니다: ' + memberError.message);
        return;
      }

      // 5. 대시보드로 이동
      router.push('/dashboard');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('교회 등록 중 예기치 않은 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-ct-xl shadow-ct-2 p-6">
      <h2 className="text-ct-xl font-semibold text-center mb-2">교회 등록</h2>
      <p className="text-ct-sm text-gray-500 text-center mb-6">
        교회 정보를 입력하고 관리자로 등록하세요
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-ct-sm rounded-ct-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-ct-sm font-medium text-gray-700 mb-1">
            교회명 <span className="text-ct-error">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="예: 은혜교회"
            required
            minLength={2}
            maxLength={50}
            className="w-full h-11 px-3 border border-gray-300 rounded-ct-md text-ct-md
              focus:outline-none focus:ring-2 focus:ring-ct-primary focus:border-transparent
              placeholder:text-gray-400"
          />
        </div>

        <div>
          <label htmlFor="denomination" className="block text-ct-sm font-medium text-gray-700 mb-1">
            교단
          </label>
          <select
            id="denomination"
            name="denomination"
            value={formData.denomination}
            onChange={handleChange}
            className="w-full h-11 px-3 border border-gray-300 rounded-ct-md text-ct-md
              focus:outline-none focus:ring-2 focus:ring-ct-primary focus:border-transparent
              text-gray-700"
          >
            <option value="">선택하세요</option>
            {denominations.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="senior_pastor" className="block text-ct-sm font-medium text-gray-700 mb-1">
            담임목사
          </label>
          <input
            id="senior_pastor"
            name="senior_pastor"
            type="text"
            value={formData.senior_pastor}
            onChange={handleChange}
            placeholder="예: 김목사"
            maxLength={20}
            className="w-full h-11 px-3 border border-gray-300 rounded-ct-md text-ct-md
              focus:outline-none focus:ring-2 focus:ring-ct-primary focus:border-transparent
              placeholder:text-gray-400"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-ct-sm font-medium text-gray-700 mb-1">
            주소
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            placeholder="예: 서울시 강남구 테헤란로 123"
            className="w-full h-11 px-3 border border-gray-300 rounded-ct-md text-ct-md
              focus:outline-none focus:ring-2 focus:ring-ct-primary focus:border-transparent
              placeholder:text-gray-400"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-ct-sm font-medium text-gray-700 mb-1">
            교회 전화번호
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="예: 02-1234-5678"
            className="w-full h-11 px-3 border border-gray-300 rounded-ct-md text-ct-md
              focus:outline-none focus:ring-2 focus:ring-ct-primary focus:border-transparent
              placeholder:text-gray-400"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-ct-primary text-white font-medium rounded-ct-md
              hover:bg-ct-primary-600 active:bg-ct-primary-700
              disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors"
          >
            {isLoading ? '등록 중...' : '교회 등록하기'}
          </button>
        </div>

        <p className="text-ct-xs text-gray-500 text-center">
          등록 후 교회 관리자(Admin)로 설정됩니다
        </p>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/register/church-search"
          className="text-ct-sm text-ct-primary font-medium hover:underline"
        >
          ← 교회 검색으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
