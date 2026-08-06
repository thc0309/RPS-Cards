# T18 — Draft visual fidelity

Status: planned

## Outcome

Make local and online Draft share the composition of `docs/ui/04-draft.png` while
preserving sequential privacy, 5-second deadline and reduced-motion behavior.

## Dependencies and skills

- Dependencies: T15.
- Skills: `vibe-build`, `frontend-ui-engineering`, `vibe-test`.

## Technical implementation

1. Render woven/paper folk background, title plaque, opponent status/nameplate,
   three large identical card backs and lower instruction panel.
2. Use a shared presentation component only for the repeated Draft geometry;
   local/online screens retain their current adapters and navigation logic.
3. Selected card gets a turmeric glow/border and forward translation; reduced
   motion removes translation but retains border/text. Waiting/complete states
   disable all cards and show explicit localized status.
4. Countdown uses the authoritative deadline where present. Never expose online
   opponent position or card; remaining positions reflow without revealing gaps.

## Likely files

- `mobile/src/screens/DraftScreen.tsx`
- `mobile/src/screens/OnlineDraftScreen.tsx`
- `mobile/src/components/FolkDraftView.tsx`
- focused Draft presentation test
- card/plaque/background runtime assets

## Acceptance criteria

- [ ] Local and online Draft screenshots match the reference hierarchy in vi/en
  at 320×568, 360×800 and 390×844.
- [ ] Three backs are identical, selected/disabled/waiting states are non-color-only,
  and every available card has >=44dp accessible hit area.
- [ ] 5-second auto-pick, sequential privacy and reduced motion regressions pass.

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand --testPathPattern="draft|motion|i18n"
rtk npm test --workspace server
rtk npm run typecheck --workspace mobile
rtk npm run lint --workspace mobile
```

Run MOB-VIS-004, MOB-P0-004 and MOB-P1-004.
