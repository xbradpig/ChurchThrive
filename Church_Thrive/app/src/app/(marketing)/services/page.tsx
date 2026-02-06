import Link from 'next/link';
import {
  UsersIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: '서비스 - ChurchThrive',
  description: 'ChurchThrive가 제공하는 교회 관리 서비스를 소개합니다.',
};

const SERVICES = [
  {
    icon: UsersIcon,
    title: '교인 관리',
    description: '교인 정보, 가족 관계, 조직 소속을 체계적으로 관리합니다.',
    href: '/services/members',
    features: ['프로필 관리', '가족 연결', '조직 배치', 'QR 등록', '엑셀 임포트'],
    color: 'bg-blue-500',
  },
  {
    icon: BookOpenIcon,
    title: '말씀 노트',
    description: '설교를 듣고 나만의 노트를 작성하고, 목사님께 피드백을 받으세요.',
    href: '/services/notes',
    features: ['설교 연동', '성경 구절 자동 감지', '음성 녹음', '노트 공유', '피드백'],
    color: 'bg-green-500',
  },
  {
    icon: ClipboardDocumentListIcon,
    title: '교회 행정',
    description: '공지사항, 출석관리, 조직도를 한 곳에서 관리합니다.',
    href: '/services/admin',
    features: ['공지사항', 'QR 출석', '구역/셀 관리', '직분 관리', '역할 권한'],
    color: 'bg-yellow-500',
  },
  {
    icon: ChartBarIcon,
    title: '통계 대시보드',
    description: '교회 현황을 한눈에 파악하는 직관적인 대시보드를 제공합니다.',
    href: '/services/dashboard',
    features: ['출석 통계', '새가족 현황', '성장 추이', '활동 분석', '리포트'],
    color: 'bg-purple-500',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: '모바일 앱',
    description: 'iOS, Android 앱으로 언제 어디서나 접근할 수 있습니다.',
    href: '/services/mobile',
    features: ['iOS 앱', 'Android 앱', '푸시 알림', '오프라인 지원', 'QR 스캔'],
    color: 'bg-indigo-500',
  },
  {
    icon: ShieldCheckIcon,
    title: '안전한 데이터',
    description: '교회별 완전한 데이터 분리와 역할 기반 접근 제어를 제공합니다.',
    href: '/services/security',
    features: ['데이터 암호화', 'RLS 보안', '역할 권한', '백업', '감사 로그'],
    color: 'bg-red-500',
  },
];

export default function ServicesPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            교회 사역에 필요한
            <br />
            <span className="text-ct-primary">모든 것</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ChurchThrive 하나로 교회 운영의 모든 영역을 관리하세요.
            각 서비스는 유기적으로 연결되어 최고의 시너지를 발휘합니다.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service) => (
              <Link
                key={service.title}
                href={service.href}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-ct-primary/20 transition-all"
              >
                <div className={`w-14 h-14 ${service.color} rounded-xl flex items-center justify-center mb-6`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-ct-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {service.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {service.features.slice(0, 3).map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                    >
                      {feature}
                    </span>
                  ))}
                  {service.features.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                      +{service.features.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-ct-primary text-sm font-medium">
                  자세히 보기
                  <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              모든 기능이 유기적으로 연결됩니다
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ChurchThrive의 각 서비스는 독립적으로도 강력하지만,
              함께 사용할 때 최고의 효과를 발휘합니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                교인 + 출석
              </h3>
              <p className="text-gray-600 text-sm">
                QR코드로 출석체크하면 자동으로 교인의 출석 기록에 반영됩니다.
                출석 통계도 실시간으로 업데이트됩니다.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                설교 + 말씀노트
              </h3>
              <p className="text-gray-600 text-sm">
                관리자가 설교를 등록하면 성도들이 해당 설교에 맞는
                말씀노트를 작성할 수 있습니다.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                구역 + 통계
              </h3>
              <p className="text-gray-600 text-sm">
                구역/셀별로 출석률, 성장 현황을 분석하여
                효과적인 목양 전략을 수립할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-ct-primary to-green-600 rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              모든 기능을 무료로 체험하세요
            </h2>
            <p className="text-green-100 text-lg mb-8">
              지금 가입하시면 모든 서비스를 무료로 사용할 수 있습니다.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 text-lg font-medium text-ct-primary bg-white rounded-xl hover:bg-green-50 transition-colors"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
