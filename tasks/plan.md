# Implementation Plan — RPS Cards MVP

Status: T01–T12 complete; Android remediation/evidence active; iOS validation deferred

Current execution order is Android-only through T13-R, T15–T25, T22 and the Android
portion of T14. iOS remains required for the later cross-platform release gate,
but it does not block completion of the current Android milestone.

`SPEC.md` là hợp đồng sản phẩm. File này chỉ ánh xạ thứ tự, phụ thuộc và
checkpoint. Chi tiết kỹ thuật, file dự kiến, tiêu chí nghiệm thu và lệnh chạy
nằm trong từng tài liệu dưới `tasks/detail-tasks/`.

## Skill Intake Summary

### Stack và miền công việc đã phát hiện

- npm workspaces đang hoạt động: `mobile`, `server`, `game-core`; automated
  gameplay/security gates đã xanh, nhưng mobile UI hiện mới là functional shell.
- Mobile: Expo development build, Expo Router, React Native, Zustand,
  AsyncStorage, SecureStore, i18n, Reanimated; drag-to-lock cần thêm
  Gesture Handler thành direct dependency; Skia chỉ theo decision gate.
- Backend: Node.js, Colyseus, authoritative in-memory rooms, typed protocol và
  player-specific private projections.
- Quality: Node test runner cho core/server, Jest cho mobile, Android/iOS device
  evidence, security/privacy, accessibility và 60 fps profiling.

### Skill hiện có được ánh xạ

| Skill | Dùng cho |
|---|---|
| `vibe-build` | Thực thi từng TXX hoặc toàn bộ theo dependency |
| `vibe-test` | TDD cho rules, protocol, store và regression |
| `source-driven-development` | Chốt phiên bản/API chính thức của Expo, Colyseus, Zustand, ads và native modules |
| `frontend-ui-engineering` | Routes, state, UI dân gian, accessibility và responsive portrait |
| `api-and-interface-design` | `game-core` contracts, Colyseus messages, error codes và projections |
| `security-and-hardening` | Guest credential, reconnect, input validation, privacy và log redaction |
| `performance-optimization` | Đo animation/FPS, ảnh lớn và decision gate cho Skia |
| `expo-animation` | Chọn motion tier, Reanimated UI-thread, timing/spring và Reduced Motion cho native Expo |
| `vibe-review` | Review theo checkpoint và trước E2E cuối |
| `vibe-e2e` | Quy trình evidence; native execution dùng runner/device đã được chọn |
| `browser-testing-with-devtools` | Console/warning/screenshot inspection for a web fallback; native device evidence remains the source of truth |
| `vibe-plan` | Tách UI-reference remediation thành các slice có screenshot gate |

### Skill gaps

- Chưa có repo-local skill chuyên tự động hóa React Native trên thiết bị
  (Maestro/Detox). Không chặn MVP vì `tasks/test-plan.md` hỗ trợ chạy tay có
  evidence; chỉ cài/tạo skill khi chọn runner chính thức.
- `responsiveness-check` is available in the shared catalog but is not
  repo-local; consider it only if the manual native viewport matrix becomes too
  slow, not as a planning prerequisite.
- Chưa có visual-diff runner cho native screenshot. T22 dùng `adb` + ảnh đối
  chiếu có checklist trước; chỉ thêm Maestro/Detox hoặc image-diff dependency
  khi manual evidence không còn đủ ổn định.
- Chưa có skill chuyên Colyseus hoặc Google Mobile Ads. Dùng
  `source-driven-development` với tài liệu chính thức; không cài thêm skill chỉ
  để lập kế hoạch.
- Supabase không có task MVP: chỉ kích hoạt khi có account, cross-device sync,
  inventory/purchase, history hoặc durable recovery theo `SPEC.md`.

### Additional intake for this remediation

- `debugging-and-error-recovery` is required first for the reproduced React
  state-update warning and lifecycle cleanup; fix the root cause before visual
  work proceeds.
- `incremental-implementation` governs each screen slice: implement, focused
  test, typecheck/lint, then native screenshot before the next slice.
- `code-review-and-quality` is the final cross-axis review after evidence.

## Task Plan

### Phase A — Foundation and deterministic core

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T01 | npm workspaces, root command contract và Expo development build boot được | — | [T01](detail-tasks/T01-workspace-expo-dev-build.md) | `vibe-build`, `source-driven-development` |
| T02 | Pure `classic_v1` match engine với legal locks, four-round lifecycle và unit tests | T01 | [T02](detail-tasks/T02-game-core-match-engine.md) | `vibe-test`, `api-and-interface-design` |
| T03 | Draft/random boundary, exhaustive 864 cases và 10,000-match simulation | T02 | [T03](detail-tasks/T03-draft-random-verification.md) | `vibe-test`, `security-and-hardening` |

T01 evidence: root `npm run verify` passed; server `/health` passed; Android
development build installed/launched; iOS native prebuild/CocoaPods passed but
simulator execution is blocked until a simulator is booted. T02 evidence:
game-core TDD red/green completed; five core tests pass for all nine matchups,
legal/illegal locks, simultaneous reveal, discard order, and exactly-four-round
`MATCH_RESULT`; T03 evidence adds `864/864` exhaustive and `10000/10000`
deterministic simulations. T04–T06 evidence: 8 mobile suites / 13 tests pass,
typed vi/en preferences and SecureStore boundary are in place, local draft and
15-second round adapters pass fake-clock race/rematch coverage, and Android
development build rebuilt/installed/launched after native module additions. T07
evidence: game-core protocol suite (13 tests), server Colyseus room/projection
suite (9 tests), full `npm run verify`, and live `/health` smoke passed. T08–T10
evidence: mobile room-entry/ad suites (10 tests), server online-room suite with
privacy/four-round/rematch coverage, live create/validate/join smoke, full
`npm run verify`, and Android development build rebuilt/installed/launched with
the official test Ads plugin. iOS runtime remains blocked until a simulator is
booted.
T11 evidence: SecureStore reconnect credential, configurable 20–30s reservation
(25s default), same-seat reconnect/expiry-forfeit tests, bounded retry route, and
`ROOM_EXPIRED` cleanup are implemented; server 17/17 and mobile 25-test suites
pass. T12 evidence: stable boundary validation, 20/s bounded limiter, 256-entry
idempotency eviction, allowlist logger, secret-config checks and audit review pass.
T13 code evidence: safe-area root, accessibility hints/state, reduced-motion
behavior and `SKIA_NOT_NEEDED`; native screen-reader/font-scale/FPS evidence is
blocked. T14 evidence is in `tasks/test-result.md`; Android emulator build/open
PASS, iOS and two-device native cases BLOCKED.

### Phase B — P0 local playable slice

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T04 | Startup hydration, guest identity, vi/en, Zustand preferences và Home customize | T01 | [T04](detail-tasks/T04-mobile-startup-preferences.md) | `frontend-ui-engineering`, `security-and-hardening` |
| T05 | Home → local draft hoàn chỉnh với bot và deadline 5 giây | T03, T04 | [T05](detail-tasks/T05-local-bot-draft.md) | `vibe-test`, `frontend-ui-engineering` |
| T06 | Four-round bot board, symmetric themes, result, rematch/home và 15-second auto-lock | T05 | [T06](detail-tasks/T06-local-bot-board-result.md) | `frontend-ui-engineering`, `performance-optimization` |

### Phase C — P1 private online rooms

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T07 | Typed Colyseus protocol, server room lifecycle, code validation và private projections | T03 | [T07](detail-tasks/T07-colyseus-room-protocol.md) | `api-and-interface-design`, `security-and-hardening` |
| T08 | Rooms/Lobby create-join flow với one-shot interstitial và duplicate guard | T04, T07 | [T08](detail-tasks/T08-rooms-lobby-ads.md) | `frontend-ui-engineering`, `security-and-hardening` |
| T09 | Online sequential draft, separate deadlines, hidden pick và reshuffle/re-index | T08 | [T09](detail-tasks/T09-online-draft-privacy.md) | `vibe-test`, `security-and-hardening` |
| T10 | Authoritative online rounds, reveal, result và two-party rematch | T09 | [T10](detail-tasks/T10-online-rounds-result.md) | `api-and-interface-design`, `frontend-ui-engineering` |
| T11 | Reconnect reservation, snapshot restore, expiry loss và `ROOM_EXPIRED` recovery | T10 | [T11](detail-tasks/T11-reconnect-expiry-restart.md) | `security-and-hardening`, `vibe-test` |

### Phase D — MVP hardening

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T12 | Boundary hardening, rate limits, safe diagnostics và privacy regression suite | T11 | [T12](detail-tasks/T12-security-observability.md) | `security-and-hardening`, `vibe-review` |
| T13 | Android portrait, TalkBack, vi/en fit, reduced motion và measured Skia decision; iOS/VoiceOver deferred | T06, T11 | [T13](detail-tasks/T13-ui-accessibility-performance.md) | `frontend-ui-engineering`, `performance-optimization` |

### Phase E — UI-reference fidelity remediation

`docs/ui/01-home.png`–`07-result.png` và `ui1.png` là visual source. Runtime
state, safe area, vi/en và accessibility từ `SPEC.md` vẫn thắng các sample text,
score hoặc fixed coordinates trong ảnh.

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T13-R | Lifecycle/runtime and shared layout gate: remove React warning, clean subscriptions, safe-area surface, 44dp shared hit targets, and responsive text constraints | T13, T12 | Root-cause fix plus focused mobile regression tests | `debugging-and-error-recovery`, `vibe-test`, `frontend-ui-engineering` |
| T15 | Folk visual foundation và Home khớp `01-home.png` | T13-R | [T15](detail-tasks/T15-folk-foundation-home.md) | `vibe-build`, `frontend-ui-engineering`, `performance-optimization` |
| T16 | Rooms khớp `02-rooms.png` với đủ empty/current/error/busy states | T15 | [T16](detail-tasks/T16-rooms-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T17 | Lobby khớp `03-lobby.png`, giữ privacy và live player state | T15, T16 | [T17](detail-tasks/T17-lobby-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T18 | Local/online Draft luôn giữ ba facedown slots, chỉ authoritative positions được chọn | T15 | [T18](detail-tasks/T18-draft-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T19 | Local/online Board dựng đúng vertical arena, score plaques, discard rail, runtime hand và player drop placeholder | T18 | [T19](detail-tasks/T19-board-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `performance-optimization` |
| T24-A | Core/server cho phép thay private active lock trước reveal, giữ deadline và protocol shape | T12, T19 | [T24-A](detail-tasks/T24-A-replaceable-lock-contract.md) | `vibe-build`, `vibe-test`, `api-and-interface-design`, `security-and-hardening` |
| T24-B | Local bot mở cửa sổ thay lá 2 giây, không reset deadline và không leak timer | T24-A | [T24-B](detail-tasks/T24-B-local-replace-window.md) | `vibe-build`, `vibe-test`, `test-driven-development` |
| T24-C | Cài Gesture Handler trực tiếp, bọc root và rebuild Android client | T19 | [T24-C](detail-tasks/T24-C-gesture-runtime.md) | `vibe-build`, `expo-animation`, `source-driven-development` |
| T24 | Board drag selected card vào placeholder để lock/thay thế; bỏ visible Lock button | T24-A, T24-B, T24-C | [T24](detail-tasks/T24-gameplay-motion.md) | `vibe-build`, `expo-animation`, `frontend-ui-engineering`, `performance-optimization`, `vibe-test` |
| T20 | Reconnecting overlay khớp `06-reconnecting.png` trên board state | T24 | [T20](detail-tasks/T20-reconnecting-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T21 | Local/online Result khớp `07-result.png`, dùng lịch sử runtime | T24 | [T21](detail-tasks/T21-result-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T23 | Shared press/selection feedback cho button, card và Back | T15–T21 | [T23](detail-tasks/T23-shared-motion-feedback.md) | `vibe-build`, `expo-animation`, `frontend-ui-engineering`, `vibe-test` |
| T25 | Result/Reconnecting motion, Reduced Motion và Android profile gate | T23, T24 | [T25](detail-tasks/T25-motion-accessibility-performance.md) | `vibe-build`, `expo-animation`, `performance-optimization`, `vibe-e2e` |
| T22 | Android screenshot, TalkBack, vi/en, small-screen, motion và asset/FPS evidence; iOS matrix deferred | T16–T25 | [T22](detail-tasks/T22-ui-visual-evidence.md) | `vibe-e2e`, `performance-optimization`, `vibe-review` |

### Phase F — Final native evidence

Run the Android subset now. Keep T14 open after the Android milestone because
the deferred iOS cases are still part of the full cross-platform gate.

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T14 | Full verify và native-device E2E evidence cho P0/P1 | T12, T13, T22 | [T14](detail-tasks/T14-native-e2e-final-gate.md) | `vibe-e2e`, `vibe-review` |

## Phase Checkpoints

### Checkpoint A — after T01–T03

- Root `npm run verify` chạy được và deterministic core suite xanh.
- 864 exhaustive cases và 10,000-match simulation chứng minh không có tied
  final match hoặc invalid terminal state.
- Interactive mode: review trước T04. `$vibe-build all`: ghi evidence rồi tiếp tục.

### Checkpoint B — after T04–T06

- Android và iOS development build hoàn tất bot draft/four-round/result flow.
- Locale/loadout hydrate đúng; không có credential trong AsyncStorage.
- Interactive mode: review P0 trước T07. `$vibe-build all`: tiếp tục P1.

### Checkpoint C — after T07–T11

- Hai simulated clients vượt integration suite về capacity, idempotency,
  privacy, timeout và reconnect.
- Automated clients có thể create/join/draft/play/result/reconnect; server vẫn
  authoritative. Hai thiết bị thật chưa có trong môi trường này.
- Interactive mode: review P1 trước hardening. `$vibe-build all`: tiếp tục.

### Checkpoint D — after T12–T13

- Security/behavior regression suite xanh trước khi đổi visual layer.
- Functional UI contract, accessibility baseline và Skia decision được giữ.

### Checkpoint E0 — after T13-R

- Cold launch and every route no longer emit the reproduced React state-update
  warning or subscription cleanup warning.
- `FolkSurface` respects safe areas; shared controls meet 44 dp; vi/en text
  remains usable at the 320×568/font-scale 1.3 regression matrix.
- `npm run verify`, mobile typecheck/lint, and focused lifecycle/layout tests are
  green before any reference-composition work.
- Interactive mode: review the root-cause fix before T15. `$vibe-build all`:
  continue only when this gate is green.

Evidence 2026-08-19: removed the duplicate root `SafeAreaView` so the shared
`FolkSurface` is the single inset owner and now declares all four edges
explicitly. Mobile regression gate is green (17 suites / 36 tests), mobile
typecheck and lint pass, and `git diff --check` passes. Existing Android
logcat evidence has no state-update-before-mount warning on visited routes;
fresh Samsung cold launch is deferred to T24-C.

### Checkpoint E1 — after T15–T17

- Home → Rooms → Lobby khớp composition của ba reference tương ứng trên Android.
- Create/join/current-room/error/busy/player-count flows không bị visual refactor làm hỏng.
- Interactive mode: review navigation shell trước gameplay screens.

### Checkpoint E2 — after T18, T19, T24-A, T24-B, T24-C and T24

- Draft local/online luôn giữ ba visual slots mà không đổi authoritative two-pick
  rules; Board có centered score plaques, opponent discard rail, vertical
  opponent-slot/VS/player-slot arena, runtime 4 → 3 → 2 → 1 hand và timer.
- Visible Lock button đã được thay atomically bằng drag selected card vào lower
  placeholder; miss/cancel/timeout/phase-change không gửi mutation.
- Trước authoritative reveal, drag lá unused khác thay active lock, đưa lá cũ về
  hand và giữ nguyên deadline; opponent chỉ thấy trạng thái locked, không thấy lá.
- `npm run verify`, small-screen layout test, drag regression và Android
  screenshot comparison trên Samsung `SM-X210` xanh.
- Interactive mode: review core gameplay fidelity trước overlay/result.

### Checkpoint E3 — after T20–T25 and T22

- Bảy screen reference có Android vi/en screenshots và explicit PASS/FAIL/BLOCKED record.
- Shared controls phản hồi trong tối đa 150ms; draft/board/reveal/result motion
  chỉ dùng transform/opacity trên UI thread và không thay đổi gameplay timing.
- Draft evidence có đủ ba facedown slots ở first/second/waiting/timeout states;
  Board evidence có valid/invalid/cancelled/timeout drag và không còn Lock button.
- TalkBack, font scale, reduced motion, asset memory và Android FPS evidence được ghi,
  gồm profile run trên Samsung `SM-X210` hoặc thiết bị Android chậm hơn.
- iOS/VoiceOver evidence is deferred and does not block this Android checkpoint.

### Checkpoint F — after T14

- `npm run verify` xanh trên đúng source state được test.
- Tất cả case trong `tasks/test-plan.md` là PASS hoặc có FAIL/BLOCKED evidence
  trong `tasks/test-result.md`.
- Chạy `$vibe-review`; không tự commit hoặc triển khai production.
- Current status: automated gate PASS; Expo Doctor PASS after SDK 57 patch
  alignment; Android local timeout path PASS; Android create-ad/Lobby and
  API-assisted two-seat online smoke PARTIAL; emulator Join UI and full
  four-round two-client Android evidence PASS. Small-screen/font-scale matrix is
  FAIL on Android and must be fixed before the Android milestone. TalkBack, FPS,
  and Reconnecting still remain. iOS is deferred.

## Task-level implementation contracts

Each remediation task is one vertical slice. It may touch its listed screen,
shared presentation primitive, one focused test, and required asset/i18n entries;
it must not alter game-core rules or room protocols except the explicitly scoped
T24-A replaceable-lock contract. Every task closes with its automated checks,
its matching test cases, and a sanitized test-result entry.

### T13-R — root lifecycle/shared layout

- Acceptance: no render-time state/store writes; all subscriptions and timers
  clean up; async busy/error paths recover; safe-area and 44 dp contracts hold.
- Verify: failing regression test first, then `npm run verify`, Expo Doctor, and
  cold Android launch through all seven routes with warning logs captured.
- Likely files: `BoardScreen.tsx`, `DraftScreen.tsx`, `RoomsScreen.tsx`,
  `Online*Screen.tsx`, `FolkSurface.tsx`, and focused mobile tests.

### T15–T21 — screen slices

- Acceptance and file ownership remain in each linked detail task. Keep local
  and online adapters separate from shared presentation; runtime data wins over
  sample mockup text.
- Verify each slice with its linked `MOB-VIS` case, vi/en screenshots, focused
  Jest tests, typecheck/lint, and no new runtime warnings.

### T24-A/T24-B/T24-C/T24 — replaceable drag-to-lock slices

- T24-A acceptance: core/server upsert one active lock in `ROUND_SELECTION`, add
  private `lockedCardId`, preserve deadline/idempotency/privacy and reject stale
  replacement after reveal. Likely files: `game-core/src/match.ts`, its test,
  `game-core/src/protocol.ts`, `server/src/rooms/online-room.ts`, its test. Verify
  focused core/server suites, then `npm run verify`.
- T24-B acceptance: local bot waits one fixed 2,000ms window after the first
  player lock; replacement does not restart either timer; timeout/rematch/dispose
  clears and resolves once. Likely files: local match adapter and its fake-clock
  test. Verify focused mobile adapter tests and mobile typecheck.
- T24-C acceptance: direct Expo-compatible Gesture Handler dependency, outer root
  wrapper, unchanged safe-area/router behavior and successful Samsung `SM-X210`
  cold launch. Likely files: `mobile/package.json`, root lockfile and `_layout.tsx`.
  Verify mobile typecheck/lint, Expo Doctor and Android development build.
- T24 acceptance: selected/remaining unused cards share one measured UI-thread
  drag path; valid initial/replacement commits once, old card returns to hand,
  invalid/stale cases reconcile, and TalkBack/Reduced Motion reach the same state.
  Likely files: `FolkGameViews.tsx` plus test, local Board screen and online Board
  screen. Verify focused Jest, `npm run verify`, `MOB-MOTION-002` and
  `MOB-DRAG-001` on Samsung `SM-X210`.

T24-A and T24-C are independent after T19; T24-B waits for T24-A, and T24 waits
for all three. Interactive execution still completes one task at a time.

### T23/T25 — remaining motion slices

- T23 extends the existing `FolkButton`, `FolkCard`, `FolkBackButton` and motion
  helper; press feedback is `scale: 0.97` with a 120ms ease-out ceiling and no
  new dependency.
- T25 adds restrained rare/state motion for Result and Reconnecting, then proves
  Reduced Motion equivalence and Android frame stability before T22.
- Verify with focused Jest tests, `npm run verify`, `MOB-MOTION-001..003`, and a
  real Android profile/release build. Dev-build feel is observation only, not FPS evidence.

### T22/T14 — evidence gates

- T22 is evidence-only after T15–T25: update test plan/results, screenshots,
  font-scale/safe-area/reduced-motion/accessibility/FPS records, and asset budget.
- T14 is final; two-client Reconnecting and unavailable iOS remain BLOCKED unless
  the required devices/runtime are actually available.

## Tradeoffs and Deferred Decisions

- Local-first MVP tránh Supabase và durable room persistence; server restart làm
  room hết hạn theo contract.
- `View`/`ImageBackground`/Reanimated là mặc định. Chỉ thêm Skia sau số đo trong
  T13 chứng minh một acceptance case cụ thể không đạt.
- Chỉ thêm `react-native-gesture-handler` trực tiếp vì drag-to-lock cần gesture
  UI-thread và root wrapper. Không thêm loop parallax/ambient nền, Lottie,
  haptics, Skia hoặc custom JS screen transitions; mở rộng chỉ khi device
  evidence chứng minh nhu cầu.
- Local bot dùng fixed 2,000ms think window để replacement có thể được thao tác và
  test deterministic. Chỉ nâng thành setting nếu device evidence cho thấy nhịp
  này quá ngắn/dài; không tạo config trước nhu cầu.
- Dùng các layer trong `docs/assets` làm nguồn; chỉ copy/resize asset thực sự được
  mount vào `mobile/src/assets/folk_default`. Không dùng nguyên mockup full-screen
  vì text/runtime state phải native và hai board halves thuộc từng player.
- Không thêm component library hoặc generic theme engine. Chỉ extract một visual
  primitive khi đã có ít nhất hai màn hình dùng cùng geometry.
- Native E2E runner chưa được chọn. T14 dùng manual device protocol trước; việc
  thêm Maestro/Detox là quyết định riêng vì làm tăng native/CI scope.
- EAS distribution, production ads, monitoring, privacy paperwork và release
  signing vẫn thuộc P2.
