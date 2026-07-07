# Goal — 교적카드 셀프서비스 (등록·수정 승인 워크플로)

> 2026-07-07 · 사용자 요청: 교적카드를 교역자·담당자·교인이 직접 등록, 교인 수정은 승인제, 본인 삭제 불가, 수정 요청 시 담당자·교역자 알림

## 목표 (사용자 요구 → 설계 매핑)

| 요구 | 설계 |
|---|---|
| 교역자·담당자 등록 | 기존 `admin_upsert_member` 유지 (변경 없음) |
| **교인 직접 등록** | 신규 `register_my_card` — 교적 미연결 사용자가 본인 카드 생성 (즉시 반영, QR 토큰 발급 포함) |
| **교인 수정 = 승인제** | 신규 `member_edit_requests` 큐 — 교인이 수정 요청 → 교역자/담당 권한자 승인 시 반영. **기존 `update_my_card`(즉시 반영)를 요청 생성으로 재정의** |
| **본인 삭제 불가** | 현재도 members에 DELETE 정책·RPC 전무 (구조적 불가) — `revoke delete` 명시 + 문서화로 확정 |
| **담당자·교역자 알림** | ① 홈 "해야 할 일"에 수정 요청 N건 (`home_feed`에 `edit_pending` 추가) ② 웹푸시: `send-digest.mjs` 크론에 미통지 요청 즉시 통지 섹션 추가 (`notified_at` 마킹) |

## 완료 기준 (DoD)

- [x] `00030` 마이그레이션 적용 완료 (RPC 6종+재정의, home_feed edit_pending, delete revoke)
- [x] 화이트리스트 강제 (`request_my_card_edit` — 그 외 키 strip)
- [x] `/me` 등록 폼(RegisterCard) + 수정 요청 폼 + 대기/반려 배너 (MemberCard)
- [x] `/church?tab=members` 승인 큐 (diff `현재→요청` 표시, 승인/반려)
- [x] 홈 todo edit_pending + 푸시 크론(send-digest.mjs, notified_at 1회 보장·실패 재시도)
- [x] typecheck·build·배포 + 런타임 검증 (2026-07-07, 롤백 트랜잭션):
  ① 요청 생성 ✓ ② members 무변경 ✓ ③ 재요청 시 pending 1건 유지 ✓ ④ 교인 승인 시도 거부 ✓
  ⑤ 교인 DELETE 권한 거부 ✓ ⑥ home_feed edit_pending=1 ✓ ⑦ 승인 큐 조회 ✓
  ⑧ 승인 → phone 반영 ✓ ⑨ status=approved ✓ (거절 경로·푸시 발송은 실사용 확인 예정)

## 가정 / 리스크

- **가정**: 교인 1인당 대기 요청 1건 (새 요청이 기존 pending을 대체). 승인 시 반영 값은 요청 시점 스냅샷.
- **리스크**: ① 동명이인 unique 충돌(자기 등록) → 친절한 안내 메시지("이미 등록된 교적이 있을 수 있습니다. 담당자에게 문의…") — 타인 카드 자동 연결은 신원 검증 문제로 금지 ② 기존 배포 클라이언트의 `update_my_card` 직접 호출 → 재정의로 요청 큐에 흡수(파손 없음) ③ 푸시 중복 발송 → `notified_at` 마킹으로 1회 보장

## 의존성·계약 (검증 R1 반영 — 상세는 detail_goal.md)

- **RPC 6종+1**: `register_my_card(p)`(본인, 카드 없음 필수) / `request_my_card_edit(p, note)`(본인) / `my_edit_request()`(본인) / `member_edit_requests_list()`(승인권자) / `member_edit_decide(id, approve, note)`(승인권자) / `can_decide_member_edit()`(판정 헬퍼) / `update_my_card` 재정의(위임). 승인권자 = superadmin·pastor·`has_module('core','manager')`.
- **auth 연결**: 본인 판정은 전부 `my_member_id()`(= members.user_id = auth.uid()) 경유. RLS select = 본인 요청 or 승인권자, 쓰기는 DEFINER RPC 전용.
- **audit_log**: 승인 반영은 members UPDATE → 기존 `tg_members_audit` 트리거가 before/after 자동 기록 (신규 action 불필요).
- **home_feed 계약**: `edit_pending`(number|null) 키 추가 — null이면 위젯 미표시(기존 키들과 동일 규약).
- **배포 순서**: ① 00030 DB 적용(이 시점부터 구 클라이언트의 `update_my_card`도 승인 큐로 흡수 — 즉시 반영만 사라짐, 에러 없음) ② 웹 배포 ③ 크론 스크립트는 서버 파일이라 배포와 동시 적용. 롤백: RPC들 drop + `update_my_card`를 00003 원본으로 재정의 + 테이블 drop.
- **푸시 fallback**: 발송 성공 후에만 `notified_at` 마킹 — 실패 시 null 유지로 다음 시간 크론이 자동 재시도. 죽은 구독(404/410)은 기존 스크립트 규약대로 삭제.

## 비범위

- 사진(photo_url) 변경 — 업로드 플로우 별도 과업
- 실시간 푸시 API 라우트 (크론 스크립트 확장으로 갈음, 실시간화는 후속)
- 승인 이력 화면 (audit_log에는 기록됨)
- `revoke_my_card` 류 본인 삭제·연결해제 — **의도적으로 제공하지 않음** (사용자 요구: 본인 삭제 불가)

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T10:07:12.184Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 요구→설계 매핑과 DoD가 구체적이며, `admin_upsert_member`, `update_my_card`, `home_feed`, `send-digest.mjs`, `audit_log` 등 기존 자산 재사용 검토가 반영됨.
- 결함/누락: 의존성 섹션이 부족함. auth-교적 연결 방식, RLS/승인 권한, 담당자 범위, push subscription/크론 운영, `home_feed`/`audit_log` 계약, 배포 순서·하위호환 리스크가 명시되지 않음. `RPC 6종`, `런타임 검증`도 측정 가능성이 낮음.
- 개선 제안: RPC 6종 이름과 권한을 명시하고, 등록/수정요청/금지필드/승인/거절/home todo/푸시 1회 발송에 대한 acceptance test를 추가. 의존성·배포 순서·푸시 실패 시 fallback을 별도 항목으로 보강.

### R2 · 원작자(claude) — 입장 AGREE

**STANCE: AGREE**

- **근거:**
  - `RPC 6종`이 DoD에만 있고 구체적 명시 없음. 실제로 어떤 RPC인지(`submit_edit_request`, `approve_edit_request`, ... 등 이름과 권한)가 불명.
  - **의존성 섹션 전무** — `member_edit_requests`가 기존 `members`, `audit_log`, `home_feed`와 어떻게 연결되는지, RLS 정책이 어떻게 구성되는지 명시 필요.
  - 배포 순서 미명시 — 마이그레이션 후 프론트엔드 언제 배포? 기존 클라이언트의 `update_my_card` 호출을 어떻게 안전하게 흡수?
  - 푸시 실패 fallback 없음 — `notified_at` 마킹만으로는 실패 시나리오 미흡.
  - Acceptance test 없음 — "승인/거절/수정 요청" 각각을 어떻게 검증하는지 구체적이지 않음.

- **수정계획:**
  1. **의존성** 섹션 추가:
     - auth/RLS: "(`auth.uid` = `member.user_id`)만 `submit_edit_request` 호출 가능" 등 정책 명시
     - `home_feed` 계약: `edit_pending` 항목의 count_badge 필드, refresh 트리거
     - `audit_log`: `action='member_edit_request.submitted'|'approved'|'rejected'` 항목
  2. **RPC 6종 명시**: `submit_edit_request(delta)`, `approve_edit_request(id, delta)`, `reject_edit_request(id)`, `get_pending_edits()`, `register_my_card()`, `revoke_my_card()` 각각의 권한·파라미터
  3. **배포 순서**: ① DB 마이그레이션 ② RPC 배포 ③ 프론트엔드 배포 (기존 클라이언트와의 downgrade 리스크 명시)
  4. **Acceptance test 추가**: 등록 성공/충돌, 수정 요청 제출/승인/거절, home todo 반영, 웹푸시 1회 발송 테스트 케이스
  5. **푸시 fallback**: 실패 시 `notified_at=NULL` 유지 → 다음 크론 재시도, 또는 alert 로깅

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 작성자 반론은 기존 지적을 대부분 수용했지만, 제시된 문서에는 아직 수정계획이 반영되지 않았습니다. RPC 6종의 이름·권한, auth/RLS·home_feed·audit_log 계약, 배포 순서, 푸시 실패 fallback, 구체 acceptance test가 여전히 빠져 있어 PASS로 보기 어렵습니다.

<!-- /doc-crossverify:managed -->
