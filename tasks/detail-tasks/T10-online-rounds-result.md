# T10 — Authoritative online rounds, result, and rematch

Status: complete

## Outcome

Hoàn tất happy-path P1 sau draft: server-authoritative four-round selection,
15-second timeout auto-lock, simultaneous reveal, public discard/score, Match
Result và rematch chỉ khi cả hai players consent.

## Dependencies and skills

- Dependencies: T09.
- Required skills: `vibe-build`, `vibe-test`, `api-and-interface-design`,
  `frontend-ui-engineering`, `security-and-hardening`.
- Read first: `SPEC.md` P1 round bullets, Battle-screen contract, Result actions,
  Realtime protocol, Contracts và Server/Mobile tests.

## Technical contract

1. Room starts one absolute `roundDeadlineAt` per selection phase using room clock.
   Deadline continues independent of client countdown; timer canceled on phase
   exit/dispose. Không interval tick server.
2. `LOCK_CARD` carries operationId, expected round/phase và card instance ID.
   Server validates seat, ownership, unused status, phase và rate before core.
3. First lock only exposes public `hasLocked=true`; card ID/kind stays private.
   Reveal starts only after both locks hoặc deadline auto-locks each unlocked seat
   bằng uniform legal remaining card.
4. Server calls `game-core` for outcome/score/discards. Projection in reveal/result
   publishes only legally revealed pair and ordered discards; next selection hides
   unused opponent hand again.
5. Client Board reuse T06 presentation nhưng online adapter renders server
   projection. Optimistic selection không predict score/phase/reveal.
6. After round four, exactly one Match Result projection. Online **Đấu lại** sends
   ready flag; new draft only when both ready. Cancel/leave returns Rooms and
   cannot restart room alone.
7. Every duplicate/retry returns stable result; simultaneous messages and timer
   callback cannot advance phase/round twice.

## TDD sequence

1. Two-client integration tests one-lock privacy then simultaneous reveal.
2. Fake-clock timeout matrix: none locked, A only, B only, both before deadline.
3. Illegal reused/unowned/stale/wrong-round and duplicate/conflict tests.
4. Full four-round server+simulated-client flow verifies score/discards/result once.
5. Rematch ready/cancel tests and mobile projection/component tests.

## Likely files

- `server/src/rooms/RpsRoom.ts`, round handlers/timers/projection schema
- `game-core/src/protocol.ts`
- `mobile/src/game/online-match-adapter.ts`
- `mobile/src/screens/BoardScreen.tsx`, `mobile/src/screens/ResultScreen.tsx`
- Server integration/mobile focused tests

## Acceptance criteria

- [x] Manual and timeout locks always select legal remaining cards; first lock
  stays secret; reveal/score/discards occur exactly once per round.
- [x] Two clients remain phase/round/score consistent through exactly four rounds
  and receive one deterministic Match Result without client-computed authority.
- [x] Online rematch waits for both ready in same room; cancel/Home leaves safely;
  duplicate/race cases do not double-advance or show ads.

## How to run

```bash
npm run test --workspace server -- --test-name-pattern="lock|round|timeout|rematch"
npm run test --workspace mobile -- --runInBand --testPathPattern="Board|Result|online"
npm run test --workspace game-core
npm run typecheck
npm run build:server
npm run verify
git diff --check
```

Manual two-device run: one all-manual match, one match with zero/one-player locks
at timeout, then rematch-ready on one device before the other.

## Evidence to record

- Timeout matrix and privacy integration outputs.
- Two-device four-round video/log timeline with absolute deadlines.
- Rematch consent/cancel evidence.

## Evidence

- `server/src/online-room.test.ts` covers first-lock privacy, simultaneous reveal, idempotent/conflicting retries, four-round result exactly once, and two-party rematch consent.
- `mobile/src/screens/OnlineBoardScreen.tsx` and `OnlineResultScreen.tsx` render server projections and send only `LOCK_CARD`/`REMATCH_READY`; score and phase remain server-authoritative.
- Full `npm run verify` passed; live server smoke covered `/health`, create, validate and join endpoints.

## Explicitly skipped

- Disconnect reservation/restart recovery (T11), production deployment và history.
