# Goal — 암송 위젯 고도화 (부서 스코핑 + streak + 완료율) · 홈 고도화 5단계

> 2026-07-08 · 상위 제안서 §2-A · 3단계에서 발견한 verse_current 부서 미필터 해소 · 선행 1~4단계 완료

## 목표

암송을 "부서 배정 우선 + 연속 암송 주(streak) + 완료율 + MATCH 가이드"로 고도화하고, **작동하지 않던 부서 암송 기능을 실제로 켠다**.

| 요구(제안서 §2-A) | 현황 | 설계 |
|---|---|---|
| 부서 타겟 우선 표시 | `verse_current` 부서 필터 없음 (3단계 발견) | v2: 교인=전교회+내 부서, 직원=전체. 같은 주는 부서 우선 정렬 |
| 부서 암송 **생성** | VerseAdmin에 부서 선택 UI 없음 → 기능 불능 | 관리 폼에 대상 부서 셀렉트 추가(`verse_create_assignment`의 `p_department` 활성화) |
| 연속 암송 주(streak) | 없음 | `verse_home()` — 내게 적용되는 주 연속 체크(진행 중 현재주 1회 미체크 허용) |
| 부서 완료율 | check_count/target_count는 반환되나 홈 미노출 | 홈 위젯에 완료율 표시(담당자·교역자 강조) |
| MATCH 가이드 1줄 | `guide` 필드 존재, 홈 미노출 | 홈 위젯에 1줄 노출 |

## 완료 기준 (DoD)

- [x] `00033` 적용: `verse_current()` v2(부서 필터+dept 컬럼, DROP+재생성), `verse_home()`(부서 우선+streak+완료율)
- [x] VerseAdmin 대상 부서 선택 → 부서 암송 생성 (verse_create_assignment p_department 연결)
- [x] VerseBoard 부서 배지 + 부서 우선 표시
- [x] 홈 암송 위젯 streak 배지🔥 + 부서 배지 + MATCH 가이드 + 완료율(직원)
- [x] typecheck·build·배포 + 런타임 검증 (2026-07-08, 롤백 트랜잭션 5/5):
  부서 암송 생성 · 비소속 교인 격리(남전도회 안 보임) · verse_current 직원 전체 · verse_home 부서우선 · streak=2

## 권한·격리

| 대상 | verse_current 조회 | 부서 암송 생성 |
|---|---|---|
| 교인(부서 소속) | 전교회 + 자기 부서 암송 | 불가 |
| 교인(부서 미소속) | 전교회 암송만 | 불가 |
| 직원(is_staff) | 전체 | — |
| verse admin/manager·교역자 | 전체 | 전교회 + 부서 지정 |

## 가정 / 리스크

- **가정**: streak = 내게 적용되는 최근 주부터 연속 체크 주. 진행 중 현재주는 미체크여도 streak 유지, 그 이전 gap에서 종료. 주당 중복 배정 시 부서 우선 1건으로 집계(distinct on week).
- **리스크**: ① `verse_current` 반환 컬럼 추가 → `create or replace` 불가, **DROP 후 재생성** 필요(호출부는 필요한 컬럼만 select → 무손상) ② 부서 필터가 VerseAdmin(직원)에도 적용되면 관리 불가 → `is_staff()` 바이패스로 직원은 전체 조회.

## 의존성 / 롤백 / 재사용 (검증 R1 반영)

- **부서 소속 소스**: `department_members`(3단계에서 이미 사용) + `my_dept_ids()`. *리뷰어가 가정한 `user_department`·`auth.users.department_id`는 이 코드베이스에 없음 — 실제 소스는 위.* 고아 레코드 정리 선행 불필요(FK 제약).
- **권한**: `verse_current`/`verse_home` 모두 `grant execute … to authenticated`, INVOKER라 `mod_verse` RLS(va_select) 상속. 신규 role 없음.
- **롤백**: 00033은 함수만 변경. 롤백 = `verse_current`를 00007 원본으로 DROP+재생성, `verse_home` drop. 테이블·데이터 무손상.
- **재사용**: VerseBoard 카드 프레임·`guide`/`check_count`/`target_count`(기존), `my_dept_ids()`/`is_staff()`(기존), 홈 verse 위젯 마크업 — 전부 재사용. 신규는 verse_home RPC·streak 로직·부서 셀렉트 UI·배지.
- **검증 완료**(2026-07-08 롤백 트랜잭션): 부서 암송 생성·비소속 격리·부서 우선·streak=2 전부 통과(detail_goal W5).

## 비범위

- 암송 SM-2 반복 학습(MATCH_Family_Verse Phase 2 영역)
- 음성/타이핑 채점
- 부서 담당자의 암송 배정 권한(현행 verse admin 권한 유지)

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-08T02:42:20.281Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 목표 기능과 DoD가 표로 잘 연결되어 있고, 권한/격리와 비범위가 비교적 명확함.
- 결함/누락: 성공기준이 일부 추상적임(`런타임 검증`, `배포` 기준 불명확). 리스크는 있으나 의존성(DB 함수 권한, 부서 소속 데이터, RLS/권한 정책, 마이그레이션 롤백)이 부족함. 기존 자산 재사용은 암시되어 있지만 capability-first 검토로 명시되지는 않음.
- 개선 제안: 핵심 사용자별 검증 시나리오와 기대 결과를 추가하고, DB/API/UI 의존성 및 롤백 계획을 적을 것. 기존 자산 재사용 목록과 새로 만드는 항목을 분리해 명시할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

### 근거

문서는 **목표와 권한 매트릭스는 명확**하지만, **구현으로 넘어가기 위한 세부 신뢰도가 낮다**:

1. **성공기준 추상성 (결함)**  
   "런타임 검증"은 무엇인가?
   - streak 계산이 올바른지? (현주 미체크, 이전주부터 연속 체크 확인)
   - 부서 필터가 권한별로 정확히 작동하는지? (교인: 전교회+자부서, 직원: 전체)  
   - 완료율 집계가 중복 제거(distinct on week)로 정확한지?
   
   명시 없으면 "완료"를 누가 판단하는가 불명확함.

2. **의존성 누락 (심각)**  
   - **DB**: `verse_current` DROP 재생성 시 권한(execute, select)을 누가 어떻게 부여? 기존 role 구조(app_user 등) 활용인지?
   - **RLS**: 부서별 필터링이 기존 `user_department` 테이블의 데이터 무결성에 전적으로 의존. 고아 기록이 있으면? 테스트 데이터?
   - **마이그레이션 롤백**: `DROP` 기반은 버전 관리 어렵고, 선행 마이그레이션(사용자 부서 데이터 동기화 등)이 필요할 수 있는데 언급 없음.

3. **기존 자산 불명시 (capability-first 위반)**  
   "선행 1~4단계 완료"라고만 쓰여 있음.  
   - 홈 카드 레이아웃(3단계), 위젯 base class는 재사용인가?  
   - verse API schema(1~4단계에서)에서 `guide`, `department` 필드는 이미 정의되었는가? 추가 마이그레이션인가?

### 수정 계획

1. **검증 시나리오 추가**  
   ```
   사용 시나리오 검증:
   - 교인(부서 소속): VerseBoard 접속 → 부서 암송(빨강 배지) 우선 표시, 자신의 streak 표시 확인
   - 직원: VerseAdmin 진입 → "부서" 셀렉트로 부서 암송 생성 → verse_current 조회에서 전체 부서 보임
   - VerseBoard 로드: 완료율 ≥ 50%면 담당자에게만 표시 (기대: 담당자만 보임 검증)
   ```

2. **의존성·롤백 섹션 추가**  
   ```
   ## 의존성 & 롤백 계획
   - DB: `user_department` 데이터 무결성 전제. 고아 기록 정리 SQL 선행 필요
   - 마이그레이션: v0050(verse_current 재정의) 전에 v0049(verse schema 확장) 실행
   - RLS: 기존 auth.users.department_id → verse_current 필터는 기존 정책 상속 (교인 scope 유지)
   - 롤백: DROP은 불가역. 사전 백업, 사용자 영향도 테스트 필수
   ```

3. **기존 자산 목록화**  
   ```
   ## 재사용 자산
   - VerseBoard 카드 프레임(3단계) + 새 배지(streak, dept)
   - verse API spec: guide(1단계), check_count/target_count(기존)
   ```

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용한다. 문서가 streak 정의와 staff bypass 리스크는 일부 명확히 했지만, 반론에서 지적한 검증 시나리오, DB 권한/RLS/데이터 무결성/마이그레이션 순서/롤백, 기존 자산 재사용 목록이 아직 본문에 반영되지 않았다. 따라서 원 critique의 핵심 결함은 그대로 남아 있다.

<!-- /doc-crossverify:managed -->
