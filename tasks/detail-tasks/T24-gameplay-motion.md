# T24 — Gameplay motion

Status: complete (final Reduced Motion/TalkBack/FPS evidence remains T25/T22)

## Outcome

Animate các thay đổi trạng thái quan trọng trong Draft/Board và thay nút Lock
bằng kéo lá đã chọn vào player placeholder để commit hoặc thay lá đang giữ,
trong khi gameplay authority vẫn giữ nguyên.

## Dependencies and skills

- Dependencies: T24-A, T24-B, T24-C. T23 is independent shared press feedback
  and is not a prerequisite for Board drag-to-lock.
- Skills: `vibe-build`, `expo-animation`, `frontend-ui-engineering`,
  `performance-optimization`, `vibe-test`.

## Contract

- Draft/Board selection dùng transform/opacity trên Reanimated UI thread và có
  thể đổi lựa chọn trước khi lock mà không giật/teleport.
- Dùng Gesture Handler/Reanimated foundation từ T24-C; không dùng `PanResponder`.
- Chỉ lá đang chọn nhận `Gesture.Pan()`. Đo player placeholder bằng `onLayout`;
  convert target/card bounds into one coordinate space, drag theo ngón tay bằng
  shared values và chỉ gọi callback lock một lần ở `onEnd` khi tâm lá nằm trong
  vùng thả hợp lệ và phase vẫn cho phép.
- Drop hợp lệ dùng spring không overshoot để settle vào placeholder. Drop hụt,
  cancel, timeout hoặc phase đổi giữa lúc kéo phải trả lá về tay và không gửi
  thêm mutation. Online busy/error tiếp tục dùng snapshot/reconnect hiện có.
- Trong `ROUND_SELECTION`, các lá unused còn lại vẫn chọn/kéo được khi đã có một
  lá trong placeholder. Drop hợp lệ của lá khác gửi đúng một `LOCK_CARD`, settle
  lá mới và đưa lá cũ về đúng vị trí trong fan; không reset timer hoặc bot delay.
- Mỗi drag hợp lệ dùng operation ID mới có attempt suffix; retry của cùng attempt
  giữ nguyên ID. A → B → A không được tái sử dụng operation ID của lần A đầu.
- Khi locked, lá của người chơi nằm ở lower slot; opponent slot không lộ card
  trước authoritative simultaneous reveal. Reveal/discard chỉ animate một lần
  từ `lastRound`/discard history.
- Không còn visible Lock button. Card đã chọn cung cấp localized custom
  accessibility action **Khóa bài** gọi cùng callback; target/drop state được
  TalkBack thông báo và không chỉ biểu đạt bằng màu.
- Local và online truyền cùng một stable `onLock(cardId)` callback vào
  `FolkBoardView`; local gọi adapter hiện có, online gửi đúng `LOCK_CARD` payload
  hiện có. `own.lockedCardId` là nguồn phục hồi sau poll/reconnect; gesture layer
  không biết transport.
- Timing UI tối đa 250ms; finger settle dùng spring tối đa 400ms, không đụng
  timer 5s/15s, server deadline, local adapter hoặc protocol payload.
- Không dùng JS interval, render-time shared-value write, `setState`/`scheduleOnRN`
  mỗi frame, animated height/width/margin/flex.

## Acceptance criteria

- [x] Local và online dùng cùng drag presentation, không leak opponent secret và
  không đổi payload shape hoặc authoritative contract đã chốt trong T24-A.
- [x] Mỗi valid initial/replacement drop gửi đúng một lock; lá mới settle và lá
  cũ trở về hand. Hụt/cancel/timeout/phase-change snap back và không gọi lock.
- [x] Busy cards không bắt đầu gesture mới; locked state vẫn cho chọn một lá unused
  khác khi phase còn `ROUND_SELECTION`, nhưng khóa mọi drag khi reveal bắt đầu.
- [x] TalkBack custom action khóa cùng lá đã chọn mà không cần visible button.
- [x] Reduced Motion giữ finger tracking nhưng bỏ overshoot/translation settle,
  đưa UI tới cùng final state bằng immediate position + opacity/state cue.

## Likely files

- `mobile/src/components/FolkGameViews.tsx`
- `mobile/src/components/FolkGameViews.test.tsx`
- `mobile/src/screens/BoardScreen.tsx`
- `mobile/src/screens/OnlineBoardScreen.tsx`

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand FolkGameViews motion
rtk npm run verify
```

Run `MOB-MOTION-002` and `MOB-DRAG-001` on Samsung `SM-X210`; drag slowly,
flick, release just outside, interrupt mid-settle, and let timeout win mid-drag.
Repeat with TalkBack and Reduced Motion, then record warning logs and a short
screen capture from a profile/release build. Confirm miss/cancel or an already
observed timeout sends no `LOCK_CARD`; if peer lock/timeout wins an unseen server
race, the request is rejected and produces no accepted mutation.

## Explicitly skipped

Freeform throwing, multi-card gestures, haptics, particle effects and Skia.

## Evidence — 2026-08-20

- Local/online Board share one selected-card `Gesture.Pan` path and stable lock
  callback. The visible Lock button is removed; hit testing uses measured window
  bounds and schedules exactly one callback only for an accepted `onEnd`.
- Focused view regression 5/5 passes, including empty selection placeholders,
  accessible custom lock action and valid/miss geometry. Full `npm run verify`
  passes: core 13, server 23, mobile 45 tests plus typecheck/lint/server build.
- Physical run on `RFCW1082JJR` confirms three fixed Draft slots when only two
  are available, valid Búa drop, then Bao replacement before reveal: Bao settles
  in the lower placeholder and Búa returns to the hand. No visible Lock button
  and no sampled app/gesture runtime error.
