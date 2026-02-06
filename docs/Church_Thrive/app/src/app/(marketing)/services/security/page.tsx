import Link from 'next/link';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  KeyIcon,
  ServerStackIcon,
  DocumentCheckIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: '데이터 보안 - ChurchThrive',
  description: '교회별 완전한 데이터 분리와 역할 기반 접근 제어. 암호화, RLS 보안, 백업, 감사 로그까지.',
};

const SECURITY_FEATURES = [
  {
    icon: LockClosedIcon,
    title: '데이터 암호화',
    description: '모든 데이터는 전송 중(TLS 1.3)과 저장 시(AES-256) 암호화됩니다. 비밀번호는 bcrypt로 해싱하여 저장합니다.',
    details: [
      'TLS 1.3 전송 암호화',
      'AES-256 저장 암호화',
      'bcrypt 비밀번호 해싱',
      '민감 정보 마스킹',
    ],
  },
  {
    icon: ShieldCheckIcon,
    title: 'RLS (Row-Level Security)',
    description: '데이터베이스 레벨에서 행 단위 보안을 적용합니다. 교회별로 완전히 분리된 데이터 접근을 보장합니다.',
    details: [
      '교회별 데이터 완전 분리',
      '행 단위 접근 제어',
      'SQL 인젝션 방지',
      '데이터 유출 원천 차단',
    ],
  },
  {
    icon: KeyIcon,
    title: '역할 기반 접근 제어',
    description: '담임목사, 교역자, 사무간사, 리더, 교인 등 역할별로 접근 권한을 차등 부여합니다.',
    details: [
      '5단계 역할 체계',
      '기능별 접근 제어',
      '데이터 조회 범위 제한',
      '수정/삭제 권한 분리',
    ],
  },
  {
    icon: ServerStackIcon,
    title: '안전한 인프라',
    description: 'Supabase와 Cloudflare의 엔터프라이즈급 인프라를 사용합니다. 99.9% 가동률을 보장합니다.',
    details: [
      'Supabase 관리형 PostgreSQL',
      'Cloudflare CDN/DDoS 방어',
      '자동 장애 복구',
      '99.9% SLA',
    ],
  },
  {
    icon: ArchiveBoxIcon,
    title: '자동 백업',
    description: '데이터는 매일 자동으로 백업됩니다. 문제 발생 시 특정 시점으로 복구할 수 있습니다.',
    details: [
      '일일 자동 백업',
      'Point-in-Time Recovery',
      '30일 백업 보관',
      '수동 백업 지원',
    ],
  },
  {
    icon: DocumentCheckIcon,
    title: '감사 로그',
    description: '중요한 작업에 대한 감사 로그를 기록합니다. 누가 언제 무엇을 변경했는지 추적할 수 있습니다.',
    details: [
      '로그인 이력 기록',
      '데이터 변경 기록',
      '권한 변경 기록',
      '접근 시도 기록',
    ],
  },
];

const COMPLIANCE = [
  {
    title: '개인정보보호법 준수',
    description: '한국 개인정보보호법의 요구사항을 준수합니다.',
  },
  {
    title: '데이터 이동권',
    description: '언제든 본인 데이터를 내보내고 삭제할 수 있습니다.',
  },
  {
    title: '최소 수집 원칙',
    description: '서비스에 꼭 필요한 정보만 수집합니다.',
  },
  {
    title: '투명한 정책',
    description: '개인정보 처리방침을 투명하게 공개합니다.',
  },
];

const DATA_OWNERSHIP = [
  '교회 데이터는 교회의 소유입니다',
  '언제든 전체 데이터를 내보낼 수 있습니다',
  '서비스 해지 시 데이터 완전 삭제를 보장합니다',
  '제3자에게 데이터를 판매하지 않습니다',
];

export default function SecurityServicePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-red-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-2xl mb-6">
            <ShieldCheckIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            안전한 데이터
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            교회별 완전한 데이터 분리와 역할 기반 접근 제어를 제공합니다.
            소중한 교인 정보를 안전하게 보호합니다.
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

      {/* Key Points */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-ct-primary mb-2">100%</div>
              <div className="text-gray-600">교회별 데이터 분리</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-ct-primary mb-2">AES-256</div>
              <div className="text-gray-600">암호화 적용</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-ct-primary mb-2">99.9%</div>
              <div className="text-gray-600">서비스 가동률</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              보안 기능
            </h2>
            <p className="text-lg text-gray-600">
              엔터프라이즈급 보안으로 데이터를 보호합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SECURITY_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-red-600" />
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

      {/* Data Ownership */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              데이터 주권
            </h2>
            <p className="text-gray-600">
              교회의 데이터는 교회의 것입니다
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8">
            <ul className="space-y-4">
              {DATA_OWNERSHIP.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              규정 준수
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMPLIANCE.map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            신뢰할 수 있는 기술 파트너
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            ChurchThrive는 검증된 기술 인프라 위에 구축되었습니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">Supabase</div>
              <div className="text-sm text-gray-500">Database & Auth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">Cloudflare</div>
              <div className="text-sm text-gray-500">CDN & Security</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">Vercel</div>
              <div className="text-sm text-gray-500">Hosting</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            안전하게 시작하세요
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
