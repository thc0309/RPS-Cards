# T16 — Rooms visual fidelity

Status: planned

## Outcome

Implement `docs/ui/02-rooms.png` as a real responsive Rooms screen while keeping
the existing create/join/ad/reconnect behavior and all error states.

## Dependencies and skills

- Dependencies: T15.
- Skills: `vibe-build`, `frontend-ui-engineering`, `vibe-test`.
- Read first: Rooms interaction contract, `02-rooms.png`, room-entry tests and
  current `RoomsScreen`.

## Technical implementation

1. Compose the safe-area screen from the folk paper surface, native back action,
   title plaque, framed current-room/empty panel, red create action, separator,
   labeled room-code input and blue join action.
2. Use the supplied textless button/input/panel/icon layers; keep code, placeholder,
   errors, busy text and current-room data native. Input stays editable after all
   invalid/full/expired/network failures.
3. Render exactly one of empty/current-room states. Busy disables both mutations
   with explicit non-color feedback and no layout shift; error is announced and
   placed beside the input/action that can resolve it.
4. Add/extend one component test covering empty, current room, busy and error
   presentation without testing image-library internals.

## Likely files

- `mobile/src/screens/RoomsScreen.tsx`
- `mobile/src/i18n/vi.ts`
- `mobile/src/i18n/en.ts`
- focused Rooms UI test
- selected `mobile/src/assets/folk_default/` layers

## Acceptance criteria

- [ ] Empty and saved-room screenshots follow `02-rooms.png` hierarchy at 320dp
  and 390pt widths; input/action labels never clip in vi/en.
- [ ] Back, create, current room and join are >=44dp, accessible and fully working;
  rapid taps still produce one mutation/ad attempt.
- [ ] Error/busy/current states remain visible, localized and recoverable.

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand --runTestsByPath src/game/room-entry.test.ts
rtk npm run typecheck --workspace mobile
rtk npm run lint --workspace mobile
```

Run MOB-VIS-002 plus MOB-UI-006 on Android.
