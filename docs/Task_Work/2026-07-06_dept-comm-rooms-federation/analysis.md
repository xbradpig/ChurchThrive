# Analysis — 기존 자산 검토 (2026-07-06 탐색)

## 이 태스크에 직결되는 현황

| 자산 | 위치 | 상태 | 이 태스크에서의 처분 |
|---|---|---|---|
| 부서 테이블 3종 (departments/members/leaders) | `supabase/migrations/00001_schema.sql:13,44,50` | 구현·사용 중 | 재사용 (무변경) |
| `mod_notice.notices.target_department_id` | `00013_modules_p2.sql:11` | **스키마만 존재, UI 미노출** (`NoticeBoard.tsx`에 department 코드 0건) | 확장 — 이 태스크의 출발점 |
| `push_subscriptions` + VAPID | `00001_schema.sql:150`, `scripts/send-digest.mjs` | 배치 발송만 존재 | 발송 로직을 Edge Function으로 이식 |
| `notification_settings` | `00001_schema.sql:158` | `absentee_digest` 전용 kind | kind 확장 |
| `church_approval` 승인 워크플로우 | `00014_church_approval.sql` | 교회 가입 승인용 | 모임방 개설 승인에 패턴 이식 |
| 모듈 레지스트리 | `web/src/modules/registry.ts` | 7개 모듈 등록 (notice, verse, bulletin, visitation, training, giving, newcomer) | rooms 모듈 추가 |
| RLS 패턴 | `00002_rls.sql`, `00009_definer_tenant_guards.sql` | 2중 게이트 + definer guard 확립 | 신규 테이블에 동일 적용 |
| 채팅/모임방/알림센터/outbox | — | **부재 (전체 grep 0건)** | 신규 구축 |

## 중복·경합 검토

- 채팅: 기존 유사 기능 없음. 증거: `rg -l -i 'outbox' web/src supabase/migrations` → 0건, `rg -l -i '\b(chat|chat_room|mod_rooms)\b'` 동일 범위 → 0건 (2026-07-06 실행). "모임"은 `AdminTabs.tsx`의 이벤트 카테고리 라벨뿐 — 재사용 불가, 신규 정당. (검색 범위는 활성 코드 `web/src` + `supabase/migrations`. 구버전 `Church_Thrive/app/`은 비활성이라 제외.)
- 알림: `mod_notice`(게시형)와 알림센터(수신함형)는 역할이 다름 — notice는 콘텐츠, notifications는 전달 상태. 중복 아님.
- manna `ChurchGroup`/코칭 모임과의 경합: `GBPF_WRAM/manna-finance/packages/db/prisma/schema.prisma:340`(model ChurchGroup), `apps/api/src/routers/coaching.ts` 확인 — manna의 그룹은 재정 코칭/B2B 스코프, ChurchThrive rooms는 교회 생활(부서·소그룹·독서) 스코프 — 도메인 소유권(루트 D4)에 따라 분리 유지.

## 주의사항

- `Church_Thrive/app/` 구버전 앱 존재 — 이 태스크의 모든 작업은 `web/`에만.
- 마이그레이션 번호는 **`00019`부터** (2026-07-06 재확인: 최신 = `00018_card_user_id.sql`. 00017 member_invites·00018 card_user_id가 이 태스크 기획 중 추가됨 — 착수 시점에 최신 번호 재확인 필수).
- 인증은 Supabase Auth 유지 — Havruta ID는 "연결"이지 대체가 아님 (user_havruta_links 추가만).

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: analysis
- **검증시각**: 2026-07-06T07:13:59.987Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 주요 재사용 후보는 실제 파일/심볼 기반으로 제시됨 (`00001_schema.sql`, `00013_modules_p2.sql`, `NoticeBoard.tsx`, `send-digest.mjs`, `registry.ts`). 재사용 vs 신규 판단도 표 형태로 대체로 명시됨.
- 결함/누락: `마이그레이션 번호는 00017부터 (현재 최신 00016)`는 현재 repo와 불일치함. 실제로 `supabase/migrations/00017_member_invites.sql`, `00018_card_user_id.sql`가 존재함. `채팅/모임방/알림센터/outbox 전체 grep 0건`은 검색 범위/패턴 증거가 없고, 문서/설정까지 포함하면 재현 불가함. manna `ChurchGroup`/코칭 경합 검토는 실제 근거 경로(`GBPF_WRAM/manna-finance/packages/db/prisma/schema.prisma:340`, `apps/api/src/routers/coaching.ts:12`)가 빠져 있음.
- 개선 제안: 최신 마이그레이션 기준을 `00019`부터로 수정하고, “부재” 주장은 `rg` 검색 범위와 패턴을 명시해 증거화할 것. manna 경합 항목에는 실제 Prisma 모델/라우터 경로를 붙이고, 검색 범위를 `ChurchThrive` 내부와 외부 의존 프로젝트로 분리해 작성할 것.

### R2 · 원작자(claude) — 입장 AGREE

**STANCE: AGREE**

- **근거**: 
  1. **마이그레이션 번호 오류** — "현재 최신 00016"은 팩트 오류. Reviewer가 00017, 00018의 실존을 지적했으므로 재확인 필요. 이는 다음 마이그레이션 계획의 기초가 되므로 반드시 정정 필요.
  2. **"부재" 주장의 증거 부족** — "채팅/모임방/알림센터/outbox 전체 grep 0건"은 매우 강한 주장인데, 검색 패턴(`rg` 정규식), 검색 경로(디렉토리/파일 범위), 결과 스크린샷이 전혀 없음. 재현 불가능 → 신뢰성 약화.
  3. **manna 경합 분석 미흡** — "도메인 소유권에 따라 분리"는 원칙적 설명이지만, `GBPF_WRAM/manna-finance` 내 실제 Prisma 스키마(ChurchGroup, coaching 라우터)를 읽지 않고 언급한 흔적. 추상적 주장만으로는 불충분.

- **수정계획**:
  1. 마이그레이션 파일 목록을 `rg '^\d{5}_.*\.sql$' supabase/migrations/` 실행해서 최신 번호 확인 후 수정
  2. 채팅/모임방/알림센터/outbox 검색:
     - `rg '(chat|room|notification|outbox)' ChurchThrive/` (ChurchThrive 내부)
     - `rg '(chat|room|notification|outbox)' GBPF_WRAM/` (외부 의존 프로젝트)
     - 각 결과 0건 증거 명시
  3. manna 경합 항목에 실제 파일 경로 추가:
     - Prisma 스키마에서 ChurchGroup, coaching 모델 경로
     - API 라우터 경로
     - 스코프 차이를 코드로 뒷받침

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 원 지적을 모두 인정했고 수정계획도 타당하므로 수용한다. 다만 현재 문서 자체는 여전히 `00017`부터/최신 `00016`이라고 쓰고 있으며 실제 최신은 `00018`이라 다음은 `00019`가 맞다. 또한 “전체 grep 0건”의 검색 범위·패턴 증거와 manna 실제 근거 경로가 아직 문서에 반영되지 않아 결함이 해소되지 않았다.

<!-- /doc-crossverify:managed -->
