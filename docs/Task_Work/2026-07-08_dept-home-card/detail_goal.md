# Detail Goal — 부서 홈 카드 구현 설계

> 2026-07-08 · goal.md 실행 설계. 근거: analysis.md

## 결정

1. **부서 격리는 RLS 계층에서** — 공지 조회 필터를 RLS `n_sel`에 넣어 home_feed·NoticeBoard·dept_home 전부 자동 적용(INVOKER). 앱 코드에 필터 중복 안 함.
2. **전교회/부서 공지 분리 노출** — home_feed 공지 = 전교회만("우리 교회의 오늘"), dept_home 공지 = 부서만("내 부서" 카드). 중복 제거.
3. **부서 담당자 공지 작성 허용** — RLS `n_ins`에 `target_department_id in my_led_departments()` 경로 추가. 전교회 공지는 매니저·교역자만.
4. **암송은 카드에서 제외** — 기존 홈 암송 위젯이 부서 배정을 이미 우선 노출. 중복 배치 대신 5단계에서 완료율 등 고도화.

## W1. `00031_dept_home.sql`

```text
- my_dept_ids() setof uuid : department_members ∪ department_leaders(approved) for my_member_id()
- 공지 RLS 재정의:
  n_sel: church + module_enabled + (target null OR role in(superadmin,pastor) OR target in my_dept_ids())
  n_ins: church + module_enabled + (has_module('notice','manager') OR role in(superadmin,pastor)
                                    OR (target not null AND target in my_led_departments()))
  (n_del 유지)
- notice_targets() jsonb : { can_church_wide bool, departments[{id,name}] }
    manager/pastor/superadmin → 전교회 + 전 부서 / dept_leader → 자기 부서만
- dept_home() jsonb (INVOKER) : null(교적 없음) 또는
    { departments[{id,name,is_leader}], events[{id,title,dept,starts_at}](부서타겟 upcoming 5),
      notices[{id,title,dept,at}](부서타겟 recent 5) }
    events는 my_dept_ids() 명시 필터(calendar RLS는 부서 무필터), notices는 target not null
- home_feed() 재정의(00030 전체 복제) : 공지 서브쿼리에 `and n.target_department_id is null`
```

## W2~W4. UI

- **W2 NoticeBoard**: `notice_targets()` 호출 → 작성 폼에 대상 셀렉트(전교회 옵션은 can_church_wide 시). insert에 `target_department_id` 포함. 공지 카드에 부서 배지(전교회는 배지 없음). 작성 폼 노출 = canManage(매니저) OR targets.departments.length>0(담당자). `page.tsx`에서 role 전달.
- **W3 홈 "내 부서" 카드**: `dept_home()` 호출(모듈 게이트 불필요 — 내부에서 처리). departments 비면 미표시. 카드: 부서명 배지(복수) + 부서 일정(D-day) + 부서 공지. is_leader 부서 있으면 "부서 공지 작성" → `/m/notice`. church-today 아래(upcoming-events 위) 좌측 컬럼 배치.
- **W4 home_feed 소비**: 기존 "우리 교회의 오늘" 공지는 이제 전교회만 — 코드 변경 없음(RPC가 필터).

## W5. 검증 (롤백 트랜잭션 + curl)

| 시나리오 | 기대 |
|---|---|
| 부서 타겟 공지 생성(담당자, 자기 부서) | 성공 |
| 담당자가 전교회 공지 insert 시도 | RLS 거부 |
| 담당자가 타 부서 타겟 공지 | RLS 거부 |
| 소속 부서원 공지 조회 | 자기 부서 공지 보임 |
| 타 부서원 조회 | 안 보임 |
| 교역자 조회 | 전부 보임 |
| home_feed 공지 | 전교회만(부서 공지 제외) |
| dept_home() | 내 부서/일정/부서공지 반환, 교적 없으면 null |
| typecheck·build·배포·prod 헬스체크 | 통과 |

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T15:38:32.317Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: RLS 중심 격리와 home_feed/dept_home 분리 결정이 구체적임. W5 검증 시나리오가 주요 권한 케이스를 잘 포함함.
- 결함/누락: 비범위가 암송 제외 외에는 명확하지 않음. 리스크/의존성/가정 섹션이 없음. capability-first 재사용 검토가 기존 암송 위젯 언급 수준에 그침.
- 개선 제안: 성공기준을 별도 acceptance criteria로 분리하고, scope/out-of-scope를 명시하세요. RLS 변경, RPC 재정의, 마이그레이션 순서, 기존 컴포넌트/함수 의존성, 롤백 리스크를 표로 추가하세요.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

---

**근거:**

문서가 **핵심 결정과 구현 스텝은 구체적**이지만, 프로덕션 배포 단계에 필요한 3가지가 누락됐다:

1. **Out-of-Scope 불명확** — "암송 제외"만 명시. 부서 관리 UI? 캘린더 RLS 변경? 권한 정책 확대?가 범위인지 불명확해 구현 중 스코프 크리프 발생 가능.

2. **리스크/의존성 미맵** — RLS 변경이 기존 공지 쿼리, 성능, 마이그레이션 순서에 미칠 영향이 없음. 예:
   - 부서별 null target 공지 기존 데이터 처리?
   - dept_home() 쿼리 성능(부서원 많으면)?
   - RLS 변경 후 롤백 시 기존 공지 노출 보안 위험?

3. **Capability-First 검토 표면적** — "기존 홈 암송 위젯" 언급만. HomeCard/NoticeCard/DepartmentBadge 같은 기존 컴포넌트 재사용 가능성 미검토.

---

**수정계획:**

1. **Out-of-Scope 섹션 추가** — "범위: RLS 공지 필터 + 부서 홈 카드 + 부서 공지 작성 / 비범위: 부서 CRUD, 캘린더 타겟팅, 권한 역할 정책" 명시

2. **Risk & Dependencies 표 추가**:
   ```
   | 항목 | 의존성 | 리스크 | 완화 |
   | RLS 변경 | notice 조회 RPC 모두 | 마이그레이션 후 null target 공지 부정확 | 배포 전 데이터 정합성 스크립트 |
   | dept_home() RPC | calendar 무필터 검증 | 부서 공지 + 일정 성능 > 500ms | 페이징/캐싱 |
   ```

3. **Acceptance Criteria 독립 섹션** — W5를 "검증 시나리오"→"AC"로 재명시. 추가: 마이그레이션 zero-downtime, 기존 공지 가시성 불변

4. **Capability-First 심화** — `home-feed.tsx`, `NoticeCard.tsx`, badge 컴포넌트 현황 + 재사용 전략 기술

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 원 critique를 사실상 수용했고, 수정계획도 타당합니다. 다만 현재 문서 본문에는 Out-of-Scope, Risk & Dependencies, 독립 Acceptance Criteria, 기존 컴포넌트 재사용 검토가 아직 반영되지 않아 원 결함이 그대로 남아 있습니다.

<!-- /doc-crossverify:managed -->
