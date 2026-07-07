# Goal — 교회별 URL 구조 (경로 기반 테넌시)

> 2026-07-07 · 사용자 확정: 경로 기반 채택. 상위 제안서: `../2026-07-07_home-upgrade-church-url/proposal.md` §1

## 목표

모든 교회 종속 화면의 URL에 교회 slug를 1단계로 포함한다.

- 변경 전: `church.havrutaproject.org/home` (로그인 세션으로만 테넌트 결정)
- 변경 후: `church.havrutaproject.org/chungpa/home` (URL이 테넌트를 명시)

## 왜

1. 행사·주보·공지·초대 링크가 교회 컨텍스트를 품고 공유 가능해야 함 (홈 고도화 2단계 "행사 공개 링크"의 전제).
2. 다중 교회 사용자(순회 교역자)의 활성 교회가 URL로 명시됨.
3. 교회별 공개 랜딩(`/{slug}`)과 후속 커스텀 도메인 연결(1-B)의 기반.

## 완료 기준 (DoD)

- [x] `/{slug}/home` 등 테넌트 라우트 전체가 `[church]` 세그먼트 하위에서 동작 (빌드 라우트 트리 확인)
- [x] URL slug ↔ `active_church` 자동 동기화 — 미들웨어 + `set_active_church_by_slug` (비소속 시 `/join?church={slug}` 안내 + join 페이지 사전 선택)
- [x] 기존 URL(`/home`, `/m/verse` 등) → 활성 교회 slug URL로 307 리다이렉트 (북마크·PWA 하위호환)
- [x] slug 예약어 제약 (`churches_slug_reserved` CHECK) + **slug 불변 트리거** (`churches_slug_immutable`) — 사용자 확정: 등록 시 1회 입력, ID처럼 변경 불가
- [x] `npm run typecheck` + `next build` 통과 (2026-07-07)
- [x] 런타임 시나리오 검증 (W5 표) — 00026 적용(+이력 드리프트 00005~26 복구) 후 배포 검증 (2026-07-07)
  - 비로그인: `/`·`/login`·`/manifest.json` 200, `/home`·`/chungpa21/home`·`/chungpa21` → 307 `/login` (로컬 3120 + 프로덕션 동일)
  - slug 불변 트리거 동작 확인 (UPDATE 시도 → 에러), slug 개명 chungpa → chungpa21 완료
  - 로그인 시나리오(②③④⑤: 레거시 slug 접두 리다이렉트·쿠키 동기화·비소속 /join 안내)는 실사용 로그인으로 확인 예정

## 비범위 (Non-Goals)

- `/{slug}` 공개 랜딩 페이지의 콘텐츠 (2단계 행사 모듈과 함께 — 지금은 `/{slug}` → `/{slug}/home` 리다이렉트만)
- 커스텀 도메인 연결 (로드맵 6단계)
- 홈 화면 위젯 고도화 (2~5단계)

## 가정 / 의존성 / 리스크

### 가정
- `churches.slug`는 unique이며 모든 active 교회에 존재 (시드 `chungpa` 확인)
- 테넌트 데이터 접근은 전부 `my_church_id()`(= `active_church`) 경유 → URL과 active_church만 동기화하면 페이지 데이터 로직 무변경
- 소속 교회가 없는 로그인 사용자는 `/join`·`/pending` 플로우로 수렴 (기존 동작 유지)

### 의존성
- Next.js 15 App Router `[church]` 동적 세그먼트 (정적 라우트가 동적보다 우선 매칭 → `/login` 등과 충돌 없음)
- 기존 `src/middleware.ts` (Supabase SSR 세션 갱신) — 여기에 slug 해석을 추가
- `active_church` 테이블 + upsert 패턴 (`00006_tenancy.sql`)

### 리스크 & 대응
- **slug ↔ 시스템 라우트 충돌**: DB CHECK 예약어 제약 — `login, signup, home, church, admin, check, scan, me, menu, members, invites, invite, join, pending, platform, store, start, apply, api, m, register-intro, register-church, forgot-password, reset-password, set-password, icons, link` (전체 목록은 마이그레이션이 SSOT)
- **기존 북마크/PWA 구 URL**: 미들웨어 레거시 목록 → 활성 교회 slug URL로 redirect
- **권한 없는 교회 URL 접근**: `set_active_church_by_slug`가 null 반환(교회 없음/비소속 비구분, 정보 비노출) → `/join?church={slug}` 안내
- **미들웨어 성능**: `ct-church` 쿠키 == URL slug이면 RPC 생략 — 교회 전환 시에만 1회 호출

## 기존 자산 재사용 검토 (조사 완료 — 상세: analysis.md §6)

| 자산 | 현황 | 결정 |
|---|---|---|
| 라우팅 구조 | `app/` App Router, 동적 세그먼트 기사용 (`members/[id]`, `invite/[token]`) | `[church]` 세그먼트 신설, 테넌트 라우트 이동 |
| active_church 저장 | DB 테이블 (`00006`), 세션/쿠키 아님 | 그대로 사용 + 동기화 RPC 1개 신설 |
| tenant resolver | `my_church_id()` RPC | 무변경 재사용 (핵심 지렛대) |
| redirect 유틸 | 없음 (페이지별 `redirect()` 직접 호출) | 미들웨어에 레거시 리다이렉트 신설 |
| auth middleware | `src/middleware.ts` 존재 | 확장 (신규 파일 없음) |
| 셸/네비 | `AppHeader`·`BottomNav`(클라이언트), `buildNav()` href 단일 소스 | `useParams()` + `NavCtx.base`로 확장 |

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T02:18:51.127Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 목표와 DoD가 URL 예시, 리다이렉트, 빌드 검증 기준까지 포함해 비교적 측정 가능함. 비범위도 공개 랜딩, 커스텀 도메인, 홈 위젯으로 명확히 분리됨.
- 결함/누락: 리스크/의존성/가정이 별도 항목으로 정리되지 않음. 기존 라우트 구조, middleware, auth/session, active_church 저장 방식 등 기존 자산 재사용 검토가 명시되지 않음.
- 개선 제안: `가정/의존성/리스크` 섹션을 추가하고 slug 충돌, 기존 북마크/PWA, 권한 없는 접근, middleware 영향 범위를 적을 것. `기존 자산 재사용` 섹션에 현재 라우팅/auth/tenant resolver/redirect 유틸을 조사해 재사용 여부를 명시할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

## 근거

리뷰어의 지적이 타당합니다:

1. **가정/의존성/리스크 누락의 심각성**
   - DoD에 "URL slug ↔ `active_church` 자동 동기화"와 "기존 URL → slug URL 리다이렉트"가 있는데, *어떤 전제 하에* 이것이 가능한지 명시되지 않음
   - "권한 없는 접근 시 `/join` 안내"는 보안 시나리오인데, 이게 의존성인지/가정인지/리스크 대응인지 불명확
   - slug 충돌 방지의 "예약어 제약" DoD만 있고, *구체적으로 어떤 slug들을 막을 것*인지 없음

2. **기존 자산 재사용 검토 누락**
   - ChurchThrive는 기존 웹 프로젝트인데, 현재 어떻게 `active_church`를 저장/관리하는지 알아야 URL 기반 테넌시를 설계할 수 있음
   - 기존 middleware, redirect 유틸, tenant resolver가 있다면 재사용/수정해야 하는데 이를 조사할 항목이 없음
   - "URL slug를 세션의 `active_church`와 동기화"한다는 것이 구체적으로 *어느 계층에서* 일어나는지 기존 구조를 모르면 설계 불가능

## 수정계획

**추가할 섹션:**

```markdown
## 가정 / 의존성 / 리스크

### 가정
- 사용자는 최소 1개 교회에 소속
- active_church는 세션/쿠키에 저장됨
- URL 기반 slug는 시스템 예약어와 분리 가능

### 의존성
- 기존 라우팅 구조: Next.js [church] 동적 세그먼트 가능 여부
- 기존 auth/session 관리: active_church 변경 트리거
- 기존 redirect 유틸: 기존 URL → slug URL 변환 로직 재사용

### 리스크 & 대응
- **slug 충돌**: 예약어 리스트 사전 정의 (login, api, admin 등)
- **기존 북마크/PWA**: 리다이렉트 middleware로 자동 처리 (6개월 → 제거)
- **권한 없는 접근**: middleware에서 검증 후 `/join?church={slug}` 안내
- **middleware 성능**: slug 검증 캐싱 필요성 검토

## 기존 자산 재사용 검토

### 조사 항목
- [ ] 현재 라우팅 패턴 (pages/, app/ 구조 내 [church] 세그먼트 사용 가능?)
- [ ] active_church 저장 위치 (세션/쿠키/컨텍스트 중 어디?)
- [ ] 현재 리다이렉트 로직 (redirect util 존재 여부)
- [ ] 기존 tenant resolver / auth middleware 존재 여부

### 재사용 결정 기준
- 재사용 가능 → 기존 로직 명시, 영향 범위 분석
- 재사용 불가 → 신규 구현 사유 명시
```

이렇게 수정하면 구현 단계에서 기존 시스템과의 일관성을 유지하고 숨겨진 리스크를 조기 포착할 수 있습니다.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 원 지적을 수용했고 수정계획도 타당하지만, 현재 Document에는 해당 보완 섹션이 아직 반영되지 않았다. `가정/의존성/리스크`, slug 예약어 범위, 기존 routing/middleware/auth/session/active_church/redirect 자산 재사용 검토가 여전히 문서에 없어 원 결함이 남아 있다.

<!-- /doc-crossverify:managed -->
