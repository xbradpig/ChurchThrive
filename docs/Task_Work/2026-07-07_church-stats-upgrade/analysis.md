# Analysis — 기존 자산 · 역량 · 중복 검토 (교회 현황 고도화)

> 2026-07-07 코드베이스 전수 조사 결과. 대상: `ChurchThrive/web/`(운영 앱) + `ChurchThrive/supabase/migrations/`(스키마 SSOT).

## 1. 기술 스택 & 라우팅 (제약 조건)

- Next.js 15.3 App Router + React 19 + TypeScript, Supabase(Postgres+RLS), Tailwind v4, Cloudflare 배포(OpenNext), PWA.
- **차트 라이브러리 없음** — 차트는 수제 인라인 SVG(`admin/TrendChart.tsx`). 신규 통계도 이 방식 유지가 일관적. (검증: `grep 'recharts|chart\.js|chartjs|d3|victory|nivo|echarts|plotly' web/package.json` = 0건, 2026-07-07)
- 경로 기반 테넌시 `app/[church]/…`, 링크 base `/${church}`. 서버 테넌트 축은 `my_church_id()` RPC.
- 듀얼 네비: 데스크톱 사이드바(`AppHeader.tsx:70`, `buildNav()` — 내 공간/사역/운영 3섹션, `registry.ts:90-165`에 children·visible/disabled/hidden 상태), 모바일 하단 탭(`BottomNav.tsx`). **웹(데스크톱)이 기준, 데스크톱에 앱 문법 금지** (사용자 확정 원칙).

## 2. 기존 "현황" 성격 화면 (중복 검토 — 흡수 대상)

| 화면 | 위치 | 내용 | 결정 |
|---|---|---|---|
| 교회 관리 > 현황 탭 | `admin/AdminTabs.tsx:64` `Overview()` | 3-스탯(등록 교인/오늘 출석/승인 대기) + `attendance_trend()` 주간 차트 + 승인 큐 | **새 `/stats` 오버뷰로 흡수, 탭은 리다이렉트** |
| 홈 대시보드 | `home/page.tsx` + `home_feed()` RPC | 해야 할 일 건수, 미출석 N명, 이번 주 암송, 내 출석 뱃지 | 유지 (홈=개인/할 일, 현황=교회 전체 — 상보적, 중복 아님) |
| 암송 관리 주차별 암송률 | `m/verse/admin/VerseAdmin.tsx:62` | 진행바(`check_count/target_count`) | 패턴 재사용, 통계 확장판은 `/stats/verse`로 |

## 3. 데이터 모델 현황 (도메인별 가용성)

### 3-1. 출석 — ✅ 준비 완료
- `events(category[worship/education/meeting/visit/other], schedule_rule, target_department_id)`, `attendances(member_id, event_id, event_date, method[manual/qr/nfc/self/auto_wifi/auto_ble], approved)` — unique(member,event,date). (`00001_schema.sql`)
- RPC: `attendance_trend(p_weeks)` → (event_date, event_name, cnt) (`00003_rpc.sql:205`), `absentee_list(p_weeks)` → (member_id, name, care_target, last_attended, weeks_absent) (`00003_rpc.sql:185`).
- 부서별 분해는 `department_members` 조인으로 가능. 예배별 분해는 `events.category`로 가능.

### 3-2. 말씀 암송 — ✅ 주차 단위 통계 가능
- `mod_verse.assignments(week_start, reference, target_department_id)`, `mod_verse.checks(assignment_id, member_id, method)` PK(assignment,member). (`00007_verse.sql`)
- RPC: `verse_current()` → (…, check_count, target_count). 스트릭 = checks의 연속 week_start로 계산 가능.
- ⚠️ 소유권 Family_Verse 이전 예정(홈 고도화 로드맵 ⑤) → 통계는 RPC 경계 뒤 배치.
- 불가(모델 확장 필요): 복습 정확도, 성경 커버리지, 메모리 헬스.

### 3-3. 말씀노트 — ❌ 모델 부재 (본 과제에서 신설 확정)
- 검증: `grep '말씀노트|설교|sermon' web/src supabase/migrations` = **0건** (2026-07-07). 유사 모듈은 전자주보(`mod_bulletin.issues`: week_start, title, content_md, published)뿐.
- `mod_note` 신설 선행 (mod_* 규약: church_id + RLS + module gate) → Phase 4, **본 과제 포함 확정(2026-07-07 사용자 결정)**.

### 3-4. 재정 — ⚠️ 수입만 존재, 권한 최고 민감
- `mod_giving.records(member_id, fund, amount, given_on, recorded_by)` (`00013_modules_p2.sql`). 펀드: 십일조·감사·주정·선교·건축·기타(`GivingBoard.tsx:8`).
- **지출/예산 테이블 없음** → 수입 현황만 가능. (검증: `grep 'expense|budget|지출|예산' supabase/migrations web/src` = 0건, 2026-07-07)
- RLS `g_sel`: 본인 + giving grant 보유자 + superadmin만. 교역자도 grant 없으면 불가.
- 확정 정책(2026-07-07, 2차 정정)과의 정합: **현행 RLS가 확정 정책과 거의 일치** — 일반 pastor는 집계 포함 접근 불가(현행 그대로), 재정부(manager+)=전체, 열람 허가자(viewer)=조회. `module_grants.level`(viewer/manager/admin)이 3층 구조에 직접 매핑. viewer=읽기 전용도 RLS에서 이미 강제됨 (검증: `g_sel`은 grant 보유 전체 열람 허용, `g_ins`는 `mg.level in ('manager','admin')` 요구 — `00013_modules_p2.sql:132-145`). **신설 필요**: 대표 교역자 지정 + grant 부여 권한을 superadmin 외 담임목사로 확장(현재 grant 관리는 superadmin 축만 — `churches.pastor_name`은 텍스트 컬럼일 뿐 권한 축 아님)뿐.

### 3-5. 교적 — ✅ 분포 통계 가능, 증감 추이도 기존 `audit_log`로 가능 (재분류)
- `members(name, position[직분], member_type[registered/new_family/visitor], status[active/inactive/moved/deceased], birthday, care_target, created_at, …)` — hard delete 금지, 상태 전환만. `departments` + `department_members` + `department_leaders(status)`.
- RPC: `admin_list_members(p_search,p_dept,p_status)`(연락처/생일은 pastor+만), `admin_list_departments()` → member_count 포함.
- **증감 추이 재분류 (초판의 "이력 없음" 판정은 오류 — 검증 후 정정)**:
  - `audit_log(action, target_table, before_json, after_json, at, church_id)` 존재 (`00001_schema.sql:139`)
  - `members_audit` 트리거가 members **update마다** before/after 전체 jsonb 기록 (`00001_schema.sql:170-179`) → **status 전환 추출 가능** (`before_json->>'status' <> after_json->>'status'`)
  - `member_create`/`member_update` 액션 로그 (`00024_admin_directory.sql:64`), 범용 트리거 `tg_audit_generic` (`00012`)
  - 등록 추이는 `members.created_at`으로 직접 집계
  - **판정**: 전용 상태 이력 테이블 **불필요**. 한계: 트리거 가동 이전 소급 불가(해당 구간 "데이터 없음" 표시), jsonb 파싱 비용(성능 경계 초과 시 표현식 인덱스 또는 파생 뷰). RLS상 audit_log 열람은 superadmin/pastor 한정(`00002_rls.sql:136-139`) → 집계 RPC는 security definer로 제공
- 연령대 분포는 `birthday`로 계산 가능(단 열람 권한 pastor+ — 익명 집계 RPC로 우회 설계).

### 3-6. 인접 모듈 (인사이트 결합 소스)
- `mod_newcomer.progress`(정착 stage 1~4) → 새가족 퍼널. `mod_visitation.visits`(requested/assigned/done) → "해야 할 일" 심방 연계. `mod_training.enrollments`(enrolled/completed/dropped) → 참여 점수 축 후보.

### 3-7. 알림 인프라 — ✅ 주간 다이제스트에 그대로 재사용 가능
- `notification_settings(user_id, kind, threshold_weeks, send_dow, send_time, enabled)` — 현행 kind `absentee_digest`, 발송 요일·시각 설정 구조 완비 (`00001_schema.sql`)
- `push_subscriptions(user_id, endpoint, keys_json)` — 웹푸시 구독 (`00001_schema.sql`)
- **판정**: 주간 현황 다이제스트는 kind `stats_digest` 추가만으로 구현 가능 — 신규 인프라 0.

## 4. 권한/가시성 자산 (통계 설계의 뼈대)

- 역할: `superadmin / pastor / dept_leader / checker / member` (`roles.ts:5`).
- 헬퍼: `my_church_id()`, `my_role()`, `my_member_id()`, `is_staff()`, `module_enabled()`, `has_module(module, level)`, `my_led_departments()` (`00006_tenancy.sql`).
- `module_grants(user_id, module, level[viewer/manager/admin])` — 재정 담당 임명 축.
- 교적 필드 2중 게이트: `field_permissions` ∩ `member_consents` (`field_visible()`, field_group: attendance/contact/birth/address/family/pastoral).
- **`home_feed()`(`00025_home_feed.sql`)의 조건부 jsonb 조립이 stats RPC의 직접 템플릿** — 각 지표를 `case when my_role() in (…)`/`module_enabled(…)`로 감쌈.
- 참고: `AdminTabs`에서 dept_leader는 현황/명부/미출석 탭만(`AdminTabs.tsx:37`), church 페이지는 member/checker 접근 시 홈 리다이렉트(`church/page.tsx:13`).

## 5. UI/디자인 자산 (재사용 목록)

- 토큰: Design System v2(`globals.css`) — 브랜드 딥네이비, 시맨틱 `--color-positive/caution/danger/accent`(+`-soft`), 다크모드 자동, `--radius-card`, `.tabular`(숫자 고정폭).
- 컴포넌트: `Stat`(3열 스탯 타일, `AdminTabs.tsx:148`) · `TrendChart`(SVG 막대, 호버 툴팁, "표 보기" 토글) · 진행바(`VerseAdmin.tsx:76`) · `.card`/`.card-hover` · `.badge` · `.chosung-chip` · `EmptyState`/`ListSkeleton` · `MemberCard` · `ModuleGate`.
- 결론: **신규 UI 의존성 0으로 Phase 1~3 구현 가능.**

## 6. 역량/중복 최종 판정

| 필요 기능 | 기존 자산 | 판정 |
|---|---|---|
| 오버뷰 KPI/추세 | `Overview()` + `Stat` + `TrendChart` | 재사용·확장 (신규 아님) |
| 역할별 조립 RPC | `home_feed()` 패턴 | 패턴 복제 — stats RPC 신설 |
| 미출석→심방 연결 | `absentee_list` + `mod_visitation` | 연결만 신설 |
| 출석 일관성 세그먼트 | 없음 (원시 데이터 충분) | 신규 집계 로직 |
| 새가족 퍼널 | `mod_newcomer.progress` | 집계 뷰 신설 |
| 암송 스트릭 | `mod_verse.checks` | 신규 집계 로직 |
| 재정 추이/세그먼트 | `mod_giving.records` + RLS | 게이트 내 집계 신설 |
| 교적 분포 | `members`/`departments` RPC | 집계 확장 |
| 교적 증감 추이 | `audit_log` + `members_audit` 트리거 + `members.created_at` | **재사용 가능으로 재분류** — 집계 RPC만 신설 (§3-5) |
| 재정 익명 집계(pastor용) | RLS는 개인 단위 게이트만 존재 | security definer 집계 RPC 신설 |
| 대표 교역자 지정·grant 부여 확장 | 없음 (`pastor_name`은 텍스트) | 신설 필요 (Phase 3) |
| 말씀노트 전체 | **모델 없음** (grep 0건) | `mod_note` 신설 (Phase 4, 본 과제 포함 확정) |
| 인쇄 보고서 | 없음 | 인쇄용 뷰 신설 (Phase 3) |
| 주간 다이제스트 푸시 | `notification_settings` + `push_subscriptions` (§3-7) | kind `stats_digest` 추가만 — 재사용 |
| 빈 상태 처리 | `EmptyState` 컴포넌트 | 위젯별 안내문구+바로가기로 재사용 |

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: analysis
- **검증시각**: 2026-07-07T04:58:17.418Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 실제 파일·심볼(`AdminTabs`, `TrendChart`, `home_feed`, `mod_*`, RPC/RLS)을 근거로 재사용/신규 판정이 구체적임. 중복 화면과 부재 영역 검토도 포함됨.
- 결함/누락: 교적 증감 추이를 “이력 없음 → 감사 로그 신설 필요”로 결론낸 부분은 부정확함. 실제로 `audit_log`, `tg_members_audit`, `members_audit`, `member_create/member_update` 로그가 있음. 또한 “그렙 0건”, “차트 라이브러리 없음”, “지출/예산 없음”은 검색 범위/명령 증거가 부족함.
- 개선 제안: `audit_log`로 가능한 지표와 전용 상태 이력 테이블이 필요한 지표를 재분류하라. 부재 주장마다 `rg` 명령, 검색 범위, 결과를 문서에 남겨라.

### R2 · 원작자(claude) — 입장 AGREE

**STANCE: AGREE**

- **근거:**
  1. **교적 증감 추이**: "이력 테이블 없음"이라고 단정한 것이 부정확함. `audit_log`, `tg_members_audit`, `members_audit`, `member_create/member_update` 같은 기존 로그 테이블을 조사하지 않고 결론냈음. `members` 테이블의 상태 전환(`active→moved→inactive` 등) 자체가 이력의 핵심인데, 이를 활용할 수 있는지(RPC 추가 vs 신규 테이블) 재분류 필요.
  2. **검색 증거 부재**: "그렙 0건", "차트 라이브러리 없음", "지출/예산 없음"은 주장만 있고 명령·범위·결과가 없음. 예를 들어:
     - 차트 라이브러리: `rg 'recharts|chart\.js' ChurchThrive/` 결과를 명시하지 않음
     - 말씀노트: `rg 'sermon|note|설교' ChurchThrive/` 범위를 제한하지 않음
     - 이력: `rg 'audit_log|_audit|created_at|updated_at' ChurchThrive/supabase/migrations/` 실행 결과를 보이지 않음
  3. 이는 **재사용성 판정**(문서의 핵심)을 흐리게 함.

- **수정계획:**
  1. `audit_log`, `tg_members_audit`, `members_audit` 테이블의 실제 스키마·RLS 조사 → "이력으로 가능한 지표" vs "전용 상태 테이블 필요 지표" 재분류
  2. 부재 주장 3곳(`말씀노트`, `차트 라이브러리`, `지출/예산`)마다 `rg` 실행 명령, 검색 범위, 결과 건수를 각주 형식으로 기록
  3. 예: `⚠️ 지출/예산 없음` → `⚠️ 지출/예산 없음 (검증: rg 'expense|budget|지출' ChurchThrive/supabase/migrations/ = 0건, package.json 확인 필요)`

이렇게 수정하면 **재사용 가능성 판정이 신뢰도 높게 전환될 것임.**

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용한다. 작성자가 `audit_log`/`*_audit` 조사 누락과 검색 증거 부족을 정확히 인정했고 수정계획도 타당하다. 다만 현재 문서는 여전히 교적 증감 추이를 “이력 없음/신설 필요”로 단정하고, 말씀노트·차트 라이브러리·지출/예산 부재 주장에 명령·범위·결과 증거가 없다. 실제 문서 수정 전까지는 NEEDS-REVISION이다.

<!-- /doc-crossverify:managed -->
