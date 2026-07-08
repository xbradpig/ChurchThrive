# AI Agent Context Router

> This project was automatically instrumented by Agent Skill MCP.
> Use Arete wrapper commands so agent/skill/MCP/workflow activity is recorded:
> - arete codex
> - arete claude
> - arete gemini

## Project

ChurchThrive

## 하브루타 생태계 역할 (MUST)

> 정본: `../docs/guides/havruta-ecosystem.md` · 지도: `../docs/index/ecosystem-map.md` · 이 앱 역할: `docs/index/ecosystem-role.md`

**축: 공동체 (허브 아님 — 대등 연합의 한 축).** 소유 도메인 = 교회·출석·교적·사역·교육·**공동체 그룹(방)** · 교인카드(**타 앱 이력을 수집하는 뷰**, 소유·발행자 아님).

- **발행**: `bookclub.completed`(도서모임 완독), `campaign.created`(교회 특별 프로젝트/암송 캠페인), `room.reflection.posted`(그룹 나눔)
- **구독**: `reading.completed`·`campaign.progress`·`reflection.shared`(Family_Verse), `diagnosis.completed`(COMPASS), `training.completed`(BlueHill) → 교인카드·그룹 피드·현황 대시보드
- **재정 금액은 교인카드에 수집하지 않음**(민감 도메인, manna 소유). 연합 이벤트 수신함 = 알림센터(notifications) 겸용. 방 연동은 **연합 방 모델 확정 대기**.

## Capability-First (MUST)

Before building anything new, review the capabilities this framework already provides
(agents / skills / MCP / workflows) and reuse them:

- Catalog: `docs/index/capability-catalog.md`
- Procedure: `docs/guides/capability-first-execution.md`

## Goal-Driven Execution

`/goal` requests read `docs/goal-driven-execution/detail_goal.md`. Each task lives in
`docs/Task_Work/{YYYY-MM-DD}_{slug}/` with `goal.md`, `detail_goal.md`, and `analysis.md` required first.

## Learning

- Local memory: `.arete/memory/skill-observations.jsonl`
- Project-local skills: `.arete/skills/local/`
- Exports: `.arete/exports/`
- Proposals: `.arete/proposals/`

## Policy

Project-specific knowledge stays local. Only anonymized, evidence-backed, approved patterns can become Agent Skill MCP core improvements.
