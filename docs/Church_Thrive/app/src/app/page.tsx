import Link from 'next/link';
import {
  UsersIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  HeartIcon,
  LightBulbIcon,
  SparklesIcon,
  HandRaisedIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowRightIcon,
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

const CORE_VALUES = [
  {
    icon: HeartIcon,
    title: '섬김의 마음',
    description: '교회의 본질은 섬김입니다. 기술로 목회자와 성도의 섬김을 돕습니다.',
  },
  {
    icon: LightBulbIcon,
    title: '지혜로운 혁신',
    description: '전통의 가치를 존중하며, 시대에 맞는 지혜로운 변화를 추구합니다.',
  },
  {
    icon: SparklesIcon,
    title: '투명한 운영',
    description: '모든 과정을 투명하게 공개하고, 신뢰를 바탕으로 성장합니다.',
  },
  {
    icon: HandRaisedIcon,
    title: '함께하는 성장',
    description: '혼자가 아닌 함께, 개인의 성공이 공동체의 성공이 됩니다.',
  },
];

const PARTNER_ROLES = [
  {
    icon: CodeBracketIcon,
    title: '개발자',
    description: 'Frontend, Backend, Mobile 개발에 참여하실 분',
    skills: ['React/Next.js', 'Node.js', 'React Native', 'TypeScript'],
  },
  {
    icon: PaintBrushIcon,
    title: 'UI/UX 디자이너',
    description: '사용자 경험을 설계하고 아름다운 인터페이스를 만드실 분',
    skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping'],
  },
  {
    icon: MegaphoneIcon,
    title: '마케팅/홍보',
    description: 'ChurchThrive를 교회들에게 알리고 성장시키실 분',
    skills: ['콘텐츠 마케팅', 'SNS 운영', '교회 네트워크', '영상 제작'],
  },
  {
    icon: DocumentTextIcon,
    title: '기획/운영',
    description: '서비스 기획과 고객 지원을 담당하실 분',
    skills: ['서비스 기획', '고객 지원', '문서 작성', '커뮤니티 관리'],
  },
];

const NAV_ITEMS = [
  { href: '#about', label: '소개' },
  { href: '#mission', label: 'Mission' },
  { href: '#services', label: '서비스' },
  { href: '#join', label: '파트너 모집' },
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

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-gray-600 hover:text-ct-primary transition-colors"
                >
                  {item.label}
                </a>
              ))}
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-ct-primary/10 rounded-full text-ct-primary text-sm font-medium mb-6">
            <SparklesIcon className="w-4 h-4" />
            교회 관리의 새로운 패러다임
          </div>
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
            <a
              href="#about"
              className="w-full sm:w-auto px-8 py-4 text-lg font-medium text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
            >
              더 알아보기
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                ChurchThrive는
                <br />
                <span className="text-ct-primary">교회를 위해</span> 만들어졌습니다
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                많은 교회들이 엑셀, 카카오톡, 여러 도구들을 오가며
                교인 관리와 행정 업무에 많은 시간을 쓰고 있습니다.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
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
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-ct-primary flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-ct-primary/10 to-ct-primary/5 rounded-3xl p-8 lg:p-12">
                <div className="bg-white rounded-2xl shadow-ct-3 p-6 space-y-4">
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
                    <div className="w-10 h-10 bg-ct-secondary rounded-full flex items-center justify-center">
                      <BookOpenIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">이번 주 말씀 노트</div>
                      <div className="text-xl font-bold text-gray-900">43개</div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ct-gold rounded-full flex items-center justify-center">
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
        </div>
      </section>

      {/* Mission, Vision, Core Values Section */}
      <section id="mission" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Mission · Vision · Core Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ChurchThrive가 추구하는 가치와 방향성입니다
            </p>
          </div>

          {/* Mission & Vision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-3xl p-8 shadow-ct-2 border border-gray-100">
              <div className="w-14 h-14 bg-ct-primary rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Mission</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                교회가 <span className="text-ct-primary font-semibold">본질에 집중</span>할 수 있도록
                기술로 섬기는 것. 행정 부담을 줄이고, 목회와 양육에
                더 많은 시간을 쓸 수 있게 돕습니다.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-ct-2 border border-gray-100">
              <div className="w-14 h-14 bg-ct-secondary rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Vision</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                한국의 모든 교회가 <span className="text-ct-secondary font-semibold">건강하게 성장</span>하는 것.
                규모와 관계없이 모든 교회가 효과적인 도구를
                사용할 수 있는 세상을 만듭니다.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900">Core Values</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_VALUES.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-2xl p-6 shadow-ct-1 border border-gray-100 hover:shadow-ct-2 transition-shadow"
              >
                <div className="w-12 h-12 bg-ct-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-ct-primary" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {value.title}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services/Features Section */}
      <section id="services" className="py-20 px-4 bg-white">
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

      {/* Partner Recruitment Section */}
      <section id="join" className="py-20 px-4 bg-gradient-to-b from-ct-secondary/5 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-ct-secondary/10 rounded-full text-ct-secondary text-sm font-medium mb-4">
              <HandRaisedIcon className="w-4 h-4" />
              함께 만들어가요
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              파트너를 모집합니다
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              ChurchThrive는 <span className="font-semibold text-ct-primary">&quot;직원이 아닌 파트너&quot;</span>와 함께 성장합니다.
              <br className="hidden sm:block" />
              기여한 만큼 함께 나누는, 공정하고 투명한 협력 모델을 추구합니다.
            </p>
          </div>

          {/* Philosophy Card */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-ct-2 border border-gray-100 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  우리의 철학
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-ct-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-ct-primary font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">기여도 기반 보상</h4>
                      <p className="text-gray-600 text-sm">
                        고정 급여가 아닌, 창출한 가치에 비례하는 공정한 보상 체계를 만들어갑니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-ct-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-ct-primary font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">수익 공유</h4>
                      <p className="text-gray-600 text-sm">
                        서비스가 수익을 창출하면, 기여도에 따라 파트너들과 공정하게 배분합니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-ct-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-ct-primary font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">투명한 운영</h4>
                      <p className="text-gray-600 text-sm">
                        모든 의사결정과 재정 상황을 파트너들에게 투명하게 공개합니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-ct-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-ct-primary font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">유연한 참여</h4>
                      <p className="text-gray-600 text-sm">
                        풀타임이 아니어도 괜찮습니다. 본업과 병행하며 자유롭게 기여할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-ct-primary/5 to-ct-secondary/5 rounded-2xl p-6 md:p-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  일반 스타트업 vs ChurchThrive
                </h4>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="font-medium text-gray-500">항목</div>
                      <div className="font-medium text-gray-400">일반</div>
                      <div className="font-medium text-ct-primary">ChurchThrive</div>
                    </div>
                  </div>
                  {[
                    { item: '관계', normal: '직원', ours: '파트너' },
                    { item: '보상', normal: '고정 급여', ours: '수익 쉐어' },
                    { item: '참여', normal: '풀타임', ours: '유연한 참여' },
                    { item: '성장', normal: '제한적', ours: '함께 성장' },
                  ].map((row) => (
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

          {/* Roles Grid */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">모집 분야</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {PARTNER_ROLES.map((role) => (
              <div
                key={role.title}
                className="bg-white rounded-2xl p-6 shadow-ct-1 border border-gray-100 hover:shadow-ct-2 hover:border-ct-primary/20 transition-all group"
              >
                <div className="w-12 h-12 bg-ct-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-ct-primary/10 transition-colors">
                  <role.icon className="w-6 h-6 text-ct-secondary group-hover:text-ct-primary transition-colors" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {role.title}
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  {role.description}
                </p>
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
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-ct-primary to-green-600 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              함께 만들어갈 동역자를 찾습니다
            </h3>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              정규직이든, 파트타임이든, 재능 기부든 상관없습니다.
              <br className="hidden sm:block" />
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

      {/* Final CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-ct-2 border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              교회 등록부터 교인 관리까지, 5분이면 충분합니다.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 text-lg font-medium text-white bg-ct-primary rounded-xl hover:bg-ct-primary-600 transition-colors shadow-lg shadow-ct-primary/25"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-ct-primary font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold text-white">ChurchThrive</span>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                교회의 건강한 성장을 함께 만들어갑니다.
                기술로 섬기고, 함께 나누며, 투명하게 운영합니다.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">서비스</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-white text-sm transition-colors">소개</a></li>
                <li><a href="#services" className="text-gray-400 hover:text-white text-sm transition-colors">기능</a></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white text-sm transition-colors">시작하기</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">파트너</h4>
              <ul className="space-y-2">
                <li><a href="#join" className="text-gray-400 hover:text-white text-sm transition-colors">파트너 모집</a></li>
                <li><a href="mailto:partner@churchthrive.org" className="text-gray-400 hover:text-white text-sm transition-colors">지원하기</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-400 text-sm">
                &copy; 2026 ChurchThrive. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs">
                Made with ❤️ for Korean Churches
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
