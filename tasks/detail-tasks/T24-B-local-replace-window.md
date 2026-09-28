# T24-B — Local bot replacement window

Status: complete

## Outcome

Give local matches the same replace-before-reveal behavior without resetting the
15-second round deadline or making timer cleanup fragile.

## Dependencies and skills

- Dependencies: T24-A.
- Skills: `vibe-build`, `vibe-test`, `test-driven-development`.

## Contract

1. After the player's first valid lock, schedule the bot lock once after a fixed
   `2,000ms` think delay using the adapter's injected timer.
2. A replacement updates the player's active `lockedCardId` through the T24-A
   core contract, returns the old card to the available hand, and does not restart
   either the bot delay or the original 15-second round deadline.
3. If the round deadline wins, immediately lock any missing side and resolve once.
   Round resolution, rematch and dispose clear both timer handles; late callbacks
   must be inert.

## Acceptance criteria

- [x] Fake-clock test proves A → B → A replacement inside the 2,000ms window and
  confirms the bot timer/deadline timestamps never move.
- [x] Bot-delay and deadline races resolve exactly one round with the newest
  accepted card; no used card becomes available again.
- [x] Round transition, rematch and dispose leave no live callback or duplicate emit.

## Likely files

- `mobile/src/game/local-match-adapter.ts`
- `mobile/src/game/local-match-adapter.test.ts`

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand local-match-adapter
rtk npm run typecheck --workspace mobile
```

## Explicitly skipped

No random/network-like bot latency and no user-facing delay setting. The fixed
2,000ms value is an MVP interaction constant, not a new configuration surface.

## Evidence — 2026-08-20

- Local adapter owns separate bot/deadline handles, schedules the bot only after
  the first lock, and leaves both timestamps unchanged across replacements.
- Fake-clock adapter regression 3/3 passes for replacement, timeout, rematch and
  dispose cleanup; full `npm run verify` passes.
