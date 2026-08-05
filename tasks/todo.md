# Todo — RPS Cards MVP

Status: planned; next task is T01

Chi tiết của mỗi task nằm trong `tasks/detail-tasks/`. Chỉ đánh dấu hoàn tất sau
khi acceptance criteria và verification trong file tương ứng đã có evidence.

## Phase A — Foundation and deterministic core

- [ ] [T01 — Workspace and Expo development build](detail-tasks/T01-workspace-expo-dev-build.md)
- [ ] [T02 — Game-core match engine](detail-tasks/T02-game-core-match-engine.md) — depends on T01
- [ ] [T03 — Draft/random/exhaustive verification](detail-tasks/T03-draft-random-verification.md) — depends on T02
- [ ] Checkpoint A recorded in `tasks/plan.md`

## Phase B — P0 local playable slice

- [ ] [T04 — Mobile startup and preferences](detail-tasks/T04-mobile-startup-preferences.md) — depends on T01
- [ ] [T05 — Local bot draft](detail-tasks/T05-local-bot-draft.md) — depends on T03, T04
- [ ] [T06 — Local bot board and result](detail-tasks/T06-local-bot-board-result.md) — depends on T05
- [ ] Checkpoint B recorded in `tasks/plan.md`

## Phase C — P1 private online rooms

- [ ] [T07 — Colyseus room protocol](detail-tasks/T07-colyseus-room-protocol.md) — depends on T03
- [ ] [T08 — Rooms, Lobby, and ads](detail-tasks/T08-rooms-lobby-ads.md) — depends on T04, T07
- [ ] [T09 — Online draft privacy](detail-tasks/T09-online-draft-privacy.md) — depends on T08
- [ ] [T10 — Online rounds and result](detail-tasks/T10-online-rounds-result.md) — depends on T09
- [ ] [T11 — Reconnect, expiry, and restart](detail-tasks/T11-reconnect-expiry-restart.md) — depends on T10
- [ ] Checkpoint C recorded in `tasks/plan.md`

## Phase D — MVP hardening and evidence

- [ ] [T12 — Security and observability](detail-tasks/T12-security-observability.md) — depends on T11
- [ ] [T13 — UI accessibility and performance](detail-tasks/T13-ui-accessibility-performance.md) — depends on T06, T11
- [ ] [T14 — Native E2E final gate](detail-tasks/T14-native-e2e-final-gate.md) — depends on T12, T13
- [ ] Checkpoint D recorded in `tasks/plan.md`
