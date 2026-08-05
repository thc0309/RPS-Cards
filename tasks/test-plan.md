# Mobile and E2E Test Plan - RPS Cards MVP

Status: partially executed; native physical cases blocked

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
| MOB-UI-002 | iPhone portrait around 390x844 pt with safe-area cutout | Repeat the critical states and rotate the physical device. | App remains portrait; native status/safe areas are respected; layout hierarchy matches the reference. | Pending |
| MOB-UI-003 | TalkBack then VoiceOver enabled | Navigate Home, Rooms, Lobby, Draft, Board, Reconnecting, and Result once in Vietnamese and once in English. | Every action/card has a meaningful localized accessible name; focus order follows play order; selected/locked/win/loss are not color-only. | Pending |
| MOB-UI-004 | Reduced Motion enabled | Complete draft, card selection, reveal, discard, and result. | Motion is reduced/removed and every transition settles into the same readable final state. | Pending |
| MOB-UI-005 | Android and iOS portrait; Board with `folk_default` | Inspect upper/lower player zones, central arena, card backs, labels, and discards through multiple rounds. | Upper and lower backgrounds are symmetric player-owned halves; text/art remain upright; the center stays neutral; opponent backs are identical and no decorative element behaves like a control. | Pending |
| MOB-UI-006 | Rooms with no credential, then one saved reconnect credential; force network/ad errors | Inspect empty/current-room states; tap create/join rapidly; open the saved room; retry after each failure. | Exactly one localized current-room row replaces the empty state; busy controls cannot duplicate requests; every failure returns to an editable, non-stuck Rooms state. | Pending; room-entry regression tests automate error/busy behavior |
| MOB-UI-007 | 320x568 and 390x844 portrait; local and online Board in vi/en | Select each card, inspect **Khóa bài**, let the opponent lock, and complete four rounds. | Búa maps to `ROCK`, Bao to `PAPER`, and Kéo to `SCISSORS`; selection precedes lock; locked status is textual; used cards disappear; per-player discards and `VS` reveal remain readable without wrapping the four-card hand. | Pending; i18n/projection/countdown regressions automate state contracts |

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
| MOB-PERF-001 | Representative mid-range Android and one iOS device; profiling tools available | Record board selection, simultaneous reveal, discard movement, and screen transitions with `View`/`ImageBackground`/Reanimated; inspect mounted large assets and listener cleanup. If a named effect fails after ordinary optimization, integrate only that bounded Skia surface, rebuild both development clients, and repeat the exact trace plus accessibility/reduced-motion checks. | Target interactions are stable near 60 fps without leaked timers/listeners or unnecessary mounted scenes. Evidence records `SKIA_NOT_NEEDED`, or measurable before/after improvement with native controls/text still accessible and no Skia objects in persisted state. | Pending |

## Final Evidence Gate

- [x] `npm run verify` passes for the exact tested source state.
- [ ] Core unit tests include all nine matchups and the 864 exhaustive final-match cases.
- [ ] Colyseus integration tests prove capacity, idempotency, timeout, reconnect, and forbidden secret-field absence.
- [ ] Preference/localization persistence cases pass without credentials in AsyncStorage.
- [ ] Performance evidence contains an explicit bounded Skia decision.
- [x] All device cases above are PASS, or each non-pass case is recorded with owner/blocker in `tasks/test-result.md`.
