# T21 — Result visual fidelity

Status: planned

## Outcome

Make local and online Result follow `docs/ui/07-result.png`: outcome stamp, final
score banner, four-round history and two actions, all from runtime match data.

## Dependencies and skills

- Dependencies: T19.
- Skills: `vibe-build`, `frontend-ui-engineering`, `vibe-test`.

## Technical implementation

1. Use the folk village/paper scene, native localized outcome stamp, score plaque,
   scroll-like history panel and red/blue actions. Confetti is decorative and
   omitted/reduced when Reduced Motion is enabled.
2. Render exactly four runtime round rows for completed matches, mapping each card
   kind to the correct illustration. For an early online forfeit, render available
   rounds plus an explicit localized forfeit reason; never manufacture missing rows.
3. Extract a shared Result presentation for local/online only if both can supply the
   same view model. Preserve immediate local rematch, two-party online readiness,
   cancel/leave and Home behavior.
4. Winner/loss/tie/forfeit and waiting-for-opponent states use text and symbols,
   not color alone. Loading remains a styled status rather than a blank screen.

## Likely files

- `mobile/src/screens/ResultScreen.tsx`
- `mobile/src/screens/OnlineResultScreen.tsx`
- `mobile/src/components/FolkResultView.tsx`
- `mobile/src/i18n/vi.ts`, `mobile/src/i18n/en.ts`
- focused result presentation test and selected assets

## Acceptance criteria

- [ ] Completed local/online screenshots match `07-result.png` hierarchy with
  correct final score and runtime round history in vi/en.
- [ ] Rematch/Home/cancel/wait states remain fully functional and accessible.
- [ ] Early forfeit and loading render honest, stable layouts without fake rounds.

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand --testPathPattern="result|local-match|i18n"
rtk npm test --workspace server
rtk npm run typecheck --workspace mobile
rtk npm run lint --workspace mobile
```

Run MOB-VIS-007 and result portions of MOB-P0-001/MOB-P1-001.
