# T03 — Draft, injected randomness, and exhaustive verification

Status: complete

## Outcome

Mở rộng `game-core` bằng sequential private draft và injectable randomness,
sau đó chứng minh toàn bộ luật bằng 864 exhaustive cases và deterministic
simulation 10,000 complete matches.

## Dependencies and skills

- Dependencies: T02.
- Required skills: `vibe-build`, `vibe-test`, `test-driven-development`,
  `security-and-hardening`.
- Read first: `SPEC.md` P0 draft bullets, State Machine, Game core tests và Rules
  and privacy acceptance.

## Technical contract

1. RNG boundary duy nhất là `randomInt(maxExclusive)` với contract integer
   `0 <= n < maxExclusive`. Production adapter dùng crypto sau T07; tests dùng
   queued deterministic values. Không dùng `Math.random` trong core.
2. Draft pool có chính xác một ROCK/PAPER/SCISSORS, shuffle không bias bằng
   Fisher–Yates và chọn first drafter bằng cùng injected boundary.
3. First drafter lấy một facedown position; trước lượt hai, hai card còn lại
   được reshuffle/re-index. Draft state canonical có thể biết card, nhưng public
   view helper của inactive player chỉ trả `opponentHasPicked: true`, không trả
   selected index/card/removed card.
4. Mỗi player nhận base three + một distinct draft card. Card thứ ba bị loại và
   không xuất hiện trong bất kỳ public result/helper nào.
5. Core cung cấp deterministic timeout action nhận một legal available choice;
   wall-clock scheduling thuộc bot/server adapter, không thuộc core.
6. Exhaustive suite duyệt 6 ordered distinct extra-card pairings × 144 legal play
   orders = 864. Mỗi case phải kết thúc round bốn và không hòa final score.
7. Simulation 10,000 matches dùng seeded/queued RNG, kiểm ownership, unique
   usage, discard order, terminal phase và deterministic replay của cùng seed.

## TDD sequence

1. Failing tests cho RNG range guard, fixed shuffle và deterministic first drafter.
2. Failing tests cho same-position rejection, second-player re-index và hidden
   inactive projection.
3. Failing test cho distinct extra cards + removed third card never exposed.
4. Viết exhaustive generator và xác nhận nó fail trước khi match/draft wiring đủ.
5. Thêm 10,000-run simulation cuối cùng; giữ runtime bounded và in summary chỉ
   log aggregate, không log secret card của từng case.

## Likely files

- `game-core/src/random.ts`
- `game-core/src/draft.ts`
- `game-core/src/projection.ts`
- `game-core/src/simulation.test.ts`
- `game-core/src/draft.test.ts`
- `game-core/src/index.ts`

## Acceptance criteria

- [ ] Fixed RNG tái tạo chính xác shuffle, first drafter, timeout pick; invalid
  RNG output bị reject và mọi draft choice luôn là available card.
- [ ] Public/inactive draft view không chứa picked index, picked card hoặc removed
  third card; second-player positions đã được reshuffle/re-index.
- [ ] Test report đếm đúng 864 exhaustive cases và 10,000 deterministic matches,
  tất cả kết thúc `MATCH_RESULT` sau bốn rounds, không tied final và không vi phạm
  ownership/discard invariants.

## How to run

```bash
npm run test --workspace game-core -- --test-name-pattern="draft"
npm run test --workspace game-core -- --test-name-pattern="864|10000|simulation"
npm run typecheck --workspace game-core
npm run build --workspace game-core
npm run verify
git diff --check
```

Simulation không được phụ thuộc thời gian thực. Nếu test quá chậm, profile test
generator trước; không giảm 10,000 cases hoặc bỏ exhaustive gate.

## Evidence to record

- `game-core` Node suite reports `864/864` exhaustive cases and `10000/10000`
  deterministic simulations passing; the focused simulation gate completed in
  about 0.17 seconds.
- Draft projection tests assert inactive views contain no `selectedPosition` or
  `selectedCard`; remaining positions are re-indexed and timeout picks are
  range-checked.
- Root `npm run verify` passes after implementation.

## Explicitly skipped

- 5-second scheduler, Colyseus StateView, UI animation và bot adapter.
