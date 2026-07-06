# /goal Call Prompt

Use this compact prompt when another LLM supports a short /goal field:

```text
Read ai_agent.md, docs/index/capability-catalog.md (reuse built agents/skills/MCP/workflows first), and docs/goal-driven-execution/detail_goal.md. Create or resume docs/Task_Work/{YYYY-MM-DD}_{slug}/ with goal.md, detail_goal.md, analysis.md, context.md, plan.md, progress.md, decisions.md, verification.md, and subgoals/. Scaffolding is only step 0 — it does not complete the task. Execute each step through capability-first, duplication, implementability, completeness, regression, and documentation gates with real evidence. A task is complete only when the implementation actually works and verification.md gates are filled with concrete results (not "pending"); never report complete because template files exist. When complete, distill durable facts to docs/index/ and procedures to docs/guides/, then write .distilled with the updated durable paths.
```
