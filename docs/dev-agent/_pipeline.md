---
project: ChurchThrive App
type: full-pipeline
created: 2026-02-05
last_updated: 2026-02-06
status: all_completed

stages:
  - id: consultation
    name: "상담 (Consultation)"
    status: skip
    reason: retroactive
    doc: 01_consultation_retroactive.md
    completed_at: 2026-02-05

  - id: research
    name: "리서치 (Research)"
    status: skip
    reason: retroactive
    doc: 02_research_retroactive.md
    completed_at: 2026-02-05

  - id: planning
    name: "기획 (Planning)"
    status: skip
    reason: retroactive
    doc: 03_planning_retroactive.md
    completed_at: 2026-02-05

  - id: architecture
    name: "아키텍처 (Architecture)"
    status: skip
    reason: retroactive
    doc: 04_architecture_retroactive.md
    completed_at: 2026-02-05

  - id: design
    name: "디자인 (Design)"
    status: skip
    reason: retroactive
    doc: 05_design_retroactive.md
    completed_at: 2026-02-05

  - id: db-design
    name: "DB 설계 (Database Design)"
    status: skip
    reason: retroactive
    doc: 06_db-design_retroactive.md
    completed_at: 2026-02-05

  - id: publishing
    name: "퍼블리싱 (Publishing)"
    status: completed
    doc: 07_publishing.md
    completed_at: 2026-02-05

  - id: frontend
    name: "프론트엔드 (Frontend)"
    status: completed
    doc: 08_frontend.md
    completed_at: 2026-02-05

  - id: backend-db
    name: "백엔드+DB (Backend + Database)"
    status: completed
    doc: 09_backend-db.md
    completed_at: 2026-02-05

  - id: mobile
    name: "모바일 (Mobile)"
    status: completed
    doc: 10_mobile.md
    completed_at: 2026-02-05

  - id: testing
    name: "테스팅 (Testing)"
    status: completed
    doc: 11_testing.md
    completed_at: 2026-02-05

  - id: documentation
    name: "문서화 (Documentation)"
    status: completed
    doc: 12_documentation.md
    completed_at: 2026-02-05

  - id: landing-routing
    name: "소개 페이지 및 역할 기반 라우팅"
    status: completed
    doc: 13_landing-page-routing.md
    completed_at: 2026-02-06
---

# ChurchThrive 개발 파이프라인

## 프로젝트 개요
- **서비스**: ChurchThrive App (교회 혁신 성장 통합  SaaS 플랫폼)
- **기술 스택**: Next.js 14 + React Native (Expo) + Supabase + TypeScript
- **모노레포**: `Church_Thrive/` (app/ + mobile/ + packages/shared/)

## 파이프라인 현황

| # | 스테이지 | 상태 | 비고 |
|---|---------|------|------|
| 01 | Consultation | ✅ skip | 역방향 문서화 완료 |
| 02 | Research | ✅ skip | 역방향 문서화 완료 |
| 03 | Planning | ✅ skip | 역방향 문서화 완료 |
| 04 | Architecture | ✅ skip | 역방향 문서화 완료 |
| 05 | Design | ✅ skip | 역방향 문서화 완료 |
| 06 | DB Design | ✅ skip | 역방향 문서화 완료 |
| 07 | Publishing | ✅ completed | Cloudflare Pages, CI/CD, GitHub Actions |
| 08 | Frontend | ✅ completed | Zustand stores, ErrorBoundary, PWA manifest |
| 09 | Backend+DB | ✅ completed | Supabase 설정, Edge Functions, seed data, RLS tests |
| 10 | Mobile | ✅ completed | 오프라인 동기화, 오디오, 푸시, 딥링킹 |
| 11 | Testing | ✅ completed | Vitest, Playwright E2E, 보안/코드 리뷰 |
| 12 | Documentation | ✅ completed | API 문서, 배포/환경 가이드, 기여 가이드 |
| 13 | Landing & Routing | ✅ completed | 소개 페이지, 역할 기반 라우팅, 교인 홈페이지 |

## 산출물 요약

### Phase A: 역방향 문서화 (6개)
- `01_consultation_retroactive.md` - 상담 요약 (비전, 비즈니스 모델)
- `02_research_retroactive.md` - 리서치 요약 (시장, 사용자, GTM)
- `03_planning_retroactive.md` - 기획 요약 (요구사항, 로드맵)
- `04_architecture_retroactive.md` - 아키텍처 요약 (기술 스택, 모노레포)
- `05_design_retroactive.md` - 디자인 요약 (Atomic Design, 토큰)
- `06_db-design_retroactive.md` - DB 설계 요약 (13 테이블, RLS)

### Phase B: 구현 스테이지 (6개)
- `07_publishing.md` - CI/CD, Cloudflare Pages 배포
- `08_frontend.md` - 의존성, stores, 빌드 검증
- `09_backend-db.md` - Supabase 설정, Edge Functions, seed data
- `10_mobile.md` - 오프라인, 오디오, 푸시, 딥링킹
- `11_testing.md` - 테스트 설정, 보안/코드 리뷰
- `12_documentation.md` - 개발자 문서 4종

### 부속 문서
- `api-docs.md` - API/Edge Functions 문서
- `deployment-guide.md` - 배포 가이드
- `env-setup-guide.md` - 환경 설정 가이드
- `contributing-guide.md` - 개발자 기여 가이드
- `security-review.md` - 보안 리뷰 결과
- `code-review.md` - 코드 리뷰 결과

## 핵심 파일
- `Church_Thrive/package.json` - 모노레포 루트
- `Church_Thrive/Dev_Plan/` - 기획 문서 13개
- `Church_Thrive/Dev_Plan/Design/` - 디자인 문서 7개
- `Church_Thrive/supabase/migrations/` - SQL 마이그레이션 17개
- `Church_Thrive/packages/shared/src/types/database.ts` - DB 타입
