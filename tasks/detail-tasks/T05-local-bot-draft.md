# T05 — Complete the local bot draft slice

Status: complete

## Outcome

Tạo vertical slice **Chơi với bot → Draft → ready for round one** dùng trực tiếp
`game-core`: chọn first drafter ngẫu nhiên, facedown choices, separate 5-second
deadline và legal auto-pick cho cả player/bot.

## Dependencies and skills

- Dependencies: T03, T04.
- Required skills: `vibe-build`, `vibe-test`, `frontend-ui-engineering`,
  `performance-optimization` chỉ khi animation có vấn đề đo được.
- Read first: `SPEC.md` P0 draft, UI/art, Asset sourcing, Card states, State
  Machine và MOB-P0 cases trong `tasks/test-plan.md`.

## Technical contract

1. Local adapter sở hữu canonical `game-core` match; screen chỉ render view model
   và dispatch typed actions. Không duplicate rule/score/ownership logic trong UI.
2. Mỗi draft turn có absolute deadline 5 giây. Dùng một scheduled timeout ở
   adapter; countdown UI derive từ deadline, không setInterval mỗi giây và không
   đưa timer ticks vào global persisted state.
3. Khi player là inactive drafter, UI chỉ hiển thị localized **Đối thủ đã chọn**;
   không animation/position hint. Trước turn hai, adapter dùng core reshuffle và
   screen render positions mới.
4. Timeout gọi injected local random adapter để chọn một available position đúng
   một lần. Rapid taps và callback race không tạo hai picks.
5. Bot pick là random legal choice; bot không đọc trước hidden player choice để
   thay đổi strategy. Sau draft, player hand có exactly four owned cards.
6. UI dùng supplied/new layered assets khi phù hợp; runtime text native, hit area
   >=44 dp, states available/selected/waiting/disabled có text hoặc symbol.
7. Route transition tới Board chỉ xảy ra khi draft canonical state complete.

## TDD sequence

1. Component/adapter test player-first and player-second flows với fake clock/RNG.
2. Race test: tap ở deadline và timeout callback chỉ accept một operation.
3. Privacy render test: inactive state không chứa selected index/card asset.
4. Timeout test: returned card nằm trong available set và discarded third card
   không xuất hiện.
5. Implement UI/animation cuối; test behavior qua accessibility queries, không
   snapshot toàn màn hình.

## Likely files

- `mobile/src/game/local-bot-adapter.ts`
- `mobile/src/game/deadline.ts`
- `mobile/src/screens/DraftScreen.tsx`
- `mobile/src/components/DraftCard.tsx`, `mobile/src/components/CountdownBadge.tsx`
- `mobile/app/draft.tsx`
- `mobile/src/assets/` runtime copies actually used
- Focused mobile tests

## Acceptance criteria

- [ ] Player-first/player-second draft đều hoàn thành; mỗi turn có deadline riêng
  5 giây và timeout/tap race tạo đúng một legal pick.
- [ ] Inactive UI không lộ selected position/card; remaining two positions được
  re-index trước second pick; third card không reveal.
- [ ] Sau draft, cả player và bot có four-card hand hợp lệ, route sang Board đúng
  một lần, layout portrait/accessibility labels hoạt động ở vi/en.

## How to run

```bash
npm run test --workspace mobile -- --runInBand --testPathPattern="draft|local-bot|deadline"
npm run test --workspace game-core -- --test-name-pattern="draft"
npm run typecheck --workspace mobile
npm run lint --workspace mobile
npm run dev:mobile
npm run verify
git diff --check
```

Manual: dùng fake/development timeout 5 giây thật, chạy một ván player tap ngay,
một ván không tap, và quan sát cả first/second drafter với fixed RNG test hook.

## Evidence to record

- Fake-clock adapter tests pass for player-first/player-second, 5-second
  deadline timeout, and tap/timeout race; the mobile suite has 13 passing tests.
- `DraftScreen` renders only facedown indexed positions and localized waiting
  text for inactive turns; canonical completion is the only route trigger to
  Board.
- Android development build rebuilt/launched; visual video evidence is deferred
  to T14 because iOS simulator execution is unavailable in this environment.

## Explicitly skipped

- Board resolution/result (T06), online room, ads, reconnect và Skia.
