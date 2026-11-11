# PROMPT — Full UI/UX redesign for "Bao Búa Kéo – Hội Làng"

You are a senior mobile game UI/UX designer. Redesign the complete interface of an existing
mobile card game. Keep the game rules and the visual theme; fix the usability problems listed
below. Deliver a design spec plus high-fidelity mockups for every screen and state.

---

## 1. Product

- Name: **Bao Búa Kéo – Hội Làng** (Rock–Paper–Scissors card duel, Vietnamese village-festival theme).
- Platform: Android phones first (iOS later). Portrait only. One-handed play.
- Audience: casual Vietnamese players, all ages, many first-time players who will not read instructions.
- Session: one match lasts about 1 minute. Two modes: **vs BOT** (offline) and **private online room** (2 players, 5-character invite code).
- Languages: Vietnamese (primary) and English. No text baked into images.

## 2. Game rules (do not change)

1. Each player starts with 3 base cards: **Búa** (Rock), **Bao** (Paper), **Kéo** (Scissors).
2. **Draft:** 3 extra cards (one Rock, one Paper, one Scissors) are shuffled face down.
   A random player picks first (1 of 3), the other picks second (1 of the remaining 2), the last card is removed.
   Nobody sees a card before picking it. Each pick has a **5-second** timer; on timeout the server picks randomly.
   Each player ends with **4 cards**: Rock, Paper, Scissors + 1 extra duplicate. The opponent's extra card is hidden.
3. **Match:** 4 rounds. Each round both players secretly lock 1 card (**15-second** timer; timeout = random card).
   A locked card can be swapped until the opponent also locks. When both are locked: both cards flip together,
   the round is resolved (Rock > Scissors > Paper > Rock; same card = draw), winner gets +1 point.
4. Every card is used exactly once. Played cards go to a public **discard pile** per player, in round order.
   In round 4 each player has only one card left (forced play).
5. After 4 rounds the higher score wins. A tied match is mathematically impossible.
6. If an online player disconnects for 25 seconds or leaves, the other player wins by forfeit.
7. Rematch: BOT mode goes straight to a new draft. Online needs both players to tap Rematch.

Round presentation timeline (fixed, server-driven): 0.8 s "both locked, get ready" → 0.6 s flip →
1.2 s outcome → 0.3 s cards fly to discard piles → next round.

Strategy note for the designer: the only real information a player has is **their own hand, both discard
piles, the score and the round number**. These must always be clearly readable — they are the gameplay.

## 3. Visual direction (keep and refine)

- Vietnamese folk / village festival ("hội làng"): Đông Hồ woodblock-print feeling, aged paper and woven-bamboo
  textures, lacquer red, indigo blue, gold trim, lotus, bamboo, communal-house roof, festival drum, lion dance, flags.
- Current palette (keep as base): lacquer red `#8A241A` / `#A63D2F`, indigo `#24486B`, gold `#D6A73A` / `#E3B64B` / `#F0CF83`,
  paper `#F7E6B0` / `#F1DDA8`, brown ink `#5A3521` / `#6F452C` / `#43291F`, cream text `#FFF0C6`, leaf green `#3F6B35`, petal pink `#F5A7B9`.
- Player = red, opponent = blue, everywhere, consistently.
- Cards: cream face with ornate frame, hand illustration (fist / open palm / scissors) and the card name; red back with a lotus.
- Decoration must never reduce legibility. Text never sits directly on busy illustration without a plate or scrim.

## 4. Screens and states to design

Design every state listed. Use real Vietnamese copy.

### 4.1 Home
- Logo, **Chơi với bot**, **Phòng online**, settings entry, **Cách chơi** (new).
- Problems today: bottom 40 % of the screen is empty; "Khách chơi" looks like a button but does nothing obvious;
  settings is a small underlined text link; no how-to-play entry.

### 4.2 How to play (new)
- 3–4 illustrated steps: your 4 cards → blind draft of the extra card → 4 rounds, each card once → highest score wins.
- Also design a lightweight **first-match coach overlay** for Draft and Board (one hint at a time, dismissible).

### 4.3 Settings sheet
- Language (vi/en), Sound on/off, Vibration on/off, Card skin, Board theme (only one default theme exists now; show locked/coming-soon slots).

### 4.4 Rooms (online entry)
- **Tạo phòng**, code input (5 characters, alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), **Vào phòng**, paste button.
- States: empty, has-current-room (resume), busy/loading, errors: invalid code, room not found, room full, room expired, entry failed.
- Keyboard open state on a small phone.

### 4.5 Lobby
- Big room code, **Copy** and **Share** (system share sheet), player slot (you) + opponent slot.
- States: waiting for opponent, opponent joined (transition into draft), leaving.
- Do not show a "Ready ✓" label — there is no ready action.

### 4.6 Draft
- Always 3 face-down slots. States: my turn (first pick, 3 available), my turn (second pick, 2 available + 1 taken),
  opponent's turn, opponent has picked, I have picked (waiting), timeout auto-pick.
- **New: reveal moment** — after my pick, flip my card for ~1 s so I see my extra card before the match starts.
- The 5 s timer must be close to the cards and impossible to miss. Avoid repeating the same instruction twice.
- The status area must say whose turn it is in plain words (today it shows the meaningless "VS / Có thể chọn").

### 4.7 Board (the core screen — spend the most effort here)
Layout zones: opponent (top), arena with two card slots (centre), player (bottom).
Must show at all times: both scores, **round indicator "Lượt 2/4"** (new), countdown, opponent's remaining face-down cards,
**both discard piles as 4 fixed slots each** (filled in round order, empty slots visible), my hand, and a clear exit/menu button (new).

States to design:
1. Selecting — nothing chosen.
2. Card lifted/selected.
3. Dragging over the drop slot (valid target highlight) and outside it.
4. I locked, waiting for opponent (card can still be swapped — show how).
5. Opponent locked first, I have not.
6. Both locked — "get ready" (0.8 s).
7. Flip (0.6 s).
8. Outcome: **win**, **loss**, **draw** — a large, unmistakable round banner with "+1" (today it is 12 px text and a few petals).
9. Cards travelling to discard piles (0.3 s).
10. Timer urgency (≤ 5 s): colour/pulse change.
11. Round 4 (single card left).
12. Online only: request in flight (busy), not yet synced after returning from background.
13. Exit confirmation dialog (online: "leaving = forfeit").

Interaction requirements:
- Locking a card must work in **two ways**: (a) drag the card straight into the slot **without selecting it first**,
  and (b) tap a card to select, then tap the slot or tap the card again to lock. There is no separate Lock button today and
  first-time players do not discover the gesture.
- The drag hint lives **inside the empty drop slot**, large, with a first-time arrow animation.
- Mark the **extra (drafted) card** in my hand with a small badge so the two identical cards are distinguishable.
- Hand of 4, 3, 2, 1 cards must all look good and stay inside the thumb zone, above the system gesture bar.

### 4.8 Result
- Outcome headline (win / loss / forfeit win "opponent left" / forfeit loss), final score.
- Round history: 4 rows with **column headers "Bạn" / "Đối thủ"** and a **per-round winner marker** (✓ / × / =, plus highlight on the winning card).
  Forfeit shows fewer than 4 rows.
- Actions **Đấu lại** and **Trang chủ** must be fully visible without scrolling on every supported screen (today the second button is cut off).
- Online states: rematch idle, I am waiting for opponent, opponent wants a rematch, opponent left.
- Win celebration and a calmer loss state.

### 4.9 Reconnecting
- Modal over a dimmed board, 25 s countdown, clear message, and a **Leave room** button (today the player is trapped).
- States: reconnecting, restored, expired.

### 4.10 Shared
- Loading state for every screen (today some are blank).
- Toast/inline error pattern.
- Interstitial ad placement: propose where it hurts least (after a match, not before entering a room).

## 5. Terminology (fix inconsistency)

Use exactly: **Ván** = one whole match; **Lượt** = one of the 4 rounds; **Chốt** = lock a card; **Bài đã ra** = discard pile;
**Lá phụ** = the drafted extra card. English: Match, Round, Lock, Played cards, Extra card.

## 6. Constraints

- Smallest supported viewport **320 × 568 dp**; common target **360–412 dp wide, 19.5:9**. System font scale up to **1.3**.
  Show the Board, Draft and Result at 320 × 568 with font scale 1.3 as well as at the default size.
- Respect top status bar and bottom gesture/navigation bar safe areas.
- Touch targets ≥ 48 × 48 dp. Body text ≥ 14 sp; anything read under a countdown ≥ 14 sp bold; contrast ≥ 4.5:1.
- Never convey win/loss by colour alone — pair with symbol and text.
- Vietnamese text is ~20–30 % longer than English and has stacked diacritics: allow generous line height, no tight caps.
- Provide a **reduced-motion** variant for every animation (cross-fade or instant state).
- Implementation stack (design must be buildable with it): React Native 0.86 + Expo SDK 57, Reanimated 4,
  Gesture Handler, expo-router. Raster 9-slice-friendly panels and buttons (stretchable centre, fixed ornate corners), PNG/WebP @1x/2x/3x.
  No custom shaders, no Lottie requirement.
- Audio/haptic cues already exist (tap, select, slide, lock, flip, round win/loss/draw, tick, match win/loss, connection lost);
  mark in the spec where each one fires.

## 7. Deliverables

1. **Design principles** (5–7 bullets) and the information hierarchy for the Board.
2. **Design tokens**: colours, type scale (name a free font with full Vietnamese support), spacing, radii, elevation, motion durations/easings.
3. **Component library**: buttons (primary red, secondary blue, tertiary, icon, disabled, pressed), panels, title plaque, score plaque,
   timer badge (normal/urgent), card (face ×3, back, selected, locked, disabled, extra-card badge, small discard size), drop slot (empty/hover/filled),
   discard rail, round banner, dialog, toast, input field, toggle.
4. **High-fidelity mockups** for every screen and state in section 4, at 360 × 800 dp, plus the small-screen/large-font set from section 6.
5. **Flow diagram**: Home → (BOT: Draft → Board → Result → Draft…) and (Online: Rooms → Lobby → Draft → Board → Result → rematch/leave; Reconnecting from any online screen).
6. **Motion spec**: for each animation — trigger, duration, easing, reduced-motion fallback, sound/haptic cue.
7. **Asset list**: file name, size, 9-slice insets, which component uses it.
8. **Copy deck**: every string in Vietnamese and English.
9. For each of the problems named in section 4, one line stating how the new design solves it.

Ask before assuming anything that changes the game rules, timers, or number of players.
