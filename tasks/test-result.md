# Test Results

Run date: 2026-08-05 (Asia/Ho_Chi_Minh)

Last updated: 2026-08-19 (Asia/Ho_Chi_Minh)

Source state: uncommitted working tree after full-project review hardening. No secret,
reconnect token, private hand, production ad ID, or stack trace is recorded.

## Automated gates

### T13-R — 2026-08-19

| Gate | Result | Evidence |
|---|---|---|
| Mobile regression tests | PASS | 17 suites / 36 tests with `npm run test --workspace mobile -- --runInBand` |
| Mobile typecheck/lint | PASS | `npm run typecheck --workspace mobile`; `npm run lint --workspace mobile` |
| Shared safe-area root | PASS | Root `SafeAreaView` removed; `FolkSurface` explicitly owns top/right/bottom/left insets |
| Native cold launch | DEFERRED | Recheck is coupled to the Samsung Gesture Handler/dev-client build in T24-C |

### T15 — 2026-08-19

| Gate | Result | Evidence |
|---|---|---|
| Home render contract | PASS | Localized bot/online/customize actions expose button roles |
| Android build/install | PASS | Development APK built and opened on Samsung `SM-X210` |
| Home runtime render | PASS with capture note | Logo, two actions and guest/customize rendered without clipping; dev-client education sheet covered the clean final capture, which remains in T22 |
| Mounted asset budget | PASS | 7 existing PNGs; 7,426,178 compressed bytes; about 18,230,944 decoded bytes; no new copies |

### T16 — 2026-08-20

| Gate | Result | Evidence |
|---|---|---|
| Rooms presentation states | PASS | Empty/saved-room, localized error and busy-disabled create/join component checks |
| Room entry regression | PASS | Rooms UI + room-entry: 2 suites / 10 tests |
| Mobile typecheck/lint | PASS | Both workspace commands complete without errors |
| Android visual capture | DEFERRED | Final vi/en and viewport screenshots remain in T22 |

### T17 — 2026-08-20

| Gate | Result | Evidence |
|---|---|---|
| Lobby projection states | PASS | One-player waiting and two-player ready component checks |
| Copy room code | PASS | Clipboard receives the public five-character room code |
| Mobile typecheck/lint | PASS | Both workspace commands complete without errors |
| Expo Doctor | FAIL with follow-up | 19/21; SDK 57 patch drift plus root yarn/npm lockfile conflict. Native dependency alignment is assigned to T24-C |

### T18 — 2026-08-20

| Gate | Result | Evidence |
|---|---|---|
| Fixed three-slot Draft | PASS | Two authoritative positions still render slots 1/2/3; slot 3 is disabled, marked and has no `onPress` |
| Draft/motion/i18n regression | PASS | 4 suites / 9 tests |
| Server privacy/deadlines | PASS | 23/23 server tests |
| Mobile typecheck/lint | PASS | Both workspace commands complete without errors |

### T19 — 2026-08-20

| Gate | Result | Evidence |
|---|---|---|
| Vertical Board geometry | PASS | Arena is column-oriented with stable opponent and lower drop placeholders |
| Runtime hand/discards | PASS | Existing state-driven filtering and ordered rails retained; no sample counts hard-coded |
| Focused mobile regression | PASS | 6 suites / 12 tests |
| Server + mobile static gates | PASS | Server 23/23; mobile typecheck/lint pass |

| Gate | Result | Evidence |
|---|---|---|
| game-core tests | PASS | 13/13, including 864 exhaustive and 10,000 deterministic simulations |
| server tests | PASS | 23/23, including configured deadlines, bearer authorization, polling expiry, per-player discards and explicit leave |
| mobile tests | PASS | 16 suites / 35 tests, including entry error containment, bearer-only transport, native ad timeout cleanup, Vietnamese card mapping, countdown, folk assets and round history |
| typecheck/lint/build | PASS | `npm run verify` on this source state |
| Expo compatibility | PASS | `npx expo-doctor --verbose`: 20/20 after SDK 57 patch alignment (`expo` 57.0.12, `expo-dev-client` 57.0.11, `expo-router` 57.0.12, `expo-splash-screen` 57.0.6, `jest-expo` 57.0.4) |
| HTTP authorization smoke | PASS | no bearer `404`; valid bearer `200`; leave `200`; post-leave snapshot `404`, with no credential printed |
| dependency audit | FAIL with note | `npm audit --audit-level=high`: 29 total findings, including 14 high in transitive Expo/Metro and Colyseus auth paths. Available forced fixes downgrade/break `expo` or `colyseus`, so they were not applied during Android evidence. |
| diff hygiene | PASS | `git diff --check` |

## Native/device evidence

| Case(s) | Result | Evidence / blocker |
|---|---|---|
| Android development build startup | PASS | Exact-source Expo development APK assembled for `arm64-v8a`, installed with `adb install -r`, and launched as the resumed `com.stagoo.rpscards/.MainActivity` on physical `Pixel_4a`; the previous missing splash module error is absent. |
| MOB-P0-001..004 | PARTIAL | Physical Android observation reached Home, Draft, Board, automatic timeout progression, and Result. Full manual tap/race/rematch matrix is still pending; unit/integration coverage passes. |
| MOB-PREF-001..003 | BLOCKED | Requires device locale/force-close/storage inspection; no physical device evidence captured |
| MOB-UI-001 | PARTIAL | Home, Draft, Board, and Result rendered on physical `Pixel_4a`; the required 320x568 and 360x800 matrix remains pending |
| MOB-UI-002 | BLOCKED | iOS destination unavailable |
| MOB-UI-003 | BLOCKED | TalkBack/VoiceOver manual pass not run |
| MOB-UI-004 | BLOCKED | Reduced-motion implementation/unit test PASS; native setting pass not run |
| MOB-UI-005 | PARTIAL | Physical Android board inspection confirms symmetric upper/lower folk zones and a neutral central `VS` arena; cross-platform/multi-round visual matrix remains pending |
| MOB-P1-001..005 | BLOCKED | Requires two physical devices; emulator-only evidence is not a replacement |
| MOB-AD-001..003 | BLOCKED | Requires native ad callback observation; deterministic gate tests PASS |
| MOB-NET-001..002 | BLOCKED | Requires two physical devices and actual transport drop; server fake-clock reconnect/expiry tests PASS |
| MOB-PERF-001 | BLOCKED | No representative iOS device or approved FPS profiler available; `SKIA_NOT_NEEDED` is the code decision, not a 60fps claim |
| iOS development build | BLOCKED | CocoaPods/Xcode planning completed; `xcodebuild` exit 70 because selected destination has no installed iOS 26.2 runtime |

## Android evidence — 2026-08-13

Source/runtime: dirty working tree with Android-first tracker updates and UI
remediation already present; no commit created. Local server ran on
`127.0.0.1:2567`; Metro ran on `8081`; `adb reverse` mapped both ports for
physical `Pixel_4a` Android 13 and emulator `sdk_gphone16k_arm64`. Evidence
screenshots are under `tasks/evidence/ui/2026-08-13/`.

| Case(s) | Result | Evidence / blocker |
|---|---|---|
| Android dependency compatibility | PASS | `npx expo-doctor --verbose` passes 20/20 after SDK 57 patch alignment; final `npm run verify` passes. |
| Android launch/log hygiene | PASS for visited routes | Home, Rooms, Lobby, Draft, Board and Result were visited on Android; `logcat` search found no React state-update-before-mount warning and no FATAL/ReactNativeJS crash. Reconnecting route was not exercised in this run. |
| MOB-P0-004 local timeouts | PASS | On physical Pixel 4a, local draft and round timers auto-advanced to `Match result` with four runtime round rows and usable `Rematch`/`Home` controls. Evidence: `draft-physical-active.png`, `board-physical-round1.png`, `result-physical-timeout.png`. |
| MOB-P0-001 local tap matrix | PARTIAL | Local flow reached Result and Home via timeout path. ADB card-tap injection did not reliably select a board card, so manual tap/race/rematch coverage remains pending. |
| MOB-AD-001 create entry gate | PARTIAL | Tapping Create room on physical Android displayed the official AdMob interstitial test ad; closing it continued to Lobby and created room code `RKSL2`. Join-side ad/UI completion remains pending. Evidence: `lobby-physical-created.png`, `lobby-physical-created-after-ad-close.png`. |
| MOB-P1-001 Android two-client smoke | PARTIAL | Physical create reached Lobby with `Players connected: 1 / 2`; server API join from emulator-side test identity was accepted and room validation returned `full`; physical client advanced to online Board. This is not a full P1 PASS because emulator Join UI did not complete through adb and the online Result captured only one round, not a four-round two-client match. Evidence: `lobby-physical-created-after-ad-close.png`, `online-physical-after-api-join.png`, `online-result-physical-timeout.png`. |
| MOB-UI-003 accessible names | PARTIAL | UIAutomator exposed localized/English accessible names for major controls and cards on Home, Rooms, Lobby, Board and Result. Manual TalkBack focus-order pass was not run. |
| MOB-PERF-001 | BLOCKED | No Android frame trace/FPS profiler evidence captured in this run. |

## Android follow-up evidence — 2026-08-13

Source/runtime: same Android-first dirty working tree. Local Colyseus server ran
on `127.0.0.1:2567`; Metro ran on `8081`; `adb reverse` mapped both ports for
physical `Pixel_4a` and emulator `sdk_gphone16k_arm64`. iOS remains deferred.

| Case(s) | Result | Evidence / blocker |
|---|---|---|
| Emulator Join UI / full two-client four-round | PASS | Physical Android created room `CHBFZ` through the Create-room UI and official AdMob test interstitial; emulator entered `CHBFZ` through the Rooms text field and tapped `Join room`, then both clients advanced into online Draft/Board and completed four rounds. Final result screenshots show consistent opposite perspectives: physical `You win`, score `2 - 1`; emulator `Opponent`, score `1 - 2`; both show Round 1-4 rows. Evidence: `tasks/evidence/ui/2026-08-13/android-two-client/physical-lobby-created.png`, `emulator-code-correct-before-join.png`, `emulator-after-join-tap.png`, `physical-result-4-round.png`, `emulator-result-4-round.png`. |
| Small-screen/font-scale matrix | FAIL | Emulator 320x568 at density 160 with `font_scale=1.3` rendered Rooms but clipped critical text and controls: placeholder text is cut and Join area is not reachable in the captured viewport after repeated scroll attempts. Emulator 360x800 at density 160 with `font_scale=1.3` clean launch rendered a blank white app surface with only system/status bars; logcat showed ReactHost soft exceptions but no JS crash. Evidence: `tasks/evidence/ui/2026-08-13/android-small-matrix/320x568-fs1_3-rooms-deeplink.png`, `320x568-fs1_3-rooms-scrolled.png`, `320x568-fs1_3-rooms-scroll-deep.png`, `360x800-fs1_3-clean-launch.png`. |

## UI-reference comparison — 2026-08-06

Source/runtime: `1a32ec5` plus the existing dirty worktree; freshly assembled and
installed debug APK on `Pixel_6_Pro` AVD, Android API 37, 1440x3120 at density 560,
font scale 1.0. Metro used `127.0.0.1:8081`; the local server used port 2567 and
the official AdMob interstitial test unit. Product source was not edited during
this evidence run.

| Case | Result | Evidence / deviation from `docs/ui` |
|---|---|---|
| MOB-VIS-001 Home | FAIL | Folk background, logo and red/blue action assets render, but composition differs materially from `01-home.png`: settings/subtitle/customize/guest UI was added, actions are narrower, and the reference hierarchy/spacing is not preserved. At 320x568-equivalent with font scale 1.3, the subtitle clips, **Chơi với bot** renders as **Chơi với**, **Phòng online** as **Phòng**, Customize truncates, and the guest badge falls below the viewport. Evidence: `tasks/evidence/ui/2026-08-06/MOB-VIS-001-home-{vi,en}-android.png`, `MOB-UI-001-home-vi-320x568-font13-android.png`. |
| MOB-VIS-002 Rooms | FAIL | Background/plaque/button assets render, but the full-height framed room panel from `02-rooms.png` is absent. The current-room label/code overlaps the scroll crest. The accessible Back bounds are 70x206 px, about 20x59 dp at density 560, below the 44 dp minimum in width. Evidence: `MOB-VIS-002-rooms-current-en-android.png`. |
| MOB-VIS-003 Lobby | FAIL | Runtime room creation works after the test ad, but the screen uses the Home background instead of the darker hall scene, omits the two player panels/avatars/VS treatment from `03-lobby.png`, and the title/room-code labels overlap their decorative assets. Evidence: `MOB-VIS-003-lobby-en-android.png`. |
| MOB-VIS-004 Draft | FAIL | Only two compact card backs are shown on a plain texture. The opponent plaque, three-card composition, woven arena and instruction scroll from `04-draft.png` are missing. Evidence: `MOB-VIS-004-draft-en-android.png`. |
| MOB-VIS-005 Board | FAIL | Functional round state renders, but the flat translucent halves and text-only hand/discard summaries do not match the score plaques, illustrated hand, card backs, discard zones or neutral two-slot arena in `05-board.png`/`ui1.png`. Evidence: `MOB-VIS-005-board-en-android.png`. |
| MOB-VIS-006 Reconnecting | BLOCKED | Stopping transport from a one-seat Lobby returned to Rooms/current-room state. An active two-client Board is required to reproduce the reference reconnect overlay; no valid screenshot was available. |
| MOB-VIS-007 Result | FAIL | Outcome/score/actions work, but the outcome stamp, score plaque, four runtime history rows and history scroll from `07-result.png` are missing; **Match result** overlaps the scroll crest. Evidence: `MOB-VIS-007-result-en-android.png`. |

Cross-cutting blocker: every exercised screen raised the React dev error
`Can't perform a React state update on a component that hasn't mounted yet`, and
its overlay covered bottom content/actions until dismissed. The debug cold start
took about 43 seconds before `Running "main"`; Android logged repeated skipped-frame
bursts, so this run is not performance-PASS evidence.

Not run in this comparison: 360x800 and 390x844 viewport passes, TalkBack,
Reduced Motion, iOS, the second online client, and Android frame tracing.

Conclusion: **NO-GO for UI-reference fidelity and the final native MVP gate.**
MOB-VIS-001–005 and 007 fail; MOB-VIS-006 remains blocked.
