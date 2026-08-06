# T19 — Board visual fidelity

Status: planned

## Outcome

Rebuild local and online Board to match `docs/ui/05-board.png` and `ui1.png`:
symmetric player-owned halves, neutral reveal arena, illustrated cards, discard
piles, fanned hand and timer-attached Lock action.

## Dependencies and skills

- Dependencies: T18.
- Skills: `vibe-build`, `frontend-ui-engineering`, `performance-optimization`,
  `vibe-test`.

## Technical implementation

1. Create one presentation layer fed by local/online projections: opponent
   nameplate/score/backs/discards, central two-slot arena + VS, local score/hand/
   discards and Lock control. Keep transport/adapters outside it.
2. Build top and bottom from the same geometry mirrored vertically, while text,
   card faces and art stay upright. Top uses opponent board/card cosmetics; bottom
   uses local cosmetics; unknown IDs fall back to `folk_default`.
3. Compose card faces from frame + ROCK fist/PAPER hand/SCISSORS illustration +
   localized native label. Fan 3–4 cards with transforms; selected card moves
   forward and remains readable. Used cards leave the hand and appear in each
   player's ordered discard zone.
4. Lock is the sole primary action. Put authoritative remaining seconds in the
   attached circular timer badge; show textual locked state and disable cards.
5. Reveal only current locked cards in the neutral arena. Use Reanimated only for
   transform/opacity; do not add Skia unless a measured trace fails the existing gate.

## Likely files

- `mobile/src/screens/BoardScreen.tsx`
- `mobile/src/screens/OnlineBoardScreen.tsx`
- `mobile/src/components/FolkBoardView.tsx`
- `mobile/src/components/FolkPlayingCard.tsx`
- Board/countdown/motion presentation tests and selected assets

## Acceptance criteria

- [ ] Local/online screenshots preserve the reference hierarchy and symmetric
  halves at all target portrait sizes without overlapping labels/actions.
- [ ] All six card/lock/reveal/discard states are visually distinct and accessible;
  Búa/Bao/Kéo illustration mapping is correct.
- [ ] Four-round behavior, privacy, 15-second timeout and rematch data remain green;
  Pixel 4a interaction trace shows no obvious frame stalls or leaked timers.

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand --testPathPattern="board|countdown|motion|i18n"
rtk npm test --workspace server
rtk npm run typecheck --workspace mobile
rtk npm run lint --workspace mobile
rtk npm run mobile:android
```

Run MOB-VIS-005, MOB-UI-005, MOB-UI-007 and MOB-PERF-001 Android portion.
