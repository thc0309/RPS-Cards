# T19 — Board visual fidelity

Status: complete (drag interaction remains T24; final screenshot matrix remains T22)

## Outcome

Rebuild local and online Board to match `docs/ui/05-board.png` and `ui1.png`:
centered opponent/player score plaques, opponent backs plus a labeled discard
rail, a large pale vertical VS arena, illustrated fanned hand, visible player
drop placeholder and nearby authoritative timer. Runtime state always wins over
the sample card/score counts in the reference.

## Dependencies and skills

- Dependencies: T18.
- Skills: `vibe-build`, `frontend-ui-engineering`, `performance-optimization`,
  `vibe-test`.

## Technical implementation

1. Reshape the existing `FolkBoardView`; do not create a second Board component.
   Keep local/online transport and mutations in their current screens.
2. Lay out the reference hierarchy in this order:
   - centered opponent nameplate/score at the top;
   - opponent facedown hand with a right-side **Bài đã ra / Discards** rail;
   - one large pale circular arena with opponent slot above, upright `VS` in the
     middle, and player drop placeholder below;
   - centered player nameplate/score above the fanned hand and status/timer.
3. Use the existing `folk_default` plaques, card art, `vs-medallion`, timer and
   festival decorations. Decorations are non-interactive and may be reduced or
   hidden before they overlap gameplay at compact heights.
4. Keep the hand driven by runtime state: 4 → 3 → 2 → 1 unused cards across the
   four rounds. Used cards leave the hand and enter each ordered discard rail;
   the three-card sample in `05-board.png` is not a fixed count.
5. Keep text and art upright and preserve the vertical slot order at 320x568,
   360x800, 390x844 and Samsung `SM-X210` portrait. Prefer flex/aspect-ratio and
   bounded scaling over fixed mockup coordinates.
6. T19 establishes static geometry and the measured lower-target layout contract.
   Keep the current lock control functional during this intermediate slice;
   T24 atomically adds drag-to-lock and removes the visible button so no playable
   build is left without a lock path.

## Likely files

- `mobile/src/components/FolkGameViews.tsx`
- `mobile/src/components/FolkGameViews.test.tsx`
- `mobile/src/screens/BoardScreen.tsx` and
  `mobile/src/screens/OnlineBoardScreen.tsx` only for presentation props
- `mobile/src/i18n/vi.ts`, `mobile/src/i18n/en.ts` for the discard label
- `mobile/src/ui/folk-assets.ts` only if an existing Board asset is not mapped

## Acceptance criteria

- [ ] Local/online screenshots show centered score plaques, opponent backs with
  the labeled discard rail, vertical opponent-slot/VS/player-slot arena, centered
  player plaque and fanned hand in the same hierarchy as `05-board.png`.
- [ ] Runtime card count remains 4 → 3 → 2 → 1; selection, locked, reveal and
  ordered discard states remain visually distinct and accessible.
- [ ] The lower placeholder is stable and measurable without covering the hand,
  timer, `VS`, opponent slot or system safe areas at all target portrait sizes.
- [ ] Four-round behavior, privacy, 15-second timeout and rematch data remain green.
- [ ] The temporary Lock control remains functional only until T24 replaces it;
  Checkpoint E2 cannot pass before T24 removes it and proves drag-to-lock.

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand --testPathPattern="board|countdown|motion|i18n"
rtk npm test --workspace server
rtk npm run typecheck --workspace mobile
rtk npm run lint --workspace mobile
rtk npm run mobile:android
```

Run MOB-VIS-005, MOB-UI-001, MOB-UI-005 and MOB-UI-007. Capture vi/en at
320x568, 360x800, 390x844 and Samsung `SM-X210` portrait for selection, locked,
reveal and discard states. Drag cases belong to T24.

## Evidence — 2026-08-20

- Shared local/online Board now uses centered opponent/player score plaques,
  labeled ordered discard rails, a pale vertical opponent-slot → VS → lower
  drop-target arena, runtime hand and nearby timer.
- Added stable `board-arena`, `board-opponent-slot` and `board-drop-target`
  contracts. The temporary Lock action remains functional until T24.
- Board/countdown/motion/i18n regression: 6 suites / 12 tests; server 23/23;
  mobile typecheck/lint pass.
