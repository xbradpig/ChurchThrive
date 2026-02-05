'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type LoginMethod = 'email' | 'phone';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [method, setMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : error.message
        );
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleKakaoLogin() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) {
      setError('카카오 로그인에 실패했습니다.');
    }
  }

  async function handlePhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+82${phone.replace(/^0/, '')}`,
      });

      if (error) {
        setError('인증번호 발송에 실패했습니다.');
        return;
      }

      // Navigate to OTP verification (simplified for now)
      router.push(`/login/verify?phone=${phone}&redirect=${redirect}`);
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-ct-xl shadow-ct-2 p-6">
      {/* Login method tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-ct-lg p-1 mb-6">
        {(['email', 'phone'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMethod(m); setError(''); }}
            className={`flex-1 py-2 text-ct-sm font-medium rounded-ct-md transition-colors ${
              method === m
                ? 'bg-white text-ct-primary shadow-ct-1'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m === 'email' ? '이메일' : '전화번호'}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-ct-sm rounded-ct-md">
          {error}
        </div>
      )}

      {/* Email login form */}
      {method === 'email' && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-ct-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              id="email"
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
            <label htmlFor="password" className="block text-ct-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
              required
              minLength={8}
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
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      )}

      {/* Phone OTP login form */}
      {method === 'phone' && (
        <form onSubmit={handlePhoneOtp} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-ct-sm font-medium text-gray-700 mb-1">
              전화번호
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
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
            {isLoading ? '발송 중...' : '인증번호 받기'}
          </button>
        </form>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-ct-xs text-gray-400">또는</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Kakao Login */}
      <button
        onClick={handleKakaoLogin}
        className="w-full h-11 bg-[#FEE500] text-[#191919] font-medium rounded-ct-md
          hover:bg-[#FADA0A] active:bg-[#F5CF00]
          transition-colors flex items-center justify-center gap-2"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.44 4.08 3.62 5.18l-.93 3.44c-.08.3.26.54.52.37L8.07 13.5c.31.03.62.05.93.05 4.42 0 8-2.79 8-6.24S13.42 1 9 1z" fill="#191919"/>
        </svg>
        카카오 로그인
      </button>

      {/* Links */}
      <div className="mt-6 text-center space-y-2">
        <Link
          href="/forgot-password"
          className="text-ct-sm text-gray-500 hover:text-ct-primary transition-colors"
        >
          비밀번호를 잊으셨나요?
        </Link>
        <p className="text-ct-sm text-gray-500">
          아직 회원이 아니신가요?{' '}
          <Link href="/register" className="text-ct-primary font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
