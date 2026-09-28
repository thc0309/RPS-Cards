# T24-A — Authoritative replaceable-lock contract

Status: complete

## Outcome

Allow an online player to replace their currently held card while the
authoritative phase is still `ROUND_SELECTION`. Keep the existing `LOCK_CARD`
action and payload; do not add a separate unlock/replace message.

## Dependencies and skills

- Dependencies: T12, T19.
- Skills: `vibe-build`, `vibe-test`, `api-and-interface-design`,
  `security-and-hardening`.

## Contract

1. `lockCard(state, playerId, cardId)` becomes an upsert for the player's one
   active lock during `ROUND_SELECTION`:
   - first valid card sets `lockedCardId`;
   - the same card is a no-op;
   - another owned, unused card replaces it without marking either card used;
   - unowned/used cards and every call after `ROUND_REVEAL` remain rejected.
2. Reuse `LOCK_CARD { cardId }`. Each intentional initial/replacement drop gets
   a new operation ID; a retry of that same drop reuses its ID. Expected phase,
   round, rate limit and operation-conflict checks remain unchanged.
3. Add `lockedCardId: string | null` to the private projection so refresh/reconnect
   restores the exact held card. Opponents continue to receive only
   `locked: boolean`.
4. Replacement never resets the 15-second deadline. Server ordering decides a
   replacement-versus-peer-lock/timeout race: accepted first means the new card
   reveals; reveal/timeout first means the replacement is stale and changes no state.

## Acceptance criteria

- [x] Core tests prove first lock, same-card no-op, A → B → A replacement,
  ownership/used validation, and rejection after reveal.
- [x] Two-client tests prove private replacement, unchanged deadline,
  idempotent retry, stale-race behavior and no opponent card-identity leak.
- [x] Existing four-round, timeout, reconnect and privacy regressions remain green.

## Likely files

- `game-core/src/match.ts`
- `game-core/src/match.test.ts`
- `game-core/src/protocol.ts`
- `server/src/rooms/online-room.ts`
- `server/src/online-room.test.ts`

## Verification

```bash
rtk npm test --workspace game-core
rtk npm test --workspace server -- --test-name-pattern="lock|replace|deadline|privacy"
rtk npm run verify
```

## Explicitly skipped

No `UNLOCK_CARD`/`REPLACE_CARD` message, deadline reset, opponent card identity,
or undo after `ROUND_REVEAL`.

## Evidence — 2026-08-20

- Core lock is an upsert during `ROUND_SELECTION`; private projections expose only
  the owning player's `lockedCardId` while opponents retain boolean lock state.
- Core 13/13 and server 23/23 pass, including A → B → A, deadline stability,
  idempotency, stale replacement and privacy coverage. Full `npm run verify` passes.
