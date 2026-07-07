# Goal — 역할별 업무 대시보드 (home_feed v2) · 홈 고도화 4단계

> 2026-07-08 · 상위 제안서 §2-D · 사용자 원 요청 "교역자·담당자 역할별 업무 고도화"의 핵심 · 선행: 1~3단계 완료

## 목표

홈의 "지금 해야 할 일"을 역할별 **통합 승인 인박스**로 완성하고, 홈에 노출되지 않던 담당자 업무(새가족 정착, 부서장 승인)를 표면화한다.

| 페르소나 | 이미 있음 | 이번에 추가 |
|---|---|---|
| 교인/시니어 | 업무 없음 (말씀·출석·소식 카드) | — |
| 출석 담당자(checker) | 출석 본인 인증 확인, 출석 체크 | 오늘 예배 이름 표시(today_service) |
| 부서 담당자(dept_leader) | 부서 미출석, 부서 공지(3단계) | — (3단계에서 충족) |
| 교역자(pastor) | 가입 승인·심방 배정·교적 수정 승인 | **부서장 승인 대기**, **새가족 정착 요약** |
| 교회 관리자(superadmin) | 교역자 전체 + 스토어/설정 | 상동 |
| 새가족 담당(newcomer manager) | **없음** | **정착 미완료 N명 + 4단계 퍼널 위젯** |

## 완료 기준 (DoD)

- [x] `00032` home_feed v2: newcomer_active·dept_pending·today_service 추가 (기존 키 불변 확인)
- [x] `newcomer_funnel()` RPC (INVOKER, nc_all RLS 게이트)
- [x] 통합 인박스 todo에 부서장 승인·새가족 정착 추가 (dept_pending→/church?tab=permissions LeaderQueue 연결, newcomer_active→/m/newcomer)
- [x] 새가족 정착 퍼널 홈 위젯(NewcomerFunnel, total=0 시 미표시)
- [x] 출석 체크 바로가기에 today_service 노출
- [x] typecheck·build·배포 + 런타임 검증 (2026-07-08, 롤백 트랜잭션 8/8):
  교역자 newcomer_active=3·funnel{1,1,1,2,active3}·기존키 불변, pending 삽입 후 dept_pending=1,
  교인은 newcomer_active·dept_pending null / funnel RLS 차단(UI 미표시)

## 권한 매트릭스 (게이트 = home_feed 내부 조건)

| 항목 | 노출 대상 | 게이트 |
|---|---|---|
| newcomer_active / funnel | 새가족 담당·교역자·관리자 | `has_module('newcomer','manager')` (교역자·관리자 자동 포함) |
| dept_pending | 교역자·관리자 | `my_role() in (superadmin,pastor)` |
| today_service | 교역자·관리자·checker·dept_leader | 동일 역할 목록 |

## 가정 / 리스크

- **가정**: `dept_pending`은 현재 `admin_set_dept_leader`가 즉시 approved로 지정 → 통상 0건. 부서장 신청(pending) 플로우가 후속에 생길 때를 대비한 무해한 사전 배선(0이면 todo 미표시).
- **리스크**: ① home_feed 재정의(00031 전체 복제 + 3키) — 기존 키 계약 불변 유지 ② newcomer 퍼널이 매니저 아닌 사용자에 노출 → RPC가 null 반환 + 위젯 게이트.

## 데이터 출처 / 재사용 / 롤백 (검증 R1 반영 — 상세 analysis.md)

- **데이터 출처**(신규 테이블 없음): `newcomer_active`·funnel = `mod_newcomer.progress.stage`(1~3=미완료), `dept_pending` = `department_leaders.status='pending'`, `today_service` = `events.schedule_rule->'dow'` 오늘 요일 매칭(신규 계산, 저장 안 함). *리뷰어가 가정한 `service` 테이블·`persons.newcomer_stage`는 이 코드베이스에 없음 — 위 실제 소스 사용.*
- **재사용**: `home_feed`(00031) 전체 복제 후 3키만 추가(기존 키 계약 불변), 기존 홈 todos 배열 렌더러, 권한 함수 `my_role()`/`has_module()`, `/m/newcomer` 라우트, 출석 체크 바로가기 컴포넌트 — 전부 재사용.
- **후방호환**: 신규 키는 optional(교인은 null → todo/위젯 미표시). 구 클라이언트가 신규 키를 무시해도 무해.
- **롤백**: `home_feed`를 00031로 재정의 + `newcomer_funnel` drop. 테이블 변경 없음, 데이터 무손상.

## 비범위

- 부서장 신청(self-request) 플로우 — 별도 과업 (지금은 pending 카운트만 사전 배선)
- 훈련·교육 진행 요약 — 후속
- 암송 위젯 고도화 (5단계)
- 페르소나별 quick-actions 전면 재편 — 이번엔 today_service·새가족 추가만

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T15:58:16.277Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: DoD가 `home_feed v2` 키, RPC, 위젯, 권한 게이트, 검증 항목으로 비교적 구체적임. 범위/비범위도 분리되어 있음.
- 결함/누락: 리스크/의존성은 부족함. `today_service` 데이터 출처, newcomer 단계 산정 기준, 기존 `00031` 계약 보존 방식, RLS/권한 검증, 배포/마이그레이션 롤백 의존성이 명시되지 않음. capability-first 재사용 검토도 `00031 전체 복제` 외에는 명확하지 않음.
- 개선 제안: 기존 재사용 자산 목록을 추가할 것: `home_feed 00031`, 기존 todo 렌더러, 권한 함수, `/m/newcomer`, 출석 체크 컴포넌트 등. 각 DoD에 검증 방법과 기대 결과를 붙이고, 데이터 소스/권한/RLS/롤백 리스크를 별도 섹션으로 보강할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

## 근거

리뷰어의 지적이 타당하다. 이 문서는 "무엇을 할 것인가"는 명확하지만, **"어떻게 검증하고, 어디서 데이터를 가져오며, 기존 자산을 어떻게 재사용할 것인가"**는 명확하지 않다:

1. **DoD 검증 방법 부재**: 각 항목(newcomer_active, dept_pending, today_service)에 대해 "구현 완료 = ?"를 명확히 정의하지 않음. 마지막 "typecheck·build·DB 적용·배포·런타임 검증"은 모든 과업에 적용되는 일반 사항일 뿐.

2. **데이터 출처 불명확**: `today_service`는 기존 서비스에서 이미 추적 중인가? 신규 계산인가? newcomer의 4단계(등록→환영→교육→정착) 판단 기준은?

3. **capability-first 검토 부족**: "00031 전체 복제 + 3키"라고만 했지, 실제로 "기존 todo 렌더러/권한 함수/출석 체크 컴포넌트를 재사용할 수 있다"를 명시하지 않음. 중복 구현 리스크.

4. **RLS/권한 검증 사각지대**: 권한 매트릭스는 있지만, 데이터베이스 정책(RLS)이나 실제 쿼리 레벨에서의 검증 방식이 없음.

5. **배포·롤백 의존성 누락**: `00031` home_feed와의 호환성 유지 전략, 기존 데이터 마이그레이션, 긴급 롤백 절차가 없음.

## 수정계획

다음 섹션을 추가할 것:

1. **기존 자산 재사용 목록** (capability-first)
   - `home_feed` 00031의 어떤 키/함수를 그대로 쓸지
   - 기존 권한 검증 함수 (`my_role()`, `has_module()` 재사용 확인)
   - 기존 todo 렌더러 컴포넌트 활용

2. **각 DoD별 검증 기준 & 기대 결과**
   - `newcomer_funnel()` RPC: "4가지 단계별 카운트 배열 [registered, welcomed, trained, settled] 반환, 비권한 사용자는 null"

3. **데이터 소스 & RLS 섹션**
   - `today_service` = 기존 service 테이블의 `service_date = TODAY()`인 행
   - newcomer 단계 판단 = persons 테이블 `newcomer_stage` 컬럼 기준
   - RLS: church_id 필터링, 권한별 가시성 정책

4. **배포·마이그레이션 리스크**
   - `00031` home_feed 스키마 후방호환성 전략 (신규 키를 optional로 처리)
   - 기존 캐시 무효화 방식
   - 긴급 롤백 시나리오

이 수정이 완료되면 개발팀이 "누가 무엇을 어떻게" 명확히 알 수 있다.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 원 critique를 전면 수용하므로 기각할 부분은 없다. 다만 Document 자체에는 재사용 자산 목록, DoD별 검증 기준, 데이터 출처, RLS/쿼리 권한 검증, `00031` 후방호환·캐시·롤백 전략이 아직 반영되지 않았다. 수정계획은 타당하지만 현재 문서 기준으로는 여전히 보완 필요하다.

<!-- /doc-crossverify:managed -->
