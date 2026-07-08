# ChurchThrive — 하브루타 생태계 역할

> 정본(세계관·연동 전문): `../../../docs/guides/havruta-ecosystem.md` · 지도: `../../../docs/index/ecosystem-map.md`
> 이 문서는 ChurchThrive의 **연합 내 역할**만 다룹니다. 세계관 사실은 정본에서 관리.

## 축과 소유 도메인

**공동체** 축 (허브 아님 — 대등 연합의 한 축, 단독 서비스로 완결).
소유: 교회·출석·교적·사역·교육·**공동체 그룹(방)**. 그리고 **교인카드 = 타 앱이 발행한 이력을 수집·표시하는 뷰**(수집자이지 소유·발행자가 아님).

## 발행 이벤트

| 이벤트 | 트리거 | 페이로드 핵심 |
|---|---|---|
| `bookclub.completed` | 도서모임 방에서 완독 | user(Havruta ID), isbn(13), room_id |
| `campaign.created` | 교회 특별 프로젝트/암송 캠페인 개설 | campaign_id, 구절 목록(reference), 기간, 대상 |
| `room.reflection.posted` | 그룹에 나눔 게시 | room_id, reflection 요약, user |

## 구독 이벤트 → 처리

| 이벤트 | 발행처 | ChurchThrive 처리 |
|---|---|---|
| `reading.completed` | Family_Verse | 교인카드에 완독 뱃지(ISBN-13 병합) |
| `campaign.progress` | Family_Verse | 캠페인 참여 집계 대시보드(`stats_verse` 계열) |
| `reflection.shared` | Family_Verse | mod_rooms 그룹 피드에 출처 뱃지 게시 + Realtime 팬아웃 |
| `diagnosis.completed` | COMPASS | 교인카드 진단 이력 |
| `training.completed` | BlueHill | 교인카드 수료 이력 |

## 원칙·경계

- **재정 금액은 수집하지 않음** (manna 소유, 민감). 교인카드는 수료·완독·완주·진단 이력만.
- 연합 이벤트 수신함 = **알림센터(notifications)** 겸용.
- 그룹(방) 연동은 **연합 방(Federated Rooms) 모델 확정 대기** — 정본 §6.
- 교인≠계정 3단 매핑(D13): 비계정 교인은 연합 이벤트 미발생.
- 이미 목표 스택(Next+Supabase+CF). Havruta_Web과 **별도 Supabase 프로젝트 유지**(데이터 병합·앱 간 FK 금지).
