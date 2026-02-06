import Link from 'next/link';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  ArrowUpTrayIcon,
  UserGroupIcon,
  FunnelIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: '교인 관리 - ChurchThrive',
  description: '체계적인 교인 관리로 목양의 효율성을 높이세요. 프로필, 가족 연결, 조직 배치, QR 등록, 엑셀 임포트를 지원합니다.',
};

const FEATURES = [
  {
    icon: UsersIcon,
    title: '교인 프로필 관리',
    description: '이름, 연락처, 직분, 역할, 상태 등 교인의 모든 정보를 체계적으로 관리합니다. 사진 등록, 메모 기능도 지원합니다.',
    details: [
      '기본 정보: 이름, 생년월일, 연락처, 주소',
      '교회 정보: 직분(장로/집사/권사/성도), 역할, 상태',
      '추가 정보: 등록일, 세례일, 메모',
      '프로필 사진 업로드',
    ],
  },
  {
    icon: UserGroupIcon,
    title: '가족 관계 연결',
    description: '같은 가정의 교인들을 연결하여 가족 단위로 목양할 수 있습니다. 가장을 지정하고 가족 구성원을 한눈에 파악합니다.',
    details: [
      '가족 그룹 생성 및 관리',
      '가장/배우자/자녀 관계 설정',
      '가족 단위 출석 현황 확인',
      '가족 구성원 일괄 관리',
    ],
  },
  {
    icon: MagnifyingGlassIcon,
    title: '강력한 검색',
    description: '이름, 전화번호는 물론 초성 검색까지 지원합니다. "ㅎㄱㄷ"을 검색하면 "홍길동"을 찾을 수 있습니다.',
    details: [
      '이름/전화번호 검색',
      '초성 검색 (ㅎㄱㄷ → 홍길동)',
      '직분/역할/상태별 필터링',
      '조직/구역별 필터링',
    ],
  },
  {
    icon: QrCodeIcon,
    title: 'QR코드 등록',
    description: '새가족이 QR코드를 스캔하면 기본 정보를 직접 입력할 수 있습니다. 입력된 정보는 승인 후 교인으로 등록됩니다.',
    details: [
      '교회별 고유 QR코드 생성',
      '새가족 셀프 정보 입력',
      '관리자 승인 프로세스',
      '자동 알림 발송',
    ],
  },
  {
    icon: ArrowUpTrayIcon,
    title: '엑셀 임포트',
    description: '기존에 엑셀로 관리하던 교인 명단을 그대로 가져올 수 있습니다. 컬럼 매핑 기능으로 어떤 형식의 엑셀도 변환 가능합니다.',
    details: [
      '엑셀(xlsx, xls) 파일 업로드',
      '자동 컬럼 매핑',
      '데이터 미리보기 및 검증',
      '중복 체크 및 병합',
    ],
  },
  {
    icon: FunnelIcon,
    title: '다양한 필터',
    description: '직분, 역할, 상태, 조직별로 교인을 필터링하여 원하는 그룹만 볼 수 있습니다. 필터 조합도 자유롭습니다.',
    details: [
      '직분별: 장로, 안수집사, 집사, 권사, 성도',
      '역할별: 담임목사, 교역자, 사무간사, 리더, 교인',
      '상태별: 활동, 대기, 비활동, 이적',
      '조직별: 구역, 셀그룹, 부서',
    ],
  },
];

const SCREENSHOTS = [
  { title: '교인 목록', description: '전체 교인을 한눈에 파악' },
  { title: '상세 프로필', description: '교인의 모든 정보 확인' },
  { title: 'QR 등록', description: '새가족 셀프 등록' },
  { title: '엑셀 임포트', description: '기존 데이터 마이그레이션' },
];

export default function MembersServicePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-6">
            <UsersIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            교인 관리
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            교인 정보, 가족 관계, 조직 소속을 체계적으로 관리합니다.
            엑셀에서 벗어나 체계적인 목양 시스템을 경험하세요.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ct-primary text-white rounded-xl hover:bg-ct-primary-600 transition-colors"
          >
            무료로 시작하기
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-ct-primary mb-2">5분</div>
              <div className="text-gray-600">엑셀 임포트로 빠른 시작</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-ct-primary mb-2">초성</div>
              <div className="text-gray-600">검색으로 빠른 탐색</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-ct-primary mb-2">QR</div>
              <div className="text-gray-600">새가족 셀프 등록</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              주요 기능
            </h2>
            <p className="text-lg text-gray-600">
              교인 관리에 필요한 모든 기능을 제공합니다
            </p>
          </div>

          <div className="space-y-16">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`bg-gray-100 rounded-2xl aspect-video flex items-center justify-center ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="text-gray-400 text-center">
                    <feature.icon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">스크린샷</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              이런 상황에서 유용합니다
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                새가족 등록이 번거로울 때
              </h3>
              <p className="text-gray-600">
                QR코드 하나면 새가족이 직접 정보를 입력합니다.
                관리자는 승인만 하면 됩니다.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                엑셀 명단 관리가 한계일 때
              </h3>
              <p className="text-gray-600">
                기존 엑셀 파일을 그대로 가져와서 즉시 시작할 수 있습니다.
                더 이상 파일 관리로 고민하지 마세요.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                교인 찾기가 어려울 때
              </h3>
              <p className="text-gray-600">
                초성 검색으로 "ㅎㄱㄷ"만 입력해도 "홍길동"을 바로 찾습니다.
                필터 조합으로 원하는 그룹만 볼 수도 있습니다.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                가족 단위 목양이 필요할 때
              </h3>
              <p className="text-gray-600">
                가족 관계를 연결하여 가정 단위로 목양 현황을 파악할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            체계적인 교인 관리를 시작하세요
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            지금 가입하면 모든 기능을 무료로 사용할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 text-lg font-medium text-white bg-ct-primary rounded-xl hover:bg-ct-primary-600 transition-colors"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/services"
              className="px-8 py-4 text-lg font-medium text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
            >
              다른 서비스 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
