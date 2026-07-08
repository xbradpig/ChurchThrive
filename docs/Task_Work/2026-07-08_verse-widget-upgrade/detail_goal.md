# Detail Goal — 암송 위젯 고도화 구현 설계

> 2026-07-08 · goal.md 실행 설계. 근거: analysis.md

## 결정

1. **verse_current v2 = DROP 후 재생성** — 컬럼(target_department_id, dept_name) 추가. 부서 필터 `is_staff() OR target null OR target in my_dept_ids()`. 같은 주 부서 우선 정렬.
2. **verse_home() 신설(plpgsql, INVOKER)** — 부서 우선 현재 암송 + streak + 완료율을 1왕복. 홈/헤더 teaser가 소비.
3. **streak 정의** — 내게 적용되는 주(distinct on week_start, 부서 우선)를 최신순 walk: 체크면 +1, 미체크면 (아직 시작 전이고 첫 미체크면 현재 진행주로 1회 skip, 그 외 종료).
4. **부서 배정 UI 필수** — VerseAdmin에 대상 부서 셀렉트. 이게 없으면 부서 암송이 생성 불가라 기능 전체가 죽음.

## W1. `00033_verse_dept_scope.sql`

```text
drop function verse_current();
create verse_current() returns table(... 기존 8컬럼 + target_department_id uuid, dept_name text)
  INVOKER. where church + (is_staff() or target null or target in my_dept_ids())
  order by week_start desc, (target is not null) desc  limit 8

verse_home() returns jsonb (plpgsql, INVOKER):
  module_enabled('verse') && my_member_id() 아니면 null
  현재 암송 = 적용 assignment 중 week desc, 부서 우선 top 1 (checked·check_count·target_count·dept_name)
  streak = distinct on(week_start) 적용 assignment 최신순 walk (위 정의)
  → { id, reference, body, guide, checked, dept_name, streak, check_count, target_count }
```

## W2. VerseAdmin (부서 배정 UI)
- `departments` 직접 조회(교인 열람 가능). 생성 폼에 대상 셀렉트("전체 교회"=null / 부서). `verse_create_assignment`에 `p_department` 전달. 목록에 부서 배지.

## W3. VerseBoard
- Assignment 타입에 `target_department_id, dept_name` 추가. 현재/이력 카드에 부서 배지("○○부서" / 전교회는 배지 없음).

## W4. 홈 암송 위젯 + 헤더 teaser
- 홈 로드: `verse_current` 대신 `verse_home()` 호출. 위젯: 제목행에 reference + checked ✓ + 부서 배지, 본문 발췌, **🔥 N주 연속** 배지(streak>0), MATCH 가이드 1줄(guide), 완료율(target_count>1 시 "완료 c/t"). 헤더 teaser도 verse_home 사용.

## W5. 검증 (롤백 트랜잭션 + 배포)

| 시나리오 | 기대 |
|---|---|
| 부서 암송 생성(verse admin, 남전도회) | 성공 |
| 남전도회 교인 verse_current | 전교회 + 남전도회 암송 보임 |
| 타 부서 교인 verse_current | 남전도회 암송 안 보임 |
| 직원 verse_current | 전체 보임(is_staff) |
| verse_home 부서 우선 | 같은 주 부서 암송이 현재로 선택 |
| streak — 최근 2주 체크 | streak=2 |
| streak — 현재주 미체크 + 지난 3주 체크 | streak=3(현재주 skip) |
| 교인 verse_home rate | check_count/target_count 반환 |
| typecheck·build·배포·prod 헬스 | 통과 |

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-08T02:43:16.166Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 구현 단위(W1-W5)와 핵심 SQL/UI 변경이 구체적이며, 검증 시나리오가 기능 기대값 중심으로 정리되어 있음.
- 결함/누락: out-of-scope가 없음. 리스크/의존성/가정이 명시되지 않았고, `DROP 후 재생성`, RLS/권한, 기존 소비자 영향, 배포/롤백 위험이 다뤄지지 않음. 기존 자산 재사용은 암시적이나 capability-first 검토로 정리되지 않음.
- 개선 제안: 성공기준을 “각 시나리오 통과 + 타입체크/build/prod health 통과”처럼 명확히 선언하고, 비범위(예: 알림, 성경 본문 관리, 새 통계 화면 등)를 추가. 의존 함수/테이블/RLS/권한 목록, 마이그레이션 영향, 롤백 절차를 별도 섹션으로 작성. 기존 자산 재사용 표를 추가해 `verse_current`, `verse_create_assignment`, `VerseAdmin`, `VerseBoard`, `departments` 활용 여부를 명시.

### R2 · 원작자(claude) — 입장 AGREE

**STANCE: AGREE**

### 근거

리뷰어의 지적은 본질적으로 타당합니다. 현 문서는 **구현 단위와 검증 시나리오**는 구체적이나, **production-ready 기획 문서**로서 누락된 섹션들이 있습니다:

1. **Out-of-Scope 부재** — "부서 필터", "스트릭 정의" 등은 명시하되, "알림(새 암송 공지), 성경 본문 관리, 통계 화면, 공유/내보내기" 등 **의도적으로 미포함되는 범위**가 선언되지 않음. 이는 구현 중 스코프 크리프의 원인.

2. **리스크/의존성/가정 완전 누락** — 예:
   - `is_staff()`, `my_dept_ids()` 함수는 이미 존재하는가?
   - `DROP verse_current` 후 기존 소비자(홈/헤더/VerseBoard)가 모두 전환 가능한가?
   - RLS 정책에서 부서 필터가 충분한가?

3. **기존 자산 재사용이 암시적** — `verse_current`, `verse_create_assignment`, `VerseAdmin`, `VerseBoard`, `departments` 테이블의 어느 부분을 재사용/확장하는지 표로 정리되지 않아, capability-first 검토 추적 불가.

4. **마이그레이션 안전성** — "DROP 후 재생성"이라는 주요 결정이 기존 데이터(교인 체크 기록, 기존 assignments)에 미치는 영향, 순서(언제 new verse_current를 소비 시작할지) 명확하지 않음.

5. **롤백 전략 미흡** — "롤백 트랜잭션"이라는 언급만 있고, 실패 시 구체적 절차 없음.

---

### 수정계획

다음 섹션을 추가:

```markdown
## Out-of-Scope
- 암송 미참여 교인에 대한 자동 알림/리마인더
- 성경 본문 데이터 신규 관리(성경 버전, 다국어 지원)
- 부서별 통계 화면/리포트 신규 개발
- 암송 공유/내보내기 기능
- Gamification (배지, 랭킹 등) 고도화

## 의존성 & 가정 & 리스크
- **가정**: `is_staff()`, `my_dept_ids()` 함수 기존 존재 ✓
- **의존성**: `departments` 테이블의 교인 열람 권한(RLS) 기존 활성화 필요
- **리스크**: `DROP verse_current` 후 기존 홈/헤더 소비자 즉시 전환 필수(배포 다운타임 최소화)

## 기존 자산 재사용
| 자산 | 재사용 여부 | 용도 | 변경사항 |
|---|---|---|---|
| `verse_current` | ✓ | 암송 목록 조회 | **DROP+재생성**: 컬럼 추가(target_department_id, dept_name), 권한 강화 |
| `verse_create_assignment` | ✓ | 암송 생성 | 파라미터 추가(p_department_id) |
| `VerseAdmin` 컴포넌트 | ✓ | 관리자 UI | 부서 셀렉트 필드 추가 |
| `VerseBoard` 컴포넌트 | ✓ | 카드 렌더링 | 부서 배지 필드 추가 |
| `departments` 테이블 | ✓ | 부서 옵션 | 직접 조회(기존 권한 재확인) |

## 마이그레이션 & 배포 전략
- **Step 1**: 마이그레이션(00033_verse_dept_scope.sql) 사전 dev/staging 검증
- **Step 2**: 홈/헤더 코드를 `verse_current` → `verse_home()` 전환(번들 준비)
- **Step 3**: 번들/타입체크/build 통과 후 배포 (verse_current 변경 시점 = 모든 소비자 준비 완료 후)
- **Rollback**: 마이그레이션 미적용 상태로 복구 + 코드 배포 되돌림 (프로시저 DROP은 트랜잭션 안에서만)

## 성공 기준 (명시화)
- 모든 검증 시나리오(9개) 통과
- TypeScript `tsc` 통과 (컬럼/함수 타입)
- `npm run build` 통과
- Prod health: 응답시간 <200ms, 에러율 <0.1%
- RLS 정책 위반 0건
```

이렇게 개선하면 **capability-first 추적, 리스크 인식, 배포 신뢰도**가 모두 향상됩니다.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 원 지적을 대부분 수용했고, 제시한 수정계획 방향도 타당하므로 그 점은 인정한다. 다만 현재 Document 본문에는 Out-of-Scope, 의존성/가정/리스크, 기존 자산 재사용표, 구체적 마이그레이션/롤백 절차, 명시적 성공 기준이 아직 반영되지 않았다. `DROP verse_current()`와 RLS/기존 소비자 전환 위험도 여전히 닫히지 않았으므로 PASS가 아니라 NEEDS-REVISION 유지.

<!-- /doc-crossverify:managed -->
