import { Metadata } from 'next';
import ChurchSearchClient from './ChurchSearchClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '교회 선택',
  description: '소속 교회를 검색하고 가입 요청하세요.',
};

export default function ChurchSearchPage() {
  return <ChurchSearchClient />;
}
