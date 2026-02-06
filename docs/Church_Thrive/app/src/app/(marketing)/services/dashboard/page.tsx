import Link from 'next/link';
import {
  ChartBarIcon,
  UsersIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  ArrowTrendingUpIcon,
  PresentationChartLineIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: '통계 대시보드 - ChurchThrive',
  description: '교회 현황을 한눈에 파악하는 직관적인 대시보드. 출석 통계, 새가족 현황, 성장 추이를 실시간으로 확인하세요.',
};

const STATS_CARDS = [
  {
    icon: UsersIcon,
    title: '전체 교인',
    description: '등록된 활동 교인 수를 실시간으로 확인',
    color: 'bg-blue-500',
  },
  {
    icon: CalendarDaysIcon,
    title: '이번주 출석',
    description: '주간 예배 출석 현황 집계',
    color: 'bg-green-500',
  },
  {
    icon: UserPlusIcon,
    title: '이번달 새가족',
    description: '월간 새가족 등록 현황',
    color: 'bg-yellow-500',
  },
  {
    icon: ArrowTrendingUpIcon,
    title: '출석 추이',
    description: '주간/월간 출석률 변화 그래프',
    color: 'bg-purple-500',
  },
];

const FEATURES = [
  {
    icon: PresentationChartLineIcon,
    title: '실시간 현황 파악',
    description: '로그인하면 바로 교회의 핵심 지표를 확인할 수 있습니다. 별도의 조회 작업 없이 대시보드에서 모든 현황을 파악합니다.',
    details: [
      '전체 교인 수 실시간 집계',
      '주간 출석 현황',
      '월간 새가족 현황',
      '활동 공지사항 수',
    ],
  },
  {
    icon: ChartBarIcon,
    title: '출석 통계',
    description: '예배별, 기간별 출석 통계를 차트로 시각화합니다. 출석률 변화 추이를 파악하고 목양 전략을 수립할 수 있습니다.',
    details: [
      '예배 유형별 출석 통계',
      '주간/월간/연간 추이',
      '구역별 출석 비교',
      '출석률 변화 그래프',
    ],
  },
  {
    icon: UserPlusIcon,
    title: '새가족 분석',
    description: '새가족 유입 경로, 정착률 등을 분석합니다. 효과적인 새가족 정착 프로그램 수립에 활용할 수 있습니다.',
    details: [
      '월별 새가족 추이',
      '유입 경로 분석',
      '정착률 통계',
      '새가족 목록',
    ],
  },
  {
    icon: UsersIcon,
    title: '구역별 현황',
    description: '구역/셀그룹별로 구성원 현황, 출석률, 활동 상황을 비교 분석합니다.',
    details: [
      '그룹별 구성원 수',
      '그룹별 출석률 비교',
      '리더별 관리 현황',
      '그룹 성장 추이',
    ],
  },
];

const QUICK_ACTIONS = [
  { label: '교인 검색', href: '/members', description: '교인 정보 조회' },
  { label: '말씀노트 작성', href: '/notes/new', description: '새 노트 작성' },
  { label: '출석 체크', href: '/admin/attendance', description: 'QR 출석 관리' },
  { label: '공지사항', href: '/admin/announcements', description: '공지 작성/확인' },
];

export default function DashboardServicePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-2xl mb-6">
            <ChartBarIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            통계 대시보드
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            교회 현황을 한눈에 파악하는 직관적인 대시보드를 제공합니다.
            데이터 기반의 현명한 목양 결정을 내리세요.
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

      {/* Stats Preview */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            핵심 지표를 한눈에
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS_CARDS.map((stat) => (
              <div key={stat.title} className="bg-white rounded-xl p-6">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{stat.title}</h3>
                <p className="text-gray-600 text-sm">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            빠른 실행
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <div
                key={action.label}
                className="bg-white rounded-xl p-6 border border-gray-200 text-center hover:border-ct-primary/30 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
                <p className="text-gray-500 text-sm">{action.description}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">
            대시보드에서 자주 사용하는 기능에 빠르게 접근할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Features Detail */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              주요 기능
            </h2>
            <p className="text-lg text-gray-600">
              데이터로 교회 현황을 파악하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
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

      {/* Role-based View */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              역할별 맞춤 대시보드
            </h2>
            <p className="text-gray-600">
              역할에 따라 다른 정보를 표시합니다
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                관리자 대시보드
              </h3>
              <p className="text-gray-600 mb-4">
                담임목사, 교역자, 사무간사용
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">전체 교인/출석/새가족 통계</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">구역별 현황 비교</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">최근 활동 타임라인</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">빠른 실행 버튼</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                교인 대시보드
              </h3>
              <p className="text-gray-600 mb-4">
                일반 교인용
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">내 말씀노트 현황</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">내 구역/셀 정보</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">최근 공지사항</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">빠른 노트 작성</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            데이터로 현명한 결정을 내리세요
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
