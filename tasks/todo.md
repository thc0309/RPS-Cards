# Todo — RPS Cards MVP

Status: T01–T12 complete; T13/T14 blocked on native evidence

Chi tiết của mỗi task nằm trong `tasks/detail-tasks/`. Chỉ đánh dấu hoàn tất sau
khi acceptance criteria và verification trong file tương ứng đã có evidence.

## Phase A — Foundation and deterministic core

- [x] [T01 — Workspace and Expo development build](detail-tasks/T01-workspace-expo-dev-build.md) — verify xanh; Android build PASS; iOS simulator BLOCKED
- [x] [T02 — Game-core match engine](detail-tasks/T02-game-core-match-engine.md) — verify xanh; five core tests pass
- [x] [T03 — Draft/random/exhaustive verification](detail-tasks/T03-draft-random-verification.md) — 864 exhaustive + 10,000 simulations pass
- [x] Checkpoint A recorded in `tasks/plan.md`

## Phase B — P0 local playable slice

- [x] [T04 — Mobile startup and preferences](detail-tasks/T04-mobile-startup-preferences.md) — locale/persistence/SecureStore tests pass
- [x] [T05 — Local bot draft](detail-tasks/T05-local-bot-draft.md) — 5s timeout/race adapter and Draft route pass
- [x] [T06 — Local bot board and result](detail-tasks/T06-local-bot-board-result.md) — 15s rounds/rematch adapter and board/result routes pass
- [x] Checkpoint B recorded in `tasks/plan.md` — Android PASS; iOS simulator BLOCKED

## Phase C — P1 private online rooms

- [x] [T07 — Colyseus room protocol](detail-tasks/T07-colyseus-room-protocol.md) — 2-seat Colyseus foundation, protocol, idempotency and private projections pass
- [x] [T08 — Rooms, Lobby, and ads](detail-tasks/T08-rooms-lobby-ads.md) — create/join validation, one-shot ad gate, Lobby and duplicate guards pass
- [x] [T09 — Online draft privacy](detail-tasks/T09-online-draft-privacy.md) — authoritative sequential draft/privacy tests pass
- [x] [T10 — Online rounds and result](detail-tasks/T10-online-rounds-result.md) — four rounds, result and two-party rematch pass
- [x] [T11 — Reconnect, expiry, and restart](detail-tasks/T11-reconnect-expiry-restart.md) — automated reconnect/expiry pass; physical two-device evidence pending
- [ ] Checkpoint C recorded in `tasks/plan.md` — automated pass; physical two-device evidence blocked

## Phase D — MVP hardening and evidence

- [x] [T12 — Security and observability](detail-tasks/T12-security-observability.md) — boundary/rate/log/audit checks pass; moderate transitive audit findings documented
- [ ] [T13 — UI accessibility and performance](detail-tasks/T13-ui-accessibility-performance.md) — implementation pass; screen-reader/font-scale/60fps device evidence blocked
- [ ] [T14 — Native E2E final gate](detail-tasks/T14-native-e2e-final-gate.md) — exact-source Android build/install/startup PASS on Pixel 4a; full Android, iOS and two-device cases remain blocked/pending
- [ ] Checkpoint D recorded in `tasks/plan.md`
