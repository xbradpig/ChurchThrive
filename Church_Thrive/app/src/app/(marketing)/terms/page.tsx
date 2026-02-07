import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: '이용약관 - ChurchThrive',
  description: 'ChurchThrive 서비스 이용약관',
};

export default function TermsPage() {
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
          이용약관
        </h1>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-500 text-sm mb-8">
            최종 수정일: 2026년 2월 1일
          </p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제1조 (목적)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              이 약관은 ChurchThrive(이하 "서비스")가 제공하는 교회 관리 서비스의
              이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항,
              기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제2조 (정의)
            </h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-2">
              <li>
                "서비스"란 ChurchThrive가 제공하는 교회 관리 플랫폼 및 관련 제반 서비스를 의미합니다.
              </li>
              <li>
                "이용자"란 본 약관에 따라 서비스를 이용하는 교회, 교인 및 모든 사용자를 의미합니다.
              </li>
              <li>
                "교회 관리자"란 서비스 내에서 교회 정보 및 교인 데이터를 관리할 권한을 가진 이용자를 의미합니다.
              </li>
              <li>
                "콘텐츠"란 서비스 내에서 게시되는 모든 글, 사진, 영상, 파일 등을 의미합니다.
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제3조 (약관의 효력 및 변경)
            </h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-2">
              <li>
                본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
              </li>
              <li>
                서비스는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위 내에서 본 약관을 변경할 수 있습니다.
              </li>
              <li>
                변경된 약관은 공지사항을 통해 공지하며, 공지 후 7일이 경과하면 효력이 발생합니다.
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제4조 (서비스의 제공)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              서비스는 다음과 같은 기능을 제공합니다:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>교인 정보 관리 및 출석 관리</li>
              <li>설교 노트 및 말씀 나눔</li>
              <li>교회 일정 및 행사 관리</li>
              <li>그룹 및 셀 관리</li>
              <li>공지사항 및 알림 서비스</li>
              <li>기타 교회 운영에 필요한 부가 서비스</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제5조 (이용자의 의무)
            </h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-2">
              <li>
                이용자는 관련 법령, 본 약관의 규정, 이용안내 등을 준수하여야 합니다.
              </li>
              <li>
                이용자는 타인의 개인정보를 무단으로 수집, 이용, 공개하여서는 안 됩니다.
              </li>
              <li>
                이용자는 서비스를 이용하여 얻은 정보를 서비스의 사전 승낙 없이 복제, 유통하여서는 안 됩니다.
              </li>
              <li>
                이용자는 서비스의 안정적인 운영을 방해하는 행위를 하여서는 안 됩니다.
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제6조 (개인정보 보호)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              서비스는 이용자의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고
              이를 준수합니다. 자세한 내용은{' '}
              <Link href="/privacy" className="text-ct-primary hover:underline">
                개인정보처리방침
              </Link>
              을 참조하시기 바랍니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제7조 (서비스 이용의 제한)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              서비스는 다음 각 호에 해당하는 경우 서비스 이용을 제한하거나
              이용 계약을 해지할 수 있습니다:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
              <li>타인의 정보를 도용한 경우</li>
              <li>서비스 운영을 고의로 방해한 경우</li>
              <li>불법적인 목적으로 서비스를 이용한 경우</li>
              <li>기타 관련 법령이나 약관을 위반한 경우</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제8조 (면책조항)
            </h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-2">
              <li>
                서비스는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인
                사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.
              </li>
              <li>
                서비스는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.
              </li>
              <li>
                서비스는 이용자가 게재한 정보, 자료, 사실의 신뢰도, 정확성 등에 대해
                책임을 지지 않습니다.
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제9조 (분쟁해결)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따르며,
              서비스와 이용자 간 발생한 분쟁에 관한 소송은 대한민국 법원을 관할법원으로 합니다.
            </p>
          </section>

          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              부칙
            </h2>
            <p className="text-gray-600">
              본 약관은 2026년 2월 1일부터 시행합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
