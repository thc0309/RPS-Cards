# Implementation Plan — RPS Cards MVP

Status: planned; awaiting `$vibe-build`

`SPEC.md` là hợp đồng sản phẩm. File này chỉ ánh xạ thứ tự, phụ thuộc và
checkpoint. Chi tiết kỹ thuật, file dự kiến, tiêu chí nghiệm thu và lệnh chạy
nằm trong từng tài liệu dưới `tasks/detail-tasks/`.

## Skill Intake Summary

### Stack và miền công việc đã phát hiện

- Greenfield npm workspaces: `mobile`, `server`, `game-core`; hiện chưa có
  package manifest hoặc product source.
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

### Skill gaps

- Chưa có repo-local skill chuyên tự động hóa React Native trên thiết bị
  (Maestro/Detox). Không chặn MVP vì `tasks/test-plan.md` hỗ trợ chạy tay có
  evidence; chỉ cài/tạo skill khi chọn runner chính thức.
- Chưa có skill chuyên Colyseus hoặc Google Mobile Ads. Dùng
  `source-driven-development` với tài liệu chính thức; không cài thêm skill chỉ
  để lập kế hoạch.
- Supabase không có task MVP: chỉ kích hoạt khi có account, cross-device sync,
  inventory/purchase, history hoặc durable recovery theo `SPEC.md`.

## Task Plan

### Phase A — Foundation and deterministic core

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T01 | npm workspaces, root command contract và Expo development build boot được | — | [T01](detail-tasks/T01-workspace-expo-dev-build.md) | `vibe-build`, `source-driven-development` |
| T02 | Pure `classic_v1` match engine với legal locks, four-round lifecycle và unit tests | T01 | [T02](detail-tasks/T02-game-core-match-engine.md) | `vibe-test`, `api-and-interface-design` |
| T03 | Draft/random boundary, exhaustive 864 cases và 10,000-match simulation | T02 | [T03](detail-tasks/T03-draft-random-verification.md) | `vibe-test`, `security-and-hardening` |

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

### Phase D — MVP hardening and evidence

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T12 | Boundary hardening, rate limits, safe diagnostics và privacy regression suite | T11 | [T12](detail-tasks/T12-security-observability.md) | `security-and-hardening`, `vibe-review` |
| T13 | Android/iOS portrait, accessibility, vi/en fit, reduced motion và measured Skia decision | T06, T11 | [T13](detail-tasks/T13-ui-accessibility-performance.md) | `frontend-ui-engineering`, `performance-optimization` |
| T14 | Full verify và native-device E2E evidence cho P0/P1 | T12, T13 | [T14](detail-tasks/T14-native-e2e-final-gate.md) | `vibe-e2e`, `vibe-review` |

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
- Hai thiết bị có thể create/join/draft/play/result; server vẫn authoritative.
- Interactive mode: review P1 trước hardening. `$vibe-build all`: tiếp tục.

### Checkpoint D — after T12–T14

- `npm run verify` xanh trên đúng source state được test.
- Tất cả case trong `tasks/test-plan.md` là PASS hoặc có FAIL/BLOCKED evidence
  trong `tasks/test-result.md`.
- Chạy `$vibe-review`; không tự commit hoặc triển khai production.

## Tradeoffs and Deferred Decisions

- Local-first MVP tránh Supabase và durable room persistence; server restart làm
  room hết hạn theo contract.
- `View`/`ImageBackground`/Reanimated là mặc định. Chỉ thêm Skia sau số đo trong
  T13 chứng minh một acceptance case cụ thể không đạt.
- Native E2E runner chưa được chọn. T14 dùng manual device protocol trước; việc
  thêm Maestro/Detox là quyết định riêng vì làm tăng native/CI scope.
- EAS distribution, production ads, monitoring, privacy paperwork và release
  signing vẫn thuộc P2.
