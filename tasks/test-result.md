# Test Results

Run date: 2026-08-05 (Asia/Ho_Chi_Minh)

Source state: uncommitted working tree after T11–T13 implementation. No secret,
reconnect token, private hand, production ad ID, or stack trace is recorded.

## Automated gates

| Gate | Result | Evidence |
|---|---|---|
| game-core tests | PASS | 13/13, including 864 exhaustive and 10,000 deterministic simulations |
| server tests | PASS | 17/17, including privacy, reconnect/expiry, limiter, idempotency and logs |
| mobile tests | PASS | 12 suites / 25 tests, including SecureStore credential and reduced motion |
| typecheck/lint/build | PASS | `npm run verify` on this source state |
| dependency audit | PASS with note | `npm audit --audit-level=high`: no high/critical; 18 low/moderate transitive findings documented in T12 |
| diff hygiene | PASS | `git diff --check` |

## Native/device evidence

| Case(s) | Result | Evidence / blocker |
|---|---|---|
| Android development build startup | PASS | `npm run mobile:android` exit 0; debug APK installed and opened on `Pixel_4a` emulator |
| MOB-P0-001..004 | BLOCKED | No approved native E2E runner/manual interaction recording in this run; unit/integration coverage remains PASS |
| MOB-PREF-001..003 | BLOCKED | Requires device locale/force-close/storage inspection; no physical device evidence captured |
| MOB-UI-001 | BLOCKED | Android emulator build exists, but no screenshot/manual small-viewport matrix recorded |
| MOB-UI-002 | BLOCKED | iOS destination unavailable |
| MOB-UI-003 | BLOCKED | TalkBack/VoiceOver manual pass not run |
| MOB-UI-004 | BLOCKED | Reduced-motion implementation/unit test PASS; native setting pass not run |
| MOB-UI-005 | BLOCKED | Symmetric board is covered by code/tests; native visual capture not run |
| MOB-P1-001..005 | BLOCKED | Requires two physical devices; emulator-only evidence is not a replacement |
| MOB-AD-001..003 | BLOCKED | Requires native ad callback observation; deterministic gate tests PASS |
| MOB-NET-001..002 | BLOCKED | Requires two physical devices and actual transport drop; server fake-clock reconnect/expiry tests PASS |
| MOB-PERF-001 | BLOCKED | No representative iOS device or approved FPS profiler available; `SKIA_NOT_NEEDED` is the code decision, not a 60fps claim |
| iOS development build | BLOCKED | CocoaPods/Xcode planning completed; `xcodebuild` exit 70 because selected destination has no installed iOS 26.2 runtime |

Conclusion: GO for code review of T11–T13 automated implementation; NO-GO for
final native MVP gate until physical Android/iOS, two-device privacy/reconnect,
screen-reader, and performance evidence is collected.
