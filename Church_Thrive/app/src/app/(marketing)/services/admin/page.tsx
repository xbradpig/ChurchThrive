import Link from 'next/link';
import {
  ClipboardDocumentListIcon,
  MegaphoneIcon,
  QrCodeIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: '교회 행정 - ChurchThrive',
  description: '공지사항, 출석관리, 조직도를 한 곳에서 관리합니다. QR코드 출석, 구역/셀 관리, 직분 및 역할 권한까지.',
};

const FEATURES = [
  {
    icon: MegaphoneIcon,
    title: '공지사항 관리',
    description: '교회 공지사항을 작성하고 관리합니다. 중요한 공지는 상단에 고정하고, 대상별로 공지를 발송할 수 있습니다.',
    details: [
      '리치 텍스트 에디터로 작성',
      '공지 고정/해제 기능',
      '이미지 첨부',
      '예약 발행 기능',
      '읽음 확인 (예정)',
    ],
  },
  {
    icon: QrCodeIcon,
    title: 'QR코드 출석',
    description: '예배 시간에 QR코드를 띄우면 교인들이 스캔하여 출석을 체크합니다. 수기 출석보다 빠르고 정확합니다.',
    details: [
      '예배별 QR코드 생성',
      '실시간 출석 현황 확인',
      '출석 통계 자동 집계',
      '미출석자 알림',
      '출석 이력 관리',
    ],
  },
  {
    icon: UserGroupIcon,
    title: '구역/셀 관리',
    description: '교회의 구역, 셀그룹, 소그룹을 계층 구조로 관리합니다. 리더 지정, 모임 일정 관리까지 한 곳에서.',
    details: [
      '계층형 조직 구조',
      '리더 및 부리더 지정',
      '모임 요일/시간 설정',
      '구성원 일괄 배치',
      '그룹별 출석 통계',
    ],
  },
  {
    icon: BuildingOffice2Icon,
    title: '부서/조직 관리',
    description: '찬양팀, 주일학교 등 교회 내 부서와 조직을 관리합니다. 부서별로 담당자를 지정하고 구성원을 관리합니다.',
    details: [
      '부서 생성 및 관리',
      '담당자 지정',
      '구성원 관리',
      '부서별 공지',
      '활동 이력',
    ],
  },
  {
    icon: ShieldCheckIcon,
    title: '역할 및 권한',
    description: '담임목사, 교역자, 사무간사, 리더, 교인 등 역할별로 접근 권한을 차등 부여합니다. 민감한 정보는 권한 있는 사람만 볼 수 있습니다.',
    details: [
      '5단계 역할 체계',
      '역할별 메뉴 접근 제어',
      '데이터 조회 권한 관리',
      '수정/삭제 권한 분리',
      '권한 변경 이력',
    ],
  },
  {
    icon: ClipboardDocumentListIcon,
    title: '직분 관리',
    description: '장로, 안수집사, 권사, 집사, 성도 등 한국 교회의 직분 체계를 그대로 사용합니다. 직분 변경 이력도 관리됩니다.',
    details: [
      '한국 교회 직분 체계',
      '직분 변경 기록',
      '직분별 통계',
      '임직 기념일 관리',
      '직분별 필터링',
    ],
  },
];

const ROLES = [
  {
    role: '담임목사 (Admin)',
    permissions: '모든 기능 접근 가능, 교회 설정 변경, 관리자 지정',
    color: 'bg-red-100 text-red-700',
  },
  {
    role: '교역자 (Pastor)',
    permissions: '교인 관리, 출석 관리, 공지사항 작성, 통계 조회',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    role: '사무간사 (Staff)',
    permissions: '교인 관리, 출석 관리, 공지사항 작성',
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    role: '사역리더 (Leader)',
    permissions: '본인 그룹 출석 관리, 그룹원 정보 조회',
    color: 'bg-green-100 text-green-700',
  },
  {
    role: '교인 (Member)',
    permissions: '본인 정보 조회, 말씀노트 작성, 공지사항 확인',
    color: 'bg-gray-100 text-gray-700',
  },
];

export default function AdminServicePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-yellow-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-2xl mb-6">
            <ClipboardDocumentListIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            교회 행정
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            공지사항, 출석관리, 조직도를 한 곳에서 관리합니다.
            번거로운 행정 업무를 효율적으로 처리하세요.
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

      {/* Role System */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            역할 기반 권한 시스템
          </h2>
          <div className="space-y-4">
            {ROLES.map((item) => (
              <div key={item.role} className="bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${item.color}`}>
                  {item.role}
                </div>
                <div className="text-gray-600 text-sm">
                  {item.permissions}
                </div>
              </div>
            ))}
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
              교회 행정에 필요한 모든 기능을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-yellow-600" />
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

      {/* QR Attendance Flow */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              QR코드 출석 체크 흐름
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'QR 생성', desc: '관리자가 예배별 QR 생성' },
              { step: '2', title: '화면 표시', desc: '예배 시작 시 QR 화면 노출' },
              { step: '3', title: '스캔', desc: '교인이 스마트폰으로 스캔' },
              { step: '4', title: '자동 기록', desc: '출석이 자동으로 기록됨' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-6 text-center">
                <div className="w-10 h-10 bg-ct-primary rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            효율적인 교회 행정을 시작하세요
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
