# T29 — Whole-game feedback / Android evidence, 07/10/2026

Product code A–K is implemented; Android acceptance is **PARTIAL**, physical
online on two Android phones **BLOCKED**. The user confirmed only one phone is
available. Scripted peers are a separate test surface. No T29 commit/push.
Base HEAD `fcb7baf` plus the uncommitted T29 working tree; no product core/server
changes. T26-F/G, T25/T22/T14 and the later iOS/VoiceOver gates remain open.

## Changes and automated proof

- Thirteen original locally synthesized WAV cues: mono44.1kHz16-bit,325,148 bytes.
  Deterministic generation/metadata/hash check passes; no external recordings.
- Expo Audio57.0.5, installed for Expo57.0.14. Recording and background playback/
  recording disabled in app config; inspected release has no RECORD_AUDIO.
  Generic FOREGROUND_SERVICE from other dependencies still exists.
- Persisted Sound ON/Vibration OFF defaults; old/malformed preferences normalize
  safely. Customize switches are localized and scroll while Close stays reachable.
- RootLayout owns fixed13-player pool, one active voice/request, priority/expiry,
  mute/background/ad cancellation and a completion record surviving Board→Result.
  Trusted synced foreground transition only; matching Result consumes once in2s.
  Cold/recovery snapshots, remount and rematch cannot manufacture a terminal cue.
- Ad display ownership survives room-entry's4s timeout; stale callbacks cannot
  release another instance. Missing-close recovery requires the actual foreground
  Sound OFF→ON interaction. A plain preference setter cannot release suppression.
- Shared press0.97/120ms, Draft entrance, selection/accepted lock, authority stage
  cues, Result motion/fanfare, rematch fresh Draft and reconnect feedback.
  Existing faceless artwork/privacy/rules and5s/15s/BOT2s plus800/600/1200/300ms stay.
- Fixed native READY-before-listener race by consulting player.isLoaded before
  starting a cue; regression failed before the guard and passes afterward.
- Related stale Rooms reply, SecureStore rejection and reconnect deadline/expiry
  callback guards; forfeit0–0 no longer fabricates a DRAW presentation.
- Native geometry revealed Reconnecting text outside its paper: constrain text to
  padded width, let panel grow and reuse the existing image background/content-View pattern.
  Padding belongs to the nested content, keeping percentage background sizing
  independent of the text inset.

| Check | Result |
|---|---|
| Mobile suite |117 tests /34 suites PASS; [raw output](automated-mobile.txt) |
| Final Reconnecting/geometry follow-up |15 tests /2 suites PASS; [output](geometry-follow-up-tests.txt) |
| Whole workspace typecheck |PASS; [output](automated-typecheck.txt) |
| Mobile final typecheck |PASS; [output](final-mobile-typecheck.txt) |
| Mobile lint |PASS; [output](automated-mobile-lint.txt) |
| Core/server |13/27 tests PASS; builds PASS in implementation run |
| Ten-rematch runtime invariant |PASS: fixed13 players, no old terminal cue/pending timer growth |
| Sound recipe |PASS13 assets/metadata/PCM/hash |
| Root lint |Baseline unused `guest`,server/src/room-entry.test.ts:37; not fixed by this scope |
| Expo Doctor |20/21;12 pre-existing SDK patch mismatches, audio57.0.5 correct |

Native sound evidence below is independent of mocked player calls. Root review
checked provider ownership, bounded request/player map, terminal and ad lifetime.
The demonstrated geometry defect was fixed in the shared Reconnecting view; no
extra player/session/animation framework was added.

## Device and build provenance

Samsung SM-S906E, RFCTB15AQ6J, Android16/API36; physical1080×2340/density450,
font1.0. Small override900×1598/density450 ≈320×568dp,font1.3. USB ADB, no Metro.
Stock and QA-loopback release use the same quiet current JS; APK native policy
is different. A temporary generated-only NetworkSecurityConfig permits HTTP to
127.0.0.1/localhost for local-server QA, with cleartext base=false. It is not a
tracked app configuration or production network-policy change. The inspected
exception is [qa-loopback-network-security.xml](qa-loopback-network-security.xml).
Generated manifest/XML are restored and stock APK installed at cleanup.

Earlier builds retained to distinguish evidence:

| APK | SHA256 | Scope |
|---|---|---|
| Quiet stock before Reconnecting geometry |1ac55e6b2a0b11d854c550d56007ceb28ce7a5b5109fa53c0ff5b334bfaf81f3 |BOT audio-ready; production cleartext policy cannot reach local HTTP |
| Quiet QA-loopback before geometry |afe126d479983da8e28dd40fab46fde1b07325cbcb573158f2410905d8080679 |Online four rounds/rematch/ad/relay recovery |
| Intermediate stock geometry |6b4fbfcf035674545e7898e3f3f42168ca4b63633662d07592ee7fd7effc8179 |Text width/height first attempt; not final |
| Intermediate QA-loopback geometry |b0ddec3a6346f588932550f284882a9f74642cc6bba1278c20657dd8485f4738 |Small reconnect first attempt; paper bounds still needed correction |
| Intermediate stock background/insets |56aceb6294d8bd20f121ada1aaf1d6df376b6d794b73a6be67092dc11b651a90 |Native exposed padding reducing percentage background; corrected with nested content View |
| Final stock |3f45188a831ad270f88c6b1faa6ac27a96bab80a3d32442c74cd1679b81a5ea4 |Nested content padding; final geometry/stress scope below |
| Final QA-loopback |6f859e3d9903baab5558800ab3a04db7f8d46c758aa7e8baf2c6b8446413917b |Final small Reconnecting transport/geometry and forfeit run |

Build command in `mobile/android`:

```sh
rtk proxy env JAVA_HOME=/Users/chuongtong/Library/Java/JavaVirtualMachines/jbr-17.0.14/Contents/Home ./gradlew app:assembleRelease -PreactNativeArchitectures=arm64-v8a --console=plain
```

## Native observations before final geometry

- BOT four-round Result and Đấu lại→fresh three-back Draft observed in
  `bot-final.mp4`/`bot-audio-ready.mp4`. Some uiautomator idle failures and stale
  hierarchy risks affected manual gesture attempts; do not certify every
  replacement/invalid drag or exact stage boundary from those runs.
- Capture-before-launch `bot-capture-first.mp4` contains recognizable confirm,
  paper-select, card-lock, tick, flip, round-win/loss, discard, match-loss and
  rematch paper-slide. This used temporary sanitized diagnostic logging and is
  audio-path proof, not final release performance proof. Logging/pilot routes
  are removed from product source and final bundle.
- Small vi/en Settings switch labels/checked states and≥44dp bounds are present,
  Close stays reachable. English Sound OFF/Vibration ON persisted after relaunch;
  later restored vi/Sound ON/Vibration OFF. Muted recording interval was silent;
  vibration persistence is proven, physical vibration feel/effect is unverified.
  [vi](small-vi-settings.png),[en](small-en-settings.png),
  [persisted](small-en-persisted.xml),`preferences-lifecycle.mp4`.
- Actual test interstitial remained visible after4s; ad hierarchy did not expose
  game Sound controls. `online-ad-after-timeout.png`/`online-ad-later.xml` prove
  native ad occlusion. Missing SDK CLOSED was not forcibly reproduced; native
  occlusion + automated recovery guards are separate from that missing-close case.
- One-phone online + scripted peer: four rounds WIN/LOSS/DRAW/LOSS, Result1–2,
  two-party consent opens fresh Draft, second match Result0–4, then native Home
  leaves the room. `online-loopback.mp4`,`online-result.png`,
  `online-rematch-draft.png`,`online-second-result.xml` and public-only peer log.
- Removing ADB reverse did **not** cut existing TCP sockets. The two images named
  `online-reverse-*-inconclusive.png` were still Board, not Reconnecting.
- QA TCP relay then closed established/new sockets for a controlled USB transport
  interruption. Native showed Reconnecting and recovered the current online game
  after relay restoration: [overlay](relay-reconnecting.png),
  [recovered](relay-restored.png),`online-relay-recovery.mp4`,event/public logs.
  The earlier overlay exposed clipped body text; those screenshots are not final
  geometry PASS. This is transport interruption, not radio/Wi-Fi outage.
- Peer stopped after38s; native forfeit Result1–0 retained three completed history
  rows and localized “Đối thủ đã rời phòng”. A neutral connection-lost cue is
  detected near63.7875s; no fabricated fourth reveal. `relay-forfeit.xml`.
- Intermediate320dp run recovered and reached forfeit1–0 after one history row.
  Runner initially missed off-screen Result buttons; scrolling exposed controls
  and native Home left properly. `small-forfeit-scrolled.png/XML`. Its reconnect
  screenshot is named intermediate because panel artwork still needed correction.

## Final small Reconnecting verification

Final QA-loopback APK uses the same JS as final stock, with only the documented
loopback exception. At320×568dp/font1.3/vi, the nested content View fixes the
background/padding interaction: title/body/countdown stay on paper, body wraps
without truncation. [Final overlay](final-small-reconnecting.png),
[tree](final-small-reconnecting.xml),[recovered Board](final-small-recovered.png),
[forfeit](final-small-forfeit.png),[scrolled actions](final-small-forfeit-scrolled.png),
`small-reconnect-final.mp4` and `small-final-events.json`.

Peer joined34.243s, transport cut41.249s, Reconnecting captured48.867s, relay
restored48.867s, recovered game captured52.846s, forfeit Result68.141s, native
Home leave71.837s. These are automation-event times, not exact frame/latency
measurements. Final stock APK is restored for BOT stress and final handoff.

## Audio measurement and limits

scrcpy5 output-audio AAC captures actual Android output; video capped30fps for
storage. ffmpeg9 decoded audio to mono22050Hz. [analyze-audio.py](analyze-audio.py)
uses numpy normalized PCM correlation against the original WAVs, threshold0.65,
zero-energy rejection and overlap filtering. `*-audio-cues.json` stores matches.
Times use decoded audio-stream origin; add stream offset before comparing video.
Automation event clocks are independent. This does not measure tap latency or
acoustic loudness/quality; missing matches do not alone prove missing playback.

Examples: diagnostic capture match-loss56.5341s/rematch paper-slide60.6302s;
quiet online relay confirm19.0515s, round-draw58.022s, neutral forfeit63.7875s.
Correlation typically0.69–0.99. Initial outage connection-lost was not reliably
matched in that recording, so do not call every reconnect cue native PASS.
Final small output also identifies confirm1.4515/21.3555/25.5155/40.7262s and
neutral forfeit connection-lost53.6115s. Initial outage loss remains unconfirmed
in the output captures. No headphone/Bluetooth/audio-focus/loaded-tap≤100ms
certification.

## Final stock native stress and frame evidence

Final stock APK:11 complete BOT matches,10 consecutive native Đấu lại presses,
all reopen fresh three-back Draft/timer5s, then native Home.771.229s continuous
run at320×568dp/font1.3/vi,60Hz native mode confirmed. Normal motion first, then
system Reduced Motion changed during the same session (no viewport/Activity
reload). [Event log](native-ten-rematches-events.json),
[summary/PSS](native-stress-summary.json),[fresh Draft10](stress-rematch-10.png),
[final scrolled Result](stress-result-final-scrolled.png),`native-ten-rematches.mp4`.
All four history rows and both actions are reachable by Result scroll. Final quiet
stock output first180s identifies confirm, paper-select, card-lock, ticks, flip,
round-win/draw, paper-slide and distinct match-win cues(59.6062/123.7341s).
[PCM matches](native-stress-first180-audio-cues.json) use a stream-copy segment
starting at0s; no tap-onset latency conclusion.

The UI hierarchy runner reported26 fresh-tree idle failures. It rejected them;
no stale XML was reused. Gesture attempts and real authority timeouts both
advanced play. This proves repeated completion/rematch and no observed hang;
it does not certify every manual drag/replacement or playback exactly once.
The strict fixed13-player/no stale terminal/no timer-growth proof is automated.
Native TOTAL PSS grew416,481→498,509KB with warming/GC variation and plateaued
near498MB late in the run; these samples alone cannot certify native leaks absent.

Final gfxinfo:4251 rendered frames,370 janky(8.70%),p90=17ms,p95=21ms,p99=73ms.
[Raw frame buckets](stress-gfxinfo.txt),[native display mode](stress-display-mode.txt).
These count rendered frames under scrcpy/UI automation and mixed normal/RM;
static periods are not a frame-rate sample. This is not near60fps certification
or a valid before/after comparison to T28. A further performance analysis and
comparable baseline remain open; no speculative optimization was made.

## 360dp Settings/TalkBack and Perfetto capture

Final stock at approximately360×800dp/font1.3/en/RM: Settings and Close reachable,
Sound checked=true,Vibration checked=false. Samsung TalkBack enabled for native
hierarchy spot-check; switches expose labels/checked state and147×124px bounds
at density450(≈52×44dp). [Settings](360-en-settings-rm.png),
[TalkBack tree](360-en-settings-talkback.xml),[capture](360-en-settings-talkback.png).
This does not verify spoken checked-state output, custom drag action or once-only
outcome speech. Locale restored vi, then all original device settings restored.

Native Perfetto35s trace captures ftrace gfx/view/scheduling + SurfaceFlinger
frame timeline: [trace](stress-game-feedback.perfetto-trace),
[config](stress-perfetto-config.txt),[capture result](perfetto-capture.txt).
7,620,785 bytes saved. Initial file-config attempt failed Android permission;
stdin config succeeded. It overlaps the tail of stress/Home, not the full run.
Raw trace is available for analysis; no baseline-matched T28 comparison or
per-action loaded-tap/audio-latency result was derived from it.

## Remaining acceptance

MOB-FEEDBACK-001–012 statuses are in [test-plan](../../../test-plan.md). Product
implementation and automated checks pass; full native matrix remains partial.
Still open: second real Android/privacy/network comparison, headset/Bluetooth/
other-app audio focus, physical vibration feel, full TalkBack custom actions/
once-only speech, complete seven-state geometry/RM/interruption fixtures and
analysis of a baseline-comparable performance trace. No broad T26/T25/T22/T14 closure.

## Cleanup and final artifact

[Cleanup proof](cleanup.json) verifies installed stock APK SHA256 matches the
final stock row,1080×2340/density450 physical defaults,font1.0,timeout30s,
transition1.0,animator/default refresh settings removed,TalkBack OFF and original
media volume0/15. Locale vi,Sound ON/Vibration OFF; [Home](final-home-restored.png).
Owned server/relay/peers/recorders stopped,USB reverse removed,test room left and
owned phone XML/trace files removed. Generated QA native override absent.
APK remains at `mobile/android/app/build/outputs/apk/release/app-release.apk`;
its native policy and installed copy are stock, not the QA-loopback variant.
No commit/push or change to existing baseline package/lint issues.
