# T25 — Motion accessibility and performance

Status: planned

## Outcome

Thêm motion hiếm/có mục đích cho Result và Reconnecting, rồi đóng gate Reduced
Motion và frame stability trên Android trước visual evidence matrix.

## Dependencies and skills

- Dependencies: T23, T24.
- Skills: `vibe-build`, `expo-animation`, `performance-optimization`, `vibe-e2e`.

## Contract

- Result: outcome stamp/score/history enter bằng opacity + scale từ tối thiểu
  `0.95`; stagger 30–40ms, toàn sequence không quá 300ms.
- Reconnecting: chỉ pulse opacity nhẹ để chỉ trạng thái đang chờ; countdown native
  text và expiry vẫn authoritative, không loop translate/rotate liên tục.
- Reduced Motion bỏ scale, stagger, pulse và overshoot; final content/focus order,
  live-region announcements và actions giữ nguyên.
- Device feel/FPS được kết luận từ profile/release build, không từ Expo dev menu.

## Acceptance criteria

- [ ] Result/Reconnecting motion giải thích trạng thái, không delay action hay content.
- [ ] Bật Reduced Motion giữa phiên được phản ánh và không để animation orphan/leak.
- [ ] Samsung `SM-X210` hoặc thiết bị chậm hơn đạt near-60fps evidence trên flow
  Draft → Board → Result; mọi non-pass được ghi FAIL/BLOCKED, không đổi thành PASS.

## Likely files

- `mobile/src/components/FolkGameViews.tsx`
- `mobile/src/components/FolkGameViews.test.tsx`
- `mobile/src/ui/motion.ts`
- `mobile/src/ui/motion.test.ts`
- `tasks/test-result.md` và evidence paths khi thực thi E2E.

## Verification

```bash
rtk npm run verify
rtk npx expo-doctor --verbose
rtk git diff --check
```

Run `MOB-MOTION-003`, then fold its sanitized screenshots/frame data into T22.
iOS/VoiceOver/FPS remains deferred, not PASS.

## Explicitly skipped

Continuous ambient background animation, Lottie, haptics, custom JS screen
transitions and Skia unless a measured T25 bottleneck proves a bounded need.
