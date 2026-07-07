# Detail Goal — 교회 현황 섹션 고도화 상세 요구사항

> `goal.md`를 해소하는 상세 설계. 근거 리서치: 해외 ChMS(Planning Center, Breeze, ChurchTrac, Tithe.ly/Aplos, Church Metrics, Subsplash, Pushpay, Vitals) + 국내(온맘교적, 만나, 스데반정보, OKSolomon) 대시보드 비교 분석 + ChurchThrive 코드베이스 조사(`analysis.md`).

## 1. IA(정보구조)

```
/{slug}/stats               현황 오버뷰 (사이드바 "운영" 섹션 최상단)
/{slug}/stats/attendance    출석 현황
/{slug}/stats/verse         말씀 암송 현황
/{slug}/stats/notes         말씀노트 현황 (Phase 4 — mod_note 신설 후)
/{slug}/stats/giving        재정 현황 (giving 권한자만 메뉴 노출)
/{slug}/stats/members       교적 현황
```

- **데스크톱**: 사이드바 "운영"에 "교회 현황" + 펼침 하위 항목(`registry.ts` children 패턴). 오버뷰 상단에 서브페이지 탭 칩(`.chosung-chip` 재사용) 병행 — 양쪽 진입 경로 제공.
- **모바일/PWA**: 하단 탭 불변(웹/앱 분리 원칙). 스태프 "메뉴" + 홈 바로가기에서 진입, 화면은 1열 카드 스택.
- 기존 `교회 관리 > 현황 탭`(`/church?tab=overview`)은 `/stats`로 리다이렉트해 중복 제거.
- **기록/읽기 분리 원칙**: 기록하는 곳(출석 체크, 헌금 입력, 암송 체크)은 각 모듈에 유지, 읽는 곳은 현황 아래로 집결.

## 2. 오버뷰 페이지 (`/stats`)

업계 표준 공식: **KPI 카드 → 추세 차트 → 액션 아이템**. 역할별 조립(`stats_overview()` RPC 내부에서 `my_role()`/`module_enabled()` 분기 — `home_feed()` 패턴).

### ① KPI 스트립 (기존 `Stat` 컴포넌트, 전주 대비 증감 ▲▼)

| 카드 | 소스 | 노출 대상 |
|---|---|---|
| 주일 출석 | `attendances` | 스태프 전체 |
| 이번 주 새가족 | `members(member_type=new_family)` | 스태프 |
| 암송 참여율 | `verse_current()` | 스태프 |
| 심방 필요 | `absentee_list()` count | pastor/superadmin/부서장(자기 부서) |
| 주간 헌금 | `mod_giving.records` | **superadmin·담임목사(대표 교역자)·giving grant(viewer+) 보유자만** — 일반 pastor 비노출 |
| 재적/활동 교인 | `members(status)` | 스태프 |

### ② 추세 존
- 13주 출석 추이 (`TrendChart` 확장): **4주 이동평균 라인** 추가 — 단일 주일 수치는 노이즈가 커서 이동평균이 업계 표준.
- **전년 동기(YoY) 비교** — 교회는 절기 효과(부활절·성탄)가 커서 전주 대비보다 YoY가 더 의미 있음 (Planning Center 표준: 30일/13주/12개월 + YoY).

### ③ "이번 주 해야 할 일" (이 페이지의 존재 이유)
- 🔴 48시간 내 연락 필요한 새 방문자 N명 — 연구상 48시간 내 개인 접촉 시 재방문율 최대 75% 상승
- 🟠 3주 연속 결석 M명 → 클릭 시 미출석·케어 명단으로
- 🟡 암송 스트릭 끊긴 교인 / 새가족 정착 단계(`mod_newcomer.progress`) 정체자
- 모든 항목은 **숫자 → 명단 → 개인 프로필 → 액션**(심방 배정·연락) 드릴다운.

### ④ 인쇄용 주간 보고서 + 주간 다이제스트 푸시 (Phase 3)
- **인쇄용 뷰**: 당회/제직회 보고 문화 대응 — 오버뷰를 인쇄용 뷰(A4)로 출력. 국내 제품 대비 즉효성 있는 차별화.
- **주간 현황 다이제스트 푸시**: 기존 알림 인프라 재사용 — `notification_settings`(발송 요일·시각 설정, 현행 kind `absentee_digest`)에 **kind `stats_digest` 추가** + `push_subscriptions` 웹푸시로 발송. 신규 인프라 0 (Vitals의 자동 주간 리포트 이메일 패턴을 기존 자산으로 구현). 수신 대상은 역할별 열람 범위와 동일(재정 수치는 giving viewer+ 수신자에게만 포함).

### ⑤ 빈 상태(콜드스타트) 규칙
신규 등록 교회는 현황이 텅 빈다 — 임의 처리 금지, 아래 기준 통일:
- 데이터 0건 위젯은 기존 `EmptyState` 컴포넌트 재사용: 안내 문구 + **해당 기록 기능 바로가기** (출석 → `/check`, 암송 → `/m/verse`, 헌금 → `/m/giving`, 교적 → 교인 등록). "기록을 시작하면 여기에 추이가 쌓입니다" 톤
- 추세 차트는 데이터 4주 미만이면 "추이가 쌓이는 중 (N/4주)" 표시, 4주 이동평균 라인은 4주 차부터 렌더링
- YoY 비교는 전년 데이터 없으면 증감 뱃지 자체를 숨김 (0% 표시 금지 — 오해 유발)

## 3. 서브페이지 상세

### 3-1. 출석 (`/stats/attendance`) — Phase 1
- 주간/월간 추이 + 4주 이동평균 + YoY. **예배별**(`events.category`) · **부서별**(`department_members` 조인) 분해.
- **출석 일관성 세그먼트** (Phase 2): 최근 13주 출석 빈도로 매주/격주/월1회/이탈위험 4구간 — 이탈위험은 자동 심방 후보. `absentee_list`(사후 감지)를 사전 감지로 진화시키는 핵심.
- **새가족 정착 퍼널** (Phase 2): 등록 → 4주 내 재출석 → `mod_newcomer.progress` stage 1~4 → 부서 배정. 단계별 전환율 + 48시간 팔로업 완료율. (벤치마크: 평균 교회 재방문율 10~20%, 성장 교회 21%+)
- 체크인 방식 분포(manual/qr/self/auto) — 자동화 정착도.

### 3-2. 말씀 암송 (`/stats/verse`) — Phase 2
현행 모델(`mod_verse.assignments` 주차별 + `checks`)로 즉시 가능:
- 주차별 암송률 추이(진행바 → 13주 차트), 부서별 참여율 비교, 주간 활동자 수(WAU).
- **개인 스트릭**(연속 체크 주차) 리더보드 — YouVersion·Bible Memory App에서 검증된 동기부여 장치.
- 연말 "우리 교회 암송 결산"(총 구절 수·최장 스트릭·참여 교인) — YouVersion Year in Review 방식. (Phase 4)
- ⚠️ **mod_verse는 Family_Verse로 소유권 이전 예정** → 통계는 RPC 경계 뒤에 두어 소스 교체에 대비.
- 모델 확장 시(후순위): 복습 정확도, 성경 66권 커버리지 히트맵, 메모리 헬스(복습 스케줄).

### 3-3. 말씀노트 (`/stats/notes`) — Phase 4, 모델 신설 선행 (본 과제 포함 확정)
- 현재 모델 부재. `mod_note` 신설: mod_* 규약(church_id + RLS + module gate), `week_start` 기준으로 전자주보 `mod_bulletin.issues`와 연결.
- **스키마 초안**:
  ```sql
  create schema mod_note;
  create table mod_note.notes (
    id uuid primary key default gen_random_uuid(),
    church_id uuid not null,
    member_id uuid not null references public.members(id),
    week_start date not null,              -- 주일 기준 (KST, 일요일 시작)
    bulletin_issue_id uuid,                -- mod_bulletin.issues 연결 (nullable — 주보 없는 주 대비)
    title text,
    body_md text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  -- 주당 여러 노트 허용 (unique 없음) — 통계는 week_start 기준 "작성 여부" distinct 집계
  ```
- **프라이버시 원칙 (선제 확정 — 재정처럼 사후 정정하지 않도록)**:
  - 노트 **내용(body)은 본인만 열람** — RLS `member_id = my_member_id()`. 스태프·목회자·superadmin도 내용 열람 불가
  - 통계는 **작성 여부/건수만** security definer RPC로 집계 (내용·제목 비노출)
  - 향후 "노트 공유" 기능이 생기더라도 opt-in(교인 동의) 축으로만 — 기본은 비공개
- 지표: 주간 작성률(주일 설교 대비), 개인 연속 작성 주차, 설교 시리즈별 커버율.
- **인사이트**: 노트 작성 중단은 출석 감소보다 먼저 나타나는 이탈 조기 신호 → 참여 점수의 한 축 (단, 점수 계산도 작성 여부만 사용).

### 3-4. 재정 (`/stats/giving`) — Phase 3 (정책 확정: 2026-07-07, 2차 정정 반영)
- **권한 3층 구조 (확정)** — 기존 `module_grants.level`(viewer/manager/admin)에 정확히 매핑:
  1. **재정부 = giving grant `manager`/`admin`**: **전체** — 재정 입력이 업무이므로 개인 단위 조회·입력·정리 전부. 개인별 명세, 펀드별 정리, 연간 개인 헌금 명세(연말정산·기부금 영수증 대비) 화면 제공
  2. **담임목사(대표 교역자) + 허가된 열람자 = giving grant `viewer`**: 재정 현황 **열람**(집계 + 개인별 명세 조회, 입력·수정 불가). 담임목사는 지정 시 viewer 이상 자동 부여
  3. **그 외 전원 — 일반 pastor 포함 — 접근 불가**: 메뉴 항목·오버뷰 헌금 카드·집계 전부 비노출. "허가 없는 교역자는 집계조차 볼 수 없다"가 확정 원칙
  - **grant 부여**: superadmin **또는 담임목사**. 대표 교역자 지정 메커니즘 신설 필요 (§8)
- 페이지 구성: 접근 가능자(viewer+)에게 집계 존(추이·펀드별·가정 수) + 개인별 명세 존(조회), 입력·정리 액션은 manager+만 활성. 차단은 UI 분기가 아닌 RPC/RLS 계층 — `stats_giving()`·`giving_ledger()` 모두 `has_module('giving','viewer')` 게이트, 미보유 시 빈 응답.
- 주간/월간/펀드별(십일조·감사·선교…) 추이, 연간 누계.
- **"헌금 가정 수" 추이를 금액보다 앞세움** — 참여 지표가 건강 신호로 더 유효 (Pushpay 핵심 지표).
- 정기성 세그먼트: 정기/간헐/신규/중단 헌금 가정 수 — 정기→중단 전환은 이탈 조기 신호.
- 지출 모델 부재 → 수입 현황만. 예산 대비 실적은 후속.

### 3-5. 교적 (`/stats/members`) — Phase 1
- 직분별·연령대별·부서별 분포 현황판(온맘 스타일 — 국내 사용자 기대치), 재적/활동/장기결석 구분.
- 월별 등록·전출입 순증감 — 등록은 `members.created_at`, 전출입은 기존 `audit_log`(`members_audit` 트리거)의 before/after jsonb에서 status 전환 추출 (전용 이력 테이블 불필요 — `analysis.md` §3-5). 트리거 가동 이전 구간은 "데이터 없음" 표시.
- **종합 참여 점수** (Phase 4): 출석+암송+노트+소그룹 축 일관성 → 상위/보통/이탈위험 3구간, 이탈위험은 자동 심방 후보. 개인 비노출, 목회 도구 한정.

## 4. 권한 매트릭스

| 서브페이지 | superadmin | 담임목사(대표 교역자) | 일반 pastor | 재정부(manager+) | 열람 허가자(viewer) | dept_leader | checker | member |
|---|---|---|---|---|---|---|---|---|
| 오버뷰 | 전체 | 전체(헌금 카드 포함) | 전체 — **헌금 카드 제외** | 역할 기본 + 헌금 카드 | 역할 기본 + 헌금 카드 | 자기 부서 스코프 | 출석 카드만 | 접근 불가* |
| 출석/교적 | ✅ | ✅ | ✅ | 역할 따름 | 역할 따름 | 자기 부서만 | 출석만 | ✕ |
| 암송/노트 | ✅ | ✅ | ✅ | 역할 따름 | 역할 따름 | 자기 부서만 | ✕ | ✕ |
| 재정 열람(집계+개인별 명세 조회) | ✅ | ✅ | **✕** | ✅ | ✅ | ✕ | ✕ | ✕ |
| 재정 입력·정리 | ✅ | ✕(별도 manager 부여 시) | ✕ | ✅ **(본연 업무)** | ✕ | ✕ | ✕ | ✕ |

\* 개인 통계(내 출석·내 스트릭)는 홈/내 교적 영역. giving grant 부여는 superadmin 또는 담임목사만 가능. **일반 pastor는 재정에 대해 집계조차 볼 수 없음** (2026-07-07 확정).

- 부서 스코프 축소는 UI가 아니라 RPC/RLS 계층(`my_led_departments()`)에서.
- 교적 필드 상세는 기존 2중 게이트(`field_permissions` ∩ `member_consents`) 준수 — 통계는 익명 집계이므로 게이트 밖이지만, 드릴다운 명단부터는 게이트 적용.

## 5. 기술 구현

- **집계 RPC 서브페이지당 1개**: `stats_overview()`, `stats_attendance(p_weeks, p_dept)`, `stats_verse(p_weeks)`, `stats_giving(p_months)`, `stats_members()` — `home_feed()` 패턴(역할/모듈 게이트 내장, jsonb 반환, 1왕복).
- **차트는 신규 라이브러리 없이** 기존 `TrendChart` SVG 확장: 이동평균 라인, 그룹 막대, (후순위) 히트맵. 스탯 `Stat`+`.card`, 비율 진행바.
- **모든 신규 차트에 "표 보기" 토글 필수** — TrendChart에 이미 있는 패턴을 강제 규칙화 (Design System v2 어르신 가독성·접근성 원칙: 시각 차트를 읽기 어려운 사용자를 위한 동등한 표 접근).
- 무거운 세그먼트 집계는 초기 실시간 쿼리 → 성능 경계(p95 1s) 초과 시 주간 배치/materialized view.
- 디자인 토큰: 긍정 `--color-positive`, 주의 `--color-caution`, 위험 `--color-danger`, 숫자 `.tabular` — Design System v2 준수(본문 17px, 터치 48px, 다크모드 자동).

## 6. 리서치 근거 요약 (왜 이 구성인가)

- **오버뷰 3단 공식**(KPI+증감 → 추세 → 액션): Planning Center 커스텀 대시보드, Breeze 카드 대시보드, ChurchTrac 공통 패턴.
- **at-risk 감지 → 개입 연결**: Pushpay Donor Development(정기→중단 = at-risk 세그먼트 + 권장 액션), Vitals(참여 일관성 하락 조기 신호, 번아웃 감지). 만나 앱의 "결석 사유 관리 + 심방 연계"가 국내 접점.
- **새가족 퍼널**: Planning Center 워크플로우(첫 방문 48시간 내 이메일→엽서→문자→1개월 확인). 고성장 교회 정착률 1회차 34%/2회차 51%/3회차 78%.
- **스트릭/습관 통계**: YouVersion(일/주/연 스트릭, Year in Review), Bible Memory App(스트릭+정확도+66권 히트맵).
- **재정 권한 규범**: Planning Center Giving 4단계(Administrator/Bookkeeper/Counter/**Reviewer=익명 집계만**), Church Social(Treasurer만 — admin도 불가).
- **국내 차별화 논지**: 온맘(약 220종 리포트)·스데반 등은 집계표 중심, 인사이트형(추세·세그먼트·퍼널·팔로업 연동)은 부재 — 이 결합이 기회.

## 7. 성공기준 & Phase별 완료조건

공통 기준선: 타임존 KST, 주간 = 일요일 시작. 모든 stats RPC p95 < 1s. 비권한자 데이터 노출 0건(RPC/RLS 계층 검증, UI 분기만으로 통과 불인정).

### Phase 1 완료조건
- KPI: 오버뷰에 역할별 KPI 카드 렌더링 (superadmin 5~6개 / pastor 5개 / dept_leader 2개 / checker 1개 — goal.md DoD 매트릭스 준수), 각 카드 전주 대비 증감 표시
- UI: 13주 추세 + 4주 이동평균 라인 렌더링, 375/768/1280px 3개 폭 가로 스크롤 없음, ≥768px 사이드바 레이아웃
- 권한: ① member→`/stats` 접근 시 `/{slug}/home` 리다이렉트 ② checker→`/stats/members` 차단 ③ dept_leader 타 부서 파라미터 조작 시 자기 부서 강제 — 3개 시나리오 테스트 통과
- 데이터: 교적 증감 집계 RPC가 `audit_log` status 전환 + `members.created_at` 기반으로 동작, 트리거 가동 이전 구간 "데이터 없음" 표시
- 라우팅: `/church?tab=overview` → `/stats` 리다이렉트(307) 동작
- 빈 상태: 데이터 0건 교회에서 전 위젯 `EmptyState` + 기록 기능 바로가기 렌더링 (§2-⑤ 규칙), 4주 미만 차트 "쌓이는 중" 표시
- 테스트 픽스처: 역할별 시드 계정 5종(superadmin/pastor/dept_leader/checker/member) + 13주 이상 출석 시드 데이터 — 권한 매트릭스 검증에 사용
- 빌드: `npm run typecheck` + `next build` 통과

### Phase 2 완료조건
- 출석 일관성 세그먼트 4구간(매주/격주/월1회/이탈위험) 분류 로직 + 이탈위험 명단 → 심방 후보 드릴다운 동작
- 새가족 퍼널 4단계 전환율 표시 (`mod_newcomer.progress` 연동), 48시간 팔로업 대기 건수 오버뷰 노출
- `/stats/verse`: 주차별 암송률 13주 차트 + 부서별 참여율 + 개인 스트릭 (RPC 경계 뒤 구현 — 소스 교체 대비 확인)

### Phase 3 완료조건
- `/stats/giving` 열람(집계 + 개인별 명세 조회): superadmin·담임목사·giving grant(viewer+) 보유자만. 입력·정리 액션은 manager+만 활성
- **차단 검증: giving grant 없는 일반 pastor 계정에서 재정 메뉴 비노출 + 오버뷰 헌금 카드 비노출 + `stats_giving()`/`giving_ledger()` RPC 응답 0건** (집계 포함 전부 — UI 분기가 아닌 RPC/RLS 계층에서)
- 대표 교역자 지정 + 지정된 담임목사가 giving grant 부여/회수 가능 (superadmin과 동등) — 지정·부여·회수 3개 시나리오 테스트, 지정 시 담임목사 본인 viewer 자동 부여 확인. **지정·해제·grant 부여/회수는 모두 `audit_log` 기록** (권한 이양 행위 — 기존 `tg_audit_generic` 부착)
- 인쇄용 주간 보고서: 오버뷰 인쇄 뷰(A4 세로) 출력 확인
- 주간 다이제스트 푸시: `notification_settings`에 kind `stats_digest` 추가, 설정한 요일·시각에 발송 + 재정 수치는 giving viewer+ 수신자에게만 포함되는지 검증

### Phase 4 완료조건
- `mod_note` 스키마 + RLS + module gate 가동 후 `/stats/notes` 지표 3종(주간 작성률/연속 주차/시리즈 커버율)
- 종합 참여 점수: 목회자 화면에서 "심방 후보" 표현만(등급 라벨·개인 노출 없음) 확인

## 8. 선행 의존성 & 미결 사항 (블로커 집결)

| 항목 | 블로킹 대상 | 상태 |
|---|---|---|
| 교적 증감 추이 데이터 소스 | Phase 1 | **해소** — 기존 `audit_log` + `members.created_at` 재사용 (전용 테이블 불필요, `analysis.md` §3-5) |
| giving 열람 정책 | Phase 3 | **확정(2026-07-07, 2차 정정)** — 재정부(manager+)=전체(입력·정리), 담임목사·허가 viewer=열람, **일반 pastor=집계 포함 접근 불가**, grant 부여=superadmin·담임목사 |
| **대표 교역자(담임목사) 지정 메커니즘** — 예: `churches.senior_pastor_user_id` 컬럼 + 지정 UI, grant 부여 함수의 권한 검사 확장 | Phase 3 (grant 부여 권한) | 미착수 — 신규 설계 항목 |
| `mod_note` 모듈 신설 (스키마+RLS+게이트) | Phase 4 | **본 과제 포함 확정(2026-07-07)** — 미착수 |
| `mod_verse` → Family_Verse 소유권 이전 일정 | Phase 2 설계 방식 | 일정 미정 — RPC 경계 뒤 배치로 위험 흡수 |

## 9. 명시적 Out-of-Scope

- **Phase 4 이후로 명시 이연**: 암송 복습 정확도·성경 66권 히트맵·메모리 헬스, 예산 대비 실적
- **본 과제 전체에서 제외**: 지출(expenses) 모델, 하단 탭 변경, 차트 라이브러리 도입, 개인 대상 통계 노출(홈/내 교적 영역), 연합(하브루타) 크로스앱 통계, 커스텀 대시보드 빌더(위젯 선택 배치)

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T04:55:23.583Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: IA, 단계별 페이지 구성, 권한 매트릭스가 구체적임. 기존 `Stat`, `TrendChart`, `.chosung-chip`, `home_feed()` 패턴 등 capability-first 재사용 검토가 비교적 잘 반영됨.
- 결함/누락: 성공기준이 측정 가능하게 정의되지 않음. Phase별 완료 조건, p95 1s 외 성능/UX/권한 검증 기준, 데이터 정확도 기준이 부족함. out-of-scope가 명시 섹션으로 분리되지 않았고, 리스크/의존성/가정도 흩어져 있어 누락 검토가 어려움.
- 개선 제안: “성공기준/비범위/리스크·의존성·가정” 섹션을 별도로 추가하고, Phase별 acceptance criteria를 수치화할 것. 예: `/stats` 접근 권한 테스트 통과, RPC p95 < 1s, 재정 페이지 비권한자 0건 노출, 기존 `/church?tab=overview` 리다이렉트 동작 확인, `mod_note`/giving 정책/상태 이력 테이블은 명시적 선행 의존성으로 분리.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- **근거**: 문서가 정보는 충분하지만 **구조화가 부족해 검증과 실행이 어렵다**는 지적이 정확함.
  - Phase 1~4는 명시되어 있으나, 각 Phase의 **acceptance criteria**가 수치/동작으로 정의되지 않음 ("출석/교적 구현 완료" vs "출석 페이지 4주 이동평균 라인 렌더링 + dept_leader 스코프 RLS 테스트 통과")
  - 성능 기준은 "p95 1s" 하나만 있고, 권한 검증(비권한자 노출 0건), 기존 리다이렉트, 데이터 정확도 기준은 흩어짐
  - 선행 의존성("mod_note 신설", "상태 이력 테이블", "giving 정책 미결")이 3.3/3.4/3.4 구간에 산재 → 팀이 놓칠 위험
  - out-of-scope도 "Phase 4", "후순위", "미결", "후속"으로 흩어져 있음

- **수정계획**:
  1. **"7. 성공기준 & Phase별 완료조건"** 신규 섹션
     - Phase 1~4 각각에 대해 (KPI: ~, UI: ~, 권한: ~, 성능: ~, 테스트: ~) 체크리스트
     - 예: Phase 1 완료 = "(1) 5개 KPI 카드 렌더링 (2) dept_leader 스코프 테스트 통과 (3) `/church?tab=overview` → `/stats` 307 리다이렉트 (4) p95 < 1s"
  
  2. **"8. 선행 의존성 & 미결 사항"** 신규 섹션
     - `mod_note` 신설 + RLS 구현 (Phase 4 블로커)
     - `members.status` 변경 이력 테이블 신설 (Phase 1 블로커)
     - `giving` 권한 정책 확정 — pastor 익명 집계 노출 여부 (goal.md와 연계)
     - `mod_verse` → Family_Verse 소유권 이전 일정
  
  3. **"9. 명시적 Out-of-Scope"** 신규 섹션
     - Phase 4 이후: 복습 정확도, 66권 히트맵, 예산 대비 실적
     - 현 단계 미포함: 지출 모델, 다국어 지원, 모바일 앱 네이티브 재구현

이렇게 구조화하면 팀/리뷰어가 (1) 각 Phase에서 해야 할 일이 명확 (2) "어? 이거 먼저 필요하네" 발견 용이 (3) 팀회의 시 "out-of-scope"를 명시해 scope creep 방지.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용함. 저자의 수정계획은 원 critique를 정확히 인정하고 적절한 방향을 제시하지만, 제공된 문서 본문 기준으로는 아직 `성공기준/Phase별 완료조건`, `선행 의존성 & 미결 사항`, `명시적 Out-of-Scope` 섹션이 실제 반영되지 않았음. 따라서 핵심 결함인 측정 가능한 acceptance criteria, 권한/성능/정확도 검증 기준, 의존성·비범위 구조화 부족은 여전히 남아 있음.

<!-- /doc-crossverify:managed -->
