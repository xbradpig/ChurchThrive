'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterClient() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 8자 이상 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push('/register/church-search');
    } catch {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-ct-xl shadow-ct-2 p-6">
      <h2 className="text-ct-xl font-semibold text-center mb-6">회원가입</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-ct-sm rounded-ct-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-ct-sm font-medium text-gray-700 mb-1">
            이름 <span className="text-ct-error">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            required
            minLength={2}
            maxLength={20}
            className="w-full h-11 px-3 border border-gray-300 rounded-ct-md text-ct-md
              focus:outline-none focus:ring-2 focus:ring-ct-primary focus:border-transparent
              placeholder:text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="block text-ct-sm font-medium text-gray-700 mb-1">
            이메일 <span className="text-ct-error">*</span>
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
            className="w-full h-11 px-3 border border-gray-300 rounded-ct-md text-ct-md
              focus:outline-none focus:ring-2 focus:ring-ct-primary focus:border-transparent
              placeholder:text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="block text-ct-sm font-medium text-gray-700 mb-1">
            비밀번호 <span className="text-ct-error">*</span>
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상, 영문+숫자"
            required
            minLength={8}
            className="w-full h-11 px-3 border border-gray-300 rounded-ct-md text-ct-md
              focus:outline-none focus:ring-2 focus:ring-ct-primary focus:border-transparent
              placeholder:text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="reg-password-confirm" className="block text-ct-sm font-medium text-gray-700 mb-1">
            비밀번호 확인 <span className="text-ct-error">*</span>
          </label>
          <input
            id="reg-password-confirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 재입력"
            required
            className="w-full h-11 px-3 border border-gray-300 rounded-ct-md text-ct-md
              focus:outline-none focus:ring-2 focus:ring-ct-primary focus:border-transparent
              placeholder:text-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-ct-primary text-white font-medium rounded-ct-md
            hover:bg-ct-primary-600 active:bg-ct-primary-700
            disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors"
        >
          {isLoading ? '가입 중...' : '다음: 교회 선택'}
        </button>
      </form>

      <p className="mt-4 text-center text-ct-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-ct-primary font-medium hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
