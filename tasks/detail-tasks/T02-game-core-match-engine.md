# T02 — Implement the pure `classic_v1` match engine

Status: complete

## Outcome

Tạo pure TypeScript match engine cho Bao–Búa–Kéo: card ownership, legal lock,
simultaneous reveal, scoring, discard order và kết thúc chính xác sau bốn vòng.
Engine là nguồn luật duy nhất cho local bot và Colyseus server.

## Dependencies and skills

- Dependencies: T01.
- Required skills: `vibe-build`, `vibe-test`, `test-driven-development`,
  `api-and-interface-design`.
- Read first: `SPEC.md` P0, State Machine, Workspace, Contracts, Code Style,
  Game core testing, Rules and privacy acceptance.

## Technical contract

1. Public domain types tối thiểu gồm `CardKind`, `CardInstance`, `PlayerId`,
   `RulesetVersion`, `MatchPhase`, `RoundOutcome`, `MatchState`, typed actions và
   stable domain error codes. Dùng discriminated unions; không dùng string tự do
   ở callers.
2. Mỗi player có ba base card và sau T03 sẽ có một extra card. Mỗi card instance
   có ID ổn định; ownership/used state được kiểm bằng ID, không bằng UI index.
3. Reducer/pure transition chỉ nhận state + validated action + injected time/RNG
   khi thật sự cần. Không import timer, network, React Native, storage, Colyseus.
4. `resolveRound` phải bao phủ đủ chín ordered matchups. Chỉ khi cả hai đã lock
   mới chuyển `ROUND_SELECTION → ROUND_REVEAL → ROUND_RESULT` và cập nhật score.
5. Một card chỉ lock một lần; player chỉ lock một card/vòng; duplicate cùng
   operation sẽ do protocol layer xử lý sau, còn core trả domain error ổn định
   cho illegal/conflicting action.
6. Sau round bốn, chuyển `MATCH_RESULT`; không sudden death. Nếu invariant tạo
   score hòa ở terminal state, fail bằng internal invariant thay vì tự chế luật.

## TDD sequence

1. Viết failing table test cho đủ 9 cặp card và reciprocal outcome.
2. Viết failing tests cho initial hand, ownership, unused card và one-lock rule.
3. Viết failing test cho simultaneous reveal: không lộ/resolve khi mới một bên
   lock; sau hai lock mới cập nhật outcome, score và hai discard piles đúng thứ tự.
4. Viết failing test cho phase guard và exactly-four-round transition.
5. Implement tối thiểu để từng nhóm test xanh; refactor chỉ sau khi tests xanh.

## Likely files

- `game-core/src/types.ts`
- `game-core/src/rules.ts`
- `game-core/src/match.ts`
- `game-core/src/errors.ts`
- `game-core/src/index.ts`
- `game-core/src/*.test.ts`

## Acceptance criteria

- [ ] Tất cả 9 ordered matchups đúng Bao thắng Búa, Búa thắng Kéo, Kéo thắng
  Bao; draw chỉ xảy ra khi hai loại giống nhau.
- [ ] Tests chứng minh illegal ownership, reused card, second lock và wrong phase
  không mutate input state; legal reveal giữ đúng discard order và score.
- [ ] Một valid match đi qua đúng state machine, dừng sau round bốn với
  `rulesetVersion: 'classic_v1'`; core không import mobile/server/timer/storage.

## How to run

```bash
npm run test --workspace game-core
npm run test --workspace game-core -- --test-name-pattern="resolveRound"
npm run typecheck --workspace game-core
npm run build --workspace game-core
npm run verify
git diff --check
```

Nếu workspace test script compile trước khi dùng `node --test`, giữ focused
filter trong script contract thay vì thêm test framework thứ hai.

## Evidence to record

- TDD red: `npm run test --workspace game-core` initially failed at the missing
  `./rules.js` and `./types.js` modules.
- Green: five Node tests pass (one rules suite plus three match-state cases and
  the existing ruleset smoke test), covering all nine ordered matchups,
  reciprocal outcomes, immutable lock/reveal, ownership/reuse/phase guards,
  discard order, and the four-round terminal transition.
- `npm run verify` passes for game-core, server, and mobile (test, typecheck,
  lint, and server build).

## Explicitly skipped

- Draft/randomness (T03), bot UI, timers, networking, persistence và animations.
