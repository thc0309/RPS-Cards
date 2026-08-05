# RPS Cards UI Assets

34 PNG assets extracted as reusable layers from the UI direction in `docs/ui`.

## Folders

- `backgrounds/` — 3 opaque scene and texture backgrounds.
- `cards/` — 5 transparent card frames and hand symbols.
- `controls/` — 13 transparent buttons, panels, plaques, scores, logo, timer, and VS badge.
- `decorations/` — 7 transparent Vietnamese village and festival illustrations.
- `icons/` — 6 transparent navigation and action icons.

## Usage

- Render labels, room codes, scores, countdowns, and player names as native text over the textless assets.
- Stretch wide controls with cap insets or a nine-slice technique; do not scale them non-uniformly without protected corners.
- The online status dot is intentionally native UI (`View`/CSS circle), so it does not need a bitmap asset.
- Source mockups: `docs/ui/01-home.png` through `docs/ui/07-result.png`.

## Generation

Generated with built-in ImageGen using the mockups as style references. Isolated assets were rendered on a flat `#ff00ff` chroma background, then converted to RGBA with a soft matte and despill pass.
