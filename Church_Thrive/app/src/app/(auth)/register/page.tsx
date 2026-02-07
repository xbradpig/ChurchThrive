import { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '회원가입',
  description: 'ChurchThrive에 가입하세요.',
};

export default function RegisterPage() {
  return <RegisterClient />;
}
