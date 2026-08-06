# Implementation Plan — RPS Cards MVP

Status: T01–T12 complete; T13/T14 open; remediation plan awaiting implementation

`SPEC.md` là hợp đồng sản phẩm. File này chỉ ánh xạ thứ tự, phụ thuộc và
checkpoint. Chi tiết kỹ thuật, file dự kiến, tiêu chí nghiệm thu và lệnh chạy
nằm trong từng tài liệu dưới `tasks/detail-tasks/`.

## Skill Intake Summary

### Stack và miền công việc đã phát hiện

- npm workspaces đang hoạt động: `mobile`, `server`, `game-core`; automated
  gameplay/security gates đã xanh, nhưng mobile UI hiện mới là functional shell.
- Mobile: Expo development build, Expo Router, React Native, Zustand,
  AsyncStorage, SecureStore, i18n, Reanimated; Skia chỉ theo decision gate.
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
| T13 | Android/iOS portrait, accessibility, vi/en fit, reduced motion và measured Skia decision | T06, T11 | [T13](detail-tasks/T13-ui-accessibility-performance.md) | `frontend-ui-engineering`, `performance-optimization` |

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
| T18 | Local/online Draft khớp `04-draft.png` và private selection states | T15 | [T18](detail-tasks/T18-draft-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T19 | Local/online Board khớp `05-board.png`/`ui1.png` | T18 | [T19](detail-tasks/T19-board-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `performance-optimization` |
| T20 | Reconnecting overlay khớp `06-reconnecting.png` trên board state | T19 | [T20](detail-tasks/T20-reconnecting-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T21 | Local/online Result khớp `07-result.png`, dùng lịch sử runtime | T19 | [T21](detail-tasks/T21-result-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T22 | Matrix screenshot, accessibility, vi/en, small-screen và asset/FPS evidence | T16–T21 | [T22](detail-tasks/T22-ui-visual-evidence.md) | `vibe-e2e`, `performance-optimization`, `vibe-review` |

### Phase F — Final native evidence

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

### Checkpoint E1 — after T15–T17

- Home → Rooms → Lobby khớp composition của ba reference tương ứng trên Android.
- Create/join/current-room/error/busy/player-count flows không bị visual refactor làm hỏng.
- Interactive mode: review navigation shell trước gameplay screens.

### Checkpoint E2 — after T18–T19

- Draft và Board local/online dùng đúng card art, private/public states, symmetric
  board halves, reveal arena, discard zones và attached timer badge.
- `npm run verify`, small-screen layout test và Android screenshot comparison xanh.
- Interactive mode: review core gameplay fidelity trước overlay/result.

### Checkpoint E3 — after T20–T22

- Bảy screen reference có vi/en screenshots và explicit PASS/FAIL/BLOCKED record.
- TalkBack, font scale, reduced motion, asset memory và Android FPS evidence được ghi;
  iOS giữ BLOCKED nếu runtime vẫn không có.

### Checkpoint F — after T14

- `npm run verify` xanh trên đúng source state được test.
- Tất cả case trong `tasks/test-plan.md` là PASS hoặc có FAIL/BLOCKED evidence
  trong `tasks/test-result.md`.
- Chạy `$vibe-review`; không tự commit hoặc triển khai production.
- Current status: automated gate PASS; physical iOS/two-device/accessibility/
  FPS cases BLOCKED and recorded; UI fidelity tasks T15–T22 phải hoàn tất trước T14.

## Task-level implementation contracts

Each remediation task is one vertical slice. It may touch its listed screen,
shared presentation primitive, one focused test, and required asset/i18n entries;
it must not alter game-core rules or room protocols. Every task closes with its
automated checks, its matching `MOB-VIS` case, and a sanitized test-result entry.

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

### T22/T14 — evidence gates

- T22 is evidence-only after T15–T21: update test plan/results, screenshots,
  font-scale/safe-area/reduced-motion/accessibility/FPS records, and asset budget.
- T14 is final; two-client Reconnecting and unavailable iOS remain BLOCKED unless
  the required devices/runtime are actually available.

## Tradeoffs and Deferred Decisions

- Local-first MVP tránh Supabase và durable room persistence; server restart làm
  room hết hạn theo contract.
- `View`/`ImageBackground`/Reanimated là mặc định. Chỉ thêm Skia sau số đo trong
  T13 chứng minh một acceptance case cụ thể không đạt.
- Dùng các layer trong `docs/assets` làm nguồn; chỉ copy/resize asset thực sự được
  mount vào `mobile/src/assets/folk_default`. Không dùng nguyên mockup full-screen
  vì text/runtime state phải native và hai board halves thuộc từng player.
- Không thêm component library hoặc generic theme engine. Chỉ extract một visual
  primitive khi đã có ít nhất hai màn hình dùng cùng geometry.
- Native E2E runner chưa được chọn. T14 dùng manual device protocol trước; việc
  thêm Maestro/Detox là quyết định riêng vì làm tăng native/CI scope.
- EAS distribution, production ads, monitoring, privacy paperwork và release
  signing vẫn thuộc P2.
