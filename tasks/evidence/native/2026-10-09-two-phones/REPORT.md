# Native device check — 2026-10-09

Status: **Expo 57.0.27 migration applied; unsigned iOS Release build PASS; gameplay acceptance not executed.**

## Source and devices

- Source HEAD: `e4095c4`; product working tree clean before this run.
- Samsung S22 Plus / SM-S906E, Android 16: ADB connected. Physical size
  1080×2340, density 450, font scale 1.0. Installed release APK SHA256 matches
  the existing stock artifact:
  `3f45188a831ad270f88c6b1faa6ac27a96bab80a3d32442c74cd1679b81a5ea4`.
- iPhone 8 Plus, iOS 16.7.16 (20H392): USB detected; Xcode 26.1.1 Devices and
  Simulators visibly lists it as Connected. User reports Developer Mode enabled.
  App target minimum deployment is 16.4. Device connection is not launch proof.
- User-selected Xcode: `/Users/chuongtong/Project/Xcode 2.app`, version 26.1.1
  (17B100), Swift 6.2.1. Default installed Xcode is 27.0. Commands used a local
  `DEVELOPER_DIR`; no global Xcode selection was changed.
- User selected Personal Team for signing. No product signing configuration was
  changed; team was supplied as a build argument.

## Build attempts

Release device build failed twice. `ios-release-build.log` records an initial
ExpoModulesJSI module-cache/build-database failure. A retry with outer `-jobs 2`
in `ios-release-build-retry.log` fails on ExpoModulesJSI Swift source, including
`'weak' must be a mutable variable, because it may change at runtime` and an
ambiguous expression in `JavaScriptCodable+Date.swift`.

Those attempts established no successful signed iPhone build, installation,
launch, BOT match, or two-phone online match. The existing Samsung release was launched,
but the interrupted Samsung recording contains navigation/setup only and is
not a completed game test.

## User-reported UIScene launch failure

User supplied `_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`
with `UIScene life cycle is required for apps built with this SDK`.
The device/build that emitted this message was not identified in the user log;
do not attribute it to the iPhone 8 Plus build attempts above.

At the diagnostic stage, installed Expo was 57.0.14. Generated AppDelegate created UIWindow in
didFinishLaunchingWithOptions; generated Info.plist has no
UIApplicationSceneManifest. These match the missing-scene configuration.

Official Expo guidance provides SDK 57 scene support in `expo@57.0.23` or newer,
with a compatible `expo-build-properties` and `ios.enableSceneSupport=true`.
The generated lifecycle must be rebuilt; adding a plist key alone is insufficient.
The diagnostic phase did not apply this migration. The authorized SDK update
below now replaces that configuration.

References:
- https://expo.dev/changelog/sdk-57
- https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md
- https://developer.apple.com/documentation/uikit/transitioning-to-the-uikit-scene-based-life-cycle
- https://developer.apple.com/xcode/system-requirements/

## Remaining work

The user cancelled iPhone 8 Plus testing; do not resume that device gate.
After the SDK migration, rebuild/install a supported client and
execute actual BOT, rematch, settings, reveal/audio, and cross-device online
cases. T14/T26/T29 broad native gates remain open. No commit or push performed.

## T30 — Authorized Expo 57 patch / scene migration

- Updated Expo 57.0.14 → **57.0.27**, React Native 0.86.2 → **0.86.3**, and Expo-compatible package patches. Added `expo-build-properties ~57.0.22` with `ios.enableSceneSupport=true`.
- iOS prebuild reused the native project without clean. Generated Info.plist now has `UIApplicationSceneManifest` with `EXExpoAppSceneDelegate`; AppDelegate conforms to `ExpoReactNativeFactoryProvider` and no longer creates its own UIWindow. This is configuration proof, not runtime launch proof.
- npm initially retained a stale hoisted React Native 0.86.2. The final npm lock/install has one hoisted 0.86.3 with its dependencies resolving correctly; `npm ls` and `npm ci --dry-run --ignore-scripts --audit=false` succeed. Server Colyseus/Zod versions remain at their original lock versions.
- Final workspace tests: **13 core + 27 server + 117 mobile PASS**. Whole workspace typecheck and mobile lint PASS. Android production Hermes bundle export PASS (`/tmp/rps-expo57-android-export`). Logs: `expo57-tests-final.log`, `expo57-typecheck-final.log`, `expo57-mobile-lint-final.log`, `expo57-android-export.log`.
- Expo Doctor **20/21**: SDK alignment/native duplication checks PASS. Remaining warning is the pre-existing untracked `yarn.lock` alongside the authoritative `package-lock.json`; preserved the user file and used npm consistently. CI/EAS must not infer Yarn from the second lockfile.
- CocoaPods update PASS: 116 pods, React Native 0.86.3. Log: `expo57-pods-final-update.log`. Earlier install/resolution failures are diagnostic attempts, superseded by final logs.
- Generic unsigned iOS Release build **PASS** using Xcode 27/iOS 27 SDK via per-command `DEVELOPER_DIR` and `/tmp/rps-expo57-ios-build`; no global Xcode selection or signing change. `expo57-ios-release-build.log` ends with `BUILD SUCCEEDED`. Built app inspection confirms `com.stagoo.rpscards`, minimum iOS16.4, Expo scene delegate in its manifest and a 4,166,034-byte embedded JS bundle; see `expo57-built-app-check.json`. App path: `/tmp/rps-expo57-ios-build/Build/Products/Release-iphoneos/mobile.app`. This unsigned build cannot establish device installation or runtime launch acceptance.
- Lock-only audit compared against HEAD at the same registry snapshot: **81 → 77 findings**, including **2 critical in both** (`proxy-addr`, `shell-quote`). Two newly reported moderate testing-tool packages are `@istanbuljs/load-nyc-config` and `babel-plugin-istanbul`. No forced security upgrades were performed; dependency advisories remain open. Raw reports: `expo57-audit-baseline.json`, `expo57-audit-current.json`.
- No upgraded client was installed/tested on a phone. Existing Samsung APK does not validate this migration. No commit/push; broad gameplay/audio/accessibility/performance gates remain open.
