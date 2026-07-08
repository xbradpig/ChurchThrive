# Analysis — 암송 위젯 고도화 (현황 조사)

> 2026-07-08 · migrations 00007 + web/src 실사

## 1. verse_current 현황 (00007_verse.sql:76-91)

- 반환: `id, week_start, reference, body, guide, checked, check_count, target_count`. SECURITY INVOKER.
- `where a.church_id = my_church_id() order by a.week_start desc limit 8` — **부서 필터 없음**. 교인이 전 부서 암송을 모두 봄.
- `target_count`(86-88)는 target_department 스코프로 완료율 분모 계산 → 이미 부서 인지. 목록 필터만 없음.
- 소비: VerseBoard(교인, rows[0]=현재), VerseAdmin(관리, 목록), 홈 위젯(verse_current[0]).

## 2. 부서 암송 생성 경로

- `verse_create_assignment(p_week_start, p_reference, p_body, p_guide, p_department)` — `p_department` 파라미터 **존재**. RLS `va_write` = `has_module('verse','admin')`.
- **VerseAdmin 생성 폼에 부서 선택 UI 없음** → `p_department` 항상 null → 부서 암송이 생성될 수 없음 → 부서 필터를 만들어도 대상 데이터 0. **UI 추가가 기능 활성화의 핵심.**

## 3. checks / streak 소재

- `mod_verse.checks(assignment_id, member_id, method, checked_at)`. streak는 member의 주별 체크 연속성으로 계산 가능.
- 주당 배정 1건이 일반적(church-wide). 부서+전교회 동시 주는 `distinct on (week_start)` 부서 우선으로 집계.

## 4. 재사용 (Capability-First)

| 자산 | 재사용 |
|---|---|
| `my_dept_ids()`(3단계 신설) | verse_current 부서 필터·verse_home streak |
| `is_staff()`(00002) | 직원 전체 조회 바이패스 |
| `verse_create_assignment` `p_department` | 부서 배정 — UI만 연결 |
| `departments` select 정책(교인 열람 가능) | VerseAdmin 부서 셀렉트 직접 조회 |
| home_feed jsonb 패턴 | verse_home jsonb |
| 홈 verse 위젯 마크업 | streak/배지/가이드 확장 |

## 5. 반환 컬럼 변경 제약

- `verse_current`에 컬럼(target_department_id, dept_name) 추가 → Postgres는 OUT 시그니처 변경 시 `create or replace` 거부. **`drop function` 후 재생성** 필요. 호출부(VerseBoard/VerseAdmin/홈)는 필요한 컬럼만 select하므로 무손상.

## 6. 최신 상태

- 다음 마이그레이션: **00033** (00032까지 적용).
- verse_home은 INVOKER + `mod_verse` RLS(va_select = module_enabled + church) → 교인은 자기 교회 암송만. streak/현재 선택은 `my_dept_ids()`로 적용 범위 판정.

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: analysis
- **검증시각**: 2026-07-08T02:44:26.980Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: `verse_current`의 부서 필터 부재와 `VerseAdmin`에서 `p_department`를 전달하지 않는 문제는 실제 심볼/경로와 대체로 일치함.
- 결함/누락: 중복 자산/심볼/테이블 검토가 명시적으로 부족함. `is_staff()`는 00002가 아니라 이후 00006에서 재정의됨. “주당 배정 1건이 일반적”, “호출부 무손상”은 DB 데이터/타입검사/호출부 줄번호 근거가 없음. 현재 작업트리 기준 `00033_verse_dept_scope.sql`이 존재해 “다음 마이그레이션 00033” 문장은 최신 상태와 불일치 가능성이 큼.
- 개선 제안: `rg` 결과 기반으로 `verse_home`, `streak`, `target_department_id`, 기존 stats/note streak 자산 중복 검토를 추가하고, 각 결론에 `supabase/migrations/00007_verse.sql`, `00006_tenancy.sql`, `00031_dept_home.sql`, `VerseAdmin.tsx`, `VerseBoard.tsx`, `home/page.tsx`의 구체 줄번호를 붙일 것. “주당 1건”은 실제 DB 카운트 쿼리나 “스키마상 보장 없음”으로 정정할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- 근거: 
  - **`is_staff()` 위치 오류**: 줄번호 검증 없이 "00002"라고 단정했는데, 실제로는 00006에서 재정의되었을 수 있음. 구체 파일·줄번호 없이 쓴 추측성 주장.
  - **근거 없는 일반화**: "주당 배정 1건이 일반적", "`distinct on(week_start)` 부서 우선 집계" 같은 주장이 DB 스키마·데이터 카운트·실제 쿼리로 뒷받침되지 않음.
  - **호출부 검증 누락**: "호출부 무손상"이라는 결론이 VerseAdmin.tsx, VerseBoard.tsx, home/page.tsx의 구체 줄번호(select 컬럼, 파라미터)로 입증되지 않음.
  - **현재 상태 불일치**: 작업트리에 이미 `00033_verse_dept_scope.sql`이 존재하는데, "다음 마이그레이션 00033"이라고 미래형으로 표기해서 최신성 의심 발생.
  - **중복 자산 검토 부재**: Section 4의 재사용 테이블이 기존 `stats`, `note streak` 자산과의 중복을 명시적으로 제거하지 않음.

- 수정계획:
  1. `rg` 검색으로 `verse_home`, `streak`, `target_department_id`, `stats.*streak` 중복 확인 및 명시
  2. `is_staff()`, `my_dept_ids()` 정의 파일·줄번호를 `00006_tenancy.sql`, `00031_dept_home.sql` 등에서 추출해 기재
  3. VerseAdmin.tsx, VerseBoard.tsx, home/page.tsx에서 `verse_current` 호출부의 select 컬럼과 where 조건을 줄번호 포함해 명시
  4. "주당 배정 1건"은 실제 migration/table 스키마 or query로 검증하거나 "스키마상 제약 없음, 교회별 데이터 확인 필요"로 정정
  5. `00033_verse_dept_scope.sql`의 내용 확인 후, 현재 상태(이미 생성됨 vs. 예정)를 정확히 기재

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용한다. 작성자가 인정한 문제들이 현재 문서 본문에 아직 반영되지 않았다. `is_staff()`는 00002 최초 정의 후 00006에서 재정의되므로 최신 기준 줄번호 보강이 필요하고, `00033_verse_dept_scope.sql`은 이미 존재해 “다음 마이그레이션 00033”은 현재 상태와 불일치한다. `VerseAdmin`은 `p_department`를 넘기지만 부서 선택 UI가 없어 null만 전달되는 상태이므로 더 정확히 써야 한다. 또한 “주당 1건이 일반적”, “호출부 무손상”, streak/기존 stats·note 자산 중복 없음 주장은 여전히 줄번호·검색 결과·DB 근거가 부족하다.

<!-- /doc-crossverify:managed -->
