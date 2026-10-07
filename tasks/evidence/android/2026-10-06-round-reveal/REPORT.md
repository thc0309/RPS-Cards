# T26 — Android round reveal evidence

Execution: 2026-10-06; evidence/ledger follow-up: 2026-10-07 (Asia/Ho_Chi_Minh).
**Code implemented; native acceptance PARTIAL.** Two physical clients, complete
TalkBack/recovery matrix and performance stress gates remain open.

## Source and runtime

- Current source: HEAD `b1c3400` already contains T26 implementation. The 07/10
  follow-up edits evidence/docs only and creates no commit. Preserve prior UI/assets.
- Samsung SM-S906E, serial RFCTB15AQ6J, Android 16/API 36, arm64-v8a; native
  1080×2340, density 450, font 1.0. Only one physical phone available.
- Debug + Metro on 06/10 for default BOT and online videos; HTTP server port 2567,
  polling 500 ms, USB reverse8081/2567. Online peer is a scripted authenticated client,
  not a second phone. Logs contain phase/revision/score/outcome, no tokens/hand secrets.
- Release `app:assembleRelease -PreactNativeArchitectures=arm64-v8a` built on 06/10
  with JBR17.0.14 (final build20s). Installed APK was checked non-debuggable; local BOT
  cold launch works without Metro. Existing release APK was reinstalled07/10 because
  app was absent. No new product build on 07/10.
- Same phone overridden to900×1598 (~320×568dp), English/font 1.3 on 06/10;
  1013×2250 (~360×800dp), English/font 1.3 on 07/10. These are viewport overrides,
  not independent devices. Reduced Motion uses RN Android's transition animation scale0.

## Automated and build verification

07/10 `rtk proxy npm run verify`: core 13 tests PASS (including864 exhaustive and
10,000 deterministic simulations), server 27 PASS, mobile 56 PASS/23 suites; whole
core/server/mobile typecheck PASS. Verify then stops at pre-existing
`server/src/room-entry.test.ts:37` unused `guest` lint error. Baseline was not changed.
Separate mobile lint and server build PASS. Root independently reran four impacted
mobile suites:17 tests PASS, plus whole typecheck PASS. Diff whitespace check PASS.
Debug/release build evidence is separate from physical motion/FPS acceptance.

## Case matrix

| Case | Result | Evidence and remaining scope |
|---|---|---|
| MOB-REVEAL-001 BOT | PARTIAL; observed pipeline PASS | `bot-default.mp4` vi/debug: four rounds WIN,DRAW,WIN,LOSS, Result2–1. `small-release.mp4` en/release/font 1.3: WIN,WIN,LOSS,DRAW and Result2–1. Fourth round finishes before Result. Native replacement/deadline edge cases not exhaustively exercised; fixed15s/2s proven by fake clocks. |
| MOB-REVEAL-002 two Android | BLOCKED | `online-final.mp4` is one Android seat B + scripted A, four rounds WIN,LOSS,WIN,DRAW, Result2–1. Cards/outcomes agree with safe `online-peer.log`. Two-phone recording and measured inter-device lag require second physical Android. |
| MOB-REVEAL-003 race/timeout/retry | PASS automated; PARTIAL native | Core/local/server fake-clock tests cover accepted replacements, fixed deadlines, auto-lock, one resolution/score/discard and timer cleanup. Native timeout path completes; full physical race matrix not run. |
| MOB-REVEAL-004 privacy/stale snapshots | PASS automated; PARTIAL native | Prepare projections hide opponent face/outcome/new score/discard; old revisions/rounds, fresh retry serverNow, missing reveal and late catch-up tested. Component labels hide opponent face. Controlled adverse-network native matrix not run. |
| MOB-REVEAL-005 recovery | PARTIAL | Poll/action/lifecycle epoch, stale background response, bounded poll, busy ownership, unmount, final route and authority cleanup automated PASS. `online-resume.png` shows resumed round3 selection (two discards each, score1–1, current deadline); the earlier script phase marker was inaccurate. No prepare/result recovery claim from that image. Every phase/network expiry/forfeit/rematch physical combination not run. |
| MOB-REVEAL-006 geometry | PARTIAL | Default vi/debug and320×568dp en/release/font 1.3 videos/frames;360×800dp en/font 1.3 release smoke. Equal slots and stable centered score; `small-geometry.json` slot bounds differ only1px rounding, score column centerx450. Full locale/font/phase/hand-size/edge-drag cross-product not run. |
| MOB-REVEAL-007 accessibility/motion | PARTIAL | `reduced-360-release.mp4`: transition scale0 switched during active match (selection), remaining rounds and final Result0–1 complete; static faces/text and no stuck transition. TalkBack enabled on 07/10; `talkback-board.png/.xml` captures Board focus on hidden opponent back and meaningful accessible labels. Accessible lock action, once-per-round speech and focus retention are not confirmed; toggle during the revealing-status interval is observed below. Early scheduled drags did not establish an accepted lock. A final select→drag run accepted the lock; `final-toggle-release.mp4` and `final-toggle-events.json` show transition scale0 at 3.943s, outcome then next selection without hanging. A further accepted-lock run (`midflip-release.mp4`, `midflip-events.json`) switched scale0 at 3.424s: video 3.4/3.6s shows Đang lật bài with backs, 3.8s shows faces under the same status, 4s shows LOSS and 7s next selection. Scoped toggle while reveal is active completes without hanging; exact frame/clock boundary alignment is not certified. |
| MOB-REVEAL-008 performance/stress | PARTIAL | Release four-round BOT plus `release-framestats.txt` and raw `release.perfetto-trace`.541 frames,30 janky (5.55%), p50=9ms / p90=21ms / p95=25ms / p99=34ms; legacy jank49.17% is also present. These aggregate gfxinfo measures include UI/session activity, not isolated flip FPS or 60 fps certification. Raw Perfetto not analyzed. Release online, ten rematches, rapid replacements and measured listener/timer growth not run. |

## Artifact interpretation

- `bot-default.mp4` was captured before the final three-equal-column score/rail
  geometry correction. Use it for phase/outcome history, not final geometry approval.
- `online-final.mp4` debug uses final geometry; `small-release.mp4` release also
  uses final geometry. Exports of original online/small videos preserve variable
  frame timestamps (`-fps_mode vfr`), rather than forcing average FPS.
- `frame-index.json` records exact requested seek offsets for named frames.
  Extraction seeks the next available encoded frame; offsets are not independent
  authority timestamps and do not prove duration of every animation boundary.
  Guessed online round4prepare/outcome images were removed: actual inspected
  frames show waiting/flip then discard, so new names state observed phases.
- Useful inspected offsets: BOT21.2prepare/22.15flip/22.6WIN/72round4prepare/
  75round4LOSS; online31.2prepare/31.9flip/32.5WIN/85.7round4flip/
  86.6round4discard; release-small19.2prepare/20.4flip/21.2WIN/57LOSS/
  39.5discard. Native video shows both slots at corresponding rotation states.
- `online-peer.log` authority observations show800 ms prepare +2100 ms result
  (600 ms flip/1200 ms outcome/300 ms discard). Exact injected-clock timing is proven in
  tests; screenrecord is visual evidence and is not used to certify frame timing.
- `small-release-result.png` is the scrolled four-row Result; it was previously
  named outcome and corrected. `online-result.png` includes rematch-waiting after
  an incidental post-result tap; that is not a failure of the four-round pipeline.
- TalkBack tree/focus screenshots do not contain audio and cannot establish speech
  count. No once-only announcement PASS is inferred from a live-region Jest test.

## Follow-up gates

Keep T26-F/G and CP26-3/4, T25/T22/T14 open. Finish second Android online/privacy/
reconnect, native accessible lock and announcement-count checks, repeated native motion-toggle matrix, complete geometry cross-product and release stress/performance
analysis. iOS/VoiceOver remains deferred, not PASS.

## Device cleanup

Follow-up restored native1080×2340, font 1.0, timeout30000ms, transition animation
scale1.0 and TalkBack disabled/enabled-service setting removed. Animator duration
scale was not changed. Existing release app remains installed after authorized
reinstall. App language restored to Vietnamese via Customize, confirmed in
`restored-home.png`; final device settings saved in `restored-settings.json`.
