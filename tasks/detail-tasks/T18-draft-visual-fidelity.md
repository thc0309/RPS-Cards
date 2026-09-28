# T18 — Draft visual fidelity

Status: complete (final screenshot matrix delegated to T22)

## Outcome

Make local and online Draft share the composition of `docs/ui/04-draft.png` while
preserving sequential privacy, 5-second deadline and reduced-motion behavior.

## Dependencies and skills

- Dependencies: T15.
- Skills: `vibe-build`, `frontend-ui-engineering`, `vibe-test`.

## Technical implementation

1. Render woven/paper folk background, title plaque, opponent status/nameplate,
   three fixed facedown slots and lower instruction panel. Never render the
   authoritative `availablePositions` array directly as the visible slot count.
2. Use a shared presentation component only for the repeated Draft geometry;
   local/online screens retain their current adapters and navigation logic.
3. Derive interaction from the authoritative available-position set: all three
   backs remain visible, but only legal positions are pressable. After the first
   pick/re-index, the third slot is a non-interactive facedown placeholder with a
   localized non-color-only unavailable state and no card data.
4. Selected card gets a turmeric glow/border and forward translation; reduced
   motion removes translation but retains border/text. Waiting/complete states
   disable all cards and show explicit localized status.
5. Countdown uses the authoritative deadline where present. Never expose online
   opponent position or card; timeout/waiting updates keep all three slots stable.

## Likely files

- `mobile/src/screens/DraftScreen.tsx`
- `mobile/src/screens/OnlineDraftScreen.tsx`
- `mobile/src/components/FolkDraftView.tsx`
- focused Draft presentation test
- card/plaque/background runtime assets

## Acceptance criteria

- [ ] Local and online Draft screenshots match the reference hierarchy in vi/en
  at 320×568, 360×800 and 390×844.
- [ ] Three backs reuse identical artwork; selected/disabled/waiting overlays are
  non-color-only, and every available card has >=44dp accessible hit area.
- [ ] First-turn, second-turn, waiting and timeout snapshots always show three
  backs; the unavailable placeholder cannot call `onPick` or carry secret data.
- [ ] 5-second auto-pick, sequential privacy and reduced motion regressions pass.

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand --testPathPattern="draft|motion|i18n"
rtk npm test --workspace server
rtk npm run typecheck --workspace mobile
rtk npm run lint --workspace mobile
```

Run MOB-VIS-004, MOB-P0-004, MOB-P1-004 and MOB-DRAFT-001.

## Evidence — 2026-08-20

- `FolkDraftView` now renders fixed slots 0/1/2 instead of mapping the
  authoritative array as visual count. Legal positions alone receive `onPress`;
  unavailable positions expose localized disabled state and a visible `×` cue.
- Local and online screens pass the same authoritative set and never add card or
  opponent-pick data to placeholders.
- Regression started red at 0 slots with the new contract, then passes at three
  slots. Draft/motion/i18n suite: 4 suites / 9 tests; server: 23/23; mobile
  typecheck/lint pass.
