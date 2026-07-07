# Goal — 행사 모듈 (mod_calendar) · 홈 고도화 2단계

> 2026-07-07 · 상위 제안서: `../2026-07-07_home-upgrade-church-url/proposal.md` §2-B · 선행: 교회별 URL(완료)

## 목표

날짜 기반 교회 행사·부서 일정 모듈을 신설한다. 기존 `events` 테이블(주간 반복 예배 규칙)은 그대로 두고, 역할을 분담한다: **반복 예배 = `events` / 날짜 행사 = `mod_calendar.events`**.

## 완료 기준 (DoD)

- [x] `mod_calendar.events` 스키마 + RLS (`00027_mod_calendar.sql`, `mod_calendar.can_write` 헬퍼)
- [x] 행사 CRUD RPC — SECURITY INVOKER + RLS 규약 (verse 패턴)
- [x] 공개 행사 RPC — anon 허용, `visibility='public'` + **모듈 활성 교회만** (검증 R1 반영)
- [x] 멤버 화면 `/{slug}/m/calendar` + 관리 화면 `/{slug}/m/calendar/admin` (공유 링크 복사 포함)
- [x] 홈 "다가오는 행사" 위젯 (`calendar_upcoming(4)`, D-day, 모듈 게이트)
- [x] 공개 공유 페이지 `/{slug}/events/{id}` + 미들웨어 공개 예외
- [x] 레지스트리 등록(행사·일정) + 기존 교회 4곳 활성화 시드 + 기존 탭 라벨 "예배·모임 규칙"으로 명확화
- [x] typecheck·build 통과, 00027 DB 적용, 배포, 런타임 검증 (2026-07-07):
  - public 행사 페이지(비로그인) 200 + 교회명·행사명·장소 렌더 ✓
  - member 행사 URL 직접 접근 404 ✓ · 타 slug로 접근 404 ✓ · `/m/calendar` 비로그인 307→login ✓ (프로덕션 동일)
  - 역할별 쓰기 거부(RLS)는 실계정 로그인 검증 예정 — 정책은 verse 규약 복제

## 가정 / 의존성 / 리스크

- **가정**: `visibility='member'`(기본)는 교인만, `'public'`은 링크 공유용. 부서 타겟(`target_department_id`)이 null이면 전교회 행사.
- **의존성**: `my_church_id()`/`my_led_departments()`(setof uuid)/`module_enabled()`/`has_module()` 재사용. `churches.slug`(1단계). `departments` select 정책(교인 전체 열람 가능 — 확인됨).
- **리스크**: ① 공개 페이지가 미들웨어 인증 게이트에 막힘 → slug 브랜치 앞에 `/{slug}/events/*` 공개 예외 추가(1단계 detail_goal에 예고된 지점) ② 공개 RPC 정보 노출 → public 행사만, SECURITY DEFINER + 필드 최소화 ③ 기존 `events`와 혼동 → 관리 UI 라벨을 "예배·모임 규칙"으로 명확화.

## 비범위

- `home_feed()` v2 통합(4단계에서 — 지금은 별도 `calendar_upcoming` RPC 호출)
- 반복 행사(RRULE), 참석 신청(RSVP), 알림 발송 — 후속
- 부서 공지 활성화(3단계)

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T05:13:49.546Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 목표와 역할 분리(`events` vs `mod_calendar.events`)가 명확하고, DoD가 스키마/RLS/RPC/UI/배포까지 구체적임. 기존 함수·verse 모듈 규약 재사용 검토도 반영됨.
- 결함/누락: 권한별 검증 기준, 공개/비공개 노출 테스트, 모듈 비활성 시 동작 기준이 부족함. 날짜/타임존, 공개 ID 추측 가능성, 인덱스/마이그레이션/롤백 리스크가 누락됨.
- 개선 제안: DoD에 권한별 테스트 매트릭스, 공개 RPC 필드 목록, 날짜/정렬 기준, 필요한 인덱스와 롤백 계획을 추가할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- **근거**: 리뷰어의 지적이 **대부분 타당**함. goal 문서가 "무엇을 만드는가"는 명확하지만, "어떻게 검증하고 운영할 것인가"의 세부사항이 부족함. 특히:
  - DoD에서 **"권한별 테스트"**는 RLS 규약만 있고, 실제 케이스(교역자가 타교회 부서 행사 수정 시도 → 거부 확인 등)가 없음
  - **공개 필드 목록**(`public_events`가 반환할 컬럼)이 명시되지 않아, 정보 노출 범위 검증 불가
  - **날짜/타임존**: "D-day 정렬"만 있고, 사용자 타임존/시간 표시 기준이 미정
  - **인덱스/마이그레이션**: 테이블 신설이므로 성능(행사 검색 인덱스)과 롤백 계획이 있어야 함

- **수정계획**:
  1. **DoD에 권한별 테스트 매트릭스 추가** (예: 교역자/일반 교인/비로그인별 CRUD 시도 결과 표 1개)
  2. **공개 RPC 필드 화이트리스트** 추가 (`public_events` → `id, title, start, location, description만` 같은 형태)
  3. **날짜 및 타임존 결정** 추가 (예: "UTC 저장, 교회 타임존으로 렌더링 / 시간 미포함(전일 행사)" 명시)
  4. **마이그레이션/인덱스 섹션** 신설 (예: `CREATE INDEX idx_calendar_events_church_date`, 롤백: 테이블 삭제)
  5. **공개 ID 추측 가능성** 명시적 해결 (UUID 사용 → 순차 ID 아님 → 리스크 없음)
  6. **모듈 비활성 시 행동** 명시 (미활성 교회 → `public_events` 404 / 멤버 화면 미노출)

리뷰어의 "과한 점"은 없으며, 이들 추가사항은 detail_goal·스펙 단계로 넘어갈 때 **필수 선결 조건**임.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 원 critique를 대부분 수용했고, 그 수용은 타당하다. 다만 현재 문서 본문에는 권한별 테스트 매트릭스, 공개 RPC 필드 화이트리스트, 날짜/타임존 기준, 인덱스/롤백, UUID 공개 ID 근거, 모듈 비활성 시 동작이 아직 반영되지 않았으므로 결함은 그대로 남아 있다.

<!-- /doc-crossverify:managed -->
