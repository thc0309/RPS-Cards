# T07 — Colyseus protocol, room lifecycle, and private projections

Status: complete

## Outcome

Tạo server P1 foundation: typed protocol, validated environment, five-character
room codes, exactly-two-player Colyseus room, idempotent mutations và projection
riêng cho từng client mà không lộ secret hand/draft.

## Dependencies and skills

- Dependencies: T03.
- Required skills: `vibe-build`, `vibe-test`, `api-and-interface-design`,
  `security-and-hardening`, `source-driven-development`.
- Read first: `SPEC.md` P1, Architecture, Realtime server/protocol, Contracts,
  Environment/diagnostics, Server tests và Boundaries.

## Technical contract

1. Tra Colyseus official docs đúng version cho Room lifecycle, Schema/StateView,
   reconnection và simulated clients. Pin compatible packages; không dựa vào
   deprecated filter APIs.
2. Shared protocol ở `game-core` chỉ gồm stable typed messages/projections/error
   codes. Mọi action có `operationId`, `expectedPhase`, `expectedRound` và payload
   tối thiểu. `rulesetVersion` luôn `classic_v1`.
3. Server env parser fail-fast:
   `DRAFT_SELECTION_TIMEOUT_MS` 1000–30000 default 5000,
   `ROUND_SELECTION_TIMEOUT_MS` 5000–120000 default 15000,
   `RECONNECT_TIMEOUT_MS` 20000–30000 default 25000. Không silent clamp.
4. Room code là 5 ký tự uppercase từ allowlist bỏ `I/O/0/1`, dùng Node crypto,
   retry collision bounded. Validation endpoint/message chỉ trả
   available/full/not-found/expired, không trả player/secret state.
5. Room `maxClients = 2`; canonical state ở server gọi `game-core`. Accepted
   duplicate operationId trả cùng result; conflicting reuse/stale phase/wrong
   seat/rate excess bị reject trước core và không mutate state.
6. Mỗi client projection có own private hand/draft + public opponent count,
   locked flag, score, discards và public cosmetic IDs. Test enumerate keys và
   assert forbidden fields absent, không chỉ undefined.
7. MVP catalog chỉ accept `folk_default`; unknown/unavailable value normalize
   server-side. `uiThemeId` không broadcast.
8. Structured logs có room/phase/round/operation/error code nhưng redact guest
   resume credential, secret cards và removed draft card.

## TDD sequence

1. Failing env and room-code unit tests, including collision and ambiguous chars.
2. Simulated-client test create/validate/join and third-client rejection.
3. Protocol boundary tests malformed/stale/unauthorized/idempotent/conflicting actions.
4. Projection tests from both seats; maintain explicit forbidden-key list.
5. Cosmetic/ruleset fallback tests and sanitized structured-log test.

## Likely files

- `game-core/src/protocol.ts`, `game-core/src/errors.ts`, exports
- `server/src/config.ts`, `server/src/room-code.ts`
- `server/src/rooms/RpsRoom.ts`, `server/src/rooms/schema.ts`
- `server/src/rooms/projection.ts`, `server/src/index.ts`
- `server/src/*.test.ts`, integration fixtures

## Acceptance criteria

- [x] Env/room-code/ruleset validation đúng bounds; create/validate/join works,
  third client và duplicate/conflicting requests không corrupt room.
- [x] Two player-specific snapshots chứa đúng own secrets/public opponent fields;
  forbidden secret keys/card values hoàn toàn vắng mặt trước legal reveal.
- [x] Server dùng `game-core`, `maxClients=2`, stable error codes, bounded message
  rate/idempotency và sanitized logs; focused integration tests xanh.

## How to run

```bash
npm run test --workspace server -- --test-name-pattern="room|projection|code|config"
npm run test --workspace game-core -- --test-name-pattern="protocol"
npm run typecheck --workspace server
npm run build --workspace server
npm run dev:server
npm run verify
git diff --check
```

Negative startup checks phải chạy trong test process với invalid env; không làm
ô nhiễm shell profile. Integration tests dùng random/free test port và teardown
server/clients chắc chắn.

## Evidence to record

- Two-client/third-client test output.
- Projection key lists đã sanitize cho seat A/B.
- Room-code collision and invalid-env test output.

## Evidence

- `npm run test --workspace game-core`: 13 tests passed, including malformed
  protocol envelopes, stable `classic_v1`, and cosmetic fallback.
- `npm run test --workspace server`: 9 tests passed, including Colyseus schema
  metadata, two-seat/third-client capacity, stale/conflicting/idempotent
  operations, explicit projection key allowlists, room-code collision retry,
  and log redaction.
- `npm run verify`: full game-core/server/mobile tests, typecheck, lint and
  server build passed. Runtime smoke served `GET /health` with `200 {"ok":true}`.
- Colyseus `0.17.10` and `@colyseus/schema` `4.0.30` are pinned in the server
  manifest; public Schema carries only room metadata while private state is sent
  through explicit seat projection messages.

## Explicitly skipped

- Mobile Rooms UI, ads, actual draft scheduler, rounds và reconnect lifecycle.
