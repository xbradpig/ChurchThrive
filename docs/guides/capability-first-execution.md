# Capability-First Execution

> Before building anything new for a task, review the capabilities this framework
> already provides and reuse them. Building from scratch when a capability exists
> causes duplication and bypasses verification gates.

## Decision procedure (every task)

1. Search built capabilities: agents (`docs/index/capability-catalog.md`), skills, MCP tools, workflows.
2. Full match -> call/delegate it. Partial -> extend/compose. No match -> build new, and record why.
3. Record the review + decision in `docs/Task_Work/{id}/analysis.md`.

## Completion is not scaffold existence

Creating the task scaffold (`goal.md`, `detail_goal.md`, `analysis.md`, ...) is only the FIRST step.
A task is complete only when the actual implementation works and every gate has real evidence.
Never report "complete" because template/scaffold files exist.
