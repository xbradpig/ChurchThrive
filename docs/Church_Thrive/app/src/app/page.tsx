import Link from 'next/link';
import {
  UsersIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const FEATURES = [
  {
    icon: UsersIcon,
    title: '교인 관리',
    description: '교인 정보, 가족 관계, 조직 소속을 체계적으로 관리합니다.',
  },
  {
    icon: BookOpenIcon,
    title: '말씀 노트',
    description: '설교를 듣고 나만의 노트를 작성하고, 목사님께 피드백을 받으세요.',
  },
  {
    icon: ClipboardDocumentListIcon,
    title: '교회 행정',
    description: '공지사항, 출석관리, 조직도를 한 곳에서 관리합니다.',
  },
  {
    icon: ChartBarIcon,
    title: '통계 대시보드',
    description: '교회 현황을 한눈에 파악하는 직관적인 대시보드를 제공합니다.',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: '모바일 앱',
    description: 'iOS, Android 앱으로 언제 어디서나 접근할 수 있습니다.',
  },
  {
    icon: ShieldCheckIcon,
    title: '안전한 데이터',
    description: '교회별 완전한 데이터 분리와 역할 기반 접근 제어를 제공합니다.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-ct-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-ct-primary">ChurchThrive</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-ct-sm font-medium text-gray-600 hover:text-ct-primary transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-ct-sm font-medium text-white bg-ct-primary rounded-lg hover:bg-ct-primary-600 transition-colors"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            교회의 건강한 성장을
            <br />
            <span className="text-ct-primary">함께</span> 만들어갑니다
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            교인관리, 말씀노트, 교회행정을 한 곳에서.
            <br className="hidden sm:block" />
            ChurchThrive와 함께 더 나은 교회 사역을 경험하세요.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 text-lg font-medium text-white bg-ct-primary rounded-xl hover:bg-ct-primary-600 transition-colors shadow-lg shadow-ct-primary/25"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 text-lg font-medium text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
            >
              기존 교회 로그인
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              교회 사역에 필요한 모든 것
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              ChurchThrive 하나로 교회 운영의 모든 영역을 관리하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-gray-50 rounded-2xl hover:bg-green-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-ct-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-ct-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-ct-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-ct-primary to-green-600 rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-green-100 text-lg mb-8">
              교회 등록부터 교인 관리까지, 5분이면 충분합니다.
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

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-ct-primary font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-white">ChurchThrive</span>
            </div>
            <p className="text-gray-400 text-sm">
              &copy; 2026 ChurchThrive. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
