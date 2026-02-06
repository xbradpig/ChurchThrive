import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '승인 대기',
  description: '교회 가입 승인을 기다리는 중입니다.',
};

export default function PendingPage() {
  return (
    <div className="bg-white rounded-ct-xl shadow-ct-2 p-6 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-ct-primary-50 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-ct-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <h2 className="text-ct-xl font-semibold mb-2">승인 대기 중</h2>
      <p className="text-ct-sm text-gray-500 leading-relaxed">
        가입 요청이 접수되었습니다.<br />
        교회 관리자의 승인 후 서비스를 이용하실 수 있습니다.<br />
        승인 시 알림으로 안내드리겠습니다.
      </p>
    </div>
  );
}
