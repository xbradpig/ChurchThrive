# Decisions — 교회 현황 고도화 결정 이력

> 결정의 "무엇"은 goal.md/detail_goal.md가 SSOT. 이 문서는 **왜 그렇게 됐는지의 이력**(진화·번복 포함)을 기록해 재론을 방지한다.

## D1. IA 구조 — 오버뷰 + 도메인 서브페이지 (2026-07-07 확정)

- **결정**: 현황 클릭 → `/{slug}/stats` 오버뷰, 하위에 출석/암송/노트/재정/교적 서브페이지. 교회 관리의 현황 탭은 리다이렉트로 흡수.
- **경위**: 사용자가 "하위 메뉴 구성 → 오버뷰+서브페이지" 안을 제시, AI 독립 검토 결과 업계 표준(Planning Center/Breeze)과 일치해 채택. AI가 추가한 원칙 3가지 — ① 집계표가 아닌 행동 연결형(해야 할 일로 끝남), ② 숫자에서 사람으로 드릴다운, ③ 역할이 화면을 결정.
- **기각 대안**: 별도 최상위 메뉴 5개(도메인마다) — 당회 보고 동선 분산, 사이드바 비대화로 기각.

## D2. 재정 열람 정책 — 3단 진화 끝에 확정 (2026-07-07)

| 차수 | 안 | 결과 |
|---|---|---|
| 초안 (AI 제안) | 미국 Reviewer 모델 소개 — pastor 익명 집계 노출 여부를 미결로 상정 | 사용자 결정 대기 |
| 1차 (사용자) | "superadmin 또는 담임목사가 허가하면 가능 + 집계는 노출" → pastor 전원에게 익명 집계 노출로 해석 | 반영 후 정정됨 |
| 1.5차 (사용자) | "재정부는 누가 얼마 냈는지 정리하도록" — 재정부=개인 단위 전체가 본연 업무 | 반영 |
| **2차 (사용자, 최종)** | **"교역자는 담임목사와 허가된 사람만, 다른 목회자들은 볼 수 없도록"** — 일반 pastor는 **집계조차 불가** | **확정** |

- **최종**: 재정부(giving grant manager/admin)=전체(입력·정리), 담임목사+허가 viewer=열람, 그 외 전원(일반 pastor 포함)=완전 비노출. grant 부여=superadmin 또는 담임목사.
- **근거**: 재정은 한국 교회 최고 민감 데이터. 기존 `module_grants.level`(viewer/manager/admin)과 RLS(`g_sel`/`g_ins`, `00013_modules_p2.sql:132-145`)가 이 구조를 이미 강제함을 검증 — 신설은 대표 교역자 지정 메커니즘뿐.
- **재론 방지**: "pastor에게 익명 집계라도 보여주자"는 안은 **이미 검토 후 사용자가 명시 기각**한 안임.

## D3. 말씀노트 모듈(`mod_note`) 본 과제 포함 (2026-07-07 확정)

- **결정**: 모델 부재(검증: grep 0건)에도 불구하고 별도 과제로 빼지 않고 Phase 4로 본 과제에 포함.
- **프라이버시 원칙** (detail_goal §3-3): 노트 내용은 본인만 열람, 통계는 작성 여부/건수만 집계 — 재정처럼 사후 정정하지 않도록 선제 확정.

## D4. 교적 증감 추이 — 전용 이력 테이블 신설 → 기존 `audit_log` 재사용으로 번복 (2026-07-07)

- **경위**: 초안은 "이력 없음 → `member_status_history` 신설 + 백필"로 판정. Cross-LLM 검증자(codex)가 `audit_log`/`members_audit` 존재를 지적 → 재검증 결과 사실 (`00001_schema.sql:139,170-179` — update마다 before/after jsonb 기록).
- **최종**: 등록 추이=`members.created_at`, 전출입=`audit_log`의 status 전환 추출. 전용 테이블 불필요. 한계(트리거 가동 이전 소급 불가)는 "데이터 없음" 표시로 수용.
- **교훈**: 부재 판정은 반드시 grep 증거와 함께 기록 (analysis.md에 적용됨).

## D5. 기술 관례 준수 (2026-07-07, 무이견 확정)

- 차트 라이브러리 도입 금지 — 기존 인라인 SVG(`TrendChart`) 확장. 신규 차트도 "표 보기" 토글 필수(어르신 가독성).
- 집계는 서브페이지당 RPC 1개, `home_feed()` 패턴(역할/모듈 게이트 내장). 차단은 UI 분기가 아닌 RPC/RLS 계층.
- 하단 탭 불변(웹/앱 분리 원칙), 데스크톱 사이드바에 하위 메뉴.
- 주간 기준: KST, 일요일 시작. 성능: stats RPC p95 < 1s.

## 결정별 검증 기준 (AC) — 상세 DoD는 goal.md·detail_goal.md §7이 SSOT

| 결정 | 측정 가능한 AC | 상세 위치 |
|---|---|---|
| D1 (IA) | `/stats` 진입 → 오버뷰 렌더링, 사이드바 하위 5항목, `/church?tab=overview` 307 리다이렉트, 3개 뷰포트(375/768/1280px) 가로 스크롤 0 | goal.md DoD, detail_goal §7 Phase 1 |
| D2 (재정) | grant 없는 일반 pastor 계정: 재정 메뉴·오버뷰 헌금 카드 비노출 + `stats_giving()`/`giving_ledger()` 응답 0건. viewer 계정: 열람 가능·쓰기 거부(RLS). 지정·부여·회수 3 시나리오 + audit_log 기록 | detail_goal §7 Phase 3 |
| D3 (mod_note) | 타인 노트 body 조회 시 RLS 거부(본인 외 0건), 통계 RPC는 건수만 반환(본문 필드 부재), 지표 3종 렌더링 | detail_goal §3-3, §7 Phase 4 |
| D4 (audit_log 재사용) | 테스트 status 전환 N건 → 집계 RPC가 N건 정확 추출, 트리거 이전 구간 "데이터 없음" 표시 | detail_goal §7 Phase 1 |
| D5 (기술 관례) | 신규 의존성 0 (package.json diff), 전 차트 "표 보기" 토글 동작, stats RPC p95 < 1s (시드 규모) | detail_goal §5, §7 공통 |

## 범위 / 리스크 / 자산 fallback 참조

- **범위(in/out)**: in = 5개 도메인 현황 + 오버뷰, 웹·모바일 뷰 모두(단일 반응형, 하단 탭 불변). out = goal.md "비범위" + detail_goal §9 (지출 모델, 커스텀 대시보드 빌더, 크로스앱 통계 등). 기존 관리자 현황 탭은 **완전 대체**(리다이렉트).
- **리스크 등록부**: goal.md "가정/의존성/리스크"가 SSOT (재정 노출 사고→RPC/RLS 계층 차단, 소급 한계→"데이터 없음" 표시, 성능→p95 초과 시 배치/뷰 전환, 낙인 효과→개인 비노출).
- **자산 재사용·fallback**: `home_feed()` 패턴(fallback: 페이지별 개별 쿼리 — 왕복 증가 감수), `audit_log`(fallback: 성능 초과 시 표현식 인덱스→파생 뷰→그래도 부족하면 그때 전용 테이블), `TrendChart`(fallback 불필요 — 순수 SVG), `module_grants`/RLS(fallback 없음 — 보안 축이므로 대체 불가, 실패 시 기능 보류), `notification_settings`(fallback: 다이제스트 기능 자체를 Phase 3에서 제외 가능 — 독립 기능).
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T05:19:06.209Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 기존 자산 재사용 검토가 강함(`module_grants`/RLS, `audit_log`, `TrendChart`, `home_feed()` 패턴). 재정 권한/프라이버시 결정 이력이 명확함.
- 결함/누락: 목표/성공기준은 SSOT 참조만 있고 이 문서 내 측정 가능한 완료 기준이 부족함. 포함 범위는 보이지만 out-of-scope가 명시적이지 않음. 리스크/의존성은 일부만 있으며 백필, 인덱스/성능, 권한 부여 UX, 데이터 누락, 테스트 전략이 빠짐.
- 개선 제안: 기능별 acceptance criteria, in/out scope 표, 리스크 등록부(영향/대응/검증), 기존 자산별 재사용 근거와 fallback을 추가할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- **근거**: 
  1. 결정 이력이 "왜"를 설명하지만, 각 결정의 **검증 기준**(AC)이 빠지면 구현 단계에서 "완료했나?"를 판단 불가. D5의 "p95<1s"는 좋은 예인데, D1~D4엔 측정 가능한 기준이 부재.
  2. 명시적 **out-of-scope**가 없으면 scope creep 위험. 예: 모바일 stats는 별도인지, 관리자 화면의 현황 탭은 완전히 사라지는지 불명확.
  3. **리스크 등록부 부재**. D4에서 "트리거 이전 소급 불가"는 언급했으나, 백필 전략·인덱스 성능·권한 부여 UX·데이터 누락 시 폴백·테스트 전략은 체계적으로 기록되지 않음 → 구현 중 예상 밖 문제 발생.
  4. 기존 자산 재사용 방식이 상세하지 않음. D4는 `audit_log` 근거를 명확히 했으나, `module_grants`/RLS·`TrendChart`·`home_feed()` 패턴은 **어디에 어떻게** 재사용하는지, **fallback**이 뭔지 명시 필요.

- **수정계획**:
  1. 섹션 추가: **"## 범위 정의"** — in-scope(5개 도메인, 웹만), out-of-scope(모바일 별도, 역사 소급 불가) 표 형식.
  2. 각 결정별 **AC 추가**: D1(로드<0.5s, 네비 검증), D2(권한 RLS 테스트 100%), D3(권한 없는 사용자 403), D4(status 추출 100%), D5(p95<1s, 차트 토글, KST 테스트).
  3. **리스크 등록부**: 위험 요소|영향도|대응|검증 방법 테이블.
  4. **자산 재사용 상세화**: 각 자산(module_grants, audit_log, TrendChart, home_feed())별로 용도·근거·fallback 명시.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용한다. 작성자가 원 critique를 정확히 인정했고 수정계획도 타당하지만, 제시된 현재 문서에는 범위 정의, D1~D4의 측정 가능한 AC, 리스크 등록부, 자산 재사용 상세/fallback이 아직 반영되지 않았다. 따라서 문서 기준으로는 기존 결함이 그대로 남아 있어 PASS로 올릴 수 없다.

<!-- /doc-crossverify:managed -->
