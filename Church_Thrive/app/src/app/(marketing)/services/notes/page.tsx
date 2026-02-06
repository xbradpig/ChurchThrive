import Link from 'next/link';
import {
  BookOpenIcon,
  MicrophoneIcon,
  ShareIcon,
  TagIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: '말씀 노트 - ChurchThrive',
  description: '설교를 듣고 나만의 말씀노트를 작성하세요. 성경 구절 자동 감지, 음성 녹음, 노트 공유, 목사님 피드백까지.',
};

const FEATURES = [
  {
    icon: BookOpenIcon,
    title: '설교 연동',
    description: '관리자가 등록한 설교와 연결하여 노트를 작성합니다. 설교 제목, 본문, 설교자 정보가 자동으로 표시됩니다.',
    details: [
      '설교 아카이브에서 설교 선택',
      '예배 유형별 분류 (주일/수요/금요/새벽)',
      '설교 본문 및 설교자 정보 연동',
      '설교별 노트 목록 확인',
    ],
  },
  {
    icon: TagIcon,
    title: '성경 구절 자동 감지',
    description: '노트에 입력한 성경 구절을 자동으로 인식하여 태그로 표시합니다. "요한복음 3:16"을 입력하면 자동으로 태그가 생성됩니다.',
    details: [
      '성경 구절 자동 인식',
      '태그 형태로 시각화',
      '구절 클릭 시 전문 확인',
      '구절별 노트 검색',
    ],
  },
  {
    icon: MicrophoneIcon,
    title: '음성 녹음',
    description: '설교를 들으며 음성으로 메모할 수 있습니다. 녹음된 음성은 노트와 함께 저장됩니다.',
    details: [
      '인앱 음성 녹음',
      '녹음 파일 노트 첨부',
      '녹음 재생 및 구간 이동',
      '음성 메모 텍스트 변환 (예정)',
    ],
  },
  {
    icon: ShareIcon,
    title: '노트 공유',
    description: '작성한 말씀노트를 다른 성도들과 공유할 수 있습니다. 같은 설교를 들은 성도들의 묵상을 함께 나눕니다.',
    details: [
      '노트 공유/비공개 설정',
      '공유된 노트 열람',
      '좋아요 및 북마크',
      '공유 노트 댓글 (예정)',
    ],
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: '목사님 피드백',
    description: '공유된 노트에 목사님이 피드백을 남길 수 있습니다. 성도의 묵상에 대한 목양적 코멘트를 제공합니다.',
    details: [
      '목사님/교역자 피드백 기능',
      '피드백 알림',
      '1:1 소통 채널',
      '목양 기록으로 활용',
    ],
  },
  {
    icon: CalendarDaysIcon,
    title: '노트 아카이브',
    description: '작성한 모든 노트를 날짜별, 설교별로 정리하여 보관합니다. 언제든 과거의 묵상을 다시 찾아볼 수 있습니다.',
    details: [
      '날짜별 노트 정렬',
      '예배 유형별 필터링',
      '기간별 검색',
      '노트 내용 전문 검색',
    ],
  },
];

const WORKFLOW = [
  {
    step: '1',
    title: '설교 선택',
    description: '오늘의 설교를 선택하거나 새 노트를 시작합니다',
  },
  {
    step: '2',
    title: '노트 작성',
    description: '설교를 들으며 자유롭게 노트를 작성합니다',
  },
  {
    step: '3',
    title: '공유 (선택)',
    description: '원하면 노트를 공유하여 다른 성도들과 나눕니다',
  },
  {
    step: '4',
    title: '피드백 수신',
    description: '목사님께 묵상에 대한 피드백을 받습니다',
  },
];

export default function NotesServicePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-6">
            <BookOpenIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            말씀 노트
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            설교를 듣고 나만의 노트를 작성하고, 목사님께 피드백을 받으세요.
            말씀을 더 깊이 묵상하는 도구입니다.
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

      {/* Workflow */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            간단한 사용 흐름
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW.map((item, index) => (
              <div key={item.step} className="relative">
                <div className="bg-white rounded-xl p-6 text-center h-full">
                  <div className="w-10 h-10 bg-ct-primary rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
                {index < WORKFLOW.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRightIcon className="w-6 h-6 text-gray-300" />
                  </div>
                )}
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
              말씀노트에 필요한 모든 기능을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-green-600" />
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

      {/* For Whom */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              누구를 위한 기능인가요?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                성도를 위해
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">설교 내용을 체계적으로 정리하고 묵상</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">성경 구절을 자동으로 정리하여 복습</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">목사님의 개인적인 피드백 수신</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">다른 성도들의 묵상을 통해 배움</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                목회자를 위해
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">성도들의 묵상 상태를 파악하여 목양</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">설교에 대한 반응과 이해도 확인</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">개인별 맞춤 피드백으로 양육</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-ct-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">말씀 적용을 독려하는 도구로 활용</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            말씀 묵상을 시작하세요
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            오늘부터 설교를 더 깊이 묵상하고 기록하세요.
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
