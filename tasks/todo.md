# Todo — RPS Cards MVP

Status: T01–T12 complete; Android remediation/evidence is active; iOS validation deferred

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
- [ ] [T13 — UI accessibility and performance](detail-tasks/T13-ui-accessibility-performance.md) — finish Android TalkBack/font-scale/60fps evidence first; iOS/VoiceOver deferred
- [ ] Checkpoint D recorded in `tasks/plan.md`

## Phase E — UI-reference fidelity remediation

- [ ] [T13-R — Lifecycle and shared layout root fix] — remove React warning, clean effects, safe-area surface, 44dp targets, and responsive text regression before visual slices
- [ ] Checkpoint E0 recorded in `tasks/plan.md`
- [ ] [T15 — Folk foundation and Home](detail-tasks/T15-folk-foundation-home.md)
- [ ] [T16 — Rooms visual fidelity](detail-tasks/T16-rooms-visual-fidelity.md)
- [ ] [T17 — Lobby visual fidelity](detail-tasks/T17-lobby-visual-fidelity.md)
- [ ] Checkpoint E1 recorded in `tasks/plan.md`
- [ ] [T18 — Draft visual fidelity](detail-tasks/T18-draft-visual-fidelity.md)
- [ ] [T19 — Board visual fidelity](detail-tasks/T19-board-visual-fidelity.md)
- [ ] Checkpoint E2 recorded in `tasks/plan.md`
- [ ] [T20 — Reconnecting visual fidelity](detail-tasks/T20-reconnecting-visual-fidelity.md)
- [ ] [T21 — Result visual fidelity](detail-tasks/T21-result-visual-fidelity.md)
- [ ] [T22 — UI visual evidence matrix](detail-tasks/T22-ui-visual-evidence.md) — close the Android vi/en, small-screen, TalkBack, reduced-motion and FPS matrix first
- [ ] Checkpoint E3 recorded in `tasks/plan.md`

## Phase F — Android final evidence (current milestone)

- [ ] [T14 — Native E2E final gate](detail-tasks/T14-native-e2e-final-gate.md) — chạy Android gate sau T22; iOS cases deferred and keep the full cross-platform task open
- [ ] Checkpoint F recorded in `tasks/plan.md`

Deferred from the current queue: iOS simulator/device, VoiceOver and iOS FPS
evidence. Deferred is not PASS and does not establish cross-platform release readiness.
