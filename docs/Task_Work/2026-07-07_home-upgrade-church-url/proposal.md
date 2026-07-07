# 홈 화면 고도화 + 교회별 URL 구조 제안서

> 작성: 2026-07-07 · 근거: 코드베이스 3방향 심층 조사 (web/src 홈 구현, supabase/migrations 00001–00025, 하브루타 연합 아키텍처 docs)

## 0. 현황 요약 (조사 결과)

| 영역 | 상태 | 근거 |
|---|---|---|
| 멀티테넌시 DB | **완비** — `church_id` RLS 전면 적용, `churches.slug` unique 존재 (청파중앙교회 = `chungpa`), `active_church`로 다중 교회 사용자 지원 | `00006_tenancy.sql` |
| 교회별 URL | **없음** — `/home` 고정, 로그인 세션의 `my_church_id()`로만 테넌트 결정 | `web/src/app/home/page.tsx` |
| 암송 말씀 | **완비** — `mod_verse` (assignments/checks, 부서 타겟 지원), 홈 위젯 존재. 단, 연합 계획상 Phase 2에서 MATCH_Family_Verse로 소유권 이전 예정 | `00007_verse.sql`, federation detail_goal §3 |
| 교회 행사 | **부재** — `events`는 주간 반복 규칙(`schedule_rule` jsonb)만. 날짜 기반 일회성 행사 없음, `schedule_rule` 편집 UI도 없음 | `00001_schema.sql:67-77` |
| 부서 일정 | **완전 부재** — 캘린더/일정 테이블·페이지·컴포넌트 없음. `notices.target_department_id`는 "잠자는 스키마" (UI 없음) | grep 전수 확인 |
| 역할별 업무 | **부분** — `home_feed()`가 3개 카운트(가입 승인/출석 승인/심방 요청)만 라이브 계산. 5-persona 위젯 어셈블리는 설계 문서만 존재 | `00025_home_feed.sql`, identity-role-architecture.md |

역할 체계: `superadmin`(교회 관리자) / `pastor`(교역자) / `dept_leader`(부서 담당자) / `checker`(출석 담당자) / `member`(교인) + `module_grants`(viewer/manager/admin). 스키마 변경 없이 그대로 사용.

---

## 1. 교회별 URL 구조 — `/{churchSlug}/...` (경로 기반 테넌시)

### 결정: 경로 기반 (사용자 확정, 2026-07-07), 예) `church.havrutaproject.org/chungpa/home`

- **서브도메인 대비 장점**: 와일드카드 DNS/인증서 불필요, Cloudflare/OpenNext 배포 그대로, 교회 수 무제한.
- **로그인 기반 유지 대비 장점**: 행사·주보·공지·초대(`member_invites`) 링크가 교회 컨텍스트를 품고 공유 가능. 다중 교회 사용자(순회 교역자)의 컨텍스트 명시.
- slug 규칙은 `churches.slug` regex 체크 재사용. (`chang_pa` 식 언더스코어 대신 `chungpa` 형태 권장 — 기존 시드와 일치)

### 구현 설계

1. **라우트 이동**: `app/home` → `app/[church]/home` 등 테넌트 종속 라우트 전체를 `[church]` 세그먼트 하위로.
2. **미들웨어 해석**: `middleware.ts`에서 첫 세그먼트를 slug로 간주 → `church_public` 뷰로 존재 검증(캐시) → 미존재 시 404.
3. **컨텍스트 일치 보장** (핵심): 모든 RPC가 `my_church_id()`(= `active_church`) 기반이므로, 레이아웃 서버 컴포넌트에서 URL slug ↔ `active_church` 불일치 시 `set_active_church(slug)` RPC 호출(권한 없으면 접근 거부/가입 안내). 신규 RPC 1개 필요:
   ```sql
   create function set_active_church_by_slug(p_slug text) returns uuid
   -- church_roles에 (user, church) 존재 확인 후 active_church upsert
   ```
4. **하위호환 리다이렉트**: 기존 `/home`, `/m/verse` 등 → 로그인 사용자의 활성 교회 slug로 301. 북마크·PWA 아이콘 보호.
5. **공개/비공개 경계**: `/{slug}` = 교회 공개 랜딩(교회 소개 + 공개 행사 + 최신 주보 여부). 그 외 전부 멤버 전용. 공개 표면은 RLS `anon` 정책 신설이 아니라 **명시적 public 뷰/RPC로만** 노출 (기존 D6 원칙 유지).
6. **연합 정합성**: 연합 딥링크 포맷 `https://{app}.havruta.app/link/{resource}/{id}?org={havruta_org_id}` 과 충돌 없음 — `/link/*`는 slug 세그먼트 밖에 유지.

> 이 단계가 행사 공유 링크·부서 초대·공개 랜딩의 전제이므로 **가장 먼저** 수행.

### 1-B. 교회 커스텀 도메인 연결 (선택 부가 서비스, 후속 단계)

교회가 자체 구입한 도메인(예: `chungpa.church`)을 교회 설정 페이지에서 등록하면 자기 테넌트로 연결되는 화이트라벨 기능. **현 배포 스택(Cloudflare Workers/OpenNext)에서 Cloudflare for SaaS(Custom Hostnames)로 실현 가능.**

**동작 흐름:**
1. 교회 관리자가 `/{slug}/church/settings`에서 도메인 입력.
2. 서버가 Cloudflare API로 Custom Hostname 생성 → 검증용 DNS 레코드(TXT/CNAME) 안내 표시.
3. 교회 측 DNS에서 `CNAME → church.havrutaproject.org` (+ 검증 TXT) 설정.
4. Cloudflare가 도메인 소유 검증(DCV) 후 TLS 인증서 자동 발급·갱신 — 우리가 인증서 관리할 필요 없음.
5. 미들웨어: `Host`가 기본 도메인이 아니면 `churches.custom_domain` 조회 → 해당 slug로 내부 rewrite (`chungpa.church/home` → `/{chungpa}/home`). URL 표시는 커스텀 도메인 그대로.

**스키마/설정 추가:**
```sql
alter table churches add column custom_domain text unique,
  add column custom_domain_status text default 'none'
    check (custom_domain_status in ('none','pending_dns','verifying','active','failed'));
```

**유의사항:**
- **비용**: Cloudflare for SaaS는 존당 100개 커스텀 호스트네임 무료, 초과분 소액 과금 — 초기 교회 수 기준 사실상 무료.
- **인증(가장 중요한 함정)**: Supabase Auth 쿠키는 호스트 단위 — 커스텀 도메인 로그인 세션과 기본 도메인 세션은 분리됨. 각 커스텀 도메인을 Supabase Auth redirect allow-list에 등록하는 자동화(Management API) 필요. OAuth 콜백은 기본 도메인으로 받고 커스텀 도메인으로 되돌리는 브리지 방식 권장.
- **정식 URL(canonical)**: SEO·링크 일관성을 위해 커스텀 도메인 활성 교회는 기본 경로 URL → 커스텀 도메인으로 301, canonical 태그 통일.
- 연합 딥링크·웹훅은 기본 도메인 유지 (커스텀 도메인은 표시용 표면일 뿐, 시스템 간 계약에는 미사용).

---

## 2. 홈 화면 고도화 — 4대 영역

홈의 설계 원칙(기존 문서 준수): `홈 = AppShell + WidgetSlot[]`, `(활성 컨텍스트 × 보유 역할 × 설치 모듈)`로 어셈블리. 데스크톱=사이드바 웹 문법, 모바일=하단 탭 앱 문법 유지.

### A. 내가 암송해야 할 말씀 (`verse.week` 위젯 고도화)

이미 동작하는 유일한 암송 기능이므로 **제거·재작성 금지** (Phase 2 완료 전 mod_verse 유지 — 연합 문서 명시). 고도화:

- **부서 타겟 우선 표시**: `verse_current()`가 이미 `target_department_id`를 지원 — 내 부서 배정 말씀 > 전교회 말씀 순으로 카드 구성.
- **진행 상태**: 이번 주 체크 여부(✓), 연속 암송 주(streak, `mod_verse.checks` 집계), 부서 완료율(담당자/교역자에게만 — `check_count/target_count` 이미 반환됨).
- **MATCH 가이드 1줄 노출**: `assignments.guide` 필드 활용 (암송·질문·대화·묵상·순종 중 이번 주 스텝).
- **인터페이스 고정**: 위젯 props를 `{reference, body, checked, progress}` 형태로 추상화 → Phase 2에서 데이터 소스만 Family_Verse `verse.checked` 이벤트/요약 API로 교체. iframe 금지, 상세는 딥링크.

### B. 내가 속한 교회의 행사 (신규 스키마 필요)

날짜 기반 행사 모델 신설 — 기존 `events`(반복 예배 규칙)와 분리하되 이름 충돌 회피를 위해 모듈 스키마 사용:

```sql
create schema mod_calendar;
create table mod_calendar.events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references churches(id),
  title text not null,
  description text,
  category text check (category in ('worship','education','fellowship','outreach','meeting','other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  target_department_id uuid references departments(id),  -- null = 전교회
  visibility text not null default 'member' check (visibility in ('public','member')),
  created_by uuid, created_at timestamptz default now()
);
-- RLS: church_id = my_church_id(); insert/update = superadmin/pastor 또는 has_module('calendar','manager')
-- 부서 타겟 행사 작성 = 해당 부서 dept_leader 허용
```

- **홈 위젯 "다가오는 행사"**: D-day 정렬, 전교회 + 내 부서 행사 병합, 3~4건 + 더보기.
- **관리 UI**: 기존 IA 계획대로 `/church/events` (기존 `EventsAdmin`은 "예배·모임 규칙" 탭으로 분리 유지).
- **공유 링크**: `visibility='public'` 행사는 `/{slug}/events/{id}` 비로그인 열람 → 1번 URL 구조와 직결.
- 기존 `events.schedule_rule`(주간 예배)은 그대로 "이번 주 예배·모임" 위젯 담당 — 역할 분담: 반복 예배 = `events`, 날짜 행사 = `mod_calendar.events`.

### C. 내가 속한 부서의 일정·내용 ("내 부서" 카드 신설)

별도 부서 일정 테이블을 만들지 않고 **행사 테이블의 `target_department_id`로 통합** (도메인 중복 방지, Phase 1 dept-comm-rooms 과업과 정합). 홈에 "내 부서" 카드:

- 내 부서 해석: `my_member_id()` → `department_members` (복수 부서 지원).
- 카드 내용: ① 이번 주 부서 일정(부서 타겟 행사) ② 부서 공지 — **잠자는 `mod_notice.notices.target_department_id` 활성화** (공지 작성 UI에 부서 선택 추가 + `home_feed()` 공지 쿼리에 `target_department_id is null or in (내 부서)` 필터) ③ 부서 배정 암송 진행.
- 부서 담당자에게 추가: 부서 미출석 요약(기존 `absentee_list` 재사용), 부서 공지 작성 바로가기.
- 후속(별도 과업): dept-comm-rooms의 `mod_rooms` 부서 자동 방 — 이 카드의 "부서 소통" 슬롯으로 연결 예정.

### D. 역할별 업무 대시보드 (교역자·담당자)

`home_feed()`를 v2로 확장해 **역할별 페이로드**를 늘리고, 5-persona 위젯 어셈블리를 실현:

| 페르소나 | 홈 상단 업무 위젯 |
|---|---|
| 교인/시니어 | 업무 없음 — 큰 카드 3개(말씀·내 출석·교회 소식) 유지 |
| 출석 담당자(checker) | 오늘 체크할 예배(현재 시각 기준 `schedule_rule` 매칭) + 미승인 셀프체크 N건 |
| 부서 담당자(dept_leader) | 부서 미출석 N명 + 부서 암송 완료율 + 부서 공지 작성 |
| 교역자(pastor) | **통합 승인 인박스**: 가입 신청 / 셀프체크 승인 / 심방 요청(미배정·배정됨 구분) / 부서장 승인 대기(`department_leaders.status='pending'` — 현재 홈에 미노출) + 새가족 정착 단계 요약(`mod_newcomer.progress` 4단계 퍼널) + 장기결석 목양 리스트 |
| 교회 관리자(superadmin) | 교역자 전체 + 모듈 스토어/교회 설정/역할 관리 바로가기 |

- **구현 원칙**: 별도 task 테이블 신설하지 않음 — 도메인별 승인 워크플로(join_requests, attendances.approved, visits, department_leaders)를 `home_feed()`가 카운트+딥링크로 집계하는 현 패턴 유지·확장. 영속 알림은 이미 계획된 `notifications` 테이블(dept-comm-rooms 과업)에 위임 — 중복 설계 금지.
- `home_feed()` v2 추가 항목: `dept_leader_pending`, `newcomer_stages`, `my_departments`, `upcoming_events`(전교회+부서), `dept_notices`.
- 위젯 선언은 `registry.ts`의 `{widget, showFor, size}` 패턴으로 — 권한 필터가 항상 우선.

---

## 3. 실행 로드맵 (의존 순서)

| 단계 | 내용 | 규모 | 의존 |
|---|---|---|---|
| 1 | `[church]` URL 세그먼트 + `set_active_church_by_slug` + 하위호환 리다이렉트 | 중 (마이그레이션 1 + 라우트 이동 + 미들웨어) | — |
| 2 | `mod_calendar.events` + `/church/events` 관리 + 홈 "다가오는 행사" 위젯 + 공개 행사 페이지 | 중 | 1 (공유 링크) |
| 3 | "내 부서" 홈 카드: 부서 공지 활성화 + 부서 일정(행사 부서타겟) + 부서 암송 진행 | 소~중 | 2 |
| 4 | `home_feed()` v2 + 역할별 업무 위젯 (교역자 통합 인박스 포함) | 중 | 2, 3 |
| 5 | 암송 위젯 고도화 (streak, 부서 완료율, MATCH 가이드) — 인터페이스 추상화 포함 | 소 | — (병행 가능) |
| 6 | 교회 커스텀 도메인 연결 (Cloudflare for SaaS + 설정 페이지 UI) | 중 | 1 |

연합(Phase 0/1) 관련 유의: `federation-slot` 홈 위젯은 placeholder 유지, `mod_verse`는 Family_Verse 완성(Phase 2) 전 제거 금지, 앱 간 데이터는 API+이벤트만(공유 DB·iframe 금지).

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: general
- **검증시각**: 2026-07-07T02:12:38.833Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 주요 현황 진단은 실제 마이그레이션/RPC 근거와 대체로 연결됨; 기존 반복 예배 `events`와 신규 날짜 행사 분리 방향은 일관적임.
- 결함/누락: `my_church_id() = active_church`, “모든 RPC”, “RLS 전면 완비”, “Cloudflare/OpenNext 그대로” 등은 과단정; URL slug 불일치 시 `active_church`를 변경하는 설계는 다중 탭/다중 교회 사용자에서 컨텍스트 충돌 위험이 있음; 사용자별 `/home` 리다이렉트를 301로 제안한 것은 캐시 위험; 공개 랜딩/행사 열람은 현재 `church_public`이 authenticated 중심이라 anon 공개 경계 설계가 부족함.
- 개선 제안: 세션별 전역 `active_church` 변경 대신 URL 컨텍스트 전달 방식 또는 명시적 전환 UX를 재검토; 리다이렉트는 302/307로 수정; `mod_calendar`에 schema config, grants, RLS, public RPC/view, 테스트 케이스를 구체화; 근거 없는 배포/무제한/완비 표현은 검증된 범위로 낮출 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- **근거**: 리뷰어의 지적이 타당하다. 나는:
  1. "모든 RPC", "RLS 전면 완비", "Cloudflare 그대로" 등을 근거 없이 절대화했다 — 실제 마이그레이션 범위를 명확히 검증해야 함.
  2. `active_church` 세션 전역 변경은 **다중 탭 환경에서 심각한 컨텍스트 충돌을 야기한다** (탭 A에서 교회 전환 → 탭 B의 요청이 잘못된 테넌트로 실행). 이는 critical issue.
  3. 301 리다이렉트는 브라우저/CDN 캐시로 인해 동일 사용자의 다중 교회 시나리오를 파괴한다.
  4. `mod_calendar`의 public RPC/view, RLS 정책, 테스트 케이스가 스케치 수준에 그친다.
  5. 현재 `church_public` 뷰가 anon/authenticated를 어떻게 구분하는지 미조사.

- **수정계획**:
  1. **과단정 표현 정제**: "확인된 RPC는 X개 (나머지는 검증 필요)" 형태로 근거 범위 명확화.
  2. **`active_church` 메커니즘 재설계**: 세션 전역이 아닌 **URL 컨텍스트 전달** (middleware에서 매 요청마다 slug 검증, 불일치 시 302 리다이렉트로 재유도) 또는 **명시적 전환 UX** (탭 내 "교회 전환" 버튼).
  3. **리다이렉트**: 기존 `/home` → `/{slug}/home`을 **302/307**로 변경.
  4. **`mod_calendar` 상세화**: 
     - RLS 정책: `visibility='public'` 행사는 public view만 노출 (anon도 접근 가능), 비공개는 church_roles 검증.
     - Public RPC: `get_public_events(slug)` 신설 (church_public 뷰 기반, row security 미적용).
     - 테스트: multitenancy isolation, public/member 경계, dept_target 필터 검증 케이스 3~4건 추가.
  5. **`church_public` 현황 재조사**: 실제 RLS 정책이 뭔지 확인 후 문서에 병기.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 전부 수용한다. 다만 문서 본문은 여전히 `완비`, `Cloudflare/OpenNext 그대로`, `교회 수 무제한`, `active_church` 전역 변경, `/home` 301, `mod_calendar` public/RLS/test 미상세, `church_public` anon 경계 미조사 문제를 그대로 포함한다. 반론의 수정계획은 타당하지만 아직 문서에 반영되지 않았으므로 통과 불가.

<!-- /doc-crossverify:managed -->
