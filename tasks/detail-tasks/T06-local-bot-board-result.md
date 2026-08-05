# T06 — Complete local bot rounds, board, and result

Status: pending

## Outcome

Hoàn tất P0: sau draft, người chơi đấu bốn rounds với bot trên board hai nửa đối
xứng, timeout 15 giây auto-lock, simultaneous reveal, public discards, Match
Result, **Đấu lại** và **Về trang chủ**.

## Dependencies and skills

- Dependencies: T05.
- Required skills: `vibe-build`, `vibe-test`, `frontend-ui-engineering`,
  `performance-optimization`.
- Read first: `SPEC.md` P0 rounds, Battle-screen visual contract, Cosmetic
  loadout, Card states, Result actions, Rendering/performance và MOB-P0/UI cases.

## Technical contract

1. Board view model lấy canonical state từ local adapter. UI không tự tính round
   winner, score, phase, available cards hoặc final winner.
2. Layout gồm opponent upper half, neutral center reveal arena và local lower
   half. Hai player zones dùng cùng geometry mirrored vertically nhưng text/card
   art luôn upright. Upper/lower backgrounds resolve theo từng player
   `boardThemeId`; cards resolve theo từng `cardSkinId`.
3. Opponent hand là identical facedown backs + count. Chỉ hai current locked cards
   vào reveal arena sau cả hai lock/timeout. Discards hiển thị public play order.
4. Local selection là transient component state. **Khóa bài** dispatch đúng một
   action; disabled/locked state rõ bằng text/symbol. Deadline là absolute 15s;
   timeout auto-lock uniformly random owned unused card.
5. Reveal/result motion dùng Reanimated transform/opacity trên UI thread và obey
   reduced motion. Không update React state per frame.
6. Result sau exactly four rounds. Bot rematch tạo fresh local match/draft ngay;
   Home action dispose adapter/timers và về Home.
7. Skia không cài ở task này. Chỉ ghi candidate effect nếu View/Reanimated không
   thể đạt; decision và measurement nằm ở T13.

## TDD sequence

1. Failing component tests cho available → selected → locked → reveal → discard.
2. Fake-clock test 15-second auto-lock chỉ chọn owned/unused card và không double
   resolve khi user lock sát deadline.
3. Four-round integration test qua local adapter tới result, including rematch
   reset và Home cleanup.
4. Render tests cho symmetric zones, hidden opponent cards và per-player cosmetic
   IDs; unknown IDs fallback `folk_default`.
5. Implement animations after state tests; reduced-motion test verifies same final UI.

## Likely files

- `mobile/src/game/local-bot-adapter.ts`
- `mobile/src/screens/BoardScreen.tsx`, `mobile/src/screens/ResultScreen.tsx`
- `mobile/src/components/BattleBoard.tsx`, `PlayerZone.tsx`, `RevealArena.tsx`
- `mobile/src/components/Hand.tsx`, `Card.tsx`, `DiscardPile.tsx`
- `mobile/app/board.tsx`, `mobile/app/result.tsx`
- Runtime art under `mobile/src/assets/` and focused tests

## Acceptance criteria

- [ ] Một bot match luôn chơi đúng four rounds; legal manual/timeout locks,
  simultaneous reveal, score và discard order khớp core; không stuck phase.
- [ ] Board portrait đúng hierarchy và symmetric player-owned halves; opponent
  secrets không render; card states, timer, score và **Khóa bài** accessible ở vi/en.
- [ ] Match Result xác định winner, rematch reset fresh draft, Home cleanup timers;
  Android/iOS development builds hoàn tất MOB-P0-001/002 smoke flow.

## How to run

```bash
npm run test --workspace mobile -- --runInBand --testPathPattern="board|result|local-bot"
npm run test --workspace game-core
npm run typecheck --workspace mobile
npm run lint --workspace mobile
npm run dev:mobile
npm run mobile:android
npm run mobile:ios
npm run verify
git diff --check
```

Manual: hoàn tất một match bằng taps, một match để ít nhất một round timeout,
kiểm **Đấu lại** và **Về trang chủ**, rồi lặp với Reduced Motion.

## Evidence to record

- Four-round integration/fake-clock output.
- Android/iOS video hoặc ordered screenshots Draft → Board → Result.
- Timer/listener cleanup evidence; candidate Skia need nếu có, chưa cài.

## Explicitly skipped

- Online mode, ads, reconnect, Supabase và speculative visual effects.
