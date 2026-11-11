# Todo — RPS Cards MVP

Status: T01–T12 complete; Android remediation/evidence is active; iOS validation deferred

## T30 — Expo SDK 57 patch / UIScene (2026-10-09)

- [x] [T30](plan.md#t30--expo-sdk-57-patch-và-uiscene-2026-10-09) — Expo57.0.27/RN0.86.3 và scene lifecycle; 157 tests/typecheck/lint mobile/Android bundle, npm ci dry-run, unsigned iOS Release Xcode27 và built scene manifest PASS. Doctor20/21 chỉ còn hai lockfile. Chưa test bản mới trên máy thật; bỏ qua iPhone 8 Plus, không đóng các gate gameplay rộng hơn.

Chi tiết của mỗi task nằm trong `tasks/detail-tasks/`; T26 nằm trong [kế hoạch sân đấu](plan.md#t26-round-flow). Chỉ đánh dấu hoàn tất sau
khi acceptance criteria và verification trong file tương ứng đã có evidence.

## Phase A — Foundation and deterministic core

- [x] [T01 — Workspace and Expo development build](detail-tasks/T01-workspace-expo-dev-build.md) — verify xanh; Android build PASS; iOS simulator BLOCKED
- [x] [T02 — Game-core match engine](detail-tasks/T02-game-core-match-engine.md) — verify xanh; five core tests pass
- [x] [T03 — Draft/random/exhaustive verification](detail-tasks/T03-draft-random-verification.md) — 864 exhaustive + 10,000 simulations pass
- [x] Checkpoint A recorded in `tasks/plan.md`

## Phase B — P0 local playable slice

- [x] [T04 — Mobile startup and preferences](detail-tasks/T04-mobile-startup-preferences.md) — locale/persistence/SecureStore tests pass
- [x] [T05 — Local bot draft](detail-tasks/T05-local-bot-draft.md) — 5s timeout/race adapter and Draft route pass
- [x] [T06 — Local bot board and result](detail-tasks/T06-local-bot-board-result.md) — 15s rounds/rematch adapter and board/result routes pass
- [x] Checkpoint B recorded in `tasks/plan.md` — Android PASS; iOS simulator BLOCKED

## Phase C — P1 private online rooms

- [x] [T07 — Colyseus room protocol](detail-tasks/T07-colyseus-room-protocol.md) — 2-seat Colyseus foundation, protocol, idempotency and private projections pass
- [x] [T08 — Rooms, Lobby, and ads](detail-tasks/T08-rooms-lobby-ads.md) — create/join validation, one-shot ad gate, Lobby and duplicate guards pass
- [x] [T09 — Online draft privacy](detail-tasks/T09-online-draft-privacy.md) — authoritative sequential draft/privacy tests pass
- [x] [T10 — Online rounds and result](detail-tasks/T10-online-rounds-result.md) — four rounds, result and two-party rematch pass
- [x] [T11 — Reconnect, expiry, and restart](detail-tasks/T11-reconnect-expiry-restart.md) — automated reconnect/expiry pass; physical two-device evidence pending
- [ ] Checkpoint C recorded in `tasks/plan.md` — automated pass; physical two-device evidence blocked

## Phase D — MVP hardening and evidence

- [x] [T12 — Security and observability](detail-tasks/T12-security-observability.md) — boundary/rate/log/audit checks pass; moderate transitive audit findings documented
- [ ] [T13 — UI accessibility and performance](detail-tasks/T13-ui-accessibility-performance.md) — finish Android TalkBack/font-scale/60fps evidence first; iOS/VoiceOver deferred
- [ ] Checkpoint D recorded in `tasks/plan.md`

## Phase E — UI-reference fidelity remediation

- [x] [UI-01–UI-12 — sửa hình học UI sau card refresh](evidence/android/2026-10-06-ui-fixes/REPORT.md) — mobile 48 tests/typecheck/lint PASS; Samsung SM-S906E mặc định + 320×568 dp/font 1.3, vi/en và keyboard/drag smoke đã kiểm tra. Không đóng các gate T13/T14/T21/T22.

- [x] [T13-R — Lifecycle and shared layout root fix] — removed duplicate root SafeArea wrapper, made FolkSurface own explicit insets; mobile tests/typecheck/lint pass. Native cold-launch recheck remains part of T24-C.
- [ ] Checkpoint E0 recorded in `tasks/plan.md`
- [x] [T15 — Folk foundation and Home](detail-tasks/T15-folk-foundation-home.md) — focused Home contract PASS; Android build/install and Home render PASS on Samsung SM-X210; clean final screenshot remains in T22.
- [x] [T16 — Rooms visual fidelity](detail-tasks/T16-rooms-visual-fidelity.md) — empty/current/error/busy UI contract plus room-entry regression PASS; final Android screenshots remain in T22.
- [x] [T17 — Lobby visual fidelity](detail-tasks/T17-lobby-visual-fidelity.md) — waiting/ready projection and copy-code tests PASS; Expo Doctor patch drift is assigned to T24-C.
- [ ] Checkpoint E1 recorded in `tasks/plan.md`
- [x] [T18 — Draft visual fidelity with three fixed facedown slots](detail-tasks/T18-draft-visual-fidelity.md) — local/online always render three slots; unavailable slot is disabled and non-color marked; focused + server regressions PASS.
- [x] [T19 — Board reference geometry and player drop placeholder](detail-tasks/T19-board-visual-fidelity.md) — vertical arena, centered score hierarchy, discard rails and stable lower target implemented; focused/server regressions PASS.
- [x] [T24-A — Authoritative replaceable-lock contract](detail-tasks/T24-A-replaceable-lock-contract.md) — core/server 36 tests prove replaceable private lock and stable deadline.
- [x] [T24-B — Local bot replacement window](detail-tasks/T24-B-local-replace-window.md) — fake clock proves fixed 2s window and timer cleanup.
- [x] [T24-C — Gesture runtime foundation](detail-tasks/T24-C-gesture-runtime.md) — Expo Doctor 21/21; Android build/install/cold launch PASS on `RFCW1082JJR`.
- [x] [T24 — Board drag-to-lock and remove visible Lock button](detail-tasks/T24-gameplay-motion.md) — full verify PASS; physical initial/replacement drag PASS on `RFCW1082JJR`.
- [x] Checkpoint E2 recorded in `tasks/plan.md` — automated gate and requested Samsung device drag/replacement PASS; final matrix remains T22.
- [ ] [T20 — Reconnecting visual fidelity](detail-tasks/T20-reconnecting-visual-fidelity.md)
- [ ] [T21 — Result visual fidelity](detail-tasks/T21-result-visual-fidelity.md)
- [ ] [T23 — Shared motion feedback](detail-tasks/T23-shared-motion-feedback.md)
- [ ] [T25 — Motion accessibility and performance](detail-tasks/T25-motion-accessibility-performance.md)
- [ ] [T22 — UI visual evidence matrix](detail-tasks/T22-ui-visual-evidence.md) — close the Android vi/en, small-screen, TalkBack, reduced-motion and FPS matrix first
- [ ] Checkpoint E3 recorded in `tasks/plan.md`

## T26 — Chuẩn bị, lật bài hai bên và kết quả lượt (implemented 2026-10-06; evidence follow-up 2026-10-07)

Chi tiết/acceptance/verification: [T26](plan.md#t26-round-flow).
Code A–F đã triển khai; automated checks và video BOT/online một Android đã có.
[Báo cáo T26](evidence/android/2026-10-06-round-reveal/REPORT.md) ghi rõ gate còn mở;
T26 chưa hoàn tất toàn bộ native acceptance và không đóng T25/T22/T14.

- [x] T26-A — Contract vòng chơi và lượt 4 qua ROUND_RESULT — core 13 tests, 864 exhaustive + 10,000 simulations PASS
- [x] T26-B — BOT giữ đủ nhịp chuẩn bị/result trước lượt mới — fake clock/cleanup và native four-round PASS scoped
- [x] CP26-1 — Contract và BOT — automated PASS
- [x] T26-C — Online authority: timer, privacy, revision, outcome — server 27 tests PASS
- [x] T26-D — Board online: nhận snapshot đúng thứ tự, dùng chung timeline — stale response/background/busy ownership tests PASS
- [x] CP26-2 — Hai seat đồng bộ và không lộ bài — two-seat automated PASS; hai Android vẫn BLOCKED
- [x] T26-E — Lật đồng thời, banner thắng/thua/hòa, thu bài — implementation + BOT/one-phone online video; không đại diện full matrix
- [ ] T26-F — Code recovery/accessibility đã triển khai; TalkBack action/once-only announcement và full recovery matrix còn PARTIAL
- [ ] CP26-3 — Motion và recovery — video có; accessibility/recovery native acceptance chưa đầy đủ
- [ ] T26-G — Android evidence đã thu và báo cáo; hai máy/full geometry/performance stress matrix còn PARTIAL/BLOCKED
- [ ] CP26-4 — T25/T22/T14 đã liên kết evidence thực chạy; broad gates chưa đóng

## T29 — Hiệu ứng và âm thanh toàn game (implemented; native acceptance PARTIAL 2026-10-07)

A–K product code đã triển khai,117 mobile/13core/27server tests PASS; không còn
planning-only. Checkbox bên dưới biểu thị acceptance đầy đủ, không chỉ code done.
Chi tiết: [T29](plan.md#t29--hiệu-ứng-và-âm-thanh-toàn-game-implemented-2026-10-07);
[Báo cáo native](evidence/android/2026-10-07-game-feedback/REPORT.md).

- [ ] T29-A — Pack13 WAV325,148 bytes/module release đã có; loa output có capture, tai nghe/A-B nghe chưa nghiệm thu
- [x] T29-B — Sound ON/Rung OFF, migration/partialize/defaults và relaunch persistence PASS
- [ ] T29-C — Runtime RootLayout/finite pool/terminal/ad/lifecycle/welcome implemented; automated PASS, audio-focus native còn mở
- [ ] T29-D — Switch vi/en/màn nhỏ/relaunch PASS scoped; TalkBack đầy đủ còn mở
- [ ] CP29-1 — Code/automated PASS; native audio/settings PARTIAL
- [ ] T29-E — Shared controls0.97/120ms/callback tests PASS; full native cancelled/TalkBack matrix còn mở
- [ ] T29-F — Draft ba slot/entrance/pick implemented; automated + native timeout/rematch PASS scoped
- [ ] T29-G — Accepted lock/replacement/invalid/stale tests PASS; full physical gesture/TalkBack matrix còn mở
- [ ] T29-H — Authority timeline/fourth-round/seat-correct cues PASS automated; native audio/video scoped, full fixtures/RM matrix PARTIAL
- [ ] CP29-2 — Code/automated PASS; native four-round matrix PARTIAL
- [ ] T29-I — Home/Rooms/Lobby + ad-lifetime guards PASS automated; ad>4s/occlusion observed, missing-close recovery automated only
- [ ] T29-J — Board→Result once-only/rematch PASS integration, BOT + one-phone online rematch observed; two-phone acceptance BLOCKED
- [ ] T29-K — Reconnect code/tests and one-phone TCP interruption/recovery observed; full radio/background matrix PARTIAL
- [ ] CP29-3 — Code/automated PASS; whole-game native PARTIAL
- [ ] T29-L — Review/build/Samsung11 matches/10 rematches +35s Perfetto có; headphones/full TalkBack/baseline trace analysis/physical two-phone matrix còn mở
- [ ] CP29-4 — PARTIAL; hai Android thật BLOCKED vì người dùng chỉ có một máy. Không đóng T26/T25/T22/T14 rộng hơn.

## Phase F — Android final evidence (current milestone)

- [x] T27 — Đấu lại BOT quay về chọn bài mới — xóa phiên/bộ bài cũ, mở `/draft`; regression 8 tests/3 suites, mobile typecheck/lint PASS. T28 Android release mặc định đã bấm Đấu lại và thấy Draft mới ba lá úp/timer5s.
- [x] [T28 — Thử hiệu ứng thắng/thua/hòa](evidence/android/2026-10-07-outcome-effects/REPORT.md) — bài nảy/viền vàng/cánh sen, thua nghiêng, hòa nhún; 59 mobile tests/typecheck/lint PASS; release Samsung mặc định +320dp/font1.3, compact final normal/reduced smoke và footer fix PASS scoped. Giữ các broad native gates mở.

- [ ] [T14 — Native E2E final gate](detail-tasks/T14-native-e2e-final-gate.md) — chạy Android gate sau T22; iOS cases deferred and keep the full cross-platform task open
- [ ] Checkpoint F recorded in `tasks/plan.md`

Deferred from the current queue: iOS simulator/device, VoiceOver and iOS FPS
evidence. Deferred is not PASS and does not establish cross-platform release readiness.
