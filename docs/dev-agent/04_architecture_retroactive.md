---
stage: architecture
status: retroactive
created: 2026-02-05
sources:
  - Dev_Plan/06_기술_아키텍처.md
  - Church_Thrive/package.json
  - Church_Thrive/tsconfig.base.json
  - Church_Thrive/app/package.json
  - Church_Thrive/mobile/package.json
  - Church_Thrive/packages/shared/package.json
---

# 04. Architecture (아키텍처) - 역방향 문서화

## 요약

기술 아키텍처 문서와 실제 구현된 모노레포 구조를 통해 아키텍처 스테이지가 완료되었습니다.
Cloudflare Pages + Supabase 기반 서버리스 아키텍처가 채택되었습니다.

## 주요 결정 사항

### 1. 전체 아키텍처 패턴
- **서버리스 아키텍처**: 별도 백엔드 서버 없이 Supabase BaaS 사용
- **모노레포 구조**: 웹(app/) + 모바일(mobile/) + 공유(packages/shared/)
- **비용 최소화**: 무료 티어 최대 활용 (Cloudflare + Supabase)

### 2. 기술 스택

| 영역 | 기술 | 용도 |
|------|------|------|
| 웹 프론트엔드 | Next.js 14 (App Router) | SSR/SSG, PWA |
| 모바일 | React Native (Expo 52) | iOS/Android 동시 개발 |
| 언어 | TypeScript (strict) | 타입 안전성 |
| 스타일링 | Tailwind CSS / NativeWind | 반응형 UI |
| 상태관리 | Zustand | 경량 상태관리 |
| BaaS | Supabase | Auth + DB + Storage + Realtime + Edge Functions |
| 오프라인(웹) | Dexie (IndexedDB) | 웹 오프라인 캐시 |
| 오프라인(모바일) | WatermelonDB | 모바일 오프라인 동기화 |
| 폼 처리 | React Hook Form + Zod | 폼 관리 + 유효성 검증 |
| 리치 텍스트 | TipTap | 말씀노트 에디터 |
| 호스팅 | Cloudflare Pages | 글로벌 CDN, 자동 HTTPS |

### 3. 모노레포 구조
```
docs/Church_Thrive/
├── app/                    # Next.js 14 웹앱
│   └── src/
│       ├── app/            # App Router 페이지 (34+ routes)
│       ├── components/     # Atomic Design (atoms/molecules/organisms/templates)
│       ├── hooks/          # 커스텀 훅 (7개)
│       ├── lib/            # 라이브러리 (supabase, offline, cn)
│       ├── stores/         # Zustand 스토어 (미구현)
│       └── styles/         # CSS 변수, globals
├── mobile/                 # Expo React Native 앱
│   └── src/
│       ├── app/            # Expo Router 페이지 (28+ routes)
│       ├── components/     # Atomic Design (atoms/molecules/organisms)
│       ├── hooks/          # 커스텀 훅
│       ├── lib/            # 라이브러리
│       └── stores/         # Zustand 스토어 (authStore 구현됨)
├── packages/shared/        # 공유 패키지 (@churchthrive/shared)
│   └── src/
│       ├── constants/      # 권한, 역할, 라우트
│       ├── hooks/          # 공유 훅
│       ├── schemas/        # Zod 스키마
│       ├── types/          # TypeScript 타입 (database.ts 포함)
│       └── utils/          # 유틸리티 (초성 검색, 포맷, 성경 구절)
├── supabase/               # Supabase 설정
│   └── migrations/         # 17개 SQL 마이그레이션
├── Dev_Plan/               # 기획 문서 13개
│   └── Design/             # 디자인 문서 7개
└── package.json            # 모노레포 루트 (workspaces)
```

### 4. 컴포넌트 아키텍처 (Atomic Design)
- **Atoms**: CTButton, CTInput, CTAvatar, CTBadge, CTSelect 등 (12개)
- **Molecules**: CTCard, CTFormField, CTSearchBar, CTStatCard 등 (9개)
- **Organisms**: CTModal, CTBottomSheet, CTToast, CTOfflineIndicator (5개)
- **Templates**: CTListPage, CTDetailPage, CTFormPage (4개)
- **Features**: ImportWizard, OfflineIndicator, PWAInstallBanner, SWUpdateBanner

### 5. 인증 아키텍처
- Supabase Auth (이메일 + Kakao OAuth)
- 미들웨어 기반 세션 관리 (`app/src/lib/supabase/middleware.ts`)
- OAuth 콜백 라우트 (`app/src/app/api/auth/callback/route.ts`)

### 6. 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_KAKAO_APP_KEY
NEXT_PUBLIC_FCM_VAPID_KEY
FCM_SERVER_KEY
```

## 소스 문서/코드 링크
- [기술 아키텍처](../Church_Thrive/Dev_Plan/06_기술_아키텍처.md)
- [모노레포 루트 package.json](../Church_Thrive/package.json)
- [웹앱 package.json](../Church_Thrive/app/package.json)
- [모바일 package.json](../Church_Thrive/mobile/package.json)
- [공유 패키지](../Church_Thrive/packages/shared/package.json)
