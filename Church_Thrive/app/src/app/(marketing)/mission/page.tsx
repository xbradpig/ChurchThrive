import Link from 'next/link';
import {
  HeartIcon,
  LightBulbIcon,
  SparklesIcon,
  HandRaisedIcon,
  BoltIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Mission · Vision · Core Values - ChurchThrive',
  description: 'ChurchThrive가 추구하는 가치와 방향성을 소개합니다.',
};

const CORE_VALUES = [
  {
    icon: HeartIcon,
    title: '섬김의 마음',
    description: '교회의 본질은 섬김입니다. 우리는 기술을 통해 목회자와 성도의 섬김을 돕습니다. 편리함을 넘어, 사역의 본질에 집중할 수 있도록 지원합니다.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: LightBulbIcon,
    title: '지혜로운 혁신',
    description: '전통의 가치를 존중하면서도 시대에 맞는 지혜로운 변화를 추구합니다. 변화를 위한 변화가 아닌, 사역에 실질적인 도움이 되는 혁신을 추구합니다.',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: SparklesIcon,
    title: '투명한 운영',
    description: '모든 과정을 투명하게 공개하고, 신뢰를 바탕으로 성장합니다. 파트너와 사용자 모두에게 정직하고 열린 소통을 약속합니다.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: HandRaisedIcon,
    title: '함께하는 성장',
    description: '혼자가 아닌 함께 성장합니다. 개인의 성공이 공동체의 성공이 되고, 공동체의 성장이 개인의 보람이 됩니다.',
    color: 'bg-green-50 text-green-600',
  },
];

const PRINCIPLES = [
  {
    title: '교회 중심',
    description: '모든 기능은 교회의 실제 필요에서 출발합니다. 기술적 편의보다 목회적 가치를 우선합니다.',
  },
  {
    title: '단순함의 미학',
    description: '복잡함을 걷어내고 본질에 집중합니다. 누구나 쉽게 사용할 수 있어야 합니다.',
  },
  {
    title: '데이터 주권',
    description: '교회의 데이터는 교회의 것입니다. 언제든 내보내고, 삭제할 수 있는 권리를 보장합니다.',
  },
  {
    title: '지속 가능성',
    description: '단기적 이익보다 장기적 신뢰를 추구합니다. 지속 가능한 방식으로 성장합니다.',
  },
];

export default function MissionPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Mission · Vision · Core Values
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ChurchThrive가 추구하는 가치와 방향성입니다.
            우리의 모든 결정과 행동은 이 원칙에 기반합니다.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-ct-primary rounded-2xl flex items-center justify-center mb-8">
                <BoltIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Mission</h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                교회가 <span className="text-ct-primary font-semibold">본질에 집중</span>할 수 있도록
                기술로 섬기는 것
              </p>
              <div className="space-y-4 text-gray-600">
                <p>
                  우리의 미션은 간단합니다. 교회가 행정 부담에서 벗어나
                  복음 전파와 양육이라는 본연의 사명에 더 많은 시간을
                  쓸 수 있도록 돕는 것입니다.
                </p>
                <p>
                  기술은 목적이 아닌 수단입니다. 우리는 기술을 통해
                  목회자와 성도들이 서로를 더 잘 섬길 수 있는
                  환경을 만들고자 합니다.
                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8">
                <EyeIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Vision</h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                한국의 모든 교회가 <span className="text-blue-600 font-semibold">건강하게 성장</span>하는 것
              </p>
              <div className="space-y-4 text-gray-600">
                <p>
                  우리가 꿈꾸는 미래는 규모와 관계없이 모든 교회가
                  효과적인 도구를 사용할 수 있는 세상입니다.
                </p>
                <p>
                  대형 교회만의 전유물이었던 체계적인 교인 관리 시스템을
                  작은 교회도 쉽게 사용할 수 있도록,
                  접근성과 사용성을 최우선으로 생각합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Core Values
            </h2>
            <p className="text-lg text-gray-600">
              우리가 지키고자 하는 핵심 가치입니다
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {CORE_VALUES.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${value.color}`}>
                  <value.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guiding Principles */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              행동 원칙
            </h2>
            <p className="text-lg text-gray-600">
              일상의 결정에서 지키는 원칙들
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRINCIPLES.map((principle, index) => (
              <div
                key={principle.title}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-ct-primary/30 hover:shadow-md transition-all"
              >
                <div className="w-8 h-8 bg-ct-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-ct-primary font-bold">{index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {principle.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-20 px-4 bg-ct-primary">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className="text-2xl sm:text-3xl font-medium text-white leading-relaxed">
            &ldquo;기술은 섬김의 도구입니다.
            <br />
            교회의 본질을 회복하는 데 작은 도움이 되길 바랍니다.&rdquo;
          </blockquote>
          <p className="text-green-200 mt-6">— ChurchThrive Team</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            우리의 비전에 공감하시나요?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            ChurchThrive와 함께 한국 교회의 건강한 성장을 만들어가세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 text-lg font-medium text-white bg-ct-primary rounded-xl hover:bg-ct-primary-600 transition-colors"
            >
              서비스 시작하기
            </Link>
            <Link
              href="/join"
              className="px-8 py-4 text-lg font-medium text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
            >
              파트너로 참여하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
