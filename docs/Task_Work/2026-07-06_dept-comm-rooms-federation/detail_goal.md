# Detail Goal — 부서 알림·소통 + 모임방 + 연합 참여

## Goal Reference
- `goal.md` / 루트: `docs/Task_Work/2026-07-06_havruta-ecosystem-federation/detail_goal.md`

## 1. 부서 공지 (기존 mod_notice 완성)

현황: `mod_notice.notices.target_department_id` 컬럼은 존재하나 (`00013_modules_p2.sql:11`) `NoticeBoard.tsx`에 미노출.

- 작성 UI: 대상 선택 = 전체 / 부서(복수). 복수 지원 위해 `mod_notice.notice_targets(notice_id, department_id)` 조인 테이블 신설, 기존 단일 컬럼은 마이그레이션 후 유지(하위호환) 또는 뷰로 흡수.
- 작성 권한: `has_module('notice','manager')` **또는** 해당 부서 `department_leaders` — RLS insert 정책에 leader 조건 추가.
- 열람 RLS: 전체 공지 OR 내 소속 부서(`department_members`) 공지만 select.
- 읽음 확인: `mod_notice.notice_reads(notice_id, user_id, read_at)`. 부서장 화면에 읽음률/미읽음 명단.

## 2. 알림센터 + 이벤트 기반 푸시

- `public.notifications` 테이블 (church_id, user_id, kind, title, body, link, read_at). kind는 범용: `dept_notice`, `dept_chat_mention`, `room_approved`, `training_completed`, **`ecosystem.*`(연합 이벤트 착지)**.
- 발송 경로: notices/messages INSERT → Supabase DB Webhook → Edge Function → 대상 조회 → `notifications` INSERT + web-push 발송 (`scripts/send-digest.mjs`의 VAPID 발송 로직 이식).
- 수신 설정: `notification_settings` kind 확장 + 부서별 on/off + 방해금지 시간대. 채팅은 기본 멘션/고정공지만 푸시 (전 메시지 푸시 금지 — 피로도).
- UI: 헤더 종 아이콘 + 알림 목록 + 읽음 처리.

## 3. 모임방 모듈 (mod_rooms)

스키마 초안 (`00019_dept_comm.sql` — 착수 시 최신 번호 재확인, 2026-07-06 기준 최신은 00018):

```sql
create schema mod_rooms;
create table mod_rooms.rooms (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  room_type text not null default 'department'
    check (room_type in ('department','group','bookclub')),
  department_id uuid references public.departments(id),
  name text not null,
  status text not null default 'active',      -- group/bookclub: pending → active
  book_isbn13 text, book_title text,          -- bookclub 전용
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table mod_rooms.room_members (
  room_id uuid references mod_rooms.rooms(id) on delete cascade,
  user_id uuid references auth.users(id),
  role text not null default 'member' check (role in ('owner','manager','member')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create table mod_rooms.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references mod_rooms.rooms(id) on delete cascade,
  sender_id uuid references auth.users(id),
  body text, image_path text,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create table mod_rooms.reading_progress (     -- bookclub 전용
  room_id uuid references mod_rooms.rooms(id) on delete cascade,
  member_user_id uuid references auth.users(id),
  status text not null default 'reading' check (status in ('reading','completed')),
  completed_at timestamptz, confirmed_by uuid,
  primary key (room_id, member_user_id)
);
```

- 부서방: 부서 생성 트리거로 자동 생성(room_type='department'), `department_members` 동기화로 자동 참여, 부서장=manager.
- 일반 모임방(group): 개설 신청 status='pending' → 승인권자(승인 정책: 부서장→자기 부서 스코프, 교역자/관리자→교회 전체) 승인 시 active. `church_approval`(00014) 패턴 재사용.
- 도서모임(bookclub): group과 동일 워크플로우 + 책 지정 + reading_progress. 완독 확정(본인 체크 또는 리더 일괄) 시 `bookclub.completed` outbox 적재 (멤버별 1건).
- 실시간: Supabase Realtime 채널 구독 (`messages` INSERT). RLS: room_members만 select/insert.
- 모듈 등록: `registry.ts`에 `rooms` 추가, `web/src/app/m/rooms/` Board 컴포넌트.

## 4. 연합 참여 기반 (루트 Phase 0/1 이식분)

- `public.outbox_events` (event_id uuid, event_type, payload jsonb, user_ref, status, attempts, next_retry_at) + 발송 워커(Edge Function cron).
- webhook 수신: `web/src/app/api/hooks/havruta/route.ts` — HMAC 검증 → 동의 확인 → kind별 처리(교인카드 타임라인 적재, notifications 생성). 검증 실패 시 401 + audit_log.
- 계정 연결: `user_havruta_links(user_id, havruta_user_id, linked_at)` + 로그인 후 연결 배너.
- 교인카드 타임라인: 기존 교적 화면에 `growth_timeline` 뷰 (수료·완독·진단 등 ecosystem 이벤트 + 자체 mod_training 수료 통합 표시, 출처 앱 표기).
- manna 헌금 연동: `offering.recorded` 수신 → 동의 ON 교인의 mod_giving 기록과 대사(금액 등급만, 원본 금액은 manna 소유 — 루트 개인정보 원칙).

## 5. 구현 순서 (4~5주) — 문서 내 정량 DoD

| 주차 | 작업 | DoD (이 문서 단독으로 판정 가능) |
|---|---|---|
| 1 | 부서 공지 완성 (§1) | RLS 테스트 3종 통과: (a) 타부서원 select 0건 (b) 부서장 자기 부서 insert 허용·타부서 insert 거부 (c) notice_manager 전체 insert 허용. 읽음률 화면에서 미읽음 명단 정확(수기 대조 1회) |
| 2 | 알림센터+푸시 (§2) | E2E: 공지 발행→대상 부서원 알림센터 항목 생성 100% + 푸시 구독자 도달 ≥95% (미구독/권한거부는 인앱만으로 폴백, 실패 로그 0건 아님이 아니라 **미처리 실패 0건**) |
| 3 | 부서방+채팅 (§3 전반) | 부서 생성→방 자동 생성 1:1, 부서원 추가/제거 시 room_members 동기화, 두 세션 메시지 왕복 p95 <2초 (동시 구독 상한 가정: 방당 200명 — 초과 교회는 폴링 전환) |
| 4 | 모임방 승인 + 도서모임 (§3 후반) | pending 방 비승인권자 비노출(RLS), 승인→active 전환, 완독 확정 시 outbox_events 멤버당 정확히 1건 (중복 확정 시 증가 0) |
| 5 | 연합 기반 (§4) | 위조 HMAC 401+audit_log, 동일 event_id 2회 수신 시 notifications/타임라인 row 증가 0 (멱등), 동의 OFF 사용자 처리 0건 |

## 이번 범위 / 비범위 (Scope)

- **포함**: §1~§4 전부, 텍스트+이미지 메시지, 멘션 알림, 도서모임 완독 이벤트 발행.
- **제외**: 파일/영상 첨부 일반화, 1:1 DM, 메시지 암호화(E2EE), 메시지 수정·삭제 정책 고도화(1차는 소프트 삭제만), 연합 이벤트의 **발행측 전체 카탈로그**(루트 소유 — 이 태스크는 `bookclub.completed` 발행 + `reading.completed`/`offering.recorded`/completion 계열 수신만), 푸시의 모바일 네이티브(FCM) 지원(웹푸시만).

## Constraints / RAID

| 유형 | 항목 | 완화 |
|---|---|---|
| Dependency | 5주차 = 루트 contracts v0.1 + HMAC 시크릿 배포 의존 | 1~4주차 독립 진행 |
| Risk | notice 단일 컬럼→notice_targets 전환 중 기존 공지 타겟 유실 | 마이그레이션에서 기존 값 백필 + 전후 카운트 대조, 실패 시 1스텝 롤백 |
| Risk | webhook 중복 발송 → 알림/타임라인 중복 적재 | event_id unique 제약으로 DB 수준 멱등 |
| Risk | 동의 철회 후 기 적재 타임라인 잔존 | 철회 시 ecosystem 출처 항목 soft-delete + 30일 내 hard-delete (루트 개인정보 정책) |
| Risk | 푸시 권한 거부/만료 구독 | 인앱 알림 폴백 + 410 응답 구독 자동 삭제(기존 send-digest 패턴) |
| Risk | room RLS에서 church_id 누수 | 크로스 테넌트 테스트 케이스 필수 (00009 definer guard 패턴 준수) |
| Risk | Realtime 구독 성능 | 방 진입 시에만 구독, 목록은 폴링, 방당 200명 상한 가정 |
| Assumption | Cloudflare(OpenNext)에서 Edge Function 연계 가능 | 실패 시 Supabase 함수 대체 |
| 정책 | 채팅 메시지는 연합 공유 대상 아님 (심방 노트와 동급 민감 취급) | — |

롤백 조건: 마이그레이션 후 무결성 검사(공지 타겟 카운트 대조) 실패 시 즉시 롤백. webhook 수신 5회 연속 처리 실패 시 수신 일시중지 + 알림.

## Quality Bar

- 신규 테이블 전건 RLS 정책 + definer guard 테스트 (기존 00009 패턴).
- 마이그레이션은 최신 번호 다음(2026-07-06 기준 `00019`)부터 순번, 롤백 스크립트 동반.
- 회귀: 출석 체크·교적 조회·기존 공지 스모크 통과 후 머지.

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-06T07:09:53.767Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 기존 `mod_notice`, `church_approval`, VAPID 발송 로직, RLS 테스트 패턴 등 재사용 검토가 비교적 잘 반영됨. 주요 기능별 구현 순서와 의존성도 제시됨.
- 결함/누락: 성공기준이 `goal.md 기준 N`에 의존해 문서 단독으로 측정 불가함. out-of-scope가 명시적이지 않음. 리스크는 일부만 있으며 마이그레이션, 동의/철회, webhook 재시도·중복처리, 푸시 권한 실패, 멀티테넌시 누수 리스크가 부족함.
- 개선 제안: 각 섹션별 정량 DoD를 문서 내에 직접 정의하고, “이번 범위/비범위”를 별도 섹션으로 추가. RAID에 데이터 이관, idempotency, consent, audit, 성능 한계, 롤백 조건을 구체적으로 보강.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- 근거: 문서의 주요 약점이 비평에서 정확히 지적되었음:
  1. **DoD 외부 참조**: "goal.md 기준 1·2·3..." 표현으로는 이 문서만으로 완료 판단 불가. 정량적 기준(예: "RLS 테스트 5개 이상 통과", "푸시 도달률 95%+")을 각 섹션에 내장해야 함.
  2. **Scope 경계 부재**: 채팅 미디어(파일/영상), 읽음 확인 UI 상세, 연합 이벤트 타입 목록 등 "이번엔 제외"할 것들이 명시되지 않아 기대치 충돌 위험.
  3. **리스크 누락**: RAID에 Risk 2개만 있는데, 실제로는:
     - 마이그레이션: 기존 notice 단일 컬럼 → 조인 테이블 전환 중 데이터 손실
     - 동의/철회: 연합 webhook 수신 후 사용자가 동의 철회 시 이미 적재된 타임라인 정리 전략 부재
     - Idempotency: webhook 중복 발송 시 notification/타임라인 중복 적재 방지 메커니즘 미정
     - 권한 실패: 푸시 permission denied 시 폴백 (웹 알림만), audit 로깅
     - 멀티테넌시: room RLS 정책에서 church_id 누수 시나리오 테스트

- 수정계획:
  1. **섹션 2. DoD 상세화** — "구현 순서" 표를 확장해 각 주차의 정량 기준 기재:
     ```
     | 주차 | 작업 | DoD |
     | 1 | 부서 공지 | RLS 정책 3개(insert/select/update), edge case 테스트(리더-비리더 분리) 통과 |
     ```
  2. **신규 섹션: "범위/비범위"** — 명시적으로 제외 목록(파일 업로드, end-to-end 암호화 등) 기재.
  3. **RAID 보강**:
     - Risk → 위의 5개 항목 추가, 각 mitigation 구체화
     - 롤백 조건: "데이터 무결성 검사 실패 시 migration 01step 롤백, webhook 처리 중 5회 연속 실패 시 receiver pause"
  4. **성능 기준**: "Realtime 동시 구독 한계 N명, 초과 시 폴링 전환" 구체화.

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용한다. 저자가 지적을 인정하고 적절한 수정계획을 제시했지만, 현재 문서에는 아직 DoD 외부 참조, 범위/비범위 부재, RAID 리스크 누락이 그대로 남아 있어 PASS로 판정할 수 없다.

<!-- /doc-crossverify:managed -->
