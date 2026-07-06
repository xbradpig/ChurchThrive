# Goal

> 루트 생태계 기획: `../../../../docs/Task_Work/2026-07-06_havruta-ecosystem-federation/`
> 이 태스크는 ChurchThrive 앱 내부의 세부 구현만 다룬다.

## Final Objective

ChurchThrive에 (1) 부서별 알림·소통(부서 타겟 공지 + 읽음 확인 + 인앱 알림센터 + 이벤트 기반 웹푸시), (2) 모임방 모듈(부서방 자동 생성 → 일반 모임방 개설 승인 → 도서 모임 타입), (3) 하브루타 연합 참여 기반(outbox/webhook, 계정 연결, manna-finance 헌금 연동)을 기존 모듈 아키텍처(registry.ts + 스키마별 모듈 + RLS 2중 게이트) 위에 구현한다.

## Success Criteria

- [ ] 부서 공지: 부서장이 자기 부서에만 공지 작성 가능, 타부서원에게 미노출 (RLS 테스트), 읽음/미읽음 목록을 부서장이 조회
- [ ] 알림센터: 공지 발행 시 대상 부서원에게 인앱 알림 + 웹푸시 도달 (E2E), 사용자별 kind·부서별 on/off 동작
- [ ] 부서방: 부서 생성 시 소통방 자동 생성, 부서원 자동 참여, Realtime 메시지 왕복 <2초
- [ ] 일반 모임방: 개설 신청 → 승인권자(부서장/교역자/관리자) 승인 → 활성화 워크플로우 동작, 미승인 방 비노출
- [ ] 도서모임: room_type='bookclub' 방에서 멤버별 완독 확정 시 outbox에 `bookclub.completed` 적재
- [ ] 연합: HMAC webhook 수신 엔드포인트가 위조 서명 거부, `reading.completed` 수신 시 교인카드 타임라인 표시
- [ ] 기존 기능 회귀 없음 (출석·교적 스모크 통과)

## Non-Goals

- 범용 메신저 수준 채팅 (1:1 DM, 통화, 파일 전송 일반화 — 후속 판단)
- mod_verse 폐지 (Phase 2 완료 전 금지 — 루트 decisions D4)
- manna 쪽 구현 (GBPF_WRAM Task_Work 소유)
- `Church_Thrive/app/` 구버전 정리

## Assumptions / Dependencies / Risks

| 유형 | 항목 | 대응 |
|---|---|---|
| Dependency | 웹푸시 = 기존 VAPID/`push_subscriptions` 인프라 (신규 제공자 없음) | `send-digest.mjs` 발송 로직 이식 |
| Dependency | 실시간 = Supabase Realtime (기존 스택, 추가 인프라 없음) | 방 진입 시에만 구독 (성능) |
| Dependency | 5주차(연합)는 루트 태스크의 contracts v0.1 + HMAC 규격·시크릿 배포에 의존 | 1~4주차는 독립 진행, 5주차만 블로킹 허용 |
| Dependency | manna 헌금 연동 계약·계정 연결 API는 루트+GBPF Task_Work 공동 소유 | 이 태스크는 수신·표시만 구현 |
| Risk | 신규 마이그레이션(00019~, 착수 시 재확인)이 기존 부서/공지 데이터 훼손 | 롤백 스크립트 동반, 스테이징 dry-run 필수 |
| Risk | 연합 webhook 장애가 코어로 전파 | outbox 격리 + 수신 실패는 알림센터만 영향 |
| Assumption | Cloudflare(OpenNext)에서 Edge Function 연계 가능 | 실패 시 Supabase 함수 대체 (detail_goal RAID) |

## 기존 자산 재사용 (capability-first)

| 자산 | 판정 | 신규 범위 |
|---|---|---|
| `mod_notice.notices.target_department_id` (잠자는 스키마) | 확장 | notice_targets 조인 + UI 노출 |
| `departments`/`department_members`/`department_leaders` | 재사용 | 변경 없음 (RLS 조건에 참조만) |
| `push_subscriptions` + `send-digest.mjs` VAPID 발송 | 이식 | Edge Function 이벤트 발송 |
| `notification_settings` | 확장 | kind 추가 + 부서별 on/off |
| `church_approval` 승인 워크플로우 (00014) | 패턴 재사용 | 모임방 개설 승인에 이식 |
| `registry.ts` 모듈 레지스트리 / RLS 2중 게이트 (00002/00009) | 재사용 | rooms 모듈 등록 |
| `mod_rooms`, `notifications`, `outbox_events` | **신규** | 기존 자산 없음 확인됨 (탐색 근거: analysis.md) |

## 성공기준별 검증 방법

| 기준 | 검증 | 위치(예정) |
|---|---|---|
| 부서 공지 RLS | pgTAP/SQL 테스트: 타부서원 select 0건, 부서장 insert 허용 | `supabase/tests/rls_dept_notice.sql` |
| 알림 도달 | Playwright E2E: 공지 발행→알림센터+푸시 수신 | `web/e2e/dept-notice-push.spec.ts` |
| 부서방 채팅 | E2E: 두 세션 메시지 왕복 <2초 | `web/e2e/dept-room-chat.spec.ts` |
| 모임방 승인 | E2E: 신청→pending 비노출→승인→노출 | `web/e2e/room-approval.spec.ts` |
| bookclub outbox | SQL: 완독 확정 후 outbox_events 1건/멤버 | `supabase/tests/bookclub_outbox.sql` |
| webhook 보안 | curl 유효/위조 서명 → 2xx/401 + audit_log | 루트 verification.md V5 공용 |
| 회귀 | 기존 출석·교적 스모크 스위트 | 기존 `scripts/verify-e2e.mjs` |

## Invariant Principles

- 모든 신규 테이블은 `church_id` + RLS 2중 게이트 기존 패턴 준수.
- 모듈 추가는 registry.ts 단일 소스 경유.
- 연합 장애가 코어 기능(출석/교적)을 막지 않는다 (outbox 격리).

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-06T07:09:10.623Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 성공기준이 RLS 테스트, E2E, `<2초`, 회귀 스모크 등으로 비교적 측정 가능하게 정의됨. scope/non-goals도 ChurchThrive 내부 구현과 외부 소유 범위를 잘 구분함.
- 결함/누락: 리스크/의존성/가정 섹션이 없음. Web Push 인프라, Realtime, HMAC 시크릿, 연합 webhook 계약, 계정 연결, manna 연동 계약, 권한 데이터, 마이그레이션/롤백 리스크가 누락됨. 기존 자산 재사용은 아키텍처 수준 언급만 있고 실제 capability-first 검토 목록은 부족함.
- 개선 제안: `Assumptions / Dependencies / Risks` 섹션을 추가하고, 기존 알림·부서·방·outbox·RLS 패턴 중 재사용할 자산과 새로 만들 범위를 표로 명시. 각 성공기준에는 대응 테스트 종류/파일 또는 검증 방법을 붙일 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- **근거**: 
  - 리뷰어 지적이 구체적이고 정당합니다. 실제로 본 문서는 "**무엇을**" 하는지는 명확하지만, "**언제 실패할 수 있고, 무엇에 의존하며, 기존 코드를 정확히 어떻게 재사용**"하는지가 누락되었습니다.
  - 특히 Web Push 인프라, HMAC 시크릿, manna 연동 계약, 연합 webhook 계약 같은 것들은 구현 난도와 일정을 결정하는 핵심 의존성인데, 현재 문서에는 "아키텍처 수준"의 언급만 있을 뿐 **위험 매트릭스**가 없습니다.
  - Capability-first 실행 원칙(docs/guides/capability-first-execution.md)에 어긋납니다 — 기존 alerting, department, room, outbox, RLS 패턴을 **구체적으로 어디서 재사용하고 어디서 신규 구성**하는지 표로 명시해야 합니다.

- **수정계획**:
  1. **Assumptions / Dependencies / Risks** 섹션 추가 (3행 이상):
     - 외부 의존성: Web Push 제공자, Realtime 스택, HMAC 라이브러리
     - 내부 의존성: manna-finance 시스템, 연합 webhook 계약, 계정 연결 API
     - 위험: 마이그레이션 중 기존 부서/메시지 손실, 연합 서비스 장애 전파
  
  2. **기존 자산 재사용 테이블** 추가:
     | 자산 | 재사용? | 신규 범위 | 검증 |
     |------|--------|---------|------|
     | Notification 알림 패턴 | ✓ 확장 | 웹푸시 토픽 매핑 | integration-test/.../push-notification.spec.ts |
     | Department RLS | ✓ 기존 | - | 기존 dept RLS 테스트 통과 |
     | Room Realtime | ✓ 기존 | 부서방 자동생성 hook | e2e/realtime-dept-room.spec.ts |
     | Outbox 패턴 | ✓ 기존 | bookclub.completed 이벤트 | db/migration/.../add-bookclub-outbox.sql |
  
  3. **성공기준별 검증 방법** 명시:
     ```
     부서 공지: 
       - Unit: RLS policy test (roles_dept_cte 필터)
       - File: tests/db/rls/department-notice.spec.ts
       - Acceptance: 타부서원 쿼리 시 403 반환
     ```

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용합니다. 작성자가 지적을 인정했고 수정계획도 타당하지만, 현재 문서 본문에는 아직 Assumptions / Dependencies / Risks, 기존 자산 재사용 테이블, 성공기준별 검증 방법/파일 매핑이 반영되어 있지 않습니다. 계획만으로는 결함이 해소되지 않았으므로 NEEDS-REVISION입니다.

<!-- /doc-crossverify:managed -->
