# T17 — Lobby visual fidelity

Status: planned

## Outcome

Match `docs/ui/03-lobby.png`: invitation scroll, two player panels, explicit ready/
waiting states and leave action, driven entirely by authoritative room projection.

## Dependencies and skills

- Dependencies: T15, T16.
- Skills: `vibe-build`, `frontend-ui-engineering`, `vibe-test`,
  `source-driven-development` for Clipboard API.

## Technical implementation

1. Build the dark village-gate composition with native back/leave, title plaque,
   scroll-like room-code panel, two player cards and central VS medallion.
2. Add a real copy-code action. Verify the Expo SDK 57 official Clipboard package,
   install only `expo-clipboard` when required, and rebuild the development client.
3. Local seat shows ready; opponent panel switches from silhouette/waiting to an
   occupied public player state. Do not invent profile/avatar data not present in
   the projection; use one static guest illustration or silhouette with native text.
4. Preserve polling, automatic Draft navigation, credential cleanup and leave.
   Announce player-count/status changes without announcing every poll.

## Likely files

- `mobile/src/screens/LobbyScreen.tsx`
- `mobile/src/i18n/vi.ts`
- `mobile/src/i18n/en.ts`
- `mobile/package.json` / `package-lock.json` only if Clipboard is installed
- selected `mobile/src/assets/folk_default/` layers

## Acceptance criteria

- [ ] One-player and two-player screenshots match the reference composition and
  stay readable at supported widths.
- [ ] Copy, leave and navigation actions work; live status is accessible and based
  on `snapshot.players.length`, never mock data.
- [ ] No opponent secret/card/theme data beyond the safe projection is rendered.

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand
rtk npx expo-doctor
rtk npm run typecheck --workspace mobile
rtk npm run mobile:android
```

Run MOB-VIS-003 and the Lobby portion of MOB-P1-001.
