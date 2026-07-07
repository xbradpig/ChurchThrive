# Detail Goal — 역할별 업무 대시보드 구현 설계

> 2026-07-08 · goal.md 실행 설계. 근거: analysis.md

## 결정

1. **home_feed v2 = 00031 전체 복제 + 3키** — 기존 키 계약 절대 불변. `newcomer_active`, `dept_pending`, `today_service` 추가.
2. **newcomer 게이트는 has_module 단일 조건** — 교역자·관리자 자동 포함(§4). 별도 role 분기 없음.
3. **newcomer_funnel은 SECURITY INVOKER** — `mod_newcomer.progress`의 `nc_all` RLS가 매니저만 통과 → 게이트 자동. 비매니저는 빈 결과 → 위젯 미표시.
4. **dept_pending 사전 배선** — 0이면 todo 미표시. 신청 플로우는 비범위.
5. **today_service는 정보성** — 오늘 요일 매칭 예배명 1개. 출석 체크 바로가기 라벨 보강용.

## W1. `00032_home_feed_v2.sql`

```text
- newcomer_funnel() returns jsonb (INVOKER):
    null(모듈 미설치/비매니저 → RLS로 빈 결과 시 null 처리) 또는
    { s1, s2, s3, s4, active }  -- active = s1+s2+s3 (정착 미완료)
    source: mod_newcomer.progress group by stage (RLS가 매니저 게이트)
- home_feed() 재정의 (00031 복제 + 3키):
    newcomer_active : has_module('newcomer','manager') ?
       count(progress where stage between 1 and 3) : null
    dept_pending : role in(superadmin,pastor) ?
       count(department_leaders dl join departments d ... where d.church_id=my_church_id
             and dl.status='pending') : null
    today_service : role in(superadmin,pastor,checker,dept_leader) ?
       (select name from events where church_id=my_church_id and schedule_rule is not null
        and (schedule_rule->'dow') @> to_jsonb(extract(dow from current_date)::int)
        order by sort_order limit 1) : null
```

## W2. 홈 UI

- **Feed 타입 확장**: `newcomer_active`, `dept_pending`, `today_service` 필드.
- **통합 인박스 todo 추가** (기존 배열에):
  - `dept_pending > 0` → "🧑‍🏫 부서장 승인 대기 N건" → `/church?tab=permissions`
  - `newcomer_active > 0` → "🌱 새가족 정착 관리 N명" → `/m/newcomer`
- **새가족 정착 퍼널 위젯** (`NewcomerFunnel`): home 좌측 컬럼, `newcomer_funnel()` 데이터 있을 때만. 4단계 가로 바(등록·환영·교육·정착 카운트) + /m/newcomer 링크. 게이트: 데이터 non-null.
- **출석 체크 바로가기**: 라벨에 `today_service` 있으면 "✅ 오늘 출석 체크 · {today_service}".

## W3. 데이터 로드
- home 페이지 Promise.all에 `newcomer_funnel()` 추가 (RLS가 게이트하므로 조건 없이 호출, 비매니저는 빈 결과).

## W4. 검증 (롤백 트랜잭션 + 배포 헬스체크)

| 시나리오 | 기대 |
|---|---|
| 교역자 home_feed | newcomer_active=3, dept_pending=0, today_service=요일매칭 or null |
| 교역자 newcomer_funnel | {s1:1,s2:1,s3:1,s4:2,active:3} |
| 일반 교인 newcomer_funnel | 빈/null (RLS 차단) |
| pending 부서장 1건 삽입 후 교역자 home_feed | dept_pending=1 |
| 교인 home_feed | newcomer_active·dept_pending 모두 null |
| 기존 키(join_pending 등) | 불변 |
| typecheck·build·배포·prod 헬스 | 통과 |

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T15:59:18.350Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: W1-W4 구현 범위와 추가 키 3개가 구체적이며, 검증 시나리오에 기대값이 일부 정량화되어 있음.
- 결함/누락: 성공기준이 독립적으로 정리되지 않았고, 비범위는 신청 플로우만 명시되어 권한/RLS/스키마/UI 범위 경계가 불명확함. `events.schedule_rule`, `department_leaders.status`, `00031` 복제, `SECURITY INVOKER`/RLS, `current_date` 타임존 같은 의존성·가정·리스크가 별도 섹션으로 충분히 드러나지 않음. capability-first 재사용은 암시되지만 기존 자산 검토 결과로 정리되어 있지 않음.
- 개선 제안: “성공기준”, “범위/비범위”, “가정·의존성·리스크”, “기존 자산 재사용 검토” 섹션을 추가하고 각 항목을 체크 가능한 문장으로 분리할 것. 특히 기존 `00031 home_feed`, `has_module`, RLS, 기존 todo 배열, `/m/newcomer`, `/church?tab=permissions` 재사용 여부와 새 구현이 필요한 부분을 명확히 구분할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- 근거: 현재 문서는 "뭘 할지"는 구체적이지만, 완료 기준, 범위 경계, 숨겨진 가정이 체계적으로 정리되지 않았다. 특히:
  1. **성공기준 부재**: W4 검증 테이블이 있지만 "이것을 모두 통과하면 완료"라는 명시적 체크리스트로 정리되지 않음
  2. **범위 경계 모호**: "신청 플로우는 비범위"만 있고, UI 권한 처리, RLS 정책 신규 여부, 스키마 경계가 불분명
  3. **의존성 숨김**: `events.schedule_rule` 구조, `department_leaders.status` 존재 여부, `SECURITY INVOKER` RLS 정책, `current_date` 타임존 처리 등이 가정으로만 남음
  4. **기존 자산 재사용 불명확**: `home_feed()` 기존 키 목록 미제시, `has_module`, `/m/newcomer`, `/church?tab=permissions`, 기존 todo 배열이 정확히 뭔지/어디서 정의되는지 추적 불가능

- 수정계획:
  1. **성공기준** 섹션 추가: W4 검증 테이블을 "□ 교역자 home_feed: newcomer_active=3..." 형태 체크리스트로 변환
  2. **범위/비범위** 섹션 추가:
     - ✓범위: home_feed SQL 3키 추가, NewcomerFunnel UI, todo 라벨 2개, today_service 라벨
     - ✗비범위: 신청 플로우, RLS 정책 신규 작성(기존 활용), 부서장 승인 화면
  3. **가정·의존성·리스크** 섹션 추가:
     - `events.schedule_rule` = JSON 객체, `dow` 키로 요일 배열 포함 (구조 명시)
     - `department_leaders.status` 컬럼 존재 (00031 이후 추가됨?) 확인 필요
     - `SECURITY INVOKER` RLS: `mod_newcomer.progress` 기존 RLS 정책 활용
     - `current_date` 타임존 = DB 설정 기준 (별도 처리 없음)
  4. **기존 자산 재사용 검토** 섹션 추가:
     - ✓재사용: `00031` home_feed 정의, `has_module()` 함수, `/m/newcomer` 라우트, `/church?tab=permissions` 라우트, 기존 todo 배열
     - ✓신규: `newcomer_funnel()` SQL 함수, `NewcomerFunnel` React 컴포넌트, 3개 라벨 문구

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용한다. 저자의 진단과 수정계획은 원 critique를 정확히 인정했다. 다만 제출된 문서 자체에는 성공기준, 범위/비범위, 가정·의존성·리스크, 기존 자산 재사용 검토 섹션이 아직 반영되지 않았다. 핵심 가정들도 여전히 구현 설명 안에 묻혀 있어, 계획은 타당하지만 현 문서는 아직 NEEDS-REVISION이다.

<!-- /doc-crossverify:managed -->
