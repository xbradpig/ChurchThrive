# Detail Goal — 교회별 URL 구조 구현 설계

> 2026-07-07 · goal.md의 실행 설계. 분석 근거는 analysis.md.

## 아키텍처 결정

**결정 1 — 실제 `[church]` 세그먼트로 라우트 이동** (미들웨어 rewrite 위장 방식 기각)
- rewrite 방식은 파일 구조를 안 건드리지만 모든 내부 네비게이션이 리다이렉트 1회씩 추가되고, URL이 코드 구조와 어긋나는 부채가 됨. 제안서에 문서화된 설계(`app/[church]/...`)를 그대로 구현.

**결정 2 — slug ↔ active_church 동기화는 미들웨어에서** (레이아웃 기각)
- 서버 컴포넌트 렌더 중에는 쿠키를 set할 수 없음. 미들웨어가 유일한 단일 지점.
- `ct-church` 쿠키 == URL slug이면 통과(RPC 0회). 불일치 시에만 `set_active_church_by_slug` 호출 → 성공: 쿠키 갱신, 실패: `/join?church={slug}`.

**결정 3 — 페이지 코드의 데이터 로직은 무변경**
- 모든 RPC가 `my_church_id()` 기반이므로 active_church 동기화만 보장되면 쿼리 코드는 그대로. 변경은 링크·리다이렉트의 base 접두뿐.

**결정 4 — `/{slug}` 공개 랜딩은 비범위**
- 지금은 `/{slug}` → `/{slug}/home` 리다이렉트. 공개 랜딩 콘텐츠는 2단계(행사 공개 링크)와 함께.

**결정 5 — slug는 ID처럼 불변 (사용자 확정, 2026-07-07)**
- 등록(`register-church`, 신청자 = 담임목사/교역자/담당 관리자)에서 **1회 입력 후 변경 불가**. 변경되면 공유된 링크·북마크·초대 QR 전부 파손.
- 현황 확인: `update_church_profile`(00024)은 slug를 건드리지 않고, `churches`에 authenticated UPDATE 정책 없음, 설정 UI는 읽기 전용 표시 — 이미 사실상 불변.
- 보강: `churches_slug_immutable` BEFORE UPDATE 트리거 추가(00026) — service_role 스크립트 실수까지 차단. 설정 UI에 "등록 시 확정 · 변경 불가" 명시.

## 작업 항목

### W1. 마이그레이션 `00026_church_url_context.sql`
```text
- set_active_church_by_slug(p_slug text) → uuid
  · SECURITY DEFINER. churches에서 slug+status='active' 조회 →
    church_roles(user, church) 멤버십 확인 → active_church upsert → church_id 반환
  · 교회 없음/비소속 모두 null (정보 비노출)
- my_church_slug() → text  (레거시 리다이렉트용, 활성 교회 slug)
- churches_slug_reserved CHECK: 시스템 라우트 예약어 차단
  (login, signup, home, church, admin, check, scan, me, menu, members,
   invites, invite, join, pending, platform, store, start, apply, api, m,
   register-intro, register-church, forgot-password, reset-password,
   set-password, icons, link 등)
- grant execute → authenticated only (anon revoke)
```

### W2. 미들웨어 확장 (`src/middleware.ts`)
```text
세그먼트 분기:
1. PUBLIC/루트 경로 → 기존 동작 (비로그인 login 리다이렉트 포함)
2. 레거시 테넌트 경로(home|church|admin|check|scan|me|menu|members|invites|m|store)
   → slug = ct-church 쿠키 ?? my_church_slug() RPC
   → 있으면 301 /{slug}{path}{query} / 없으면 /join
3. 그 외 첫 세그먼트 = slug 후보
   → 형식 검증([a-z0-9][a-z0-9_-]*) 실패 시 통과(→ [church] layout notFound)
   → 쿠키 일치: 통과 / 불일치: set_active_church_by_slug →
     성공: 쿠키 set 후 통과, 실패: /join?church={slug}
   → /{slug} 단독: /{slug}/home 리다이렉트
```

### W3. 라우트 이동 (git mv)
- `app/{home,church,admin,check,scan,me,menu,members,invites,m,store}` → `app/[church]/`
- 신규 `app/[church]/layout.tsx`: slug 형식 검증(notFound) + children (동기화는 미들웨어 담당)

### W4. 링크·리다이렉트 base 접두
- 서버 페이지: `params: Promise<{church}>`에서 base 계산, `href`/`redirect()` 접두
  (`/login`, `/pending` 등 루트 경로는 예외)
- `registry.ts buildNav(ctx)`: `NavCtx.base` 추가, 전 href 접두 (MODULES home/adminHome 포함)
- `AppHeader`/`BottomNav`/`ModuleGate`: 클라이언트 — `useParams().church`로 base 자체 해결
- 루트 페이지(login, start, pending, Landing, platform 등)의 `/home` 링크는 무변경 — 레거시 리다이렉트가 흡수

### W5. 검증 — 시나리오 × 기대값

**리다이렉트는 전부 307(임시)** — 301은 브라우저/CDN 영구 캐시로 slug 변경·구조 롤백이 비가역이 되므로 금지. (`NextResponse.redirect` 기본값 307 사용)

| # | 초기 상태 | 요청 | 기대 status | 기대 Location | 기대 ct-church 쿠키 | 기대 DB(active_church) |
|---|---|---|---|---|---|---|
| ① | 비로그인 | GET `/home` | 307 | `/login` | 없음 | 변화 없음 |
| ② | 로그인, 쿠키 없음 | GET `/home` | 307 | `/chungpa/home` (`my_church_slug()` 조회) | 없음(다음 요청에서 set) | 변화 없음 |
| ③ | 로그인, 쿠키=chungpa | GET `/chungpa/home` | 200 (RPC 0회) | — | chungpa 유지 | 변화 없음 |
| ④ | 로그인, 쿠키 없음/불일치 | GET `/chungpa/home` | 200 | — | `chungpa`로 set | `set_active_church_by_slug` upsert |
| ⑤ | 로그인, 비소속 slug | GET `/other/home` | 307 | `/join?church=other` | 변화 없음 | 변화 없음 (RPC null) |
| ⑥ | 로그인 | GET `/chungpa` | 307 | `/chungpa/home` | — | — |
| ⑦ | 로그인, 소속 없음 | GET `/home` | 307 | `/join` | 없음 | 변화 없음 |
| ⑧ | — | 존재하지 않는 형식 slug (`/UPPER!/x`) | 404 (layout notFound) | — | — | — |

- "정상 렌더(200)" = `home_feed()` 데이터가 해당 교회 것으로 로드 (RLS 경유).
- 빌드 검증: `npm run typecheck` + `npx next build` 통과.
- SECURITY DEFINER 검증: `set_active_church_by_slug`는 ①auth.uid() null 가드 ②status='active' 필터 ③church_roles 멤버십 확인 3중 가드 — 마이그레이션 코드 리뷰로 확인, 비소속 시나리오 ⑤로 런타임 확인.

## 리스크 표

| 리스크 | 영향 | 완화책 | 반영 위치 |
|---|---|---|---|
| 301 영구 캐시 | slug 변경/롤백 불가 | 모든 리다이렉트 307 | W2 미들웨어 |
| 예약어 slug 등록 시도 | 시스템 라우트 가림 | `churches_slug_reserved` CHECK → insert 실패(register_church RPC가 에러 반환, 신청 UI는 "사용 불가 주소" 안내는 후속) | W1 |
| 쿠키 위조(ct-church) | 타 교회 위장? | 불가 — 데이터 접근은 RLS(`my_church_id()`=DB의 active_church) 기준. 쿠키는 RPC 생략용 힌트일 뿐, 위조 시 URL과 DB 불일치로 남의 데이터가 아닌 "내 활성 교회" 데이터만 나옴. 미들웨어는 쿠키≠slug면 반드시 RPC 재검증 | W2 |
| 레거시 redirect 무한루프 | /join도 레거시 목록에 있으면 루프 | 레거시 목록과 루트 유지 목록을 상호 배타로 관리 | W2 |
| 다중 교회 사용자 컨텍스트 꼬임 | A교회 URL에서 B 데이터 | ④번 강제 동기화로 URL이 항상 승리 (URL = SSOT) | W2 |

## 스코프 표 (수정 파일 경계)

| 파일 | 변경 | 비고 |
|---|---|---|
| `supabase/migrations/00026_church_url_context.sql` | 신규 | RPC 2개 + CHECK |
| `web/src/middleware.ts` | 확장 | 분기 로직 추가 |
| `web/src/app/[church]/layout.tsx`, `page.tsx` | 신규 | 형식 검증 / home 리다이렉트 |
| `web/src/app/{11개 테넌트 라우트}` | git mv + base 접두 | 데이터 로직 무변경 |
| `web/src/modules/registry.ts` | `NavCtx.base` 추가 | href 단일 소스 |
| `web/src/components/{AppHeader,ui/BottomNav,ModuleGate}.tsx` | `useParams()` base | 재사용, 구조 무변경 |
| **비범위** | `lib/supabase/*`, 모든 Board/Panel 클라이언트 컴포넌트, 루트 페이지들(login/start/pending/Landing/platform), API 라우트 | 링크는 레거시 리다이렉트가 흡수 |

## 이후 단계 연결

- 2단계 행사 모듈의 공개 링크 `/{slug}/events/{id}`는 이 구조 위에 얹힘 — `[church]` 하위에 공개 라우트 추가 시 미들웨어 3번 분기에 공개 예외 목록 필요 (그때 추가)
- 커스텀 도메인(1-B)은 미들웨어 최상단에 Host 판별 분기 1개 추가로 수용 가능

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T02:20:05.178Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 라우팅/미들웨어/DB 변경 방향이 구체적이고, 비범위(`/{slug}` 공개 랜딩)가 명확함. 기존 `my_church_id()` 기반 데이터 로직을 유지하는 재사용 판단도 반영됨.
- 결함/누락: 성공기준이 빌드/수동 시나리오 수준이라 쿠키 갱신, RPC 호출 조건, 301/302 기대값 등 측정 기준이 부족함. 예약 slug 충돌, RLS/SECURITY DEFINER 검증, 기존 링크 누락, 공개 라우트 예외, 301 캐시 리스크 같은 의존성/리스크가 충분히 명시되지 않음.
- 개선 제안: 각 시나리오에 기대 status/location/cookie/DB 상태를 추가하고, 리스크 표를 별도로 만들어 영향·완화책을 적을 것. 기존 middleware/nav/helper 재사용 대상과 새로 만들지 않을 범위를 명시할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: AGREE

**근거:**

이 문서는 아키텍처 결정과 작업 흐름은 구체적이지만, **검증 기준과 리스크 명시가 부족**하다는 지적이 정확하다:

1. **W5 검증 기준 불충분:**
   - 수동 시나리오 ①~⑤는 나열만 되어 있음
   - 각 경로에서 기대되는 **HTTP status(301 vs 302), Location 헤더값, ct-church 쿠키 최종 상태, DB active_church 레코드 상태**가 명시되지 않음
   - "정상 렌더"가 구체적으로 무엇인지(데이터 로드 성공? 쿠키 불일치 시 RPC 호출 감지?) 불명확

2. **리스크 및 의존성 누락:**
   - `churches_slug_reserved CHECK`는 제시되었지만, 예약어 충돌 시나리오(예: "admin"인 slug 등록 시도)의 에러 처리가 없음
   - RLS/SECURITY DEFINER 검증: `set_active_church_by_slug()` 권한 체크가 코드 리뷰 시 어떻게 검증되는지 명시 없음
   - 301 리다이렉트 캐시 리스크(브라우저/CDN이 영구 캐시 → 나중에 slug 변경 불가)
   - 기존 `/home` → `/chungpa/home` 리다이렉트 중 **301로 설정되면 비가역**

3. **스코프 경계 모호:**
   - W4에서 "registry.ts buildNav(ctx)" "NavCtx.base 추가"는 언급되지만, **어느 파일/함수가 수정 대상이고 어디가 비범위**인지 명시 안 됨
   - `AppHeader`, `BottomNav`, `ModuleGate` 같은 기존 컴포넌트 **재사용 여부**가 명확하지 않음

**수정계획:**

1. **시나리오×검증 기준 표 추가:**
   ```
   | 시나리오 | 초기 상태 | 요청 경로 | 기대 status | 기대 Location | 기대 ct-church | 기대 DB |
   | ① /home 비로그인 | - | GET /home | 307 | /login | (없음) | - |
   | ② /home 로그인 | ct-church=chungpa | GET /home | 301 | /chungpa/home | chungpa | (변화 없음) |
   | ... |
   ```

2. **리스크 표 별도 섹션:**
   - 리스크 항목, 영향도, 완화책, 담당 단계

3. **스코프 표:**
   - (파일/함수 | 변경 유형 | 영향도 | 검증 방법)

이를 통해 실행 중 누락이나 이슈를 사전 예방할 수 있다.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 원 critique를 대부분 수용했고, 아키텍처 방향 자체가 구체적이라는 점은 인정된다. 다만 문서 본문에는 아직 status/Location/cookie/DB/RPC 검증 기준, 301 캐시 리스크 완화, reserved slug 충돌 처리, RLS/SECURITY DEFINER 검증, 수정/비범위 파일 경계가 반영되지 않았다. 수정계획은 타당하지만 결함 해소는 아직이므로 PASS는 이르다.

<!-- /doc-crossverify:managed -->
