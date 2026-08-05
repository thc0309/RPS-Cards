---
name: vibe-build
description: Implement one task or autonomously complete all planned tasks with tests, verification, status updates, and no automatic commit.
---

Use `incremental-implementation` and `test-driven-development`.

Invocation modes:

- `$vibe-build TXX`: implement only the requested task.
- `$vibe-build`: implement the next unchecked task in `tasks/todo.md`.
- `$vibe-build all`: autonomously implement every unchecked task in dependency order and return one final handoff for human review.

For `$vibe-build all`:

1. Read `tasks/todo.md`, `tasks/plan.md`, and only the relevant `SPEC.md` sections for unchecked tasks.
2. Build tasks one at a time in dependency order, including across phase checkpoints.
3. Treat checkpoints as progress markers, not approval gates.
4. Resolve ordinary implementation ambiguity with the minimum choice consistent with `SPEC.md`, existing code, and project conventions; record material decisions in `tasks/plan.md`.
5. After each task, run its verification, update `tasks/todo.md`, and record evidence in `tasks/plan.md`.
6. If verification fails, use `debugging-and-error-recovery`, fix the root cause when possible, and retry before declaring a blocker.
7. Continue without asking between tasks. Stop only for an unresolved blocker, a material contradiction in `SPEC.md`, missing external access, a destructive or irreversible action requiring approval, or an explicit user stop.
8. After the final task, run the broadest appropriate regression checks and return one consolidated handoff for human review.
9. Do not commit unless the user explicitly asked for commits.

For each task:

1. Identify the requested task or the next unchecked task in `tasks/todo.md`.
2. Read that task's acceptance criteria in `tasks/plan.md` plus relevant `SPEC.md` sections.
3. Load only the needed source context.
4. If the task touches user input, authentication, authorization, data storage, secrets, permissions, or external integrations, also use `security-and-hardening`.
5. Write a failing test for the expected behavior when practical.
6. Implement the minimum code to pass.
7. Run focused tests, then broader regression checks appropriate to the change.
8. Run the build or typecheck when the project provides one.
9. Mark the task complete in `tasks/todo.md` and update `tasks/plan.md` if scope changed.
10. Report changes and verification evidence.
11. Suggest a commit message, but do not commit unless the user explicitly asks.

If a step fails, use `debugging-and-error-recovery` and report the blocker with evidence.
