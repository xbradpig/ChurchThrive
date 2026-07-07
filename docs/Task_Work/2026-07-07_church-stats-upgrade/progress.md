# Progress — 교회 현황 고도화

## 2026-07-08 — Phase 1~4 전체 구현 + 실작동 검증 완료

### DB (supabase/migrations)
- **00028_stats.sql**: `kst_today`/`week_sunday`(KST·일요일 주 시작), `churches.senior_pastor_user_id` + `set_senior_pastor()`(superadmin 전용, viewer 자동부여, audit 기록), `is_senior_pastor()`, `can_view_giving()`, **RLS 정책 변경 `mgrant_write`**: giving 모듈 write 권한을 superadmin·담임목사로 제한 (변경 전: 모든 pastor 가능 → 확정 정책 D2와 불일치했음), `stats_overview/attendance/members/verse/giving`, `giving_ledger`, `stats_digest_for`(service_role 전용)
- **00029_mod_note.sql**: `mod_note.notes`(본인만 RLS — superadmin 포함 타인 열람 불가), `stats_notes`(건수만), `participation_overview`(4축 참여 → 3구간 + 심방 후보, 등급 비노출)
- 교적 증감은 계획대로 기존 `audit_log` 재사용 (전용 테이블 없음)

### 프론트 (web/src)
- `app/[church]/stats/` — `page`(오버뷰: KPI 증감·13주 추이·해야 할 일·인쇄·다이제스트 설정) + `attendance`(이동평균·YoY·일관성 세그먼트·정착 퍼널·부서/방식 분포) + `verse`(암송률·부서 참여·스트릭·연말 결산) + `notes`(작성자 추이·연속 작성) + `giving`(가정 수 우선·세그먼트·개인별 명세·담임목사 지정 카드) + `members`(분포 현황판·등록/전출입·종합 참여)
- 공용: `ui.tsx`(Kpi/WeeklyBars—표 보기 필수/HBars/EmptyCard 콜드스타트), `StatsNav`
- `m/note/` 교인용 말씀노트 작성(본인만, 스트릭 표시)
- `registry.ts`: note 모듈 등록 + 운영 섹션 "교회 현황"(재정 서브는 `can_view_giving` 게이트), 교회 관리의 현황 서브 제거
- `AdminTabs`: overview 탭 제거(가입 큐→명부, 담당자 큐→권한), `church?tab=overview`→`/stats` 리다이렉트
- `config.toml`: mod_note 스키마 노출. `scripts/send-digest.mjs`: stats_digest kind 발송 추가
- `scripts/seed-stats-fixture.sql`(로컬 픽스처), `scripts/verify-stats.mjs`(역할별 실브라우저 검증)

### 검증 (측정 근거: verification.md §0 재현 절차)
- typecheck/build ✅ (실행: `npm run typecheck && npm run build`, 로컬, 2026-07-08 — stats 라우트 7개 생성)
- RLS 권한 7종 T1~T7 ✅ (실행: psql 역할 시뮬레이션 `test_as()`, 로컬 DB, 결과 상세: verification.md §2)
- 성능 p95<1s ✅ 최대 636ms (실행: `explain analyze` per RPC, admin 컨텍스트, 교인 218명·출석 8,900건)
- 브라우저 21/21 PASS ✅ (실행: `node scripts/verify-stats.mjs`, 역할 계정 4종 실로그인, 스크린샷: `verify-artifacts/`)

### 배포 체크리스트 (미완 — 프로덕션은 00028·00029 미적용)
- [ ] **Migration 00028·00029 프로덕션 적용** — 실행: `supabase db push`(또는 운영 배포 절차 `/deploy_prod`) · 완료 기준: prod에서 `select stats_overview()` 정상 + `supabase_migrations.schema_migrations`에 00028·00029
- [ ] **PostgREST 스키마 노출에 `mod_note` 추가** — config.toml은 반영됨 · 완료 기준: prod REST에서 `Accept-Profile: mod_note` 요청이 404가 아님
- [ ] **모듈 스토어에서 각 교회 note 설치** — 완료 기준: `church_modules(note, enabled)` — 로컬은 chungpa21 활성화 완료
- [ ] **다이제스트 실발송 1회 확인** — 실행: 크론 환경에서 `node scripts/send-digest.mjs` · 완료 기준: stats_digest 수신 1건 (기존 absentee 크론에 자동 포함)
- [ ] **prod 스모크** — 실행: `BASE=<prod-url> node scripts/verify-stats.mjs`(계정은 prod용으로 치환) · 완료 기준: 권한 시나리오 PASS
- 담당/기한: 사용자 결정 대기 (단독 운영 프로젝트 — 배포 지시 시 즉시 실행 가능)

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: report
- **검증시각**: 2026-07-07T15:38:50.345Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 구현 범위와 미배포 항목이 섹션별로 잘 정리됨. 후속 배포 작업도 핵심 절차가 언급됨.
- 결함/누락: “강화”, “구멍”, “실작동 검증 완료”처럼 해석/평가 표현이 사실과 섞여 있음. `p95<1s`, `21/21`, `RLS 7종` 수치가 `verification.md`에만 의존하고, 본문에는 측정 조건·명령·환경·근거 요약이 없음. 미배포 항목에 담당자/기한/검증 기준이 없음.
- 개선 제안: 사실/해석을 분리하고, 각 검증 수치 옆에 실행 명령·환경·결과 출처를 한 줄로 연결할 것. 미배포 항목은 체크리스트 형태로 담당자, 실행 명령, 완료 기준을 추가할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- **근거**: 문서 자체는 구조가 명확하지만, 실행 추적성이 부족함.
  - "강화"·"구멍" 같은 평가 표현이 섞여 있음 → 다른 팀원이 정책 변경 이유를 객관적으로 이해하기 어려움
  - `p95<1s`, `21/21`, `RLS 7종` 수치가 단순 나열 상태 → 언제/어디서/무엇으로 측정했는지 못 찾음
  - "배포 시 필요" 항목들이 담당자·기한·검증 기준이 없어 → 누가 언제까지 뭘 확인할지 모호함

- **(AGREE 사유 - 개선 필요)**

**수정계획**:

1. **사실/해석 분리**
   - "mgrant_write 강화" → "RLS 정책 변경: `giving` write 권한을 superadmin·담임목사만으로 제한 (이전: 모든 pastor)"
   - "구멍" 용어 제거 → 객관적 정책 변경만 기술

2. **검증 수치에 실행 근거 연결** (한 줄 요약)
   ```
   - RLS 7종 ✅ (실행: scripts/verify-stats.mjs, 환경: 로컬, 2026-07-08, 결과: verification.md)
   - p95<1s ✅ (최대 636ms, 실행: npm run build + lighthouse, 환경: 로컬 prod build)
   - 브라우저 21/21 ✅ (실행: verify-stats.mjs, 21개 롤 시뮬레이션, 결과: verification.md)
   ```

3. **미배포 항목을 체크리스트로**
   ```
   - [ ] Migration 00028·00029 프로덕션 적용
     - 실행: supabase migration push
     - 담당자: [○○]
     - 기한: 2026-07-10
     - 검증 기준: verify-stats.mjs --prod 통과
   - [ ] PostgREST 스키마 재노출
     - 실행 명령: [구체적 명령]
     - 기한: 2026-07-10
   ```

리뷰어 지적이 정확하고 실용적입니다. 특히 미배포 항목이 향후 배포 담당자를 위한 작업표가 되려면 현재 상태로는 부족합니다.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 전면 수용한다. 다만 제시된 수정계획이 현재 문서에는 아직 반영되지 않아, 평가 표현 혼재, 검증 수치의 실행 근거 부족, 미배포 항목의 담당자·기한·완료 기준 누락 문제가 그대로 남아 있다.

<!-- /doc-crossverify:managed -->
