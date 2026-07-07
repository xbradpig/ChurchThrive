# Analysis — 교적카드 셀프서비스 (현황 조사)

> 2026-07-07 · migrations 00001–00029 + web/src 실사 (서브에이전트 전수 조사)

## 1. 현재 교적 쓰기 경로 (전체)

| 경로 | 주체 | 방식 | 상태 |
|---|---|---|---|
| `admin_upsert_member` (00024) | superadmin/pastor | 즉시 반영 (name·suffix·phone·birthday·position·status) | 유지 |
| `approve_join` (00012) | 교역자 승인 | 신규 생성(+QR 토큰) 또는 기존 카드에 user_id 연결 | 유지 |
| `create_member_invite`/수락 (00017) | 담당자 초대 | 기존 카드에 계정 연결 | 유지 |
| **`update_my_card` (00003)** | **교인 본인** | **즉시 반영 (phone·address·photo_url·family_note) — 승인 없음** | **재정의 대상** |
| 교인 본인 신규 생성 | — | **없음** | 신설 대상 |

## 2. 삭제 현황 — 이미 구조적 불가

- `members`에 DELETE RLS 정책 없음, delete RPC 없음 (00001 주석 "hard-delete 금지" 설계).
- 컬럼 GRANT도 select/insert/update만 — 이번에 `revoke delete` 명시로 belt-and-braces.

## 3. 알림 인프라 현황

- **인앱 알림 테이블 없음.** 홈 "해야 할 일"(`home_feed` 카운트)이 사실상 인앱 알림 표면 — `join_pending` 등과 같은 패턴으로 `edit_pending` 추가가 정합적.
- **웹푸시**: `push_subscriptions` + `notification_settings` + `scripts/send-digest.mjs`(crontab 매시, service-role) — 앱 내 발송 경로 없음. 크론 스크립트에 섹션 추가가 최소 비용 경로. 중복 방지는 요청 행에 `notified_at`.

## 4. 관련 제약·재사용 지점

- `members` unique `(church_id, name, name_suffix)` — 자기 등록 시 충돌 가능 (동명이인/기존 미연결 카드). 자동 연결은 타인 카드 탈취 위험 → 금지, 안내 후 담당자 경유.
- QR 토큰: `member_qr_tokens(member_id PK, token unique)` — `approve_join`의 `encode(extensions.gen_random_bytes(24),'hex')` 패턴 재사용.
- 승인 큐 UI: `MembersDirectory.tsx`의 join_requests 인라인 큐 패턴 재사용.
- 홈 todo: `home/page.tsx` todos 배열 + Feed 타입에 1키 추가.
- `field_visible()`은 **읽기** 게이트 — 수정 권한과 무관. 수정 화이트리스트는 RPC에서 강제.
- 00028에서 `is_senior_pastor()` 등장 — 승인 권한은 기존 관례(superadmin/pastor + `has_module('core','manager')`)로 충분, senior 구분 불필요.

## 5. 최신 상태 확인

- 다음 마이그레이션 번호: **00030** (00028 stats, 00029 mod_note까지 적용됨)
- `home_feed` 최종 정의 = 00025 (이후 재정의 없음) → 00030에서 전체 복제 + `edit_pending` 키 추가
