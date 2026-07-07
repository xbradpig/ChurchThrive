# Analysis — 역할별 업무 대시보드 (현황 조사)

> 2026-07-08 · migrations 00001–00031 + web/src + 운영 DB 조회

## 1. 현재 홈 업무 표면 (home_feed 최신 = 00031)

todo 소스 키: `join_pending`(교역자), `selfcheck_pending`(교역자·checker·dept_leader), `visit_requested`(교역자+심방모듈), `edit_pending`(교적 승인권자). "사역 현황" = `absentee_list`(교역자·dept_leader, dept 스코프). quick-actions = 출석체크·교인초대·교회관리·스토어.

**미노출 업무**: 새가족 정착(mod_newcomer), 부서장 승인 대기(department_leaders.status='pending').

## 2. 새가족 (mod_newcomer.progress)

- 스키마(00013): `(church_id, member_id) PK, stage int 1~4, note`. 1등록 2환영 3교육 4정착.
- RLS `nc_all`: `has_module('newcomer','manager')` 전용 (교역자·관리자 자동 포함 — has_module 정의 확인).
- **전용 RPC 없음** — NewcomerBoard가 members+progress 직접 조회.
- 운영 DB 현황: stage 1=1, 2=1, 3=1, 4=2 → **정착 미완료(1~3) 3명**.

## 3. 부서장 승인 (department_leaders)

- `status leader_status('pending','approved','revoked')`, 기본 'pending'.
- 유일 생성 경로 `admin_set_dept_leader`(00024)는 **status='approved' 즉시 지정** → 통상 pending 없음. self-request 플로우 부재.
- 결론: `dept_pending` 카운트는 사전 배선(무해, 0이면 미표시). 신청 플로우는 비범위.

## 4. has_module 게이트 (00006:132)

`has_module(m, lvl)` = `module_enabled(m) AND (role in (superadmin,pastor) OR module_grants>=lvl)`. → 새가족 매니저 게이트는 `has_module('newcomer','manager')` 단일 조건으로 교역자·관리자·명시적 매니저 모두 포함. 별도 role 분기 불필요.

## 5. events.schedule_rule (오늘 예배)

`events.schedule_rule` jsonb 예: `{"dow":[0],"start":"09:00"}`. 오늘 요일 매칭 = `(schedule_rule->'dow') @> to_jsonb(extract(dow from current_date)::int)`. checker의 "오늘 출석 체크" 맥락 강화용.

## 6. 재사용 (Capability-First)

| 자산 | 재사용 |
|---|---|
| home_feed jsonb 1왕복 | v2로 키 3개 추가 (00031 전체 복제) |
| 홈 todos 배열 + Feed 타입 | 키 2개 추가 |
| has_module | 새가족 게이트 |
| DeptCard 패턴(3단계) | 새가족 퍼널 위젯 구조 참고 |
| `/m/newcomer` 라우트(기존) | 퍼널 위젯 링크 대상 |

## 7. 기존 지표와의 중복 검토 (검증 R1 반영)

grep `newcomer_stall|funnel|LeaderQueue|department_leaders` 결과:
- **`stats_attendance().funnel`** (00028:187-196): 새가족 stage 카운트를 `{stages:{s1..}}`로 이미 계산. **단 `my_role() in (superadmin,pastor)` 전용**(새가족 매니저 grant 미포함), 그리고 stats 페이지 전체 페이로드에 묶여 홈에서 호출하기엔 무거움.
- **`stats_overview().todo.newcomer_stall`** (00028:109): stage=1(정체)만 카운트 — 내 `newcomer_active`(stage 1~3 미완료)와 **다른 지표**.
- **`AdminTabs.LeaderQueue`** (AdminTabs.tsx:112-124): `department_leaders where status='pending'`를 조회·승인하는 **기존 UI**가 `/church?tab=permissions`에 존재. → `dept_pending` todo의 링크 대상이 검증됨. pending 부서장은 실제 발생 가능 상태(사전 배선이 아니라 실 업무).

**결론 — `newcomer_funnel()` 신설 정당화**: 기존 funnel은 (a) 새가족 매니저(grant)에 미노출, (b) 무거운 stats RPC에 결합. 홈 위젯용 경량 + `has_module('newcomer','manager')` 게이트가 필요해 별도 신설. 중복이 아니라 다른 청중·다른 무게.

## 8. 최신 상태

- 다음 마이그레이션: **00032**.
- home_feed 재정의는 SECURITY INVOKER 유지 → RLS 그대로. `newcomer_funnel`도 INVOKER면 `nc_all` RLS가 매니저만 통과 → 게이트 자동. INVOKER 채택.
- **DB 수치**(church_id = chungpa21, 2026-07-08): `select stage,count(*) from mod_newcomer.progress group by stage` → 1=1,2=1,3=1,4=2. active(1~3)=3.

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: analysis
- **검증시각**: 2026-07-07T16:00:03.937Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: `home_feed`, `mod_newcomer.progress`, `has_module`, `admin_set_dept_leader` 등 핵심 스키마/RPC 주장은 실제 파일 기준으로 대체로 맞음.
- 결함/누락: 중복 검토가 불충분함. 기존 `supabase/migrations/00028_stats.sql`의 `stats_overview().todo.newcomer_stall`, `stats_attendance().funnel`, `web/src/app/[church]/admin/AdminTabs.tsx`의 `LeaderQueue`가 재사용/중복 판단에 반영되지 않음. 운영 DB stage 카운트는 조회 SQL/테넌트/시각 증거가 없음.
- 개선 제안: `rg newcomer_stall|funnel|department_leaders|LeaderQueue` 결과를 문서에 추가하고, 신규 `newcomer_funnel()` 필요성을 기존 stats RPC와 비교해 명시할 것. 운영 DB 수치는 실행 SQL과 대상 church_id를 함께 기록할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- 근거: 
  - 섹션 6(재사용)에서 `stats_overview().todo.newcomer_stall`과 `stats_attendance().funnel`을 누락했고, `LeaderQueue` 패턴도 미언급 → 중복 검토 미흡 인정.
  - 섹션 2에서 "운영 DB 현황: stage 1=1, 2=1..." 제시했으나 **조회 SQL, 대상 church_id, 조회 시각 기록 없음** → 재현 불가 상태.
  - 섹션 7의 "신규 RPC 1개(newcomer_funnel)" 주장이 기존 stats RPC들과의 명시적 비교 없음 → 필요성 약함.

- 수정계획:
  1. `rg 'newcomer_stall|funnel|LeaderQueue|department_leaders'` 실행 결과 추가 섹션으로 삽입
  2. 섹션 6을 "기존 지표(stats_overview, stats_attendance, AdminTabs.LeaderQueue) vs 신규 newcomer_funnel() 기능 비교표"로 재작성 → 신규 RPC 정당성 명시
  3. 섹션 2 운영 DB 수치를 아래 형식으로 보완:
     ```sql
     SELECT stage, COUNT(*) FROM mod_newcomer.progress 
     WHERE church_id = '{{church_id}}' 
     GROUP BY stage;  -- 조회시각: 2026-07-08 14:30 (UTC+9)
     ```

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용합니다. 작성자가 기존 stats RPC/LeaderQueue 누락, 운영 DB 수치의 재현성 부족, 신규 `newcomer_funnel()` 정당화 부족을 모두 인정했고 수정계획도 적절합니다. 다만 현재 문서 본문에는 그 보완이 아직 반영되지 않아 원래 결함이 그대로 남아 있으므로 판정은 유지합니다.

<!-- /doc-crossverify:managed -->
