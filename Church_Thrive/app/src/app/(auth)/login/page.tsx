import { Metadata } from 'next';
import LoginClient from './LoginClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '로그인',
  description: 'ChurchThrive에 로그인하세요.',
};

export default function LoginPage() {
  return <LoginClient />;
}
