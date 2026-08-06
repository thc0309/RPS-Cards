# Test Results

Run date: 2026-08-05 (Asia/Ho_Chi_Minh)

Last updated: 2026-08-06 (Asia/Ho_Chi_Minh)

Source state: uncommitted working tree after full-project review hardening. No secret,
reconnect token, private hand, production ad ID, or stack trace is recorded.

## Automated gates

| Gate | Result | Evidence |
|---|---|---|
| game-core tests | PASS | 13/13, including 864 exhaustive and 10,000 deterministic simulations |
| server tests | PASS | 23/23, including configured deadlines, bearer authorization, polling expiry, per-player discards and explicit leave |
| mobile tests | PASS | 14 suites / 33 tests, including entry error containment, bearer-only transport, native ad timeout cleanup, Vietnamese card mapping and countdown |
| typecheck/lint/build | PASS | `npm run verify` on this source state |
| Expo compatibility | PASS | `npx expo-doctor --verbose`: 20/20 after npm-only lockfile cleanup and SDK 57 package alignment |
| HTTP authorization smoke | PASS | no bearer `404`; valid bearer `200`; leave `200`; post-leave snapshot `404`, with no credential printed |
| dependency audit | PASS with note | `npm audit --audit-level=high`: no high/critical; 19 low/moderate transitive findings remain in upstream Expo/Colyseus paths; available forced fixes are breaking downgrades and were not applied |
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
