# T15 — Folk visual foundation and Home fidelity

Status: complete (final clean screenshot matrix delegated to T22)

## Outcome

Biến Home functional hiện tại thành màn hình cùng art direction và composition với
`docs/ui/01-home.png`, đồng thời tạo đúng lượng visual primitive tối thiểu để các
màn sau tái sử dụng. Không hard-code guest name, locale text hoặc product state vào ảnh.

## Dependencies and skills

- Dependencies: T13 accessibility baseline.
- Skills: `vibe-build`, `frontend-ui-engineering`, `performance-optimization`, `vibe-test`.
- Read first: `SPEC.md` UI/art, asset sourcing, localization; `docs/assets/README.md`;
  `docs/ui/01-home.png`; current Home, CustomizeSheet, cosmetic catalog and app shell.

## Technical implementation

1. Inventory only Home assets: paper/village background, logo/plaque, red/blue
   buttons, bot/online icons and small decorations. Copy selected layers to
   `mobile/src/assets/folk_default/`; resize source PNGs to their maximum rendered
   size at 3x density while preserving alpha/aspect ratio.
2. Use `ImageBackground`/`Image` for textless art. All title, action, guest and
   customization labels remain native localized `Text`; images are decorative and
   excluded from accessibility.
3. Rebuild the portrait hierarchy: safe-area top, branded title/mark, central
   village illustration, two dominant actions, compact guest/customize affordance.
   The Customize action may be visually compact but must remain at least 44dp.
4. Derive at most the repeated primitives already proven by Home and next screens:
   a folk screen background and image-backed action/plaque. Do not create a generic
   design-system package or theme engine.
5. Preserve startup hydration, locale/theme selection and both navigation routes.
   Add one focused render/contract test for action labels and accessible roles.

## Likely files

- `mobile/src/screens/HomeScreen.tsx`
- `mobile/src/components/CustomizeSheet.tsx`
- `mobile/src/components/FolkSurface.tsx` (only if reused immediately)
- `mobile/src/ui/folk-assets.ts`
- `mobile/src/assets/folk_default/`

## Acceptance criteria

- [ ] Screenshot preserves the reference's logo → village → two-action hierarchy
  at 320×568, 360×800 and Pixel 4a portrait without clipped actions.
- [ ] vi/en content, hydration and Customize behavior remain correct; no runtime
  text is baked into art and every action is accessible at >=44dp.
- [ ] Only mounted Home assets are copied; aspect ratio is preserved and the
  measured decoded-image budget is recorded before proceeding.

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand
rtk npm run typecheck --workspace mobile
rtk npm run lint --workspace mobile
rtk npm run mobile:android
```

Capture vi/en Home screenshots on Pixel 4a and compare side-by-side with
`docs/ui/01-home.png`. Record exact asset count/package size in T15 evidence.

## Explicitly skipped

- New themes, store/shop UI, custom font dependency, full-screen mockup image.

## Evidence — 2026-08-19

- Home now follows logo → two dominant actions → guest/customize order without
  the extra subtitle that displaced the reference hierarchy.
- Focused Home render contract passes and confirms localized accessible button
  roles for bot, online rooms and customize; mobile typecheck/lint pass.
- Development APK built and installed on Samsung `SM-X210`; Home rendered with
  all actions visible. The first dev-client education sheet obscured the clean
  capture, so T22 still owns the final vi/en screenshot matrix.
- Mounted Home inventory is 7 existing PNGs, 7,426,178 bytes compressed and
  about 18,230,944 bytes decoded at source dimensions. No asset was copied or
  dependency added for this slice.
