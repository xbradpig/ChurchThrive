# Goal — "내 부서" 홈 카드 + 부서 공지 활성화 (홈 고도화 3단계)

> 2026-07-08 · 상위 제안서 §2-C · 선행: 교회별 URL(1), 행사 모듈(2) 완료

## 목표

홈에 "내가 속한 부서의 일정·내용"을 모으는 카드를 신설하고, 잠자던 부서 공지 타겟팅을 깨운다.

| 요구(제안서 §2-C) | 설계 |
|---|---|
| 내 부서 해석 (복수) | `my_dept_ids()` — `department_members` ∪ `department_leaders(approved)` |
| ① 부서 일정 | 부서 타겟 행사 (2단계 `mod_calendar`, target_department_id) |
| ② 부서 공지 | **잠자는 `mod_notice.notices.target_department_id` 활성화** — RLS 부서 필터 + 작성 UI 부서 선택 |
| ③ 부서 배정 암송 | **제외** — `verse_current`는 현재 부서 필터가 없어(analysis §6) 부서별 암송 스코핑 자체가 미구현. 부서 암송은 5단계(암송 위젯 고도화)에서 함께 처리 |
| 부서 담당자 추가 | 부서 공지 작성 바로가기 (부서 미출석은 기존 "사역 현황" 위젯이 이미 부서 스코프로 표시) |

## 완료 기준 (DoD)

- [x] `00031` 적용: `my_dept_ids()`·공지 RLS 재정의·`dept_home()`·`notice_targets()`·home_feed 전교회 한정
- [x] 공지 조회 격리 (RLS) — 검증 완료
- [x] 공지 작성 권한 분리 (매니저/교역자 = 전교회+전부서 / 담당자 = 자기 부서만)
- [x] 홈 "내 부서" 카드(DeptCard) — 부서명·일정·공지, 담당자 작성 바로가기
- [x] NoticeBoard 대상 부서 선택 + 부서 배지
- [x] typecheck·build·배포 + 런타임 검증 (2026-07-08, 롤백 트랜잭션, 8/8 통과):
  ① 담당자 부서공지 발행 ✓ ② 담당자 전교회 거부 ✓ ③ 담당자 타부서 거부 ✓ ④ 담당자 자기부서 조회 ✓
  ⑤ dept_home departments/notices 반환 ✓ ⑥ 비소속 교인 부서공지 0건(격리) ✓
  ⑦ home_feed 전교회만 ✓ ⑧ 교역자 전체 조회 + can_church_wide ✓

## 가정 / 리스크

- **가정**: 부서 없는 교인은 카드 미표시. 전교회 공지는 모두에게.
- **리스크**: ① 공지 RLS 변경이 기존 NoticeBoard(전체 표시)에 영향 → 의도된 격리(교인은 자기 부서만), 교역자·관리자는 전체 유지로 관리 연속성 보장 ② dept 공지가 홈 "우리 교회의 오늘" 공지와 "내 부서" 카드에 중복 노출 → home_feed 공지를 전교회 한정으로 분리 ③ 부서 담당자 공지 작성 권한 확대 → RLS insert가 `my_led_departments()` 타겟만 허용(전교회 불가)

## 권한 매트릭스 (검증 R1 반영 — RLS가 SSOT)

| 역할 | 공지 조회 | 공지 작성 대상 | 내 부서 카드 |
|---|---|---|---|
| 교인(부서 미소속) | 전교회만 | 불가 | 미표시 |
| 교인(부서 소속) | 전교회 + 자기 부서 | 불가 | 표시 |
| 부서 담당자(approved) | 전교회 + 자기 부서(복수) | 자기 부서만 | 표시 + 작성 바로가기 |
| 교역자/관리자/notice manager | 전체 | 전교회 + 전 부서 | 표시 |

## 의존성 (조사 완료 — analysis.md)

- 스키마: `department_members(member_id,department_id)`, `department_leaders(…,status)`, `mod_notice.notices.target_department_id`(컬럼 존재·미사용), `mod_calendar.events.target_department_id`(2단계 사용 중).
- 함수: `my_led_departments()`(00002 기존), `my_role`/`has_module`/`module_enabled`(기존). 신설: `my_dept_ids()`, `dept_home()`, `notice_targets()`.
- 선행 완료: 교회별 URL(1), 행사 모듈(2).

## 롤백

`00031`은 정책 재정의 + 함수 추가만(테이블 변경 없음). 롤백: `n_sel`/`n_ins`를 00013 원본으로, `home_feed`를 00030으로 재정의, 신설 함수 3종 drop. 데이터 무손상(기존 notices.target_department_id 전부 null → 롤백해도 전교회 공지).

## 비범위

- 부서 채팅/방(dept-comm-rooms 별도 과업)
- 부서 암송 완료율 상세(5단계 암송 위젯 고도화)
- 공지 읽음 확인(read receipt) — 후속

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T15:37:39.384Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: DoD가 DB/RLS/UI/검증 단위로 비교적 구체적임. 기존 `mod_calendar`, `mod_notice`, `verse_current`, `home_feed`, `NoticeBoard` 재사용 검토가 반영됨.
- 결함/누락: “런타임 검증”이 모호하고 역할별/부서별 기대 결과가 테스트 매트릭스로 정의되지 않음. 의존성으로 기존 스키마, 역할 모델, `my_led_departments()`/RLS 정책, 2단계 행사 모듈 완료 상태가 명시되지 않음.
- 개선 제안: 교인/부서담당자/관리자별 조회·작성 가능 범위를 표로 추가하고, 검증 명령·마이그레이션 적용/롤백 기준·샘플 데이터 조건을 DoD에 명시.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- **근거**: 
  - "런타임 검증"은 실제로 모호함. `typecheck·build·DB 적용·배포·런타임 검증`은 일반적 절차명일 뿐, 구체적인 검증 명령과 통과 기준이 없음.
  - 역할별 권한이 가정 섹션에는 서술되지만, 테스트 매트릭스(교인/부서담당자/관리자/교역자별 조회·작성 범위 표)가 없어서 개발 중 구현 범위 인식 차이 발생 가능.
  - 의존성이 "선행: 교회별 URL(1), 행사 모듈(2) 완료"로만 되어있고, 실제 필수 스키마(department_members, mod_notice.target_department_id), 함수(`my_dept_ids()`, `my_led_departments()`, `dept_home()`)의 존재/상태가 명시되지 않음. 이는 마이그레이션 선택지와 리스크 판단에 영향.
  - DoD에 마이그레이션 롤백 기준, 샘플 데이터 셋업(부서 없는 교인, 다중 부서 소속 등)이 빠짐.

- **수정계획**:
  1. **의존성 섹션** 추가: 기존 스키마(`department_members.role`, `mod_notice.target_department_id`), 필수 함수(`my_dept_ids()`, `my_led_departments()`, `dept_home()`), RLS 정책(기존 상태) 명시.
  2. **권한 매트릭스 표** 추가:
     | 역할 | 공지 조회 범위 | 공지 작성 대상 | 부서 카드 표시 |
     |---|---|---|---|
     | 교인(부서 미소속) | 전교회만 | 불가 | 미표시 |
     | 교인(부서 소속) | 전교회 + 자기 부서 | 불가 | 표시 |
     | 부서담당자(approved) | 전교회 + 자기 부서(다중) | 자기 부서만 | 표시 + 작성 바로가기 |
     | 교역자/관리자 | 전체 | 전체 대상 선택 가능 | 표시 |
  3. **테스트 케이스** 추가: 부서 없는 교인 조회 시 카드 미표시, 부서담당자가 타 부서 공지 작성 시도 실패, NoticeBoard에서 부서별 필터링 등.
  4. **런타임 검증 구체화**: 
     ```
     - `SELECT COUNT(*) FROM notices WHERE target_department_id IS NOT NULL AND created_at >= '...'` (부서 공지 생성 확인)
     - RLS select 테스트: 교인 계정으로 타 부서 공지 조회 시도 → 제외 확인
     - UI: 부서담당자 로그인 → 공지 작성 UI에서 "자기 부서만" 선택 가능 확인
     ```
  5. **마이그레이션/롤백**: 마이그레이션 내용(예: `ALTER TABLE notices ADD COLUMN target_department_id ...`), 롤백 수행 시간/절차 명시.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용한다. 작성자가 문제를 정확히 인정했고 수정계획도 타당하지만, 현재 문서에는 그 수정이 아직 반영되지 않았다. 권한 매트릭스, 구체 테스트 케이스, 런타임 검증 명령/통과 기준, 기존 스키마·함수·RLS 의존성 상태, 마이그레이션 롤백 기준과 샘플 데이터 조건이 여전히 빠져 있다. DoD의 역할별 조회/작성 bullet은 일부 보완이지만 테스트 가능한 매트릭스 수준은 아니다.

<!-- /doc-crossverify:managed -->
