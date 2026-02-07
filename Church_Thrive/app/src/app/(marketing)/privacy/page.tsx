import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: '개인정보처리방침 - ChurchThrive',
  description: 'ChurchThrive 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-ct-primary mb-8 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>설정으로 돌아가기</span>
        </Link>

        {/* Header */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
          개인정보처리방침
        </h1>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-500 text-sm mb-8">
            최종 수정일: 2026년 2월 1일
          </p>

          <p className="text-gray-600 leading-relaxed mb-8">
            ChurchThrive(이하 "서비스")는 이용자의 개인정보를 중요시하며,
            「개인정보 보호법」을 준수하고 있습니다. 본 개인정보처리방침은
            이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
            개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
          </p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. 수집하는 개인정보 항목
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              서비스는 원활한 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">
              필수 수집 항목
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>이메일 주소 (로그인 ID로 사용)</li>
              <li>비밀번호</li>
              <li>이름</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">
              선택 수집 항목
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>연락처 (전화번호)</li>
              <li>프로필 사진</li>
              <li>생년월일</li>
              <li>주소</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">
              자동 수집 항목
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>서비스 이용 기록</li>
              <li>접속 로그</li>
              <li>기기 정보 (브라우저 종류, OS 등)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. 개인정보의 수집 및 이용 목적
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              수집된 개인정보는 다음의 목적으로 이용됩니다:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>회원 가입 및 관리: 회원 식별, 가입 의사 확인, 서비스 제공</li>
              <li>서비스 제공: 교인 관리, 출석 관리, 알림 서비스 등 핵심 기능 제공</li>
              <li>고객 지원: 문의 사항 처리, 공지사항 전달</li>
              <li>서비스 개선: 서비스 이용 통계 분석, 서비스 품질 향상</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. 개인정보의 보유 및 이용 기간
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              서비스는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는
              해당 정보를 지체 없이 파기합니다. 단, 관련 법령에 의해 보존할
              필요가 있는 경우에는 해당 기간 동안 보관합니다:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
              <li>표시/광고에 관한 기록: 6개월</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. 개인정보의 제3자 제공
            </h2>
            <p className="text-gray-600 leading-relaxed">
              서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
              다만, 다음의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              5. 개인정보 처리 위탁
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              서비스는 서비스 향상을 위해 아래와 같이 개인정보를 위탁하고 있으며,
              관계 법령에 따라 위탁 계약 시 개인정보가 안전하게 관리될 수 있도록
              필요한 사항을 규정하고 있습니다:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-700">수탁업체</th>
                    <th className="text-left py-2 text-gray-700">위탁업무 내용</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b">
                    <td className="py-2">Supabase Inc.</td>
                    <td className="py-2">데이터베이스 호스팅 및 인증 서비스</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Vercel Inc.</td>
                    <td className="py-2">웹 서비스 호스팅</td>
                  </tr>
                  <tr>
                    <td className="py-2">Firebase (Google)</td>
                    <td className="py-2">푸시 알림 서비스</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              6. 이용자의 권리와 행사 방법
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              위 권리 행사는 서비스 내 설정 페이지에서 직접 하거나,
              고객센터를 통해 요청하실 수 있습니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              7. 개인정보의 파기
            </h2>
            <p className="text-gray-600 leading-relaxed">
              서비스는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는
              해당 정보를 지체 없이 파기합니다. 파기 절차 및 방법은 다음과 같습니다:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
              <li>
                <strong>파기 절차:</strong> 이용자가 회원 탈퇴를 요청하거나
                개인정보 수집 및 이용 목적이 달성된 후 내부 방침 및 관련 법령에 따라 일정 기간 저장된 후 파기됩니다.
              </li>
              <li>
                <strong>파기 방법:</strong> 전자적 파일 형태로 저장된 개인정보는
                기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              8. 개인정보 보호를 위한 기술적/관리적 대책
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>개인정보의 암호화: 비밀번호는 암호화되어 저장되며, 전송 시 SSL 암호화 통신을 사용합니다.</li>
              <li>해킹 등에 대비한 기술적 대책: 백신 프로그램 설치, 보안 업데이트를 실시합니다.</li>
              <li>개인정보에 대한 접근 제한: 개인정보 처리 담당자를 최소한으로 제한하고 관리합니다.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              9. 개인정보 보호책임자
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              서비스는 개인정보 처리에 관한 업무를 총괄하여 책임지고,
              이와 관련한 불만처리 및 피해구제를 위해 아래와 같이
              개인정보 보호책임자를 지정하고 있습니다:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">
                <strong>개인정보 보호책임자</strong>
                <br />
                이메일: privacy@churchthrive.org
              </p>
            </div>
          </section>

          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              10. 개인정보처리방침의 변경
            </h2>
            <p className="text-gray-600">
              본 개인정보처리방침은 법령 및 방침에 따라 변경될 수 있으며,
              변경 시 서비스 내 공지사항을 통해 고지합니다.
            </p>
            <p className="text-gray-600 mt-4">
              본 방침은 2026년 2월 1일부터 시행합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
