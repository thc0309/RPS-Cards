# T24-C — Gesture runtime foundation

Status: complete

## Outcome

Prepare the Expo native runtime for Board gestures without changing Board
behavior in this task.

## Dependencies and skills

- Dependencies: T19.
- Skills: `vibe-build`, `expo-animation`, `source-driven-development`.

## Technical implementation

1. Install Expo-compatible `react-native-gesture-handler` as a direct mobile
   dependency through Expo; preserve npm workspaces and the single root lockfile.
2. Wrap the current safe-area/router tree with an outer
   `GestureHandlerRootView` using `flex: 1`. Do not add a Babel override; the
   existing Expo/Reanimated setup remains authoritative.
3. Rebuild the Android development client because the native dependency changed,
   then cold-launch through Home → Draft → Board to catch root/safe-area regressions.

## Acceptance criteria

- [x] `react-native-gesture-handler` resolves to the Expo-compatible version and
  is present as a direct `mobile` dependency with focused lockfile changes only.
- [x] Root gesture wrapper, safe areas and Expo Router mount without warning,
  blank screen or route regression.
- [x] Android development build installs and cold-launches on the requested
  Samsung device `RFCW1082JJR` (`SM-S911B`).

## Likely files

- `mobile/package.json`
- `package-lock.json`
- `mobile/app/_layout.tsx`

## Verification

```bash
rtk npm run typecheck --workspace mobile
rtk npm run lint --workspace mobile
rtk npm exec --workspace mobile expo-doctor
rtk npm run mobile:android
```

## Explicitly skipped

No gesture component, animation helper, haptics, Babel config or unrelated
dependency upgrade in this foundation slice.

## Evidence — 2026-08-20

- Direct Gesture Handler `~2.32.0` is deduped across the Expo SDK 57 tree; the
  outer `GestureHandlerRootView` wraps SafeArea/Router without a Babel override.
- Expo Doctor passes 21/21. Android `assembleDebug` passes and the development
  APK installs on `RFCW1082JJR`; cold launch is `Status: ok`, `TotalTime: 796ms`.
- Home UI occupies 1080×2340 within safe areas and sampled logcat contains no
  app fatal, React Native, Gesture Handler, Reanimated or Worklets error.
