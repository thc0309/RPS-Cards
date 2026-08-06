# T22 — UI visual evidence matrix

Status: planned

## Outcome

Prove the seven-screen folk UI against `docs/ui` with reproducible screenshots,
responsive/accessibility checks and asset/performance evidence before T14.

## Dependencies and skills

- Dependencies: T16, T17, T18, T19, T20, T21.
- Skills: `vibe-e2e`, `performance-optimization`, `vibe-review`.
- This is an evidence phase: do not edit product source during the active run.

## Execution protocol

1. Record exact diff, build type, Pixel 4a/device dimensions, locale, font scale,
   Reduced Motion and server/test-ad settings without recording tokens/hands.
2. Capture Home, Rooms empty/current/error, Lobby one/two players, Draft active/
   waiting, Board select/lock/reveal/discard, Reconnecting and Result in vi/en.
3. Compare side-by-side with each `docs/ui` reference using the MOB-VIS checklist:
   hierarchy, geometry, art layers, native text, state fidelity, safe area and targets.
   Do not claim pixel equality where runtime data intentionally differs.
4. Repeat critical Draft/Board/Result at 320×568, 360×800 and 390×844-equivalent
   portrait viewports; test font scale 1.0 and 1.3. Record clipping/overflow.
5. Run TalkBack focus/order/names, Reduced Motion, Android frame trace and asset
   memory/package inventory. Record iOS cases BLOCKED if no runtime is installed.
6. Run final automated suite, Expo Doctor and diff hygiene; update T13/T22/T14
   status and `tasks/test-result.md` with PASS/FAIL/BLOCKED evidence.

## Files updated during evidence

- `tasks/test-plan.md`
- `tasks/test-result.md`
- `tasks/todo.md`
- `tasks/plan.md`
- no product code during the active evidence run

## Acceptance criteria

- [ ] MOB-VIS-001–007 each has vi/en Android evidence and explicit result; every
  deviation is justified by runtime/spec precedence or returned as a UI bug.
- [ ] Small-screen/font-scale/TalkBack/Reduced-Motion matrix has no blocker/high
  issue; all touch targets remain >=44dp.
- [ ] Runtime asset/package size and Android FPS observations are recorded;
  `npm run verify`, Expo Doctor and diff check pass.

## How to run

```bash
rtk npm run verify
cd mobile && rtk npx expo-doctor && cd ..
rtk npm run dev:server
rtk npm run dev:mobile
rtk npm run mobile:android
rtk adb shell wm size
rtk adb shell wm density
rtk proxy git diff --check
```

Use `adb exec-out screencap -p` through the approved evidence workflow and inspect
the resulting local images. Restore any temporary `wm size/density` overrides.

## Explicitly skipped

- Automated pixel-diff dependency, Maestro/Detox installation and production EAS build.
