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
| MOB-P0-001 | Android portrait build; fresh guest | Start local play, complete private draft, select then drag one legal card into the player placeholder in each of four rounds, inspect result, tap **Đấu lại**, then **Về trang chủ**. | Each valid drop locks once; no Lock button is present; used cards disappear from the hand and enter discards in order; exactly four rounds end; both result actions work; no ad appears. | Pending |
| MOB-P0-002 | iOS portrait build; fresh guest | Repeat MOB-P0-001 on iOS. | Behavior and rules match Android; safe areas do not cover content. | Deferred — Android-first milestone |
| MOB-P0-003 | Either platform | Lock A, replace with B, replace back with A before reveal; then release once outside the target and later attempt to reuse a discarded card. | Each valid drop sends one distinct idempotent operation; the newest accepted card is held, the previous card returns to hand, timer does not reset, invalid drop sends nothing, and a used card remains unavailable. Local bot's 2-second window does not restart on replacement. | Pending — T24-A/T24-B/T24 |
| MOB-P0-004 | Either platform; fresh bot match | Let the local draft turn expire, then let one round-selection timer expire without locking. | Draft auto-picks one available card after 5 seconds; round auto-locks one owned unused card after 15 seconds; each phase advances once and the match remains completable. | Pending |

## T26 — Round preparation, simultaneous reveal and outcome

Plan added 2026-10-06; **all cases below are Pending, not executed**.
Detailed contract/timing: [T26](plan.md#t26-round-flow). Normal timeline starts
when authority accepts both locks: prepare 800ms → flip 600ms → outcome 1200ms
→ discard 300ms. Late clients catch up to authority; they do not restart timers.

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---|---|---|---|---|
| MOB-REVEAL-001 | Android BOT, deterministic valid draft; vi/en | Select, drop, replace before BOT locks; observe each of four rounds; include WIN, LOSS and DRAW rounds across valid fixtures. | Fixed BOT 2s window and 15s deadline; waiting → preparing → simultaneous flip → seat-correct outcome → discard. Score appears after flip; no points on draw. Fourth round finishes presentation before Result. | Pending — T26-B/E/G; video required |
| MOB-REVEAL-002 | Two physical Android devices, private room | A locks first, then B; next round reverse order; record both screens in one video or with a common time reference. | Each client shows hidden opponent lock, no new confirmation button. Both slots on each screen flip together; both clients agree on cards, points and inverse WIN/LOSS (DRAW for both). Record actual inter-device lag; do not assert frame-exact network sync. | Pending — T26-C/D/E/G |
| MOB-REVEAL-003 | Fake-clock core/server/local + Android spot-check | Race replacement against second lock and deadline; retry operation; expire with neither/one side locked. | Latest accepted legal lock wins; no change after prepare starts. Auto-lock enters same pipeline; one resolve, one score update, one discard per side; no restarted 15s/2s timers. | Pending — automated plus native spot-check |
| MOB-REVEAL-004 | Two-seat projections and rendered accessibility tree | Inspect prepare, reveal and result; replay a cached action reply after newer poll; delay responses and omit intermediate snapshots. | Before reveal no opponent ID/kind/outcome/new score/discard leaks. Revision prevents regression; matching match/round prevents stale cards. Missing reveal payload keeps backs; late arrivals catch up without replaying whole timeline or extending next selection. No secret payloads saved to logs. | Pending — protocol/component tests; controlled network run |
| MOB-REVEAL-005 | Android BOT and online; app background/resume and network control | Background/disconnect during waiting, prepare, flip, result and discard; reconnect before/after next selection and after final result. Repeat with room expiry/forfeit and rematch. | Resume fetches authoritative state before enabling online input. No hanging callback, duplicate outcome/points or old-round replay; forfeit never fabricates reveal. Fresh 15s only starts at authority next selection; current deadline remains authoritative on late join. | Pending — T26-F/G |
| MOB-REVEAL-006 | Android 320×568dp, 360×800dp, connected device native size; vi/en; font1.0/1.3 | Capture waiting/prepare/flip midpoint/outcome/discard for hand sizes 4→3→2→1, including edge-card drag. | Equal upright slots, stable arena and status space, no card/label/shadow clipping or overlap with score/timer. Hidden selection timer during non-selection. Opponent hand plus held back count correctly; no duplicated discarded card. | Pending — screenshots and video |
| MOB-REVEAL-007 | Android TalkBack and Reduced Motion; vi/en | Lock via accessibility action; complete normal/draw/final rounds; toggle reduced motion during flip; repeat/receive duplicate snapshot. | Same rules/outcome, meaningful locked/preparing/outcome text; no hidden opponent face in accessibility tree. Result announced once per round without stealing focus; no dependence on color or motion, no stuck frame after toggle. | Pending — native accessibility evidence |
| MOB-REVEAL-008 | Android profile/release build | Record complete four-round BOT and online matches, rapid replacement, ten rematches and leaving during animation; collect frame trace. | Reanimated drives two flips from one progress; no JS per-frame loop. Target near 60fps with measured frame drops reported; no growing timer/listener count or post-unmount navigation. Reduced Motion has equivalent state and result. | Pending — measured trace, not dev-build impression |

## Preferences, localization, and local persistence

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-PREF-001 | Fresh install; device locale tested as `vi`, `en`, then unsupported | Launch once for each locale, open **Tùy chỉnh / Customize**, switch language, force-close, and relaunch. | Supported device locale is selected on first launch, unsupported locale falls back to English, and the saved in-app choice wins after relaunch. | Pending |
| MOB-PREF-002 | Either platform; test adapter can seed stored preferences | Seed unknown/corrupt locale and cosmetic IDs, then launch. | App does not crash; locale falls back to English and `uiThemeId`, `cardSkinId`, and `boardThemeId` resolve to `folk_default`. | Pending |
| MOB-PREF-003 | Either platform; active/reconnectable room exists | Switch `vi`/`en` and reopen the app while inspecting only sanitized storage keys. | Active session metadata is preserved; AsyncStorage contains only non-sensitive preferences, while guest/reconnect credentials are absent from AsyncStorage, route params, and logs. | Pending |

## UI, layout, and accessibility

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-UI-001 | Small Android portrait around 320x568 dp plus common 360x800 dp | Visit Draft, Board, Reconnecting, and Result; select edge and center cards and inspect the player drop target. | Vietnamese labels, score, timer, cards, and placeholder are not clipped; targets are at least 44x44 dp; cutouts/navigation bars cover nothing essential. | Pending |
| MOB-UI-002 | iPhone portrait around 390x844 pt with safe-area cutout | Repeat the critical states and rotate the physical device. | App remains portrait; native status/safe areas are respected; layout hierarchy matches the reference. | Deferred — Android-first milestone |
| MOB-UI-003 | TalkBack enabled; VoiceOver deferred | Navigate Home, Rooms, Lobby, Draft, Board, Reconnecting, and Result once in Vietnamese and once in English. | Every action/card has a meaningful localized accessible name; focus order follows play order; selected/locked/win/loss are not color-only. | Pending Android TalkBack; VoiceOver deferred |
| MOB-UI-004 | Reduced Motion enabled | Complete draft, card selection, reveal, discard, and result. | Motion is reduced/removed and every transition settles into the same readable final state. | Pending |
| MOB-UI-005 | Android portrait; Board with `folk_default`; iOS repeat deferred | Inspect upper/lower player zones, central arena, card backs, labels, and discards through multiple rounds. | Upper and lower backgrounds are symmetric player-owned halves; text/art remain upright; the center stays neutral; opponent backs are identical and no decorative element behaves like a control. | Pending Android; iOS deferred |
| MOB-UI-006 | Rooms with no credential, then one saved reconnect credential; force network/ad errors | Inspect empty/current-room states; tap create/join rapidly; open the saved room; retry after each failure. | Exactly one localized current-room row replaces the empty state; busy controls cannot duplicate requests; every failure returns to an editable, non-stuck Rooms state. | Pending; room-entry regression tests automate error/busy behavior |
| MOB-UI-007 | 320x568 and 390x844 portrait; local and online Board in vi/en | Select each card, drag it into the player placeholder, let the opponent lock, and complete four rounds. | Búa maps to `ROCK`, Bao to `PAPER`, and Kéo to `SCISSORS`; selection precedes drag-to-lock; locked status is textual; used cards disappear; per-player discards and `VS` reveal remain readable without wrapping the four-card hand. | Pending; i18n/projection/countdown regressions automate state contracts |
| MOB-DRAFT-001 | Local and two-device online Draft; deterministic first drafter; vi/en | Capture first-turn, second-turn, waiting and timeout states; tap all three visible backs in each active state. | The row never collapses below three facedown cards. First turn exposes three legal targets; second turn exposes two re-indexed legal targets plus one non-interactive facedown placeholder. The placeholder calls no mutation and reveals no selected position/card. | Pending — T18 |
| MOB-UI-008 | Fresh Android debug launch; routes Home → Rooms → Lobby → Draft → Board → Reconnecting → Result | Capture warning/error logs during cold launch and one pass through every route; repeat after navigating away and back. | No React state-update-before-mount warning, subscription/timer cleanup warning, stuck splash, or normal-screen development overlay; route transitions remain responsive. | Pending — T13-R |

## Motion and interaction polish

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-MOTION-001 | Android portrait; Reduced Motion off; vi/en | Press Home/Rooms actions and Back, then select/unselect draft and board cards with slow and rapid taps. | Press feedback starts on press-in and settles within 150ms; selected state remains textual/non-color-only; rapid taps do not duplicate navigation or mutations. | Pending — T23 |
| MOB-MOTION-002 | Local and online Board; rounds 1–4 | Drag A into the lower placeholder, then drag B to replace it before reveal; wait for opponent and observe simultaneous reveal/discards. | Drag follows the finger on the UI thread; B settles while A returns to its fan position; lock/reveal/discard reflect authoritative state exactly once and the timer/deadline does not reset. | Pending — T24-A/T24-B/T24-C/T24 |
| MOB-DRAG-001 | Samsung `SM-X210` portrait; profile/release build; local and online Board; TalkBack and Reduced Motion off then on | Drag slowly/flick A into target; replace with B then A; release another card just outside; cancel/intercept; interrupt settle; let timeout/peer lock win mid-replacement; invoke the localized accessibility action. | Every valid initial/replacement drop commits exactly once with a distinct operation ID; newest accepted card settles and previous card returns to hand. Miss/cancel or an already observed timeout sends no action. A replacement losing an unseen timeout/reveal race is rejected with no accepted mutation and reconciles. Busy cards and all cards after reveal cannot drag. TalkBack and Reduced Motion reach the same authoritative state without a visible button. | Pending — T24-A/T24-B/T24-C/T24 |
| MOB-MOTION-003 | Samsung `SM-X210` or slower Android; profile/release build; Reduced Motion off then on | Complete Draft → Board → Result and trigger Reconnecting; capture frame data and repeat with system Reduced Motion enabled. | Normal mode remains near 60fps with no JS-per-frame updates or leaked animations. Reduced Motion removes translation/scale/overshoot while preserving immediate opacity/state feedback and identical final UI. | Pending — T25; iOS repeat deferred |

## Visual fidelity against `docs/ui`

For each case, capture Vietnamese and English screenshots. Compare composition,
major geometry, art layers, native text, state treatment, safe area and touch areas.
Sample names/scores/cards in the reference are illustrative; runtime state wins.

| Case ID | Reference / Preconditions | Steps | Expected result | Evidence |
|---------|---------------------------|-------|-----------------|----------|
| MOB-VIS-001 | `01-home.png`; fresh and hydrated Home; vi/en | Launch, inspect loading-to-Home transition, both primary actions and Customize. | Paper/village scene, brand hierarchy and red/blue actions follow the reference; native labels fit; both routes and Customize remain usable. | Pending — T15 |
| MOB-VIS-002 | `02-rooms.png`; no credential, saved credential, each entry error and busy state | Open Rooms, exercise empty/current room, create, invalid/full/expired join, retry and back. | Title plaque, framed room panel, red create, labeled input and blue join follow the reference; every functional state is localized, recoverable and stable. | Pending — T16 |
| MOB-VIS-003 | `03-lobby.png`; one then two seats | Create a room, copy code, observe waiting state, join from device B, then leave. | Invitation scroll, two player panels, VS, ready/waiting and leave hierarchy follow the reference; code/status are runtime native text and no private data appears. | Pending — T17 |
| MOB-VIS-004 | `04-draft.png`; local and online active/inactive seats | Observe first/second turn, selected, waiting and timeout states with Reduced Motion on/off. | Woven scene, opponent plaque, three fixed facedown slots and instruction panel follow the reference; legal/unavailable states are clear without exposing the opponent pick and the row never collapses to two cards. | Pending — T18 |
| MOB-VIS-005 | `05-board.png` + `ui1.png`; local and online rounds 1–4; 320x568, 360x800, 390x844 and Samsung `SM-X210` portrait | Capture initial 4-card hand, then selection, target, locked, reveal and post-discard states through the 3/2/1-card hands in vi/en. | Centered opponent/player score plaques, opponent backs with labeled discard rail, large pale vertical opponent-slot/VS/player-slot arena, fanned runtime hand, lower placeholder and nearby timer follow the references without clipping. Sample card counts do not override runtime 4 → 3 → 2 → 1 state. Final T24 evidence has no visible Lock button. | Pending — T19 geometry + T24 interaction |
| MOB-VIS-006 | `06-reconnecting.png`; active online board then transport loss | Disconnect within and beyond the reservation window; inspect Reduced Motion. | Dimmed non-interactive board and centered reconnect scroll/drum follow the reference; native countdown reflects the reservation and expiry behavior remains authoritative. | Pending — T20 |
| MOB-VIS-007 | `07-result.png`; completed local/online match and early forfeit | Inspect win/loss, four runtime round rows, rematch/wait/home and forfeit. | Outcome stamp, score plaque, history scroll and actions follow the reference; rows use real history, while forfeit never fabricates missing rounds. | Pending — T21 |

## P1 - Private rooms and privacy

| Case ID | Device / Preconditions | Steps | Expected result | Evidence |
|---------|------------------------|-------|-----------------|----------|
| MOB-P1-001 | Two physical devices; local server; distinct fresh guests | Both devices open **Phòng online**. Device A uses **Tạo phòng**; Device B enters the code and uses **Vào phòng**; both draft and play four rounds. | Create and join share one Rooms screen with no separate routes or public room enumeration; Lobby admits exactly two; both clients stay phase/score consistent; opponent draft/hand stays secret until legal reveal; one result is shown after round four. | Pending |
| MOB-P1-002 | Three clients; one two-player room | Join A and B, then attempt to join C; repeat create/join taps quickly. | C receives full error without disturbing A/B; each entry mutation runs at most once. | Pending |
| MOB-P1-003 | Rooms screen with no current session, then a reconnectable session | Confirm the empty state; submit invalid, expired, then valid codes; return while a session is reconnectable. | Errors stay on Rooms with the code editable; valid code is revalidated after the ad; only the guest's current reconnectable room appears, never a server-wide private-room list. | Pending |
| MOB-P1-004 | Two physical devices; fixed first-drafter test configuration | Let A draft while observing B, then repeat with B first; compare all three visual slots before the second pick. | Inactive device shows only the localized opponent-picked/waiting state, never the selected position/card; the two remaining legal positions are reshuffled/re-indexed and rendered beside one inert facedown placeholder so the row stays at three. | Pending |
| MOB-P1-005 | Two physical devices in online draft/round selection | Let each draft seat time out once; in a later round lock on one device and let the other time out. | Each 5-second draft deadline and 15-second round deadline is server-authoritative; only legal cards are auto-selected, reveal occurs once, and both clients remain consistent. | Pending |
| MOB-P1-006 | Two physical devices in `ROUND_SELECTION`; inspect projections/logs without exposing secrets | Device A locks A, replaces with B, retries the B operation, then races C against Device B's lock and the deadline. Reconnect A before reveal in a separate run. | A's projection restores the exact held card; B sees only `locked: true`. Replacement keeps the original deadline. Same-operation retry is idempotent; peer-lock/deadline ordering selects one authoritative result and no stale replacement mutates after reveal. | Pending — T24-A |

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
