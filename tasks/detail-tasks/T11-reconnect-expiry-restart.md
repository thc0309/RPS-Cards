# T11 — Reconnect reservation, expiry loss, and restart recovery

Status: complete (automated; physical two-device evidence pending T14)

## Outcome

Làm P1 chịu được mất mạng ngắn: giữ seat 25 giây, timer gameplay vẫn chạy,
khôi phục player-safe snapshot, xử lý expiry loss đúng một lần và map room mất do
server restart sang localized `ROOM_EXPIRED` rồi xóa reconnect credential.

## Dependencies and skills

- Dependencies: T10.
- Required skills: `vibe-build`, `vibe-test`, `security-and-hardening`,
  `api-and-interface-design`, `frontend-ui-engineering`, `source-driven-development`.
- Read first: `SPEC.md` P1 reconnect, Realtime protocol, Local development,
  Contracts, Server/Mobile tests, MOB-NET cases.

## Technical contract

1. Follow Colyseus official reconnection API for pinned version. Server reserves
   exact disconnected seat for configured 20–30s (default 25s); reconnect token
   identifies room/seat but never grants a different seat.
2. Mobile stores only minimal reconnect credential in SecureStore; Zustand keeps
   non-persisted display metadata. Token không route param/log/AsyncStorage.
3. On transport loss, navigate/show Reconnecting state without disposing active
   session immediately. Retry bounded với backoff trong reservation window; một
   in-flight reconnect attempt tại một thời điểm.
4. Round/draft absolute deadlines continue. Reconnect neither resets nor extends
   them. Restored snapshot includes own hand/draft, phase, score, locks, discards,
   remaining deadline and public opponent data, with same privacy filter as join.
5. Reservation expiry resolves forfeit/loss once, cancels timers, rejects late
   mutation/reconnect and delivers one final result to connected player.
6. If server process/room missing, client maps failure to `ROOM_EXPIRED`, deletes
   credential, returns Rooms and shows exact vi/en restart message. Không retry loop.
7. Clean leave/result Home removes saved credential; transient network error does
   not erase it before server says expired/not found.

## TDD sequence

1. Fake-clock integration test disconnect/reconnect within window and snapshot parity.
2. Disconnect during draft and round selection; assert authoritative deadline did
   not change and timeout may advance while offline.
3. Expiry test ensures one loss/result and late action rejection.
4. Missing-room/restart client test checks `ROOM_EXPIRED`, token deletion and
   localized Rooms message with no retries.
5. Storage/log audit tests ensure reconnect credential absent from AsyncStorage,
   Zustand persisted payload, route params and structured logs.

## Likely files

- `server/src/rooms/RpsRoom.ts`, reconnect/reservation helper
- `mobile/src/game/colyseus-client.ts`, reconnect controller
- `mobile/src/security/reconnect-credential.ts`
- `mobile/src/screens/ReconnectingScreen.tsx`, `mobile/app/reconnecting.tsx`
- Rooms/session store actions and integration/component tests

## Acceptance criteria

- [ ] Reconnect within 25s restores same seat and client-safe state without timer
  extension or secret leak; reconnect UI exits on success.
- [ ] Expiry awards one loss, rejects late reconnect/action và cleanup timers;
  connected player receives one final result.
- [ ] Missing room produces localized `ROOM_EXPIRED`, clears SecureStore token,
  returns Rooms once; credentials never appear in non-secure persistence/logs/routes.

## How to run

```bash
npm run test --workspace server -- --test-name-pattern="reconnect|disconnect|expiry"
npm run test --workspace mobile -- --runInBand --testPathPattern="reconnect|ROOM_EXPIRED|credential"
npm run typecheck
npm run build:server
npm run verify
git diff --check
```

Manual: run MOB-NET-001/002 on two physical devices; for restart case stop/start
local server while one credential exists. Evidence chỉ ghi token presence/absence,
không ghi raw token.

## Evidence to record

- Server suite: 17/17 passed, including same-seat token reconnect, disconnected
  action rejection, reservation expiry, one forfeit result and late reconnect rejection.
- Mobile suite: 12 suites / 25 tests passed, including SecureStore-only credential read/write/delete.
- `RECONNECT_TIMEOUT_MS` is range-validated at 20–30s with default 25s and is
  injected into room construction; token is absent from route params, Zustand
  persisted state, and structured logs.
- Physical two-device video and server-restart device run remain T14 BLOCKED;
  the native HTTP adapter has no Colyseus socket drop callback yet.

## Explicitly skipped

- Durable room persistence, Supabase, cross-process recovery và offline gameplay.
