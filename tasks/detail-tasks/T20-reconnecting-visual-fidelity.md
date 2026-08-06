# T20 — Reconnecting visual fidelity

Status: planned

## Outcome

Implement `docs/ui/06-reconnecting.png` as a modal-like dimmed board overlay that
accurately reflects reconnect progress and remaining reservation time.

## Dependencies and skills

- Dependencies: T19.
- Skills: `vibe-build`, `frontend-ui-engineering`, `vibe-test`.

## Technical implementation

1. Reuse the board visual shell as a non-interactive backdrop when a safe cached
   projection exists; otherwise use the folk board background. Apply a native dim
   layer and centered scroll/paper panel with decorative drum.
2. Render localized reconnect title, seat-reservation explanation, countdown and
   do-not-close guidance as native text. The panel is an accessible live status;
   the darkened board is hidden from the accessibility tree.
3. Derive displayed seconds from the existing 25-second reconnect window/start
   time without changing retry schedule or server deadline. Expiry/error continues
   to clear credentials and navigate to Rooms.
4. Reduced motion removes drum movement/pulse; no extra retry loop or network call
   is introduced for presentation.

## Likely files

- `mobile/src/screens/ReconnectingScreen.tsx`
- optional `mobile/src/components/ReconnectingOverlay.tsx`
- `mobile/src/i18n/vi.ts`
- `mobile/src/i18n/en.ts`
- reconnect presentation/countdown test and selected assets

## Acceptance criteria

- [ ] Screenshot matches the reference overlay hierarchy at target sizes; countdown
  remains readable and never extends the server reservation.
- [ ] Retry/success/expiry behavior is unchanged and accessibility announces useful
  status without exposing/repeating board controls.
- [ ] Reduced-motion and credential-cleanup tests pass.

## Verification

```bash
rtk npm test --workspace mobile -- --runInBand --testPathPattern="reconnect|countdown|motion"
rtk npm test --workspace server
rtk npm run typecheck --workspace mobile
```

Run MOB-VIS-006 and MOB-NET-001/002 when two devices are available.
