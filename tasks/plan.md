# Implementation Plan — RPS Cards MVP

Status: T01–T12 complete; Android remediation/evidence active; iOS validation deferred

Current execution order is Android-only through T13-R, T15–T25, T26 (round reveal), T22 and the Android
portion of T14. iOS remains required for the later cross-platform release gate,
but it does not block completion of the current Android milestone.

`SPEC.md` là hợp đồng sản phẩm. File này chỉ ánh xạ thứ tự, phụ thuộc và
checkpoint. Chi tiết kỹ thuật, file dự kiến, tiêu chí nghiệm thu và lệnh chạy
nằm trong từng tài liệu dưới `tasks/detail-tasks/`; riêng kế hoạch T26 nằm trong
phần [T26 — Nhịp sân đấu và lật bài](#t26-round-flow) bên dưới.

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
| T22 | Android screenshot, TalkBack, vi/en, small-screen, motion và asset/FPS evidence; iOS matrix deferred | T16–T25, T26 | [T22](detail-tasks/T22-ui-visual-evidence.md) | `vibe-e2e`, `performance-optimization`, `vibe-review` |

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

- T22 is evidence-only after T15–T25 and T26: update test plan/results, screenshots,
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


### 2026-10-06 — scoped UI repair after card refresh

Completed UI-01–UI-12 from the Android report: bounded bitmaps, separate decorative/content padding, viewport sizing, code hint, keyboard/scroll access, and screen proportions. No gameplay/API changes or dependencies. Evidence and native limits: [REPORT](evidence/android/2026-10-06-ui-fixes/REPORT.md). Broader T21/T22/T14 acceptance remains open.

<a id="t26-round-flow"></a>

## T26 — Nhịp sân đấu và lật bài hai bên

Ngày: 2026-10-06. **PLANNED — chưa triển khai, chưa chạy kiểm thử mới.**
Phạm vi: kiểm tra sân đấu và thiết kế trọn luồng chọn → chốt → chờ → chuẩn bị
→ lật đồng thời → thắng/thua/hòa → thu bài → lượt tiếp theo/kết quả trận.
Giữ bộ ảnh dễ thương không khuôn mặt, luật bốn lượt và thao tác drag-to-lock.

### Kết quả kiểm tra hiện trạng

| Nguồn đã đọc | Khoảng trống cần xử lý |
|---|---|
| `mobile/src/game/local-match-adapter.ts`, `resolveIfReady` | Resolve rồi `beginNextRound` ngay trong cùng lần gọi; các emit trung gian không tạo được khoảng trình diễn ổn định. |
| `server/src/rooms/online-room.ts`, `applyLock`, `resolveRound` | Chốt đủ hai bên cũng resolve rồi sang lượt kế ngay; online không giữ pha chuẩn bị/kết quả để client quan sát. |
| `game-core/src/match.ts`, `resolveLockedRound` | Đã có outcome WIN/LOSS/DRAW và tính điểm đúng tầng; lượt 4 đi thẳng `MATCH_RESULT`, cần giữ kết quả lượt trước khi kết thúc trận. |
| `game-core/src/protocol.ts`, `buildProjection` | Có `lastRound` nhưng chưa public outcome và mốc trình diễn; không có revision để phân biệt snapshot cũ. Retry đang trả projection đã cache. |
| `BoardScreen.tsx`, `OnlineBoardScreen.tsx` | Điều hướng Result ngay khi gặp `MATCH_RESULT`. Online dùng HTTP polling 500ms; poll và action có thể trả khác thứ tự. |
| `FolkGameViews.tsx`, `FolkBoardView` | Chỉ dựa vào `canLock/lastRound` để hiện mặt bài; chưa có nhịp lật, trạng thái đối thủ đã chốt, thông báo kết quả lượt. Timer vẫn render khi không có deadline. |

Đã xem lại [ảnh sân đấu Android trước kế hoạch](evidence/android/2026-10-06-ui-fixes/04-board.png):
hai ô trên–dưới và vùng VS là nền bố cục phù hợp. Ảnh tĩnh không chứng minh
motion; lần này không chạy lại app/thiết bị. SPEC liên quan: Board rules,
State Machine, authoritative projection, privacy và motion acceptance.

### Luồng và nhịp đề xuất

“Chốt” tiếp tục là **thả lá bài hợp lệ vào ô của mình**, không thêm nút xác nhận.

| Bước | Trình bày trên sân đấu | Điều kiện / nhịp |
|---|---|---|
| 1. Chọn | Lá được nâng nhẹ, viền chọn rõ; hướng dẫn “Kéo bài vào ô để chốt”. | Còn bài hợp lệ và đang `ROUND_SELECTION`. |
| 2. Chốt / chờ | Bài vào ô của mình; “Đã chốt · Chờ đối thủ”. Nếu đối thủ chốt trước, ô trên hiện lưng bài và “Đối thủ đã chốt”. | Chỉ xác nhận sau khi authority nhận lock. Được đổi bài trong selection; giữ deadline 15s và BOT 2s từ lần chốt đầu. |
| 3. Chuẩn bị lật | Hai ô hiện lưng bài cùng kích thước, viền sáng nhẹ; “Cả hai đã chốt · Chuẩn bị lật bài”. Bài của mình vẫn có nhãn riêng để biết lá đã chọn. | Khi authority nhận đủ hai lock, dừng đổi/kéo bài và ẩn timer chọn bài. Giữ khoảng **800ms**. |
| 4. Lật đồng thời | Hai lá dùng chung tiến độ xoay Y với perspective, đổi mặt ở giữa vòng xoay; mặt chữ/ảnh luôn thẳng. | **600ms**, chỉ bắt đầu khi có dữ liệu reveal hợp lệ. Không mở lần lượt trên/dưới. |
| 5. Kết quả lượt | Banner “Bạn thắng lượt này” / “Bạn thua lượt này” / “Hòa lượt này”; nhấn nhẹ lá thắng và điểm +1; hòa không cộng điểm. | **1.200ms**, chỉ hiện sau khi hai mặt bài đã mở. Hiển thị outcome từ authority theo seat người xem. |
| 6. Thu bài | Hai lá về đúng chồng bài đã ra; giữ thứ tự lượt, không tạo bản sao tạm trong chồng. | **300ms**. Sau đó bắt đầu lượt mới hoặc Result nếu đã đủ bốn lượt. |

Tổng đề xuất từ đủ hai lock đến lượt tiếp theo: **2.900ms**. Đây là giá trị
khởi đầu để đo trên Android, không thêm setting cho người dùng. Reduced Motion
thay xoay/nảy/bay bằng đổi trạng thái hoặc fade nhẹ nhưng giữ thời gian đọc và
cùng thời điểm authority mở lượt mới. Không thêm khuôn mặt, confetti, âm thanh
hoặc haptics trong phạm vi này.

### Bố cục và phản hồi

- Giữ arena dọc, cùng kích thước/đường giữa cho hai slot. Dành vùng thông báo
  cố định cạnh VS; chuyển chữ không đẩy slot, hand, score hoặc vùng drop.
- Badge “đã chốt” chỉ nói trạng thái, không lộ loại/ID bài đối thủ. Số lưng bài
  còn trên tay phải trừ lá đã đặt vào slot, không vẽ dư một lá; `cardCount` hiện
  là tổng bài chưa dùng nên điều chỉnh ở view, không đổi nghĩa API.
- Mặt bài của mình có thể xem trong lúc chờ; chuyển sang lưng bài ở bước chuẩn
  bị để hai lá cùng mở. Nhãn riêng của mình vẫn đúng; accessibility tree của
  đối thủ không chứa mặt/loại bài trước reveal.
- WIN/LOSS/DRAW có chữ và biểu tượng đơn giản, không chỉ dựa màu. Điểm chỉ đổi
  trên UI ở bước kết quả, dù authority đã tính tại reveal. Giữ snapshot hiển
  thị trước reveal để không mất lá hoặc nhảy điểm trước khi lật xong.
- Kiểm tra 320×568dp, 360×800dp và máy Android đang kết nối, vi/en, font 1.0/1.3,
  hand 4→3→2→1; không cắt bóng/viền khi xoay, banner không che bài/điểm.

### Quyết định về trạng thái và đồng bộ

1. **Tái dùng state machine hiện có.** `ROUND_SELECTION` cho chọn/chờ;
   `ROUND_REVEAL` giữ khoảng chuẩn bị đã khóa; `ROUND_RESULT` giữ lật/kết quả/thu
   bài. Không thêm ba phase public chỉ để mô tả animation.
2. **Lượt 4 đi qua cùng pipeline.** Đề xuất `resolveLockedRound` luôn dừng ở
   `ROUND_RESULT`; bước advance hiện có mở lượt 2–4 hoặc chuyển `MATCH_RESULT`
   sau thời gian trình diễn lượt 4. Tính thắng trận theo luật hiện có. Rà tất
   cả caller và simulation khi đổi contract này; không giữ hai cách kết thúc.
3. **Authority giữ lịch.** Local adapter/server sở hữu timer chuẩn bị và kết
   quả, dùng clock/timer inject hiện có. Dừng timer chọn/BOT khi đủ lock; resolve
   đúng một lần ở mốc reveal; chỉ cấp 15s mới khi thực sự mở lượt tiếp theo.
   Callback animation không tính điểm, không gửi “reveal done”, không quyết
   định pha và không giữ server chờ thiết bị.
4. **Payload đủ để bắt kịp.** Bổ sung typed metadata tối thiểu: định danh trận
   (đổi khi rematch), revision tăng theo thay đổi authoritative, `serverNow`,
   timeline lượt `{ round, revealAt, completeAt }`, và `lastRound.outcomeForA`.
   Giữ timeline và lastRound vừa xong qua lượt tiếp theo; đối chiếu round trước
   khi dùng để tránh ghép bài lượt cũ vào lượt đang chuẩn bị. `deadlineAt` vẫn
   chỉ là deadline chọn bài, không dùng làm timer animation trên UI.
5. **Không tiết lộ sớm.** Trước revealAt: projection chỉ có lock flags/own card,
   score/discards cũ; không gửi bài đối thủ, outcome hoặc điểm mới để client tự
   giấu. Tại reveal mới resolve và public đủ hai lá cùng outcome. Local Board
   áp dụng cùng quy tắc dù adapter local đang giữ cả hai hand.
6. **Một đường nhận snapshot.** Poll, action response, retry/reconnect đều đi
   qua kiểm tra revision; bỏ snapshot cũ, không phát lại hiệu ứng cùng
   `(matchId, round)`. Revision phải tăng xuyên rematch trong room; `serverNow`
   là thời gian response mới, không được lấy mốc cache cũ để hiệu chỉnh đồng hồ.
   Giữ idempotency của action, không resolve lại khi retry.
7. **Mạng chậm và background.** Dùng server time/ước lượng offset từ request để
   tìm tiến độ hiện tại; không dùng giờ điện thoại trực tiếp. Thiếu payload
   reveal thì giữ lưng bài. Snapshot tới muộn bắt kịp phần còn lại; nếu hết
   timeline thì hiện trạng thái mới và tóm tắt kết quả đã biết, không phát lại
   toàn bộ 2.9s làm mất thời gian chọn của lượt mới. App resume lấy snapshot mới
   trước khi mở tương tác. Hai lá đồng thời trên mỗi màn hình; không hứa cùng
   một frame giữa hai điện thoại qua HTTP. Đo lệch giữa thiết bị trong E2E.
8. **Kết thúc bất thường.** Leave/forfeit, room hết hạn, dispose/rematch phải hủy
   timer/animation cũ. Forfeit đi nhánh kết quả phù hợp, không dựng giả một lượt
   reveal từ lastRound cũ. Reconnect vào trận đã kết thúc hiển thị Result; không
   chờ callback animation đã bị unmount.

Giữ HTTP polling 500ms hiện có cho slice này; metadata bền qua nhiều snapshot
giúp chịu được việc bỏ lỡ pha ngắn. Chưa đổi sang WebSocket hoặc thêm thư viện.
Server/mobile phải nâng contract cùng đợt thử nghiệm; client gặp payload cũ thì
hiện trạng thái tĩnh an toàn, không tự đoán hai bên đã chốt hay đối thủ ra bài gì.

### Skill Intake Summary — T26

Đã đọc frontmatter skill repo. Stack đã xác minh: Expo 57, React Native 0.86,
Reanimated 4.5.1, Gesture Handler 2.32, core TypeScript, server Node/Colyseus;
client Board thực tế dùng HTTP. Dùng `vibe-plan`, `planning-and-task-breakdown`,
`frontend-ui-engineering` và `api-and-interface-design` cho kế hoạch này.
Khi build: thêm `vibe-build`, `vibe-test`; dùng `security-and-hardening` khi sửa
projection, `performance-optimization` cho số đo native. Chưa có skill native
E2E riêng; manual Android + quay video đáp ứng bằng chứng cho phạm vi này,
không cài Maestro/Detox hoặc skill mới chỉ để lập plan.

### Task Plan — T26

Thứ tự: **T26-A → T26-B → T26-C → T26-D → T26-E → T26-F → T26-G**.
T26 dựa trên T19/T24 đã triển khai; bổ sung phần reveal cho T25 và là dependency
mới của T22/T14. Không mở lại checkbox T24 hoặc tự đóng các gate evidence cũ.

| Task / phụ thuộc | Công việc và acceptance | File dự kiến / cỡ việc | Verification / skill triển khai |
|---|---|---|---|
| **T26-A — Contract vòng chơi**; sau T24 | Chốt SPEC/timing/projection; cả bốn lượt đều qua `ROUND_RESULT`; advance chỉ mở lượt mới/kết thúc sau result, rules/điểm không đổi. Trace tất cả caller của resolve/advance. | `SPEC.md`; `game-core/src/{match.ts,protocol.ts,match.test.ts,simulation.test.ts}`; M | Core fake-state test cho 1–4, WIN/LOSS/DRAW, invalid transition; exhaustive simulation. `api-and-interface-design`, `vibe-test`. |
| **T26-B — BOT có đủ từng nhịp**; sau A | Adapter emit và giữ chuẩn bị/result có timeline; Board hiện từng trạng thái bằng UI tĩnh trước, không nhảy Result sớm; chốt/đổi/timeout vẫn đúng 15s/2s. | `mobile/src/game/local-match-adapter{.ts,.test.ts}`, `screens/BoardScreen.tsx`, `components/FolkGameViews{.tsx,.test.tsx}`; M | Fake clock đi qua toàn bộ timeline, lượt cuối, rematch/dispose; component không nhận mặt đối thủ sớm. `vibe-build`, `frontend-ui-engineering`, `vibe-test`. |
| **T26-C — Online authority giữ pha**; sau B | Server lịch/timeline tương đương BOT; private projection trước reveal, outcome sau reveal; revision/match identity, cached retry, timeout/forfeit không nhân đôi resolve. | `server/src/rooms/online-room.ts`, `server/src/online-room.test.ts`, `game-core/src/protocol.test.ts`; M | Fake-clock integration hai seat: second lock/replacement/deadline race, stale retry, privacy, final round và cleanup. `api-and-interface-design`, `security-and-hardening`, `vibe-test`. |
| **T26-D — Online Board theo timeline**; sau C | Poll/action dùng chung bộ nhận revision; map A/B đúng; tạo phần trình bày timeline dùng chung hai Board, không duplicate logic; khóa input theo authority. | `screens/{OnlineBoardScreen.tsx,BoardScreen.tsx}`, `game/board-round-presentation{.ts,.test.ts}` (mới, phục vụ cả hai screen), `screens/OnlineBoardScreen.test.tsx` (mới nếu chưa có); M | Snapshot trùng/đảo thứ tự/nhảy pha/rematch; không lấy outcome cũ, không mất lượt 4; fake clock và screen tests. `frontend-ui-engineering`, `vibe-test`. |
| **T26-E — Lật hai lá và feedback**; sau D | Dùng một shared progress Reanimated cho hai lá; chuẩn bị/flip/banner/thu bài đúng timeline, điểm không bật sớm; vi/en và Reduced Motion giữ cùng thông tin. | `components/FolkGameViews{.tsx,.test.tsx}`, `i18n/{vi.ts,en.ts}`, `game/board-round-presentation.ts`; M | Component assertions cho hidden faces/score/discards/labels; preview native ghi video happy path BOT và online. `frontend-ui-engineering`, `vibe-test`. |
| **T26-F — Resume/reconnect và tương tác hỗ trợ**; sau E | App resume đồng bộ trước thao tác, cleanup khi unmount; forfeit/kết thúc không replay sai; TalkBack thông báo kết quả một lần, reduced motion đổi giữa animation không kẹt. | `screens/{BoardScreen.tsx,OnlineBoardScreen.tsx,ReconnectingScreen.tsx}`, `game/board-round-presentation{.ts,.test.ts}`; M | Fake-clock background/reconnect giữa từng bước; native bật TalkBack/Reduced Motion, thay font và tái đo slot. `frontend-ui-engineering`, `vibe-test`. |
| **T26-G — Evidence Android**; sau F | Chạy case `MOB-REVEAL-001..008`, chốt geometry/timing bằng video; ghi rõ PASS/FAIL/BLOCKED, không dùng Jest để xác nhận FPS. | `tasks/test-result.md`, `tasks/evidence/android/<date>-round-reveal/`, `tasks/todo.md`; S | Hai Android online + BOT, vi/en/nhỏ/font1.3/TalkBack/reduced motion; profile/release FPS. `performance-optimization`, `vibe-e2e` theo native evidence protocol. |

Lệnh nền cho đợt build/đánh giá (chưa chạy ở lượt lập plan):
`rtk npm run test --workspace game-core`, `rtk npm run test --workspace server`,
`rtk npm run test --workspace mobile -- --runTestsByPath src/game/local-match-adapter.test.ts src/components/FolkGameViews.test.tsx`.
Sau khi có test mới, chạy thêm đúng file đó; cuối chuỗi chạy `rtk npm run verify`
và `rtk git diff --check`. Ghi riêng lỗi baseline với regression do T26.

### Phase Checkpoints — T26

- **CP26-1, sau A–B:** contract và BOT hiển thị đủ pha bằng fake clock/UI tĩnh;
  điểm/luật không đổi. Chốt trước khi gắn online.
- **CP26-2, sau C–D:** hai seat nhận đủ trạng thái; privacy/revision/race/final
  round PASS; không để animation che lỗi authority.
- **CP26-3, sau E–F:** complete flow có animation; Android video chứng minh hai
  lá cùng lật, nhãn kết quả rõ, không lẹm/lệch, accessibility không bị bỏ qua.
- **CP26-4, sau G:** cập nhật evidence cho T25/T22/T14 theo case thực sự đã chạy.
  Hai máy chưa có thì ghi BLOCKED; iOS vẫn deferred, không coi là PASS.

Checkpoint là điểm review khi build từng task, là mốc tiến độ nếu người dùng
yêu cầu triển khai toàn bộ. Kế hoạch này không tự cấp trạng thái hoàn tất.

### Tradeoffs / điểm cần chốt khi nghiệm thu

- Nhịp 2.9s tăng thời gian mỗi lượt để nhìn rõ kết quả. Chỉ chỉnh các duration
  sau video thực tế; không thay quy tắc chốt hay thời gian chọn bài.
- Giữ polling giúp giới hạn phạm vi; mạng trễ có thể bỏ bớt animation để bắt
  kịp. Nếu yêu cầu hai thiết bị gần cùng frame, đó là scope transport riêng.
- Thay core final-round transition là thay contract có chủ đích, nên simulation
  và tất cả caller phải được cập nhật cùng slice; không vá bằng delay router.
- Không có câu hỏi chặn lập kế hoạch. Mặc định “chốt” là drag-to-lock hiện tại,
  “hai bên” là hai slot trên cùng sân đấu và kết quả phản chiếu theo người xem.
