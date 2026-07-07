# Analysis — 부서 홈 카드 (현황 조사)

> 2026-07-08 · migrations 00001–00030 + web/src 실사

## 1. 공지 모듈 현황 (`mod_notice`, 00013_modules_p2.sql)

- 테이블: `notices(id, church_id, title, body, target_department_id → departments, published_at, created_by)`. `target_department_id`는 **컬럼만 존재, 어디서도 set·filter 안 됨 (잠자는 스키마)**.
- RLS: `n_sel`(교회 전체, 부서 무시) / `n_ins`(`has_module('notice','manager')`) / `n_del`(admin). **update 정책 없음**.
- 작성 UI(`NoticeBoard.tsx`): 제목·본문만, 직접 테이블 insert(RPC 아님), 부서 선택 없음. 조회는 교회 전체 최근 30건.
- `page.tsx` → `ModulePage moduleKey="notice"` → `{canManage}` 전달 (canManage = `has_module('notice','manager')`). ModulePage는 `{role, canManage, isAdmin}` 제공 → role 전달 가능.

## 2. home_feed 공지 (최신 = 00030)

`notices` 키: 교회 전체 최근 3건, 부서 필터 없음. **home_feed는 SECURITY INVOKER** → 공지 RLS를 바꾸면 이 쿼리도 자동으로 부서 인지됨. 단 "우리 교회의 오늘" 카드와 "내 부서" 카드 중복을 막으려면 home_feed 공지에 `target_department_id is null`(전교회 한정) 추가 필요 → 00030 home_feed 전체 복제 후 1줄 추가.

## 3. 부서 소속 해석

- `department_members(member_id, department_id)` — 소속(복수).
- `department_leaders(member_id, department_id, status)` — 담당(approved).
- `my_led_departments()` (00002) = 담당 부서만. 소속(member) 부서 헬퍼는 **없음** → `my_dept_ids()` 신설(소속 ∪ 담당).
- `absentee_list`(홈 "사역 현황" 위젯)은 이미 dept_leader에게 `my_led_departments()` 스코프 → 부서 미출석은 재구현 불필요.

## 4. 재사용 (Capability-First)

| 자산 | 재사용 |
|---|---|
| `mod_calendar` 부서 타겟 행사 (2단계) | dept_home 이벤트 소스 |
| `verse_current` | **부서 필터 없음** (아래 §6 정정) — 카드에서 제외, 5단계로 이관 |
| home_feed jsonb 1왕복 패턴 | `dept_home()` 동일 패턴 |
| `has_module`/`my_role`/`module_enabled` | 권한 판정 |
| ModulePage `{role, canManage}` | NoticeBoard에 role 추가 전달 |

## 5. 최신 상태

- 다음 마이그레이션: **00031** (00030 적용됨).
- 공지 RLS 변경은 기존 데이터 무손상(정책 재정의만).

## 6. 증거 (검증 R1 반영)

- **데이터 현황** (운영 DB): `select count(*) total, count(target_department_id) dept_targeted from mod_notice.notices;` → **total=1, dept_targeted=0**. 즉 기존 공지는 전부 전교회 공지 → RLS 변경/롤백 어느 쪽도 가시성 불변.
- **`verse_current` 정정** (`00007_verse.sql:90-91`): `where a.church_id = my_church_id() order by a.week_start desc limit 8` — 암송 목록은 **부서로 필터/우선정렬하지 않음**. 86-88행의 부서 조건은 `target_count`(완료율 분모) 계산용일 뿐, 교인이 보는 암송 목록은 부서 무관 전체. 따라서 "기존 위젯이 부서 암송을 커버"는 오판 → 부서별 암송 스코핑은 미구현이며, 이는 5단계(암송 위젯 고도화)에서 다룸. 3단계 카드에서 제외하는 결정은 유지(정확한 사유로 교체).
- **`target_department_id` 사용처** (grep): 스키마 정의(00001), verse(00003/00007/00009), notice(00013), calendar(00027), stats(00028), 신규 dept_home(00031); UI는 CalendarAdmin·NoticeBoard. `dept_home`/`department_home` 기존 참조 **없음**(신규 안전).

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: analysis
- **검증시각**: 2026-07-07T15:39:10.022Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: `mod_notice.notices`, RLS, `NoticeBoard.tsx`, `ModulePage.tsx`, `home_feed()` 관련 현황은 실제 파일과 대체로 일치함. 캘린더/미출석/권한 헬퍼 등 재사용 후보도 실제 심볼 기반으로 식별됨.
- 결함/누락: 중복 자산/심볼/테이블 검토가 “검색 결과” 형태로 명시되지 않음. `verse_current`가 “부서 배정 우선”이라는 결론은 `00007_verse.sql` 기준으로 부서 필터/우선순위가 없어 부정확함. `notices.target_department_id` 기존 값이 전부 null이라는 데이터 상태 주장도 DB 조회 증거가 없음.
- 개선 제안: `rg target_department_id|dept_home|department_home|notice` 결과 요약을 추가하고, `verse_current` 재사용 판단을 재검토할 것. 운영 DB에서 `select count(*) from mod_notice.notices where target_department_id is not null;` 결과를 증거로 붙일 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- 근거:
  1. **`verse_current` 부서 배정 우선 판단 오류** — `00007_verse.sql`을 재확인하니 부서 필터/우선순위 로직이 없음. 내가 "부서 배정 우선"이라고 결론 내린 것은 사실 오류. `verse_current`는 단순히 현재 암송 위젯이고, 부서 스코핑 기능이 없음.
  2. **DB 데이터 증거 부족** — `notices.target_department_id` 기존 값이 "전부 null"이라고 주장만 했는데, 실제 `SELECT COUNT(*) FROM mod_notice.notices WHERE target_department_id IS NOT NULL;` 같은 조회 결과를 제시하지 않음. 가정만으로 기술된 부분.
  3. **grep/rg 검색 결과 미제시** — 중복 자산/심볼 재사용 판단 시 "실제 심볼 기반"이라고만 했는데, 구체적인 grep 결과(예: `target_department_id` 사용 지점, `dept_home` 기존 참조)를 명시하지 않아 검증 불가능.

- (AGREE인 경우) 수정계획:
  1. `rg "target_department_id|dept_home|department_home" src/ --type sql --type tsx` 실행 → 결과를 "## 검색 증거" 섹션으로 추가
  2. `00007_verse.sql` 다시 읽고 `verse_current` 함수 정의 인용 추가 → "부서 배정 우선" 설명 제거/수정
  3. 운영 DB에서 `SELECT COUNT(*) FROM mod_notice.notices WHERE target_department_id IS NOT NULL;` 실행 → 결과를 "## 데이터 현황" 섹션에 기록
  4. 이 3가지 객관적 증거를 문서에 재통합

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 전부 수용한다. 작성자가 지적 오류와 증거 부족을 인정했지만, 현재 문서에는 여전히 `verse_current`의 “부서 배정 우선” 오판, `target_department_id` 전부 null이라는 무증거 데이터 주장, `rg` 검색 증거 부재가 남아 있다. 수정계획이 아니라 실제 수정과 증거 반영이 필요하다.

<!-- /doc-crossverify:managed -->
