# Analysis — 교회별 URL 구조 (현황 분석)

> 2026-07-07 · 코드베이스 조사 결과 (web/src 전수 + migrations 00001–00025)

## 1. 테넌시 현황

- DB는 멀티테넌트: 테넌트 격리는 2계층 — ① **직접 `church_id` RLS** (members, departments, events, attendances, 모듈 스키마 등 대부분) ② **간접 가드** (`department_members`, `department_leaders`, `member_qr_tokens`, `member_consents` 등은 자체 `church_id` 없이 FK 경유 + RPC 내부 가드). `churches.slug` unique (시드: 청파중앙교회 = `chungpa`), `active_church(user_id PK → church_id)`로 다중 교회 사용자 지원 (`00006_tenancy.sql:60-64`).
- 테넌트 결정은 전적으로 `my_church_id()` = `active_church` 우선, 없으면 첫 `church_roles` (`00006:102-108`). URL에는 테넌트 정보 없음.
- 데이터 RPC의 가드 방식은 혼재 — `home_feed`, `verse_current` 등은 SECURITY INVOKER(RLS 적용), `get_member_card`, `set_attendance`, `admin_list_members`, `absentee_list` 등 다수는 **SECURITY DEFINER + 내부에서 `my_church_id()`/`my_led_departments()` 가드** (`00008`~`00010`에서 교차 테넌트 누수 수정 이력). **두 방식 모두 최종적으로 `my_church_id()`로 수렴**하므로, URL slug와 `active_church`만 일치시키면 페이지 코드는 무변경으로 동작 — 이것이 이번 설계의 핵심 지렛대라는 결론은 유지된다.

## 2. 라우트 분류 (web/src/app)

**테넌트 종속 (→ `[church]` 하위로 이동, 11개 최상위):**
`home`, `church`(+`import`), `admin`(→/church 리다이렉트 스텁), `check`, `scan`, `me`, `menu`, `members/[id]`, `invites`(직원용 초대 관리), `m/*`(bulletin·giving·newcomer·notice·training·verse·verse/admin·visitation), `store`

**루트 유지 (테넌트 무관/사전 단계):**
`/`(랜딩), `login`, `signup`, `forgot-password`, `reset-password`, `set-password`, `register-intro`, `register-church`, `apply`, `start`, `join`, `pending`, `invite/[token]`(토큰이 교회를 내포), `platform`(플랫폼 콘솔, 교차 테넌트), `api/*`

## 3. 링크·리다이렉트 인벤토리

- 내부 링크 총량: `home/page.tsx` 12개가 최대, 나머지 페이지는 0~2개.
- 셸 컴포넌트: `AppHeader`(클라이언트, `buildNav()` 소비), `BottomNav`(클라이언트), `registry.ts buildNav()`(href 단일 소스), `ModuleGate`(`/store` 링크 1개).
- 서버 리다이렉트: `redirect("/home"|"/me"|"/store"|"/m/verse"|"/church")` — 이동 대상 페이지 내 존재, base 접두 필요. `redirect("/login"|"/pending")`은 루트 유지.
- `AppHeader`/`BottomNav`는 이미 클라이언트 컴포넌트 → `useParams().church`로 slug를 직접 얻을 수 있어 props 관통(threading) 불필요.

## 4. 미들웨어 현황

`src/middleware.ts`: Supabase SSR 클라이언트로 세션 갱신 + 비로그인 → `/login` 리다이렉트만 수행. `PUBLIC_PATHS` 목록 존재. 테넌트 인식 없음. → slug 해석·active_church 동기화·레거시 리다이렉트를 여기에 추가하는 것이 단일 지점.

## 5. 제약·리스크

| 리스크 | 대응 |
|---|---|
| slug가 시스템 라우트와 충돌 (`/login` 교회?) | Next.js는 정적 라우트가 `[church]`보다 우선이라 라우팅은 안전. 단 그런 slug의 교회는 접근 불가가 되므로 DB CHECK로 예약어 차단 |
| 서버 컴포넌트(layout)에서 쿠키 set 불가 | slug↔active_church 동기화를 **미들웨어에서** 수행 (쿠키 set 가능 지점) |
| 매 요청 RPC 호출 비용 | `ct-church` 쿠키와 URL slug 일치 시 RPC 생략 — 교회 전환 시에만 1회 호출 |
| 비소속 교회 URL 접근 | `set_active_church_by_slug`가 null 반환 → `/join?church={slug}` 안내 (정보 노출 없음) |
| 북마크·PWA 아이콘의 구 URL | 미들웨어 레거시 목록 → 활성 교회 slug로 redirect |
| OpenNext/Cloudflare 배포 | 경로 기반이라 DNS/인증서 영향 없음. 미들웨어는 기존에도 실행 중 |

## 6. 재사용 (Capability-First)

- `churches.slug` + unique 제약: 그대로 사용 (신규 슬러그 체계 불필요)
- `active_church` upsert 패턴: `00006:275-276` 가입 승인 로직과 동일 패턴 재사용
- `church_public` 뷰: slug 존재 검증에 재사용 가능하나, 멤버십 확인까지 겸하는 신규 RPC 1개가 더 경제적
- 미들웨어의 기존 Supabase 클라이언트: RPC 호출에 그대로 재사용

### 중복 심볼 사전 확인 (신규 RPC 충돌 검토)
- `set_active_church_by_slug`, `my_church_slug`: **기존 정의 없음** — 신규 안전
- 참고로 이 코드베이스는 `create or replace`로 함수를 재정의해온 이력 있음 (`create_church` 00006/00012/00014, `set_church_role_by_email` 00019/00020) — 최종 정의가 SSOT라는 관례를 따르며, 신규 함수도 동일 관례 적용
- `active_church`를 쓰는 기존 upsert(가입 승인 `00006:275`, `00012` join 승인)와 신규 RPC는 동일 테이블에 같은 패턴으로 write — 충돌 없음 (마지막 전환이 승리, 의도된 동작)

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: analysis
- **검증시각**: 2026-07-07T02:20:26.824Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: `churches.slug`, `active_church`, `my_church_id()`, `src/middleware.ts`, `src/app` 라우트 현황 등 핵심 축은 실제 파일/심볼을 근거로 잘 짚었다.
- 결함/누락: “전 테이블 `church_id` RLS”는 과장이다. `department_members`, `department_leaders`, `member_qr_tokens`, `member_consents` 등은 직접 `church_id`가 없다. “모든 데이터 RPC가 SECURITY INVOKER”도 틀리다. `get_member_card`, `set_attendance`, `admin_list_members`, `invite_board` 등 다수가 SECURITY DEFINER다. 중복 심볼 검토도 부족하다: `create_church`가 `00006/00012/00014`, `set_church_role_by_email`가 `00019/00020`에 중복 정의된다.
- 개선 제안: 결론을 “직접 `church_id` RLS”와 “간접 FK/RPC 가드”로 나눠 재작성하고, SECURITY DEFINER RPC 목록 및 tenant guard 근거를 표로 추가하라. 신규 RPC 제안 전 기존 중복 함수/뷰/테이블 검색 결과를 별도 섹션으로 명시하라.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

## 근거

리뷰어의 지적이 구체적이고 타당함:

1. **팩트 오류 (2건)**
   - 내 문서는 "전 테이블 `church_id` RLS"라고 명시했으나, `department_members`, `department_leaders`, `member_qr_tokens`, `member_consents` 등은 직접 `church_id` 없음 → FK나 RPC 가드에 의존. 이를 구분 안 함.
   - "모든 데이터 RPC가 SECURITY INVOKER"는 틀렸음. `get_member_card`, `set_attendance`, `admin_list_members` 등 다수가 SECURITY DEFINER. 테넌트 가드 메커니즘이 전혀 다른데 일원화함.

2. **검토 누락**
   - `create_church` 중복 정의 (00006/00012/00014)
   - `set_church_role_by_email` 중복 정의 (00019/00020)
   - 이들이 신규 RPC 설계에 영향을 미칠 수 있으므로 先 명시 필요

## 수정계획

1. **섹션 1 재구성**: "직접 RLS" vs "간접 FK/RPC 가드" 2-tier 분류
2. **신규 표 추가**: SECURITY DEFINER RPC 목록 + 테넌트 가드 근거
3. **신규 섹션 추가**: 기존 중복 심볼 (create_church 3곳, set_church_role_by_email 2곳) 명시
4. **섹션 6 개선**: 기존 중복 해소 후 신규 RPC 1개만 제안

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 저자의 반론은 수용한다. 원 critique의 핵심 오류를 모두 인정했고 수정계획도 적절하다. 다만 현재 Document 본문은 여전히 “전 테이블 `church_id` RLS”, “모든 데이터 RPC가 SECURITY INVOKER”라고 쓰고 있으며, SECURITY DEFINER RPC/tenant guard 표와 중복 RPC 정의 섹션도 아직 반영되지 않았다. 계획은 맞지만 문서 자체는 아직 수정 전이므로 PASS는 불가하다.

<!-- /doc-crossverify:managed -->
