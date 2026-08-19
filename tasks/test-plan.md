# Mobile and E2E Test Plan - RPS Cards MVP

Status: Android execution active; iOS cases deferred

Use this file with `vibe-e2e` or the approved native-device runner. Do not mark PASS without runtime evidence. Record every FAIL/BLOCKED case in `tasks/test-result.md`.

Current milestone: execute Android cases first. Rows requiring iOS or VoiceOver
remain deferred, not PASS; they are resumed for the later cross-platform gate.

## Execution Protocol

1. Record app commit/diff state, device model, OS version, build type, server URL, and test ad mode.
2. Use test ad units and disposable guest identities; never capture resume tokens or secret hands in logs/screenshots.
3. Capture visible result, relevant device/server logs, and screenshot/video path when useful.
4. Record PASS, FAIL, or BLOCKED. A test is not PASS from component/unit evidence alone when it requires a device.

## P0 - Local bot match

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-P0-001 | Android portrait build; fresh guest | Start local play, complete private draft, lock one legal card in each of four rounds, inspect result, tap **Đấu lại**, then **Về trang chủ**. | No stuck phase; used cards disappear from the hand and enter discards in order; exactly four rounds end; both result actions work; no ad appears. | Pending |
| MOB-P0-002 | iOS portrait build; fresh guest | Repeat MOB-P0-001 on iOS. | Behavior and rules match Android; safe areas do not cover content. | Deferred — Android-first milestone |
| MOB-P0-003 | Either platform | Rapidly tap a draft card and **Khóa bài**; attempt to reuse a discarded card. | One operation is accepted per step; duplicate/conflicting actions are rejected without corrupting state; used card is unavailable. | Pending |
| MOB-P0-004 | Either platform; fresh bot match | Let the local draft turn expire, then let one round-selection timer expire without locking. | Draft auto-picks one available card after 5 seconds; round auto-locks one owned unused card after 15 seconds; each phase advances once and the match remains completable. | Pending |

## Preferences, localization, and local persistence

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-PREF-001 | Fresh install; device locale tested as `vi`, `en`, then unsupported | Launch once for each locale, open **Tùy chỉnh / Customize**, switch language, force-close, and relaunch. | Supported device locale is selected on first launch, unsupported locale falls back to English, and the saved in-app choice wins after relaunch. | Pending |
| MOB-PREF-002 | Either platform; test adapter can seed stored preferences | Seed unknown/corrupt locale and cosmetic IDs, then launch. | App does not crash; locale falls back to English and `uiThemeId`, `cardSkinId`, and `boardThemeId` resolve to `folk_default`. | Pending |
| MOB-PREF-003 | Either platform; active/reconnectable room exists | Switch `vi`/`en` and reopen the app while inspecting only sanitized storage keys. | Active session metadata is preserved; AsyncStorage contains only non-sensitive preferences, while guest/reconnect credentials are absent from AsyncStorage, route params, and logs. | Pending |

## UI, layout, and accessibility

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-UI-001 | Small Android portrait around 320x568 dp plus common 360x800 dp | Visit Draft, Board, Reconnecting, and Result; select edge and center cards. | Vietnamese labels, score, timer, cards, and **Khóa bài** are not clipped; targets are at least 44x44 dp; cutouts/navigation bars cover nothing essential. | Pending |
| MOB-UI-002 | iPhone portrait around 390x844 pt with safe-area cutout | Repeat the critical states and rotate the physical device. | App remains portrait; native status/safe areas are respected; layout hierarchy matches the reference. | Deferred — Android-first milestone |
| MOB-UI-003 | TalkBack enabled; VoiceOver deferred | Navigate Home, Rooms, Lobby, Draft, Board, Reconnecting, and Result once in Vietnamese and once in English. | Every action/card has a meaningful localized accessible name; focus order follows play order; selected/locked/win/loss are not color-only. | Pending Android TalkBack; VoiceOver deferred |
| MOB-UI-004 | Reduced Motion enabled | Complete draft, card selection, reveal, discard, and result. | Motion is reduced/removed and every transition settles into the same readable final state. | Pending |
| MOB-UI-005 | Android portrait; Board with `folk_default`; iOS repeat deferred | Inspect upper/lower player zones, central arena, card backs, labels, and discards through multiple rounds. | Upper and lower backgrounds are symmetric player-owned halves; text/art remain upright; the center stays neutral; opponent backs are identical and no decorative element behaves like a control. | Pending Android; iOS deferred |
| MOB-UI-006 | Rooms with no credential, then one saved reconnect credential; force network/ad errors | Inspect empty/current-room states; tap create/join rapidly; open the saved room; retry after each failure. | Exactly one localized current-room row replaces the empty state; busy controls cannot duplicate requests; every failure returns to an editable, non-stuck Rooms state. | Pending; room-entry regression tests automate error/busy behavior |
| MOB-UI-007 | 320x568 and 390x844 portrait; local and online Board in vi/en | Select each card, inspect **Khóa bài**, let the opponent lock, and complete four rounds. | Búa maps to `ROCK`, Bao to `PAPER`, and Kéo to `SCISSORS`; selection precedes lock; locked status is textual; used cards disappear; per-player discards and `VS` reveal remain readable without wrapping the four-card hand. | Pending; i18n/projection/countdown regressions automate state contracts |
| MOB-UI-008 | Fresh Android debug launch; routes Home → Rooms → Lobby → Draft → Board → Reconnecting → Result | Capture warning/error logs during cold launch and one pass through every route; repeat after navigating away and back. | No React state-update-before-mount warning, subscription/timer cleanup warning, stuck splash, or normal-screen development overlay; route transitions remain responsive. | Pending — T13-R |

## Visual fidelity against `docs/ui`

For each case, capture Vietnamese and English screenshots. Compare composition,
major geometry, art layers, native text, state treatment, safe area and touch areas.
Sample names/scores/cards in the reference are illustrative; runtime state wins.

| Case ID | Reference / Preconditions | Steps | Expected result | Evidence |
|---------|---------------------------|-------|-----------------|----------|
| MOB-VIS-001 | `01-home.png`; fresh and hydrated Home; vi/en | Launch, inspect loading-to-Home transition, both primary actions and Customize. | Paper/village scene, brand hierarchy and red/blue actions follow the reference; native labels fit; both routes and Customize remain usable. | Pending — T15 |
| MOB-VIS-002 | `02-rooms.png`; no credential, saved credential, each entry error and busy state | Open Rooms, exercise empty/current room, create, invalid/full/expired join, retry and back. | Title plaque, framed room panel, red create, labeled input and blue join follow the reference; every functional state is localized, recoverable and stable. | Pending — T16 |
| MOB-VIS-003 | `03-lobby.png`; one then two seats | Create a room, copy code, observe waiting state, join from device B, then leave. | Invitation scroll, two player panels, VS, ready/waiting and leave hierarchy follow the reference; code/status are runtime native text and no private data appears. | Pending — T17 |
| MOB-VIS-004 | `04-draft.png`; local and online active/inactive seats | Observe available, selected, waiting and timeout states with Reduced Motion on/off. | Woven scene, opponent plaque, three identical backs and instruction panel follow the reference; selection is visible and online opponent pick remains secret. | Pending — T18 |
| MOB-VIS-005 | `05-board.png` + `ui1.png`; local and online rounds 1–4 | Capture selection, locked, reveal and post-discard states; inspect both player themes. | Mirrored board halves, score plaques, facedown backs, neutral two-slot VS arena, illustrated fanned hand, discard zones and attached timer/Lock action follow the references without clipping. | Pending — T19 |
| MOB-VIS-006 | `06-reconnecting.png`; active online board then transport loss | Disconnect within and beyond the reservation window; inspect Reduced Motion. | Dimmed non-interactive board and centered reconnect scroll/drum follow the reference; native countdown reflects the reservation and expiry behavior remains authoritative. | Pending — T20 |
| MOB-VIS-007 | `07-result.png`; completed local/online match and early forfeit | Inspect win/loss, four runtime round rows, rematch/wait/home and forfeit. | Outcome stamp, score plaque, history scroll and actions follow the reference; rows use real history, while forfeit never fabricates missing rounds. | Pending — T21 |

## P1 - Private rooms and privacy

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-P1-001 | Two physical devices; local server; distinct fresh guests | Both devices open **Phòng online**. Device A uses **Tạo phòng**; Device B enters the code and uses **Vào phòng**; both draft and play four rounds. | Create and join share one Rooms screen with no separate routes or public room enumeration; Lobby admits exactly two; both clients stay phase/score consistent; opponent draft/hand stays secret until legal reveal; one result is shown after round four. | Pending |
| MOB-P1-002 | Three clients; one two-player room | Join A and B, then attempt to join C; repeat create/join taps quickly. | C receives full error without disturbing A/B; each entry mutation runs at most once. | Pending |
| MOB-P1-003 | Rooms screen with no current session, then a reconnectable session | Confirm the empty state; submit invalid, expired, then valid codes; return while a session is reconnectable. | Errors stay on Rooms with the code editable; valid code is revalidated after the ad; only the guest's current reconnectable room appears, never a server-wide private-room list. | Pending |
| MOB-P1-004 | Two physical devices; fixed first-drafter test configuration | Let A draft while observing B, then repeat with B first; compare visible positions before the second pick. | Inactive device shows only the localized opponent-picked/waiting state, never the selected position/card; the two remaining positions are reshuffled/re-indexed before the second pick. | Pending |
| MOB-P1-005 | Two physical devices in online draft/round selection | Let each draft seat time out once; in a later round lock on one device and let the other time out. | Each 5-second draft deadline and 15-second round deadline is server-authoritative; only legal cards are auto-selected, reveal occurs once, and both clients remain consistent. | Pending |

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

## Rendering performance and Skia decision

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-PERF-001 | Representative mid-range Android; iOS repeat deferred; profiling tools available | Record board selection, simultaneous reveal, discard movement, and screen transitions with `View`/`ImageBackground`/Reanimated; inspect mounted large assets and listener cleanup. If a named effect fails after ordinary optimization, integrate only that bounded Skia surface, rebuild the Android development client, and repeat the exact trace plus accessibility/reduced-motion checks. | Target interactions are stable near 60 fps without leaked timers/listeners or unnecessary mounted scenes. Evidence records `SKIA_NOT_NEEDED`, or measurable before/after improvement with native controls/text still accessible and no Skia objects in persisted state. | Pending Android; iOS deferred |

## Final Evidence Gate

For the current Android milestone, apply this gate only to active Android rows.
Deferred iOS rows keep the full cross-platform release gate open.

- [x] `npm run verify` passes for the exact tested source state.
- [ ] Core unit tests include all nine matchups and the 864 exhaustive final-match cases.
- [ ] Colyseus integration tests prove capacity, idempotency, timeout, reconnect, and forbidden secret-field absence.
- [ ] Preference/localization persistence cases pass without credentials in AsyncStorage.
- [ ] Performance evidence contains an explicit bounded Skia decision.
- [x] All device cases above are PASS, or each non-pass case is recorded with owner/blocker in `tasks/test-result.md`.
