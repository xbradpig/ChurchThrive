# Detail Goal — 교적카드 셀프서비스 구현 설계

> 2026-07-07 · goal.md 실행 설계. 근거: analysis.md

## 결정

1. **교인 등록은 즉시, 수정은 승인제** (사용자 확정). 등록 직후 값은 본인 입력이므로 신뢰, 이후 변경은 기록 무결성을 위해 담당자 검수.
2. **`update_my_card` 재정의로 하위호환** — 기존 클라이언트가 호출해도 즉시 반영 대신 수정 요청이 생성됨 (파손 없음, 정책만 강화).
3. **승인 권한** = `superadmin`/`pastor`(교역자) + `has_module('core','manager')`(담당 권한자) — 기존 모듈 권한 체계 재사용, 신규 역할 없음.
4. **대기 요청은 교인당 1건** — 부분 unique 인덱스 `(member_id) where status='pending'`, 새 요청이 기존 pending을 갱신.
5. **알림 2채널**: 홈 todo(즉시, 인앱) + 웹푸시(크론, `notified_at`로 1회 보장). 인앱 알림센터는 dept-comm-rooms 과업 몫 — 중복 설계 금지.
6. **diff 저장**: `changes`에는 현재 값과 다른 필드만 저장. 승인 시 스냅샷 그대로 적용 (요청 후 담당자가 먼저 바꾼 필드도 요청 값이 승리 — 마지막 결정이 SSOT, audit_log로 추적 가능).

## W1. `00030_member_card_self_service.sql`

```text
member_edit_requests: id·church_id·member_id·requested_by·changes jsonb·note·
  status(pending/approved/rejected)·decided_by·decided_at·decide_note·notified_at·created_at
  부분 unique (member_id) where pending · index (church_id, status)
RLS: select = 본인 요청 or 승인권자. 쓰기 = RPC 전용(DEFINER)

RPC (전부 SECURITY DEFINER + 내부 가드):
- register_my_card(p jsonb) → uuid    : my_member_id() null 필수, name 필수,
    insert members(name·suffix·phone·birthday·address, type=registered, user_id=auth.uid())
    + QR 토큰. unique 충돌 → 친절 안내 예외
- request_my_card_edit(p jsonb, p_note) → uuid : 화이트리스트(name·phone·birthday·address·family_note),
    현재 값과 diff, 빈 diff 거부, pending upsert(notified_at 리셋)
- my_edit_request() : 내 최신 요청 (배너용)
- member_edit_requests_list() : 승인권자 — pending + 교인명 + 현재값 스냅샷
- member_edit_decide(p_id, p_approve, p_note) : 승인 시 화이트리스트만 반영(coalesce 아닌 키 존재 기준),
    상태 갱신. members 감사는 기존 tg_members_audit이 자동 기록
- update_my_card(...) 재정의 → request_my_card_edit로 위임 (하위호환)
- home_feed() 재정의 → 'edit_pending' 키 추가 (승인권자에게만)
- revoke delete on members from authenticated (명시적 belt)
```

## W2~W5. UI

- **W2 `/me`**: 카드 없음 → `RegisterCard`(이름·구분·연락처·생년월일·주소) → `register_my_card` → refresh. 카드 있음 → `MemberCard`에 `editRequest` prop — pending이면 "승인 대기 중" 배너+요청 내용, 수정 폼은 name·phone·birthday·address·family_note + 메모 → `request_my_card_edit`.
- **W3 승인 큐**: `MembersDirectory`에 join 큐와 나란히 "교적 수정 요청" 섹션 — 교인명, 필드별 `현재 → 요청` diff, 메모, 승인/거절.
- **W4 홈 todo**: `edit_pending` > 0 → "📇 교적 수정 요청 승인 N건" → `/church?tab=members`.
- **W5 푸시**: `send-digest.mjs`에 매 실행마다 `notified_at is null` pending 요청을 교회별 집계 → 해당 교회 승인권자(superadmin/pastor church_roles)의 구독에 발송 → `notified_at` 마킹.

## W6. 검증

| 시나리오 | 기대 |
|---|---|
| 교적 없는 교인 `register_my_card` | 카드 생성 + QR, /me에 카드 표시 |
| 이미 카드 있는데 재등록 | 예외 "이미 교적이 연결되어 있습니다" |
| 동명 unique 충돌 | 예외 (담당자 문의 안내) |
| 교인 수정 요청 | members **무변경**, pending 1건, 홈 todo 카운트 증가 |
| 같은 교인 재요청 | pending 1건 유지(내용 갱신) |
| 승인 | members 반영 + status=approved + audit_log |
| 거절 | members 무변경 + status=rejected |
| 화이트리스트 외 필드(position 등) 포함 | 무시(strip) 또는 거부 — strip 채택 |
| 교인의 members DELETE 시도 | 권한 거부 (revoke) |
| member 역할이 `member_edit_decide` 호출 | 예외 |
