import Link from 'next/link';
import {
  DevicePhoneMobileIcon,
  BellIcon,
  WifiIcon,
  QrCodeIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: '모바일 앱 - ChurchThrive',
  description: 'iOS, Android 앱으로 언제 어디서나 교회 관리. 푸시 알림, 오프라인 지원, QR 스캔까지.',
};

const PLATFORMS = [
  {
    name: 'iOS',
    version: 'iOS 14.0 이상',
    status: '출시 예정',
    icon: '🍎',
  },
  {
    name: 'Android',
    version: 'Android 8.0 이상',
    status: '출시 예정',
    icon: '🤖',
  },
];

const FEATURES = [
  {
    icon: DevicePhoneMobileIcon,
    title: '네이티브 앱 경험',
    description: 'React Native로 개발된 네이티브 앱으로 웹보다 빠르고 부드러운 사용자 경험을 제공합니다.',
    details: [
      '네이티브 UI 컴포넌트',
      '부드러운 애니메이션',
      '빠른 화면 전환',
      '제스처 지원',
    ],
  },
  {
    icon: BellIcon,
    title: '푸시 알림',
    description: '중요한 공지사항, 출석 알림, 목사님의 피드백 등을 실시간 푸시 알림으로 받아보세요.',
    details: [
      '공지사항 알림',
      '출석 체크 리마인더',
      '말씀노트 피드백 알림',
      '새가족 등록 알림 (관리자)',
    ],
  },
  {
    icon: WifiIcon,
    title: '오프라인 지원',
    description: '인터넷이 없어도 기본 기능을 사용할 수 있습니다. 연결되면 자동으로 동기화됩니다.',
    details: [
      '교인 목록 오프라인 조회',
      '말씀노트 오프라인 작성',
      '자동 동기화',
      '충돌 해결 처리',
    ],
  },
  {
    icon: QrCodeIcon,
    title: 'QR코드 스캔',
    description: '앱 내장 QR 스캐너로 출석 체크, 새가족 등록을 간편하게 처리합니다.',
    details: [
      '빠른 QR 인식',
      '출석 즉시 기록',
      '새가족 등록 연동',
      '플래시 지원',
    ],
  },
  {
    icon: ArrowPathIcon,
    title: '실시간 동기화',
    description: '웹과 앱 간 데이터가 실시간으로 동기화됩니다. 어디서 작업해도 항상 최신 상태입니다.',
    details: [
      '웹-앱 실시간 동기화',
      '변경사항 즉시 반영',
      '다중 디바이스 지원',
      '충돌 없는 동기화',
    ],
  },
  {
    icon: CloudArrowDownIcon,
    title: '자동 업데이트',
    description: '새로운 기능이 추가되면 자동으로 업데이트됩니다. 항상 최신 버전을 사용하세요.',
    details: [
      '앱스토어 자동 업데이트',
      'OTA 업데이트 지원',
      '업데이트 알림',
      '버전 관리',
    ],
  },
];

const USE_CASES = [
  {
    title: '심방 중에',
    description: '교인 정보를 현장에서 바로 확인하고, 심방 메모를 남길 수 있습니다.',
  },
  {
    title: '예배 시간에',
    description: 'QR코드를 스캔하여 출석 체크하고, 말씀노트를 바로 작성합니다.',
  },
  {
    title: '이동 중에',
    description: '푸시 알림으로 중요한 소식을 바로 확인하고 응답합니다.',
  },
  {
    title: '회의 중에',
    description: '교회 통계와 현황을 실시간으로 조회하여 의사결정에 활용합니다.',
  },
];

export default function MobileServicePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500 rounded-2xl mb-6">
            <DevicePhoneMobileIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            모바일 앱
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            iOS, Android 앱으로 언제 어디서나 접근할 수 있습니다.
            목회 현장에서 바로 사용하세요.
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

      {/* Platforms */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            지원 플랫폼
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PLATFORMS.map((platform) => (
              <div key={platform.name} className="bg-white rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">{platform.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {platform.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2">{platform.version}</p>
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                  {platform.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">
            현재 웹 버전을 모바일 브라우저에서 사용하실 수 있습니다.
            <br />
            네이티브 앱은 곧 출시 예정입니다.
          </p>
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
              모바일 환경에 최적화된 기능들
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-sm">
                      <CheckCircleIcon className="w-4 h-4 text-ct-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              이런 상황에서 유용합니다
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {USE_CASES.map((useCase) => (
              <div key={useCase.title} className="bg-white rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {useCase.title}
                </h3>
                <p className="text-gray-600">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Web PWA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              지금 바로 모바일에서 사용하세요
            </h2>
            <p className="text-indigo-100 text-lg mb-6">
              앱 출시 전에도 모바일 브라우저에서 ChurchThrive를 사용할 수 있습니다.
              <br />
              홈 화면에 추가하면 앱처럼 사용할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="bg-white/20 rounded-lg px-4 py-3 text-sm">
                Safari → 공유 → 홈 화면에 추가
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-3 text-sm">
                Chrome → 메뉴 → 홈 화면에 추가
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            언제 어디서나 교회 관리
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
