import Link from 'next/link';
import {
  CheckCircleIcon,
  UsersIcon,
  BookOpenIcon,
  SparklesIcon,
  BuildingOffice2Icon,
  ClockIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: '소개 - ChurchThrive',
  description: 'ChurchThrive는 교회의 건강한 성장을 위해 만들어진 통합 교회 관리 플랫폼입니다.',
};

const STATS = [
  { label: '등록 교회', value: '50+', suffix: '개' },
  { label: '관리 교인', value: '5,000+', suffix: '명' },
  { label: '작성된 말씀노트', value: '10,000+', suffix: '개' },
  { label: '서비스 가동률', value: '99.9', suffix: '%' },
];

const TIMELINE = [
  {
    year: '2024.11',
    title: '프로젝트 시작',
    description: '한국 교회의 디지털 전환을 위한 ChurchThrive 프로젝트가 시작되었습니다.',
  },
  {
    year: '2025.01',
    title: '베타 버전 출시',
    description: '핵심 기능(교인관리, 말씀노트, 출석관리)이 포함된 베타 버전을 출시했습니다.',
  },
  {
    year: '2025.02',
    title: '정식 서비스 오픈',
    description: '모바일 앱 지원과 함께 정식 서비스를 시작했습니다.',
  },
  {
    year: '2026~',
    title: '지속적인 성장',
    description: 'AI 기반 목양 도구, 재정 관리 등 새로운 기능을 준비하고 있습니다.',
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            ChurchThrive는
            <br />
            <span className="text-ct-primary">교회를 위해</span> 만들어졌습니다
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            많은 교회들이 엑셀, 카카오톡, 여러 도구들을 오가며
            교인 관리와 행정 업무에 많은 시간을 쓰고 있습니다.
            ChurchThrive는 이 문제를 해결하기 위해 태어났습니다.
          </p>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                목회자와 행정 담당자들의
                <br />시간을 아껴드립니다
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                ChurchThrive는 목회자와 행정 담당자들이 본연의 사역에
                더 집중할 수 있도록, 교회 운영에 필요한 모든 기능을
                하나의 플랫폼에서 제공합니다.
              </p>
              <div className="space-y-4">
                {[
                  '교인 정보와 출석을 한 곳에서 관리',
                  '설교 노트로 성도와 목사님의 소통 강화',
                  '셀그룹, 조직별 체계적인 관리',
                  '언제 어디서나 모바일로 접근',
                  'QR코드로 간편한 출석 체크',
                  '엑셀 임포트로 빠른 데이터 이전',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-ct-primary flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-ct-primary/10 to-ct-primary/5 rounded-3xl p-8 lg:p-12">
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-ct-primary rounded-full flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">이번 주 출석</div>
                    <div className="text-xl font-bold text-gray-900">127명</div>
                  </div>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <BookOpenIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">이번 주 말씀 노트</div>
                    <div className="text-xl font-bold text-gray-900">43개</div>
                  </div>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">새가족</div>
                    <div className="text-xl font-bold text-gray-900">5명</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-ct-primary">
                  {stat.value}<span className="text-lg">{stat.suffix}</span>
                </div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ChurchThrive */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              왜 ChurchThrive인가요?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-ct-primary/10 rounded-xl flex items-center justify-center mb-6">
                <BuildingOffice2Icon className="w-7 h-7 text-ct-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                한국 교회 맞춤형
              </h3>
              <p className="text-gray-600">
                직분 체계, 구역/셀 조직, 예배 유형 등 한국 교회의 특성에 맞게
                설계되었습니다. 장로, 안수집사, 권사 등 익숙한 용어를 그대로 사용합니다.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-ct-primary/10 rounded-xl flex items-center justify-center mb-6">
                <ClockIcon className="w-7 h-7 text-ct-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                5분 만에 시작
              </h3>
              <p className="text-gray-600">
                복잡한 설정 없이 바로 시작할 수 있습니다. 기존 엑셀 파일을
                그대로 가져오면 모든 교인 정보가 자동으로 등록됩니다.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-ct-primary/10 rounded-xl flex items-center justify-center mb-6">
                <GlobeAltIcon className="w-7 h-7 text-ct-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                언제 어디서나
              </h3>
              <p className="text-gray-600">
                웹과 모바일 앱 모두 지원합니다. 목회 심방 중에도,
                출장 중에도 교회 현황을 확인하고 관리할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ChurchThrive의 여정
            </h2>
          </div>
          <div className="space-y-8">
            {TIMELINE.map((item, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-ct-primary rounded-full" />
                  {index < TIMELINE.length - 1 && (
                    <div className="w-0.5 h-full bg-ct-primary/20 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <div className="text-sm font-medium text-ct-primary mb-1">
                    {item.year}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
    </div>
  );
}
