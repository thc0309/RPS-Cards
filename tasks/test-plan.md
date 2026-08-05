# Mobile and E2E Test Plan - RPS Cards MVP

Status: planned; not executed

Use this file with `vibe-e2e` or the approved native-device runner. Do not mark PASS without runtime evidence. Record every FAIL/BLOCKED case in `tasks/test-result.md`.

## Execution Protocol

1. Record app commit/diff state, device model, OS version, build type, server URL, and test ad mode.
2. Use test ad units and disposable guest identities; never capture resume tokens or secret hands in logs/screenshots.
3. Capture visible result, relevant device/server logs, and screenshot/video path when useful.
4. Record PASS, FAIL, or BLOCKED. A test is not PASS from component/unit evidence alone when it requires a device.

## P0 - Local bot match

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-P0-001 | Android portrait build; fresh guest | Start local play, complete private draft, lock one legal card in each of four rounds, inspect result, tap **Đấu lại**, then **Về trang chủ**. | No stuck phase; used cards disappear from the hand and enter discards in order; exactly four rounds end; both result actions work; no ad appears. | Pending |
| MOB-P0-002 | iOS portrait build; fresh guest | Repeat MOB-P0-001 on iOS. | Behavior and rules match Android; safe areas do not cover content. | Pending |
| MOB-P0-003 | Either platform | Rapidly tap a draft card and **Khóa bài**; attempt to reuse a discarded card. | One operation is accepted per step; duplicate/conflicting actions are rejected without corrupting state; used card is unavailable. | Pending |

## UI, layout, and accessibility

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-UI-001 | Small Android portrait around 320x568 dp plus common 360x800 dp | Visit Draft, Board, Reconnecting, and Result; select edge and center cards. | Vietnamese labels, score, timer, cards, and **Khóa bài** are not clipped; targets are at least 44x44 dp; cutouts/navigation bars cover nothing essential. | Pending |
| MOB-UI-002 | iPhone portrait around 390x844 pt with safe-area cutout | Repeat the critical states and rotate the physical device. | App remains portrait; native status/safe areas are respected; layout hierarchy matches the reference. | Pending |
| MOB-UI-003 | TalkBack then VoiceOver enabled | Navigate Home, Rooms, Lobby, Draft, Board, Reconnecting, and Result. | Every action/card has a meaningful Vietnamese accessible name; focus order follows play order; selected/locked/win/loss are not color-only. | Pending |
| MOB-UI-004 | Reduced Motion enabled | Complete draft, card selection, reveal, discard, and result. | Motion is reduced/removed and every transition settles into the same readable final state. | Pending |

## P1 - Private rooms and privacy

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-P1-001 | Two physical devices; local server; distinct fresh guests | Both devices open **Phòng online**. Device A uses **Tạo phòng**; Device B enters the code and uses **Vào phòng**; both draft and play four rounds. | Create and join share one Rooms screen with no separate routes or public room enumeration; Lobby admits exactly two; both clients stay phase/score consistent; opponent draft/hand stays secret until legal reveal; one result is shown after round four. | Pending |
| MOB-P1-002 | Three clients; one two-player room | Join A and B, then attempt to join C; repeat create/join taps quickly. | C receives full error without disturbing A/B; each entry mutation runs at most once. | Pending |
| MOB-P1-003 | Rooms screen with no current session, then a reconnectable session | Confirm the empty state; submit invalid, expired, then valid codes; return while a session is reconnectable. | Errors stay on Rooms with the code editable; valid code is revalidated after the ad; only the guest's current reconnectable room appears, never a server-wide private-room list. | Pending |

## Advertising entry gates

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-AD-001 | Test interstitial available | Create once; join once with a valid room. | Create request occurs after one ad attempt; join is validate -> one ad attempt -> revalidate -> join. | Pending |
| MOB-AD-002 | Force close, load failure, timeout, and no inventory in separate runs | Repeat create and join for each outcome. | Each flow continues exactly once and never becomes permanently blocked. | Pending |
| MOB-AD-003 | Active draft, board, reconnect, and result | Complete each state while observing ad callbacks/logs. | No ad is requested or shown in gameplay, reconnect, or result states. | Pending |

## Network loss and reconnect

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-NET-001 | Two devices in an active round | Disconnect one device briefly, reconnect within 25 seconds. | Seat is reserved; Reconnecting is explicit; phase, hand, locks, score, discards, and remaining timer restore without secret leakage or deadline reset. | Pending |
| MOB-NET-002 | Two devices in an active round | Keep one device offline past 25 seconds, then attempt a late reconnect. | Expiry awards one loss; connected client sees one final result; late reconnect cannot mutate the match. | Pending |

## Final Evidence Gate

- [ ] `npm run verify` passes for the exact tested source state.
- [ ] Core unit tests include all nine matchups and the 864 exhaustive final-match cases.
- [ ] Colyseus integration tests prove capacity, idempotency, timeout, reconnect, and forbidden secret-field absence.
- [ ] All device cases above are PASS, or each non-pass case is recorded with owner/blocker in `tasks/test-result.md`.
