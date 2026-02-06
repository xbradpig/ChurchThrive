import { Metadata } from 'next';
import NewChurchClient from './NewChurchClient';

export const metadata: Metadata = {
  title: '교회 등록',
  description: '새 교회를 등록하고 관리자로 시작하세요.',
};

export default function NewChurchPage() {
  return <NewChurchClient />;
}
