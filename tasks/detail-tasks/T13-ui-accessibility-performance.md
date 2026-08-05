# T13 — UI accessibility, localization fit, assets, and performance

Status: blocked (implementation complete; device profiling evidence unavailable)

## Outcome

Polish toàn bộ seven-state mobile flow trên Android/iOS portrait: safe areas,
44 dp targets, TalkBack/VoiceOver semantics, vi/en fit, reduced motion, asset
memory và measured 60 fps. Đây cũng là decision gate duy nhất cho Skia.

## Dependencies and skills

- Dependencies: T06, T11.
- Required skills: `vibe-build`, `frontend-ui-engineering`,
  `performance-optimization`, `vibe-test`, `source-driven-development` nếu Skia
  gate kích hoạt.
- Read first: `SPEC.md` UI/art through Card states, Rendering/performance, Mobile
  tests, UI acceptance; accessibility/performance checklists; `docs/assets/README.md`.

## Technical contract

1. Audit Home, Rooms, Lobby, Draft, Board, Reconnecting, Result ở small Android
   ~320×568 dp, common 360×800 dp và iPhone ~390×844 pt. Respect SafeArea; app
   remains portrait; score/timer/cards/actions không bị cutout/navigation bar che.
2. Every interactive item có >=44×44 dp hitSlop/size và localized accessibility
   role/name/state/hint. Focus order theo play flow. Selected/locked/win/loss/
   disabled không dựa color alone; status change được announce hợp lý, không spam
   countdown mỗi frame.
3. vi/en dictionaries complete; test longest English/Vietnamese labels, dynamic
   names/codes/scores và system font scaling. Không text baked vào art.
4. Reduced Motion removes/reduces transform choreography nhưng final state giống
   hệt; no flashing >3/sec. Reanimated work stays UI thread.
5. Chỉ copy assets actually used. Record pixel dimensions/file sizes; resize/
   compress oversized PNGs without degrading card readability. Keep only current/
   next large scene mounted; cleanup timers/listeners/animations on route exit.
6. Measure board reveal/hand interaction trên ít nhất một representative mid-range
   Android và một iOS device bằng release-like development profile. Target stable
   60 fps; record dropped frames/JS/UI thread observations.
7. Skia decision gate:
   - Nếu View/Image/Reanimated đạt visual acceptance và stable 60 fps: record
     `SKIA_NOT_NEEDED`, không cài dependency.
   - Nếu một named effect fail sau tối ưu assets/re-renders: record before trace,
     giới hạn Skia vào surface đó, install official compatible package, rebuild
     dev client, rerun tests/profile, record measurable improvement.
   - Không migrate controls/text/accessibility tree vào Canvas và không lưu Skia
     objects trong Zustand/storage.

## Implementation steps

1. Run automated component/a11y checks and create issue list per screen.
2. Test vi/en + font scale + safe-area matrix, fix smallest shared root causes.
3. Validate symmetric board halves and upright text/art; unknown cosmetic fallback.
4. Profile before optimizing; fix oversized art, unnecessary renders/listeners.
5. Apply Skia gate exactly once, with documented decision and evidence.
6. Rerun reduced-motion and screen-reader manual passes on both platforms.

## Likely files

- Seven screen/components under `mobile/src/screens/` and `mobile/src/components/`
- `mobile/src/i18n/vi.ts`, `mobile/src/i18n/en.ts`
- `mobile/src/assets/` and cosmetic mappings
- Reanimated hooks/styles and focused accessibility/layout tests
- Expo/native config only if the Skia gate activates

## Acceptance criteria

- [ ] Seven states fit supported Android/iOS portrait sizes in vi/en with safe
  areas/font scaling; all actions >=44 dp and screen-reader states/focus usable.
- [ ] Reduced motion, non-color cues, symmetric themed halves, upright text/art,
  native runtime text and asset memory/cleanup contracts are satisfied.
- [ ] Profiling evidence shows stable target behavior and records either
  `SKIA_NOT_NEEDED` or one bounded Skia surface with before/after improvement and
  rebuilt native clients.

## How to run

```bash
npm run test --workspace mobile -- --runInBand --testPathPattern="accessibility|layout|i18n|motion|asset"
npm run typecheck --workspace mobile
npm run lint --workspace mobile
npm run mobile:android
npm run mobile:ios
npm run verify
git diff --check
```

Manual: execute MOB-UI and MOB-L10N/MOB-PERF cases in `tasks/test-plan.md` with
TalkBack, VoiceOver, Reduced Motion và system font scaling. Nếu Skia được thêm:

```bash
npx expo install @shopify/react-native-skia
npm run mobile:android
npm run mobile:ios
```

Chỉ chạy install block sau khi decision evidence đã tồn tại.

## Evidence to record

- Added root SafeAreaProvider/SafeAreaView, localized accessibility hints/state,
  44dp-or-larger targets, and reduced-motion behavior that removes card lift.
- Mobile typecheck/lint and 12-suite / 25-test suite pass; board remains symmetric
  upper/lower View zones.
- `docs/assets` inventory is 34 PNGs (~33 MB); no bitmap is copied/mounted because
  current UI uses native text/View surfaces. Decision: `SKIA_NOT_NEEDED`.
- TalkBack/VoiceOver, font-scale matrix and 60fps traces are not claimed: iOS
  target is unavailable and no native profiling runner is installed. Explicit T14 BLOCKED.

## Explicitly skipped

- New gameplay, theme shop, Rive/custom engine, background music và speculative effects.
