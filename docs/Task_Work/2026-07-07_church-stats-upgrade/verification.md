# Verification — 교회 현황 고도화 (2026-07-08 실측)

## 0. 재현 절차 (로컬)

```bash
# 1. 로컬 Supabase 기동 확인 (docker 스택 supabase_*_ChungpaAttend, kong :54321 / db :54322)
docker ps | grep supabase_db
# 2. 마이그레이션 적용 (00028, 00029 — 로컬은 docker exec psql로 적용함)
docker exec -i supabase_db_ChungpaAttend psql -U postgres -d postgres < supabase/migrations/00028_stats.sql
docker exec -i supabase_db_ChungpaAttend psql -U postgres -d postgres < supabase/migrations/00029_mod_note.sql
# 3. 검증 픽스처 (교인 218명 규모 chungpa21에 출석 14주+YoY 6주·헌금 6개월·새가족 5명·전출 2건)
docker exec -i supabase_db_ChungpaAttend psql -U postgres -d postgres < scripts/seed-stats-fixture.sql
# 4. note 모듈 로컬 활성화 + PostgREST 스키마 노출 (config.toml에는 반영됨, 실행 중 인스턴스는 재시작)
docker restart supabase_rest_ChungpaAttend
# 5. 빌드 게이트
cd web && npm run typecheck && npm run build     # 기대: 무오류, /[church]/stats* 라우트 7개
# 6. dev 서버 (3100은 docker 점유 → 3130)
npx next dev -p 3130
# 7. 실브라우저 검증 (역할 계정 5종은 scripts/bootstrap-users.mjs가 생성한 *@chungpa.local)
node scripts/verify-stats.mjs                    # 기대: 21/21 PASS
```

성능 측정 방법: `explain (analyze, format json) select <rpc>()` 를 admin 컨텍스트(`test_as('admin@chungpa.local')`)로 실행, Execution Time 채택.

## 1. 빌드 게이트
- `npm run typecheck` ✅ 무오류
- `next build` ✅ — 신규 라우트 7개 생성 확인 (`/[church]/stats{,/attendance,/verse,/notes,/giving,/members}`, `/[church]/m/note`)

## 2. RLS/RPC 권한 테스트 (SQL 역할 시뮬레이션 — UI 분기 아닌 DB 계층 검증)

| # | 시나리오 | 결과 |
|---|---|---|
| T1 | 일반 pastor: `can_view_giving`=false, `stats_giving`=null, `giving_ledger`=0건, records 직접조회=0건, 오버뷰 헌금 키=null | ✅ 전부 차단 |
| T2 | 일반 pastor가 giving grant 셀프 부여 → RLS 위반 에러 / attendance grant는 기존대로 허용 | ✅ |
| T3 | checker: 교적·재정·암송·노트 RPC 전부 null, 오버뷰는 출석 키만(new_families=NULL, sunday_att=134) | ✅ (최초 is_staff 누수 발견→명시적 역할 목록으로 수정 후 통과) |
| T4 | member: stats_overview/attendance/participation 전부 null | ✅ |
| T5 | dept_leader: by_dept 숨김(자기 부서 스코프), **타 부서 uuid 파라미터 조작 → 자기 부서(50명)로 강제** | ✅ |
| T6 | 담임목사 플로우: 비superadmin 지정 거부 → superadmin 지정(viewer 자동부여+audit 기록) → 담임목사 재정 열람+타인에게 viewer 부여 → viewer 열람 가능·**입력은 RLS 거부** | ✅ 7단계 전부 |
| T7 | mod_note: member 본인 작성 OK, **superadmin도 타인 노트 0건**, stats_notes는 건수만 집계 | ✅ |

## 3. 성능 (p95 < 1s 기준, 218명·출석 8,900건 규모)
stats_overview 74ms · stats_attendance 38ms · stats_members 34ms · stats_verse 47ms · stats_giving 6ms · participation_overview 636ms — **전부 통과** (participation은 규모 증가 시 materialized view 후보)

## 4. 실브라우저 검증 — `scripts/verify-stats.mjs` **21/21 PASS**
- A1~A5: superadmin 6개 페이지 전부 렌더링 (KPI 증감 ▲▼, 13주 차트+4주 이동평균, 해야 할 일, 일관성 세그먼트, 정착 퍼널, 암송 스트릭, 개인별 명세, 직분/연령/부서 분포, 전출입)
- A6: `/church?tab=overview` → `/stats` 리다이렉트
- A7: 375px 뷰포트 가로 스크롤 없음 (1열 카드 스택)
- B1~B2: 담임목사(지정됨) 재정 열람 가능, 지정 카드는 superadmin 전용
- C1~C5: checker 오버뷰 출석만(헌금·새가족 카드 없음), 교적/재정 URL 직접 접근 → 리다이렉트
- D1~D3: member `/stats` → `/home` 리다이렉트, 말씀노트 실작성·저장·스트릭 표시
- 스크린샷 10장: `./verify-artifacts/` (1 오버뷰 · 2 출석 · 3 암송 · 4 노트 · 5 재정 · 6 교적 · 7 모바일 375px · 8 담임목사 재정 · 9 checker 오버뷰 · 10 member 노트 작성)

## 5. 회귀 위험 및 정책 대기 (미검증 항목 분리)
- ❌ **다이제스트 실발송 미검증** — `stats_digest_for()` RPC와 `send-digest.mjs` 코드 경로는 확인했으나, 실제 웹푸시 발송은 크론 + VAPID + `push_subscriptions` 구독이 있는 환경에서만 검증 가능. 배포 후 1회 수동 실행(`node scripts/send-digest.mjs`)으로 확인할 것
- ⚠️ **담임목사 해제 시 자동 부여된 giving viewer grant 유지** — 현재 동작은 "해제해도 열람 grant는 남음"(수동 회수 필요). 의도된 보수적 동작이나 **운영 정책 미결정** — 자동 회수로 바꿀지 결정 필요
- ℹ️ 사이드바 교회명 표기(`churches.select limit 1`)가 다중 교회 노출 환경에서 첫 교회를 표시하는 기존 동작 확인 — 본 과제 범위 외 (별도 이슈)

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: verify
- **검증시각**: 2026-07-07T15:38:21.364Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: RLS/RPC 권한 케이스와 브라우저 검증 범위가 구체적이며, 실패 발견 후 수정 통과 사례도 기록됨.
- 결함/누락: 재현 절차가 부족함. Supabase 기동, 마이그레이션/시드 적용, 실행 명령, 계정/역할 준비, 성능 측정 방법이 단계별로 없음. 로그·스크린샷 경로도 세션 임시 위치라 추적성이 약함.
- 개선 제안: `npm run typecheck`, `next build`, `scripts/verify-stats.mjs`, SQL 권한 테스트, 성능 측정 명령을 순서대로 적고 핵심 출력/아티팩트 경로를 첨부할 것. 실발송 미검증과 grant 유지 정책은 명시적 회귀 위험으로 분리할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- 근거: 
  - **재현 불가**: "로컬 Supabase(docker, 마이그레이션 00029까지 적용)"은 추상적이며, `docker compose up`, `supabase migration up`, `seed-stats-fixture.sql` 적용 방법, 테스트 실행 명령이 단계별로 없어 다른 팀원/CI가 동일하게 재현할 수 없음.
  - **추적성 약화**: "세션 스크래치 `stats-verify/`"는 임시 위치이므로, 이후 세션에서 아티팩트를 재확인하거나 CI 로그에서 증거를 찾을 수 없음.
  - **정책 모호**: "담임목사 해제 시 viewer grant 유지"가 의도된 동작이라고 했으나, 이를 "의도된 정책"인지 "미검증 회귀 위험"인지 명시하지 않아 향후 운영 혼선 위험.

- 수정계획:
  1. **"환경 설정 → 재현 절차"** 섹션 신규: 
     ```
     1. `docker compose up -d` (또는 supabase start)
     2. `supabase db push` (00029까지 확인)
     3. `psql ... < scripts/seed-stats-fixture.sql` (또는 해당 스크립트 명령)
     4. `npm run dev` (3130 기동 확인)
     5. `node scripts/verify-stats.mjs` 실행
     ```
  2. **스크린샷·로그 경로** 명확화: `/docs/Task_Work/2026-07-08_dept-home-card/verify-artifacts/` 저장소 경로로 변경
  3. **"회귀 위험 및 정책 대기"** 섹션 분리:
     - ❌ 실발송 미검증 (크론+VAPID 환경 필요)
     - ❌ 담임목사 해제 시 grant 회수 정책 미결정 → 운영팀 검토 필요
  4. `npm run typecheck`, `next build`, `scripts/verify-stats.mjs` 실행의 핵심 출력값(예: "build: route 7개 생성", "verify: 21/21 PASS") 을 각 블록의 마지막에 명시

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용한다. 작성자가 지적을 인정했지만, 현재 문서에는 수정계획이 실제로 반영되지 않았다. 재현 절차는 여전히 단계별 명령/계정 준비/성능 측정 방법이 부족하고, 스크린샷은 여전히 세션 스크래치 경로이며, 실발송 미검증·grant 회수 정책도 명시적 회귀 위험 섹션으로 분리되지 않았다.

<!-- /doc-crossverify:managed -->
