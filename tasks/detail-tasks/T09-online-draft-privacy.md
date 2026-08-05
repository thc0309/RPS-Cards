# T09 — Authoritative online draft privacy and deadlines

Status: pending

## Outcome

Nối two-player Lobby vào online Draft: server chọn first drafter, quản lý hai
deadline 5 giây tách biệt, auto-pick hợp lệ, và phát projection không cho đối thủ
suy ra card/position đã chọn.

## Dependencies and skills

- Dependencies: T08.
- Required skills: `vibe-build`, `vibe-test`, `api-and-interface-design`,
  `security-and-hardening`, `frontend-ui-engineering`.
- Read first: `SPEC.md` P0/P1 draft, State Machine, Realtime server, Server/Mobile
  tests và privacy acceptance.

## Technical contract

1. Khi đủ hai players, room tạo canonical draft bằng crypto RNG adapter và
   `game-core`; broadcast absolute `draftDeadlineAt`, active seat và safe status.
2. Mỗi drafter có một server room-clock timeout riêng. Cancel old timer khi action
   accepted; second deadline chỉ bắt đầu sau first pick + remaining-card shuffle.
   Không server interval mỗi giây.
3. `PICK_DRAFT_CARD` gồm operationId, expected phase/turn và visible position.
   Server map position trong canonical active-seat view, validate availability và
   idempotency trước core.
4. Inactive projection chỉ có `opponentHasPicked`/waiting state. Nó không có
   picked position, card kind, canonical order hoặc removed third card. Sau first
   pick, second seat nhận fresh two-position ordering không correlate với prior IDs.
5. Timeout uses crypto random available position và đi qua cùng validated action
   path. Tap/time-out race settle once.
6. Mobile Draft screen dùng server absolute deadline; local countdown không đổi
   authority. Optimistic highlight được phép nhưng rollback khi reject; không
   chuyển Board trước projection xác nhận draft complete.
7. Rejoin giữa draft chưa xử lý full reconnect lifecycle tới T11, nhưng fresh
   projection path phải có đủ own private draft state và không secret leakage.

## TDD sequence

1. Fake room-clock tests cho first/second deadlines và timeout action.
2. Two-client integration test inspect every message/snapshot before/after each pick.
3. Race/idempotency tests tap at expiry, duplicate same operation, conflicting pick.
4. Reshuffle test dùng fixed RNG chứng minh second visible positions không expose
   first selected position.
5. Mobile projection rendering tests cho active/inactive/waiting/timeout states.

## Likely files

- `server/src/rooms/RpsRoom.ts`, draft handler/timer helper
- `server/src/rooms/projection.ts`, schema/protocol updates
- `mobile/src/game/colyseus-client.ts`, online draft view model
- `mobile/src/screens/DraftScreen.tsx`
- Server integration and mobile component tests

## Acceptance criteria

- [ ] Hai players draft sequentially với separate 5s authoritative deadlines;
  manual/timeout race accept một legal choice và draft completes exactly once.
- [ ] Captured seat-specific payloads không có forbidden position/card/order fields;
  remaining two cards được reshuffle/re-index và third card never revealed.
- [ ] Mobile active/inactive states và countdown đúng server projection ở vi/en;
  route sang Board chỉ sau canonical draft complete.

## How to run

```bash
npm run test --workspace server -- --test-name-pattern="draft|privacy|deadline"
npm run test --workspace mobile -- --runInBand --testPathPattern="Draft"
npm run test --workspace game-core -- --test-name-pattern="draft"
npm run typecheck
npm run build:server
npm run verify
git diff --check
```

Manual two-device check: để A pick ngay/B timeout, rồi đảo first drafter; quay màn
hình inactive device để chứng minh không có position animation/hint.

## Evidence to record

- Sanitized message key traces per seat.
- Fake clock and race test output.
- Two-device video cho both drafter orders.

## Explicitly skipped

- Round selection/reveal/result (T10) và disconnect reservation (T11).
