# T23 — Shared motion feedback

Status: planned

## Outcome

Làm các control dùng nhiều lần phản hồi ngay khi press/selection mà không đổi
navigation, mutation, accessibility hoặc layout contract.

## Dependencies and skills

- Dependencies: T15–T21 visual slices.
- Skills: `vibe-build`, `expo-animation`, `frontend-ui-engineering`, `vibe-test`.
- Reuse: Reanimated 4, Worklets và `mobile/src/ui/motion.ts`; không thêm package.

## Contract

- `FolkButton`, `FolkCard` và `FolkBackButton`: press-in scale `0.97`, ease-out,
  tối đa 120ms; disabled state không animate.
- Card selected/unselected chuyển trong 150–200ms; border/text/accessibility state
  vẫn là nguồn feedback chính.
- Reduced Motion bỏ scale/translate nhưng giữ thay đổi opacity/border tức thời.
- Không tạo generic animation framework; mở rộng trực tiếp shared primitives hiện có.

## Acceptance criteria

- [ ] Press feedback xuất hiện trước callback và không làm double navigation/action.
- [ ] Hit area 44dp+, accessibility label/state và vi/en text không đổi.
- [ ] Không animate layout, elevation, blur hoặc chạy `setState` mỗi frame.

## Likely files

- `mobile/src/ui/motion.ts`
- `mobile/src/ui/motion.test.ts`
- `mobile/src/components/FolkButton.tsx`
- `mobile/src/components/FolkCard.tsx`
- `mobile/src/components/FolkChrome.tsx`

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand motion
rtk npm run typecheck --workspace mobile
rtk npm run lint --workspace mobile
```

Run `MOB-MOTION-001` on Android. Feel-check slow press, rapid tap, finger drift,
disabled controls and system Reduced Motion.

## Explicitly skipped

Haptics, Android ripple, Lottie, ambient loops and custom route transitions.
