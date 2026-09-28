# SPEC.md — RPS Cards

Status: active — Android-first UI remediation; iOS validation deferred
Last verified: 2026-08-06 (native Android UI run; see `tasks/test-result.md`)

Execution priority: complete and verify the Android UI/runtime milestone first.
iOS remains in the product contract, but its simulator/device evidence is not a
blocker for the current Android milestone and will be resumed later.

Sources: `docs/DEV_PLAN.md`, `docs/document.md`, `docs/ui/01-home.png` through
`docs/ui/07-result.png`, `docs/ui/ui1.png`, `docs/assets/README.md`,
`tasks/test-result.md`, and `tasks/evidence/ui/2026-08-06/`.
`docs/document.md` is the broader product roadmap; this spec is the binding MVP
contract when their scopes conflict.

## Objective

Build a portrait React Native card game for Android and iOS in which two
players draft one extra Rock–Paper–Scissors card, then play exactly four
rounds. The server is authoritative for online matches and never exposes an
opponent's secret hand or draft card.

The MVP targets guest players who want to create a private room, invite one
other person with a short code, and finish a match even after a brief network
interruption.

This remediation also brings the implemented mobile flow back to the supplied
UI hierarchy and assets, removes the observed React runtime warning, and keeps
gameplay, protocol, privacy, and localization contracts unchanged.

MVP success means:

- P0: one player can complete the full draft and four-round flow against a
  random bot on Android and iOS.
- P1: two real devices can create/join a private room, reconnect, and complete
  the same flow without rule divergence or secret-state leakage.
- Interstitial ads appear only at the create/join entry points, at most once
  per player per room-entry attempt, and never block gameplay when unavailable.

P2 is release hardening for an internal trial, not part of the first playable
MVP.

## Assumptions

- `P0 + P1` define the MVP; P2 follows after MVP acceptance.
- The repository will use npm workspaces because Node.js is already required.
- The mobile app uses an Expo development build with `expo-dev-client`; Expo Go
  is not a supported runtime because ads and other native modules need a custom
  native build.
- P0/P1 room state is in memory. No database is required until accounts,
  cross-device preferences/inventory, purchases, history, or cross-process room
  recovery is added. When one of those needs is approved, use Supabase
  Auth/Postgres/Storage as the persistence backend without replacing Colyseus as
  the authoritative live-match server.
- Guest identity is generated and stored on-device. It is not a social account.
- Reconnect reservation defaults to 25 seconds and remains server-configurable
  within the agreed 20–30 second range.
- Round selection defaults to 15 seconds and is server-configurable. On expiry,
  the server auto-locks one uniformly random owned, unused card for each player
  who has not locked, then resolves the round normally.
- Each player's draft turn lasts 5 seconds and is server-configurable. On expiry,
  the server randomly selects one of the currently available facedown cards.
- Every MVP room uses the fixed ruleset identifier `classic_v1`.
- Each guest has a cosmetic loadout restored when the app opens:
  `uiThemeId`, `cardSkinId`, and `boardThemeId`. All three default to
  `folk_default` (`Dân gian mặc định`). MVP ships only that catalog entry until
  additional themes and purchase rules are specified.
- MVP supports Vietnamese (`vi`) and English (`en`). First launch follows the
  device language when it is supported and otherwise falls back to English; a
  saved in-app choice overrides the device language on later launches.
- The seven screen mockups define the MVP flow; `docs/ui/ui1.png` remains the
  detailed battle-composition reference. They are visual references, not full
  screen images to ship.
- The MVP source exists in `mobile/`, `server/`, and `game-core/`; this spec
  records the smallest remediation needed after the 2026-08-06 native run.
- Room codes default to five characters from uppercase letters and digits with
  `I`, `O`, `0`, and `1` excluded. Mockup codes and placeholder slots are sample
  content, not a second format.
- The supplied PNG layers under `docs/assets/` are an optional starting library.
  Use them when they fit; create or modify assets when a screen is missing a
  suitable layer or the existing art does not meet visual/accessibility needs.

## Scope

### P0 — Gameplay prototype

- Model `ROCK` (Búa), `PAPER` (Bao), and `SCISSORS` (Kéo).
- Shuffle exactly one draft card of each type using an injected random source;
  the online server uses `crypto` and tests inject a deterministic sequence.
- Randomly choose the first drafter.
- Give each player the three base cards plus their private draft card.
- Let the first player take one facedown card and the second take one of the
  remaining cards; discard the third without revealing it.
- Give each drafter a separate authoritative 5-second deadline. If it expires,
  the server randomly picks one available card for that player.
- Show the inactive player only **Đối thủ đã chọn**. Do not expose or animate the
  selected position. Before the second player's turn, reshuffle and re-index the
  two remaining facedown cards so the first choice cannot be inferred.
- Keep three facedown visual slots in Draft at all times. The first drafter has
  three legal positions; after the authoritative pick and reshuffle, the second
  drafter has two legal positions plus one non-interactive facedown placeholder.
  The placeholder carries no card data and cannot submit a draft action.
- Accept one owned, unused card from each player per round.
- Reveal both locked choices together, resolve the round, update score, and
  append both cards to public discard piles in play order.
- End after exactly four rounds. There is no sudden death.
- Provide a random-choice bot only for exercising the complete local flow.

### P1 — Private realtime rooms

- Create a two-player room and return a short invitation code.
- Validate a room code before showing the join interstitial, then validate it
  again before joining.
- Reject a third player and duplicate create/join submissions.
- Keep phases, ownership, locks, timers, score, and final result authoritative
  on the Colyseus server.
- Send each client only its own private hand/draft data plus the opponent's
  public card count, lock status, discard pile, and score.
- Reveal cards only after both players lock or the authoritative selection timer
  expires. Timeout auto-lock uses only legal remaining cards and cannot replay a
  discarded card.
- Reserve a disconnected player's seat for 25 seconds by default, restore a
  client-safe snapshot on reconnect, and award a loss when the window expires.
- Keep the selection timer running while a seat is reserved for reconnect.
  Reconnect restores the current authoritative phase and remaining deadline; it
  never resets or extends the timer.
- If an in-memory room disappears after a server restart, map reconnect failure
  to `ROOM_EXPIRED`, delete the saved reconnect credential, return to Rooms, and
  show the localized restart message: **Phòng đã kết thúc do máy chủ khởi động
  lại.** / **The room ended because the server restarted.**
- Use a temporary guest identity; no registration or social login.

### UI and art

- Lock gameplay to portrait on supported phones.
- Preserve the hierarchy shown in `docs/ui/ui1.png`: opponent area above,
  neutral reveal arena in the middle, and the player's score, hand, and primary
  action below.
- Split the battle background into symmetric top and bottom halves around the
  central reveal arena. The top half belongs to the opponent and the bottom half
  belongs to the local player; neither is one full-screen background crop.
- The MVP catalog renders `folk_default` (`Dân gian mặc định`) with warm paper,
  vermilion, turmeric yellow, indigo, ink brown, and muted green from
  `docs/DEV_PLAN.md`.
- Restore the local player's cosmetic loadout before rendering Home. A compact
  **Tùy chỉnh / Customize** sheet from Home shows language, interface theme,
  card skin, and board theme; with one MVP option it displays the active default
  without fake locked products.
- Identify every card by illustration, Vietnamese label, and symbol; color
  alone is insufficient.
- Provide seven primary states: Home, Rooms, Lobby, Draft, Board,
  Reconnecting, and Match Result.
- Consolidate **Tạo phòng** and code-based **Vào phòng** on the Rooms screen.
  The screen may show the player's current reconnectable private room, but it
  must not enumerate every private room on the server.
- The primary in-round action is dragging the selected card into the player's
  arena placeholder to **Khóa bài**; there is no separate visible lock button.
  While the authoritative phase is still `ROUND_SELECTION`, dragging another
  unused owned card into the placeholder replaces the held card and returns the
  previous card to the hand. The same action remains available through an
  accessible custom action.
- Support reduced motion; animations must settle into the same readable final
  state when disabled.
- Use `View`, `ImageBackground`, Gesture Handler, and Reanimated by default.
  `@shopify/react-native-skia` is allowed for a specific battle-board effect or
  layered animation only when the same acceptance case cannot stay smooth and
  maintainable with those primitives; Skia is rendering-only and stores no data.
  Do not add Rive, a component library, or a generic theme engine for MVP.

#### Asset sourcing contract

- The 34 supplied PNG layers in `docs/assets/` may be reused for backgrounds,
  cards, controls, decorations, and icons when they fit the intended screen.
- Render player names, room codes, scores, countdowns, statuses, and button text
  as native text over the textless assets; do not bake runtime text into images.
- Preserve aspect ratio for cards, icons, and decorations. Stretch wide controls
  only with cap insets or nine-slice treatment that protects their corners.
- Copy only runtime assets actually used by the app into `mobile/src/assets/`.
  New or modified assets must follow the same Vietnamese folk direction, remain
  layered, and preserve readability and touch-target boundaries.

#### Rooms-screen interaction contract

1. Home exposes **Chơi với bot** and **Phòng online**; the latter opens Rooms.
2. Rooms shows a clear empty state when the guest has no current room and one
   current-room row when a locally known session is still reconnectable.
3. **Tạo phòng** attempts one interstitial, creates the room, then opens Lobby
   with its invitation code.
4. **Vào phòng** shares the same screen: enter a code, validate it, attempt one
   interstitial, revalidate, join, then open Lobby.
5. Invalid, full, and expired errors stay on Rooms and keep the relevant input
   available for correction. Rapid taps cannot duplicate an ad or mutation.
6. There is no public room discovery, server-wide room list, search, filter, or
   pagination in MVP.

#### Battle-screen visual contract

The reference image is a portrait concept at `836 × 1881`. It defines visual
priority and state treatment, not fixed pixel coordinates:

1. Respect the native safe area; the app does not draw its own status bar.
2. Build the upper and lower board halves from the same layout geometry mirrored
   vertically. Keep card, score, discard, and decoration zones equivalent while
   preserving upright text and illustrations.
3. Show the opponent's nameplate and score first, followed by identical
   facedown card backs and the opponent's public discard pile.
4. Keep a calm, high-contrast central arena with two slots separated by `VS`.
   The lower player slot is the drag target: a valid drop locks the selected
   card and settles it into that slot. Before reveal, a valid drop of another
   card replaces it and animates the previous card back to the hand. The opponent
   slot stays hidden until the authoritative simultaneous reveal.
5. Show the player's nameplate and score above a fanned hand. The selected card
   moves forward, gains a turmeric border, and remains readable without hiding
   the adjacent cards' labels.
6. Do not render a separate **Khóa bài** button. Show the authoritative remaining
   selection time near the player's drag target when a timer applies; hide it
   when no timer is active. A drop outside the target returns the card to the
   hand and sends no lock action. Replacing a held card does not reset the
   authoritative deadline.
7. After each reveal, move both cards to public discard piles in round order.
   The opponent's remaining hand stays facedown and exposes only its count.

All names, room codes, timers, scores, round numbers, hands, and discards shown
in the mockups are illustrative. Runtime state and the game rules win if sample
values in an image are internally inconsistent; no sample value is hard-coded.

#### Cosmetic loadout and future themes

- The app loads each player's saved `uiThemeId`, `cardSkinId`, and
  `boardThemeId` at startup. The interface theme applies locally; card skin and
  board theme become public match cosmetics.
- Render the opponent's board theme on the upper half and the local player's on
  the lower half. Render each player's cards with that player's card skin; all
  facedown backs for one player remain identical. The shared reveal arena stays
  neutral.
- Themes change only art, decoration, short ambient effects, and optional sound.
  They never change card size, hit targets, timers, visibility, or game rules.
- After MVP, a player may own and select multiple interface themes, card skins,
  and board themes; special cosmetics may be acquired or purchased.
- When a catalog has more than the default entry, the server validates ownership
  and sends only public card/board cosmetic identifiers. Unknown or unavailable
  identifiers fall back to `folk_default`.
- Inventory, purchasing, and account-synced loadouts are post-MVP. MVP persists
  the local default/loadout choice through the Zustand preference store backed
  by AsyncStorage and preserves these extension points.

#### Localization contract

- Declare `vi` and `en` as supported locales in Expo app config.
- Use `expo-localization` to read the device locale and `i18n-js` for translation,
  interpolation, and fallback. Keep one typed key set with complete dictionaries
  for both languages.
- Keep protocol enum values, room codes, operation IDs, and server error codes
  language-neutral. The client maps stable codes to localized display strings.
- Localize every visible label, validation/error message, accessibility label,
  timer/status phrase, and card name. Player-entered names are never translated.
- Do not bake Vietnamese or English text into runtime art. Both languages render
  as native text and must fit the same supported portrait layouts.

#### Card and interaction states

- `ROCK`/Búa uses a clenched fist, not a literal hammer.
- `PAPER`/Bao uses an open hand or clearly readable paper symbol.
- `SCISSORS`/Kéo uses a recognizable pair of scissors.
- Supported states are facedown, available, selected, locked, revealing, and
  discarded. Locked state adds the text **Đã chọn**; animation alone is not
  sufficient feedback.
- Card backs are identical and contain no data-dependent variation.
- Interactive cards and buttons have at least a 44 × 44 dp hit area, clear
  disabled feedback, and accessible Vietnamese labels.
- Decorative gates, drums, flags, bamboo, lion dance, and border ornaments
  remain outside card hit areas and never resemble controls.
- Layout must preserve card labels, score, timer, and primary action across
  common Android/iOS portrait aspect ratios and display cutouts.

#### Result actions

- In bot mode, **Đấu lại** starts a fresh local match immediately.
- In online mode, **Đấu lại** marks that player ready in the same room and waits
  for the opponent. A fresh draft starts only after both players consent; either
  player may cancel and return to Rooms.
- **Về trang chủ** leaves the finished match and returns Home.

## Requested UI remediation

Scope is limited to the failures recorded in `tasks/test-result.md`. Do not
change game rules, server authority, protocol payloads, room semantics, or
privacy boundaries.

### Runtime and shared layout

- Remove the React state-update warning at its root: no state/store writes
  during render; every subscription effect returns cleanup; async effects use
  cancellation/active guards; room actions always reset busy state with
  `try/finally`.
- Keep normal screens free of development overlays, stuck splash states, and
  repeated multi-second startup stalls.
- Make `FolkSurface` safe-area aware. Use layered supplied assets and layout
  geometry rather than full-screen mockup crops; keep essential art uncropped.
- Render dynamic text natively inside asset frames with no overlap or clipping.
  Primary actions and Back hit areas are at least 44 × 44 dp.
- Verify `320×568`, `360×800`, and `390×844` portrait layouts at font scales
  1.0 and 1.3 in both locales.

### Screen corrections

- Home: match the reference hierarchy while keeping complete Vietnamese and
  English labels visible.
- Rooms: restore the framed room panel/empty/current state and prevent title,
  room code, and controls from colliding.
- Lobby: use the hall composition with invitation scroll, two player panels,
  avatars, VS, ready/waiting status, and Leave action.
- Draft: show the opponent panel, three fixed facedown slots, woven arena, and
  instruction scroll with explicit available/unavailable/selected/waiting/timeout
  states. Never collapse the row to two visible cards.
- Board: mirror both player halves, score plaques, opponent backs/count and
  discards, neutral two-slot VS arena, readable fanned hand, selected/locked
  state, timer, and drag-to-lock player placeholder.
- Reconnecting: show a dimmed, non-interactive active online board with a
  centered scroll/drum and native countdown; preserve expiry behavior.
- Result: show outcome stamp, score plaque, four real round-history rows, and
  working rematch/home actions without crest/title overlap.

### Asset and text rules

- Preserve and reuse the supplied layers under `mobile/src/assets/`; add no
  screenshot-based UI and do not bake runtime text into art.
- Runtime data wins over sample values in mockups. Card labels and status cues
  remain readable and are not color-only.

## Remediation exit criteria

- Cold launch and every exercised screen flow produce no React state-update or
  subscription-leak warning.
- Native screenshots for MOB-VIS-001 through MOB-VIS-007 match the reference
  hierarchy, with no overlap or clipping in the supported matrix.
- Reconnecting is verified with two active clients; otherwise it remains
  explicitly blocked and is not claimed as passed.
- All actions have accessible names and 44 dp hit areas; no normal-screen
  overlay obscures content.
- `npm run verify`, `cd mobile && npx expo-doctor`, and `git diff --check`
  pass; device evidence records startup responsiveness and the tested matrix.

### Advertising

- Use test ad units in development and non-production builds.
- On **Tạo phòng**, attempt one interstitial before the create-room request.
- On **Vào phòng**, validate the code, attempt one interstitial, then revalidate
  and join.
- Continue after close, load failure, timeout, or no inventory.
- Do not show ads during draft, rounds, reconnect, or results.
- Do not configure rewarded ads, currency, or post-match interstitials.

## State Machine

```text
WAITING
  -> DRAFT
  -> ROUND_SELECTION
  -> ROUND_REVEAL
  -> ROUND_RESULT
  -> ROUND_SELECTION  (until four rounds are complete)
  -> MATCH_RESULT
```

Each transition is accepted only from its expected phase. A player may submit
at most one draft choice and hold at most one active card lock for the current
round. A new `LOCK_CARD` with a new operation identifier replaces that player's
active card only while the phase remains `ROUND_SELECTION`; once reveal wins the
race, later replacements are stale. Retries with the same operation identifier
are idempotent; conflicting retries are rejected.

## Architecture

Current repository structure; these seams are binding for UI remediation:

```text
.
├── mobile/                  # React Native Android/iOS app
│   ├── app/                 # Thin Expo Router route and layout files
│   ├── src/screens/         # Flow-level screen implementations
│   ├── src/components/      # Components justified by repeated use
│   ├── src/game/            # Client view-model and Colyseus adapter
│   ├── src/ads/             # One create/join interstitial gate
│   ├── src/cosmetics/       # Loadout IDs, catalog, and visual mapping
│   ├── src/i18n/            # Typed vi/en dictionaries and locale selection
│   ├── src/store/           # Zustand session shell and persisted preferences
│   └── src/assets/          # Runtime copies of supplied or new layered art
├── server/
│   └── src/
│       ├── rooms/           # Colyseus room lifecycle and client projections
│       └── index.ts         # Server entry point
├── game-core/
│   └── src/                 # Pure TypeScript rules, types, and action checks
├── docs/DEV_PLAN.md         # Product and visual-design input
├── docs/ui/                 # Seven flow mockups plus battle reference
├── SPEC.md                  # Confirmed product contract
└── tasks/                   # Plan, todo, E2E cases, and evidence
```

`game-core` has no React Native or Colyseus dependency. P0's local bot harness
and P1's server both call the same pure rules. In online play, the mobile client
renders server projections and never calculates an authoritative score/result.

Secret cards must not be placed in state broadcast to both Colyseus clients.
The room keeps canonical state server-side and emits a projection tailored to
each player.

## Tech Stack

- TypeScript in all three workspaces with strict type checking.
- Expo development builds with React Native and `expo-dev-client` for Android/iOS.
- Expo Router with one native stack; the MVP has no tab navigator.
- React Native Gesture Handler and Reanimated for interaction and motion.
- Zustand for app-wide session metadata and persisted user preferences; keep
  transient screen/animation state in React local state and do not add Redux.
- Zustand `persist` with `@react-native-async-storage/async-storage` for the
  non-sensitive locale and cosmetic preference payload.
- `expo-secure-store` only for guest/reconnect credentials; it is not the
  general preference database. Choose and test Supabase Auth session storage
  when that post-MVP integration is activated.
- `expo-localization` plus `i18n-js` for Vietnamese/English localization.
- Node.js and Colyseus for private rooms and authoritative match state.
- Supabase Auth/Postgres/Storage is the selected future persistence extension,
  activated only by the account, sync, ownership, purchase, history, or durable
  recovery requirements above; it is not required for MVP P0/P1.
- `@shopify/react-native-skia` is an optional native rendering dependency under
  the battle-board criterion above, not a state-management or storage tool.
- Node's built-in `crypto` for room-code generation and collision retries.
- `react-native-google-mobile-ads` for the single create/join interstitial gate,
  using its test interstitial IDs outside production. Do not add a second ad
  abstraction or network for MVP.

- The root uses npm workspaces. The current mobile package is Expo `~57.0.10`,
  React Native `0.86.2`, React `19.2.3`, Expo Router `~57.0.10`, Reanimated
  `4.5.1`, and Zustand `5.0.14`; preserve the installed stack during this fix.

## Commands

Current root scripts and checks:

```bash
npm install
npm run dev:server
npm run dev:mobile
npm run mobile:android
npm run mobile:ios
npm run test
npm run typecheck
npm run lint
npm run build:server
npm run verify
cd mobile && npx expo-doctor
git diff --check
```

`dev:mobile` maps to `expo start --dev-client`; `mobile:android` and
`mobile:ios` map to `expo run:android` and `expo run:ios`. Local development
builds are sufficient for P0/P1; EAS cloud builds and distribution wait for P2.

`npm run verify` must run the non-device checks required before a task is
accepted: tests, type checking, linting, and the server build. Android/iOS
device builds remain separate because they require their native toolchains.

## Development Approach

### Workspace and dependency direction

- Use npm workspaces for `mobile`, `server`, and `game-core` with one root lockfile.
- `game-core` exports pure rules, state transitions, protocol types, and an
  injectable `randomInt(maxExclusive)` boundary. It imports no mobile, network,
  timer, storage, or Colyseus code.
- `server` and the local bot harness call `game-core`; `mobile` may import shared
  types and view helpers but never server implementation files.
- Add an abstraction only after a second real implementation needs it. The MVP
  uses one Colyseus adapter, one ad gate, and one theme directly.

### Expo mobile app

- Use Expo Router route files only for navigation and parameter parsing:
  `index`, `rooms`, `lobby`, `draft`, `board`, `reconnecting`, and `result`.
  Screen components, hooks, types, and game adapters remain under `src/`.
- Use one `Stack` in `app/_layout.tsx`; there are no tabs, deep-link-only routes,
  or navigation service wrapper in MVP.
- Keep transient visual state such as the selected card local with `useState`.
  Use one small Zustand store for preferences and active room/session metadata;
  keep the current server projection in the Colyseus adapter rather than copying
  authoritative gameplay state into a second persistent store.
- Online screens render the latest server projection. They may optimistically
  highlight a local selection, but never predict phase, score, reveal, timeout,
  or final result.
- Use Expo Continuous Native Generation: native settings live in app config and
  config plugins. Rebuild the development client after changing native modules
  or native config; JavaScript, TypeScript, and ordinary asset changes use Metro
  reload without a native rebuild.
- Store non-sensitive locale/cosmetic preferences through Zustand persistence in
  AsyncStorage. Store guest/reconnect credentials in SecureStore. Future
  Supabase sessions stay outside Zustand and use a platform storage adapter
  selected and token-size-tested during that integration; never put a secret in
  route params, logs, or an `EXPO_PUBLIC_*` value.
- Resolve locale and cosmetic preferences before leaving the startup boundary,
  then expose narrow Zustand selectors/actions. Do not put translated strings,
  asset objects, or Skia objects into gameplay state or persisted storage.

### Realtime server and protocol

- Keep one canonical match object inside each two-client Colyseus room. Public
  phase, scores, card counts, lock status, deadlines, and discards use synchronized
  state; per-client `StateView` fields contain that player's private hand/draft.
- Set `rulesetVersion` to `classic_v1` when the room is created and include it in
  snapshots and structured logs. It never changes during an active match.
- Include validated public `cardSkinId` and `boardThemeId` values per player in
  the room projection. For MVP the only accepted value is `folk_default`; the
  private hand remains hidden regardless of skin.
- Use direct typed messages only for transient acknowledgements and structured
  errors. Persistent gameplay facts belong in state so join/reconnect receives a
  complete current projection.
- Define the small action set contract-first: validate room entry, draft pick,
  card lock, and rematch-ready. Every mutation includes `operationId`, expected
  phase, and expected round; accepted duplicate operations return the same result.
- Set `maxClients = 2` and a bounded per-client message rate. Reject malformed,
  stale, unauthorized, or excessive actions before calling `game-core`.
- Use the room clock for one phase deadline timer. Broadcast the absolute server
  deadline; clients render a local countdown, while only the server expiry callback
  may auto-lock cards or advance phase. Do not run a server interval every second.
- Keep room-code lookup, match state, and idempotency records in memory for P0/P1.
  A server process restart may expire active rooms; persistence remains out of scope.
- If Supabase is activated later, the Colyseus server validates identity and
  cosmetic ownership against server-controlled data. The mobile client may use
  only the public project URL/key with Row Level Security; service-role secrets
  stay server-side. Live private hands and phase timers never use Supabase as
  their synchronization path.

### Local development loop

1. Run `npm run dev:server` on the development machine.
2. Set `EXPO_PUBLIC_SERVER_URL` to the machine's reachable LAN URL for physical
   devices. An iOS simulator may use the host URL; Android Emulator normally uses
   `10.0.2.2` unless `adb reverse` is configured.
3. Build/install once with `npm run mobile:android` or `npm run mobile:ios`, then
   iterate through `npm run dev:mobile` until native dependencies/config change.
4. Develop vertically: core rule and test, server handler/integration test, mobile
   screen state, then two-device evidence. Do not build all screens before wiring
   the first complete bot or room flow.

### Rendering, assets, and performance

- Use a supplied layer when it fits; otherwise create or modify the smallest
  missing asset. Mockups remain composition references, never runtime screens.
- Keep a typed static asset map for the three card kinds. Avoid dynamic file-path
  construction that Metro cannot resolve reliably.
- Render dynamic text and accessibility labels natively. Use `ImageBackground`
  for real backgrounds and ordinary `Image` elements for cards/decorations.
- Animate card transform and opacity on the Reanimated UI thread. Do not update
  React state every frame or use JavaScript intervals for visual countdowns.
- Target stable 60 fps on the selected Android/iOS test devices and keep only the
  current/next screen's large art mounted. Optimize oversized PNGs before shipping.

### Environment and diagnostics

- Validate server environment values at startup. `EXPO_PUBLIC_SERVER_URL` and ad
  unit IDs are public identifiers; production values are injected by the release
  build and not committed. Server secrets never use the `EXPO_PUBLIC_*` prefix.
- Log structured room, phase, round, operation, and error codes. Never log private
  cards before reveal, guest resume credentials, or reconnect tokens.
- Report client-safe errors with stable codes mapped to Vietnamese or English by
  the client; keep stack traces and internal validation details server-side.

## Contracts and Validation

Client actions carry a room/session identity, expected phase or round, and a
unique operation identifier. The server validates:

- message shape and supported action;
- active room and seated player;
- expected phase, round, and turn;
- ownership and unused status of the selected card;
- duplicate or conflicting submissions;
- room capacity and reconnect eligibility.

Room codes use a fixed, documented uppercase format, exclude visually ambiguous
characters, and are generated with `crypto`. The server retries collisions and
returns a clear full/not-found/expired response without exposing private state.

Errors must leave the current authoritative state intact. Logs may contain room
and operation identifiers but never a guest resume token or secret hand.

The server validates `DRAFT_SELECTION_TIMEOUT_MS` as an integer from 1,000 to
30,000 milliseconds with a 5,000 default, `ROUND_SELECTION_TIMEOUT_MS` from
5,000 to 120,000 milliseconds with a 15,000 default, and
`RECONNECT_TIMEOUT_MS` within the agreed 20,000–30,000 range with a 25,000
default. Invalid configuration fails startup instead of silently changing
gameplay.

Every room and client projection carries `rulesetVersion: 'classic_v1'`.
Unsupported or missing versions fail with `RULESET_UNSUPPORTED`; an active room
never adopts a new ruleset midway through a match.

## Code Style

- Prefer pure functions and discriminated unions in `game-core`.
- Use `camelCase` for values/functions, `PascalCase` for components/types, and
  uppercase string literals for protocol phases/card kinds.
- Keep server mutation in the room/game-core path; screens render state and
  dispatch actions.
- Reuse only after a second real use case. Avoid factories, registries, and
  wrapper layers with one implementation.

```ts
export type CardKind = 'ROCK' | 'PAPER' | 'SCISSORS';
export type RoundOutcome = 'WIN' | 'LOSS' | 'DRAW';

export function resolveRound(mine: CardKind, theirs: CardKind): RoundOutcome {
  if (mine === theirs) return 'DRAW';
  return (
    (mine === 'ROCK' && theirs === 'SCISSORS') ||
    (mine === 'PAPER' && theirs === 'ROCK') ||
    (mine === 'SCISSORS' && theirs === 'PAPER')
  ) ? 'WIN' : 'LOSS';
}
```

## Testing Strategy

### Game core

Use Node's built-in test runner against compiled TypeScript output for
deterministic rules; do not add a second core test framework:

- all nine ordered card matchups;
- two players cannot claim the same draft position;
- an unowned or discarded card cannot be locked;
- a second valid lock replaces the first during `ROUND_SELECTION`, returns the
  previous card to the available hand, and is rejected after reveal starts;
- exactly four rounds are played and discard order is preserved;
- all six different extra-card pairings across 144 play orders per pairing
  produce no tied final match;
- a fixed random sequence reproduces draft order and first drafter;
- a deterministic simulation of 10,000 complete matches always reaches
  `MATCH_RESULT` after four rounds with valid ownership, discard order, and score.

### Server

Use the same Node test runner for Colyseus integration tests with two simulated
clients:

- create, validate, join, capacity, and room-code collision handling;
- phase/round/ownership validation and idempotent retries;
- repeated `LOCK_CARD` actions replace only the caller's private active card,
  preserve the original deadline and reveal no card identity to the opponent;
- simultaneous reveal and timeout behavior;
- separate 5-second draft deadlines auto-pick only an available card;
- the inactive drafter receives no selected position, and the second player's
  two positions cannot reveal the first player's pick;
- timeout auto-lock selects only owned, unused cards and remains reproducible
  when the test supplies a fixed random source;
- player-specific snapshots contain no opponent secret card data;
- room projections accept only known public card/board cosmetic IDs and fall back
  to `folk_default` without changing secret-state visibility;
- reconnect restores phase, score, hand, locks, and timers;
- reconnect expiry awards the documented loss once;
- a missing room after server restart produces `ROOM_EXPIRED` without retry loops.

### Mobile

Use the Jest setup from the selected React Native bootstrap for state rendering
and action gating; do not add a second mobile test runner. Keep device E2E cases
for:

- complete bot match on Android and iOS;
- two-device create/join/draft/four-round/result flow;
- join-code revalidation and duplicate-tap protection;
- ad close/error/timeout/no-inventory fallbacks;
- network loss and reconnect;
- the seven-screen flow and battle card states derived from the UI mockups;
- first-launch locale detection, saved `vi`/`en` switching, and complete localized
  labels/errors/accessibility names in both languages;
- Zustand hydration, cosmetic loadout restoration, and `folk_default` fallback
  on app launch without persisting credentials in AsyncStorage;
- common portrait ratios, display cutouts, Vietnamese text, 44 dp touch
  targets, contrast, non-color status cues, and reduced motion.

No numeric coverage target is required for MVP. Every game rule, trust-boundary
validation branch, and reported regression requires a runnable test.

## Boundaries

### Always do

- Keep the server authoritative for online phase, cards, score, timers, and
  result.
- Validate every client action and environment value at its boundary.
- Preserve secret-state separation in code and tests.
- Use test ad units outside production.
- Run the smallest relevant checks, then `npm run verify` before accepting a
  completed implementation task.
- Keep Android and iOS behavior equivalent and preserve portrait safe areas.
- Represent win/loss/valid/locked states with text or symbols as well as color.
- Treat the UI mockups as reference compositions; render real controls and
  layered assets instead of shipping screenshots as app surfaces.
- Fix the root lifecycle/layout defect evidenced by the native run and attach
  reproducible device evidence for each changed screen.

### Ask first

- Add or replace a dependency, database, queue, authentication provider, ad
  network, analytics SDK, crash SDK, or remote-config service not explicitly
  selected by this spec.
- Activate Supabase before an approved account, sync, ownership, purchase,
  history, or durable-recovery requirement exists.
- Change game rules, round count, timeout policy, room capacity, room-code
  format, ad placement, or secret-state contract.
- Add server-side live-room persistence, deploy infrastructure, native
  permissions, CI/release signing, or production ad identifiers.
- Expand MVP to any P2 or later feature.
- Add new art, dependencies, or a rendering approach beyond the supplied
  layers without first confirming the scope.

### Never do

- Trust a client-computed result, score, ownership claim, phase, or timer.
- Broadcast the opponent's hand, draft card, discarded third draft card, or
  reconnect credential.
- Show ads during gameplay/reconnect/results or block room entry permanently
  when an ad fails.
- Add Shield, support cards, hand sorting/shuffling, sudden death, rewarded
  ads, economy, theme shop, ranked play, spectator, replay, Rive, or a custom
  game/rendering engine to MVP.
- Commit secrets, production ad IDs, signing material, or generated vendor/build
  output.
- Commit changes unless explicitly requested.
- Hide a warning with an overlay, write state during render, reduce touch
  targets below 44 dp, or replace missing composition with a screenshot.

## Acceptance Criteria

### Rules and privacy

- Bao beats Búa, Búa beats Kéo, and Kéo beats Bao for every invocation path.
- Each player receives three base cards plus one distinct drafted card.
- The third draft card is removed without being revealed.
- Each draft turn has a separate 5-second deadline and auto-picks one available
  card on expiry.
- An inactive player cannot observe the opponent's selected draft position; the
  remaining positions are reshuffled before the second pick.
- Used cards cannot be replayed; each player holds at most one active card per
  round and may replace it only before authoritative reveal.
- A match ends after exactly four rounds with a deterministic winner.
- The 864 exhaustive extra-card/play-order cases contain no tied match result.
- Network payload and reconnect tests prove that opponent secrets are absent.
- Every room and projection uses the immutable ruleset `classic_v1`.

### Playable flows

- Android and iOS can each finish a bot match without a stuck phase.
- Two physical devices can create/join and finish a private-room match.
- A third join is rejected without disturbing the room.
- Reconnect within the configured window restores the match; expiry resolves
  the loss once.
- A room lost after server restart returns `ROOM_EXPIRED`, clears its reconnect
  credential, and returns the player to Rooms with the documented message.
- Selection timeout auto-locks one legal remaining card for each unlocked player
  and the match still completes exactly four rounds.
- Bot rematch starts immediately; online rematch starts only after both players
  consent in the same room.

### Ads

- Create calls the server only after the single ad attempt finishes or fails.
- Join validates before the ad, revalidates after it, and joins at most once.
- Ad failure, timeout, or no inventory never blocks the room flow.
- No MVP gameplay or result state triggers an ad.

### UI

- Players can identify Bao/Búa/Kéo in under one second without relying on color.
- Vietnamese labels are not clipped on supported portrait ratios.
- English labels are not clipped on the same supported portrait ratios, and the
  user can switch between `vi` and `en` without losing the active session.
- Drafting, waiting, locked, reveal, reconnect, and result states are explicit.
- Draft always renders three facedown slots; only authoritative available
  positions are actionable, and the non-interactive placeholder leaks no card.
- The two player halves and shared reveal zone remain visually distinct.
- The upper and lower board backgrounds are vertically symmetric player-owned
  halves; text and illustrations remain upright rather than being flipped.
- The board preserves the reference hierarchy: opponent header/hand/discards,
  central `VS` arena with the player drop target, then player score/hand/timer.
- Dragging a selected card into the player placeholder commits exactly one lock;
  an invalid/cancelled drop returns it to the hand without mutation, and TalkBack
  can invoke the same lock through a localized custom accessibility action.
- Before reveal, dragging another available card into the placeholder commits one
  replacement, settles the new card, returns the previous card to the hand and
  does not reset the timer. A replacement that loses the reveal/timeout race is
  rejected and reconciles to the authoritative state.
- Available, selected, locked, revealing, and discarded cards are visibly and
  accessibly distinct; adjacent fanned cards retain readable labels.
- Opponent card backs remain identical and reveal only the remaining count.
- Safe areas and display cutouts never cover score, timer, cards, or the primary
  action.
- Decorative elements do not look interactive, and all visible actions work.
- Each MVP screen uses suitable supplied or newly created layered assets;
  runtime text remains native and the full-screen mockups are never shipped as UI.
- App launch restores the user's interface/card/board loadout; the MVP catalog
  resolves every missing or unknown cosmetic ID to `folk_default`.
- Native evidence must show no title/crest/code/card overlap, no clipped
  Vietnamese or English labels at font scale 1.3, and complete reference
  composition on Home, Rooms, Lobby, Draft, Board, and Result.

## Out of Scope

- Quick Match, match history, analytics, production monitoring, remote ad
  frequency, weak-network release testing, privacy/consent release paperwork
  (P2).
- Tactical Mode, Scout/Recycle cards, Ranked/MMR, seasons, leaderboard, social
  systems, tournament, spectator, replay, cosmetics, currency, missions,
  Battle Pass, theme inventory/shop, rewarded ads, and post-match ads.
- Tutorial, surrender/đầu hàng, a separate round-preparation phase, and hand
  sorting or shuffling.
- A custom rendering/game engine, unnecessary Skia surfaces, and background music.

## Open Questions

Defaults below apply if the spec is confirmed without changes:

1. Confirm P0 + P1 as MVP and P2 as a later internal-release gate.
2. Confirm npm workspaces, five-character room codes, a 15-second selection
   timeout, and a 25-second reconnect default.
3. Deployment target, production ad IDs, monitoring, privacy/consent markets,
   and release signing remain intentionally undecided until P2.
4. For this remediation, use supplied assets and reference hierarchy with
   runtime data taking precedence over sample mockup text. Confirm whether a
   stricter pixel-level match is required.
5. Confirm access to two active clients for Reconnecting verification; without
   it, MOB-VIS-006 remains blocked rather than being inferred as passed.
