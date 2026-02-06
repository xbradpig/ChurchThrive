import Link from 'next/link';
import {
  HandRaisedIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: '파트너 모집 - ChurchThrive',
  description: 'ChurchThrive와 함께 한국 교회의 디지털 전환을 이끌어갈 파트너를 모집합니다.',
};

const PARTNER_ROLES = [
  {
    icon: CodeBracketIcon,
    title: '개발자',
    description: 'Frontend, Backend, Mobile 개발에 참여하실 분',
    skills: ['React/Next.js', 'Node.js', 'React Native', 'TypeScript', 'Supabase'],
    responsibilities: [
      '새로운 기능 개발 및 기존 코드 개선',
      '코드 리뷰 및 기술 문서 작성',
      '성능 최적화 및 버그 수정',
    ],
  },
  {
    icon: PaintBrushIcon,
    title: 'UI/UX 디자이너',
    description: '사용자 경험을 설계하고 아름다운 인터페이스를 만드실 분',
    skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design System'],
    responsibilities: [
      '사용자 리서치 및 UX 설계',
      'UI 컴포넌트 디자인',
      '디자인 시스템 구축 및 관리',
    ],
  },
  {
    icon: MegaphoneIcon,
    title: '마케팅/홍보',
    description: 'ChurchThrive를 교회들에게 알리고 성장시키실 분',
    skills: ['콘텐츠 마케팅', 'SNS 운영', '교회 네트워크', '영상 제작', 'SEO'],
    responsibilities: [
      '마케팅 전략 수립 및 실행',
      '콘텐츠 제작 및 SNS 운영',
      '교회 네트워크 확장',
    ],
  },
  {
    icon: DocumentTextIcon,
    title: '기획/운영',
    description: '서비스 기획과 고객 지원을 담당하실 분',
    skills: ['서비스 기획', '고객 지원', '문서 작성', '커뮤니티 관리', '데이터 분석'],
    responsibilities: [
      '신규 기능 기획 및 요구사항 정의',
      '사용자 피드백 수집 및 분석',
      '고객 지원 및 온보딩',
    ],
  },
];

const PHILOSOPHY = [
  {
    number: '1',
    title: '기여도 기반 보상',
    description: '고정 급여가 아닌, 창출한 가치에 비례하는 공정한 보상 체계를 만들어갑니다.',
  },
  {
    number: '2',
    title: '수익 공유',
    description: '서비스가 수익을 창출하면, 기여도에 따라 파트너들과 공정하게 배분합니다.',
  },
  {
    number: '3',
    title: '투명한 운영',
    description: '모든 의사결정과 재정 상황을 파트너들에게 투명하게 공개합니다.',
  },
  {
    number: '4',
    title: '유연한 참여',
    description: '풀타임이 아니어도 괜찮습니다. 본업과 병행하며 자유롭게 기여할 수 있습니다.',
  },
];

const COMPARISON = [
  { item: '관계', normal: '직원', ours: '파트너' },
  { item: '보상', normal: '고정 급여', ours: '수익 쉐어' },
  { item: '참여', normal: '풀타임', ours: '유연한 참여' },
  { item: '성장', normal: '제한적', ours: '함께 성장' },
  { item: '의사결정', normal: '하향식', ours: '참여형' },
];

const BENEFITS = [
  '의미 있는 프로젝트에 참여하는 보람',
  '기여도에 따른 공정한 수익 배분',
  '유연한 근무 환경 (원격, 파트타임 가능)',
  '성장하는 플랫폼과 함께하는 경험',
  '투명한 의사결정 참여 권한',
  '다양한 분야의 전문가들과 협업',
];

export default function JoinPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
            <HandRaisedIcon className="w-4 h-4" />
            함께 만들어가요
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            파트너를 모집합니다
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ChurchThrive는 <span className="font-semibold text-ct-primary">&quot;직원이 아닌 파트너&quot;</span>와 함께 성장합니다.
            기여한 만큼 함께 나누는, 공정하고 투명한 협력 모델을 추구합니다.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                우리의 철학
              </h2>
              <div className="space-y-6">
                {PHILOSOPHY.map((item) => (
                  <div key={item.number} className="flex gap-4">
                    <div className="w-10 h-10 bg-ct-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-ct-primary font-bold">{item.number}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-ct-primary/5 to-blue-50 rounded-2xl p-6 lg:p-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-6">
                일반 스타트업 vs ChurchThrive
              </h4>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium text-gray-500">항목</div>
                    <div className="font-medium text-gray-400">일반</div>
                    <div className="font-medium text-ct-primary">ChurchThrive</div>
                  </div>
                </div>
                {COMPARISON.map((row) => (
                  <div key={row.item} className="bg-white/50 rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="font-medium text-gray-700">{row.item}</div>
                      <div className="text-gray-400">{row.normal}</div>
                      <div className="text-ct-primary font-medium">{row.ours}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            파트너가 되면
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 bg-white rounded-xl p-4">
                <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              모집 분야
            </h2>
            <p className="text-gray-600">
              다양한 분야에서 함께할 파트너를 찾고 있습니다
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PARTNER_ROLES.map((role) => (
              <div
                key={role.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                <div className="w-14 h-14 bg-ct-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <role.icon className="w-7 h-7 text-ct-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {role.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {role.description}
                </p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">필요 역량</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">담당 업무</h4>
                  <ul className="space-y-1">
                    {role.responsibilities.map((resp) => (
                      <li key={resp} className="text-gray-600 text-sm flex items-start gap-2">
                        <span className="text-ct-primary mt-1">•</span>
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Join */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              참여 방법
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-ct-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">지원서 제출</h3>
              <p className="text-gray-600 text-sm">
                이메일로 간단한 자기소개와 관심 분야를 알려주세요.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-ct-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">온라인 미팅</h3>
              <p className="text-gray-600 text-sm">
                30분 정도 화상 미팅으로 서로를 알아가는 시간을 갖습니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-ct-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">협업 시작</h3>
              <p className="text-gray-600 text-sm">
                작은 태스크부터 시작하여 점차 역할을 확장해 나갑니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-ct-primary to-green-600 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              함께 만들어갈 동역자를 찾습니다
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              정규직이든, 파트타임이든, 재능 기부든 상관없습니다.
              당신의 전문성으로 한국 교회의 디지털 전환을 함께 이끌어주세요.
            </p>
            <a
              href="mailto:partner@churchthrive.org"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-ct-primary bg-white rounded-xl hover:bg-green-50 transition-colors"
            >
              파트너 지원하기
              <ArrowRightIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
