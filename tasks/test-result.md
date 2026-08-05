# Test Results

Run date: 2026-08-05 (Asia/Ho_Chi_Minh)

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

Conclusion: GO for code review and Android development testing; NO-GO for the
final native MVP gate until the remaining Android interaction matrix, physical iOS,
two-device privacy/reconnect, screen-reader, and performance evidence are collected.
