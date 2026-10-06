# Cute card artwork — 2026-10-05

Generated with built-in `image_gen`; PNG RGBA with true transparency. Five existing source and runtime assets replaced in place; all app imports and native localized labels retained.

Runtime folder: `mobile/src/assets/folk_default/cards/`. Source folder: `docs/assets/cards/`. Originals remain in Git history and generation outputs remain under Codex generated_images.

## Initial prompts (before facial features were removed)

### rock-fist.png

Use case: style-transfer. Asset type: transparent isolated game-card symbol for a Vietnamese rock-paper-scissors mobile game. Edit target: the attached existing ROCK fist illustration. Redraw this exact symbol into a very cute polished kawaii storybook game icon. One single chunky closed hand/fist, recognizable silhouette, four rounded folded knuckles and thumb folded across the front. Put two small dark cocoa oval eyes, a little happy curved mouth and peach blush on the front of the fist. Warm pale apricot hand, buttery soft highlights, thick clean dark cocoa outline, simple 2D rounded shapes with minimal gentle shading. Cheerful premium casual-game sticker illustration that harmonizes with Vietnamese folk art, no realistic wrinkles, no gritty texture. Center the isolated fist, upright front three-quarter view, generous but even 8 percent transparent margin; fill about 84 percent of a square canvas. Bold silhouette legible at 48 pixels. No wrist cuff, no extra limbs, no objects, no text, no letters, no card frame, no background, no floor shadow, no watermark. Actual fully transparent background; preserve alpha. Generate only this one icon.

### paper-hand.png

Use case: style-transfer. Asset type: transparent isolated PAPER hand symbol for a rock-paper-scissors card. Image 1 is the old target; image 2 is the approved cute fist style reference. Completely redraw the old open palm as one cute rounded upright open hand with exactly five fingers: thumb spreading left, four rounded fingers pointing up, a short broad wrist. Warm pale apricot skin exactly like the cute fist reference, smiling face and blush centered on the palm. Keep the characteristic open palm silhouette immediately recognizable at 48 pixels. Center upright, fill 84 percent of a square canvas with even transparent margins. Do not add card, frame, cuff, extra hands or props. Match reference image 2 (cute fist) in thick clean dark cocoa outlines, very rounded soft shapes, subtle smooth buttery highlights and gentle shading, tiny dark cocoa oval eyes with white catchlights, small joyful smile and peach-pink blush. Premium kawaii casual game artwork harmonizing with Vietnamese folk art. No gritty texture, no realism, no text, letters, logos, watermark. Actual transparent background.

### scissors.png

Use case: style-transfer. Asset type: transparent isolated SCISSORS symbol for a rock-paper-scissors card. Image 1 is the old target; image 2 is the approved cute fist style reference. Redraw one very cute toy-like pair of open scissors: two distinct rounded light ivory/silver blades opening upward in a clear V, two chunky pastel coral-pink circular handle loops at the bottom with genuinely transparent holes, small warm gold pivot, cocoa eyes and happy smile on the broad central area between pivot and handles, peach blush. Upright symmetrical frontal view, friendly rounded blade tips, no sharp realistic weapon look. Center and fill about 84 percent of a square canvas. Bold unmistakeable scissors silhouette legible at 48 pixels. No fingers, no person, no arms or legs, no card or frame. Match reference image 2 (cute fist) in thick clean dark cocoa outlines, very rounded soft shapes, subtle smooth buttery highlights and gentle shading, tiny dark cocoa oval eyes with white catchlights, small joyful smile and peach-pink blush. Premium kawaii casual game artwork harmonizing with Vietnamese folk art. No gritty texture, no realism, no text, letters, logos, watermark. Actual transparent background.

### card-frame.png

Use case: style-transfer. Asset type: textless reusable FRONT card background/frame for a cute Vietnamese rock-paper-scissors mobile game. Image 1 is the old card frame target; image 2 is the approved cute fist style reference. Redraw only the empty frame, no mascot and no game symbols. Single straight-on portrait rounded rectangle with 2:3 card aspect ratio; the card reaches nearly the full canvas, about 2 percent transparent padding outside the rounded edges. Soft creamy butter-yellow interior opaque blank center for overlaying icon and native text. Thick warm cocoa outer outline, softly rounded cream-gold double border, small restrained pastel coral and jade leaf/lotus motifs only in the four corners, reflecting Vietnamese folk ornament in cute simplified rounded forms. Keep the central 70 percent blank and lower center blank for a native localized label. Smooth clean flat 2D casual-game illustration with subtle highlights, no dense pattern, no visible paper grain, no shading outside the card. All pixels outside the card transparent. No letters, no words, no hands, no eyes or face, no full scene. Match reference image 2 (cute fist) in thick clean dark cocoa outlines, very rounded soft shapes, subtle smooth buttery highlights and gentle shading, tiny dark cocoa oval eyes with white catchlights, small joyful smile and peach-pink blush. Premium kawaii casual game artwork harmonizing with Vietnamese folk art. No gritty texture, no realism, no text, letters, logos, watermark. Actual transparent background.

### card-back.png

Use case: style-transfer. Asset type: one universal textless BACK of a card for a cute Vietnamese rock-paper-scissors mobile game. Image 1 is the old card-back target; image 2 is the approved cute fist style reference. Redraw as a straight-on portrait rounded rectangle, 2:3 aspect ratio, nearly fills canvas with only 2 percent transparent padding outside edges. Rounded cream-gold border with warm cocoa outline; soft terracotta/coral red interior with simplified very subtle Vietnamese folk leaf pattern. Large centered cream and pale pink lotus rosette with softly rounded petals and two tiny cocoa eyes and joyful little smile in its circular center, cute and welcoming; jade leaf accents and simple warm gold corner curls. Balanced symmetrical ornament, legible at 43x64 pixels. This is the SAME back for every card: absolutely NO rock/fist, open hand, scissors, type labels or hints, no letters or numbers. Opaque card interior, actual transparency only outside rounded card outline. Smooth polished 2D style matching the cute fist reference, no texture noise, no external shadow. Match reference image 2 (cute fist) in thick clean dark cocoa outlines, very rounded soft shapes, subtle smooth buttery highlights and gentle shading, tiny dark cocoa oval eyes with white catchlights, small joyful smile and peach-pink blush. Premium kawaii casual game artwork harmonizing with Vietnamese folk art. No gritty texture, no realism, no text, letters, logos, watermark. Actual transparent background.

## Verification

All images inspected; hand symbols have distinct closed/open silhouettes; scissors have rounded blades and two handle holes; back is one universal pattern with no card-kind hints.
Symbols: 1254 x 1254. Frame/back: 1024 x 1536 (2:3). All five PNGs have alpha and alpha=0 at the top-left corner. No raster postprocessing or chroma-key conversion used.

Focused card UI and asset tests passed after replacement: 3 suites / 8 tests (`folk-assets.test.ts`, `FolkGameViews.test.tsx`, `board-view.test.ts`). No native-device validation performed.

## Final edit: remove facial features — 2026-10-05

Edited with built-in `image_gen`, using each refreshed PNG as its edit target. Four files updated in both source and mobile runtime folders; `card-frame.png` already had no face and was retained.

### rock-fist.png

Use case: precise-object-edit. Input image: sole edit target, existing game-card artwork. Remove only both cartoon eyes, the smiling mouth and both pink cheek blush patches from the lower front of the apricot closed fist. Seamlessly restore the pale apricot hand surface and soft shading beneath them. Preserve the exact fist silhouette, fingers, thumb, fingernail, highlights, thick cocoa outline, short wrist, scale, position and square aspect ratio. Change only the facial features. Keep the cute rounded illustrated style and colors. No eyes, mouth, cheeks, face, facial expression, new ornament, text, watermark or extra object. Preserve actual alpha transparency in all background pixels outside the object/card; no opaque backdrop or external shadow.

### paper-hand.png

Use case: precise-object-edit. Input image: sole edit target, existing game-card artwork. Remove only both cartoon eyes, the smiling mouth and both pink cheek blush patches from the open palm. Seamlessly restore the pale apricot palm surface and soft shading beneath them. Preserve the five fingers, thumb, hand creases, highlights, thick cocoa outline, short wrist, scale, position and square aspect ratio. Change only the facial features. Keep the cute rounded illustrated style and colors. No eyes, mouth, cheeks, face, facial expression, new ornament, text, watermark or extra object. Preserve actual alpha transparency in all background pixels outside the object/card; no opaque backdrop or external shadow.

### scissors.png

Use case: precise-object-edit. Input image: sole edit target, existing game-card artwork. Remove only both cartoon eyes, the smiling mouth and both pink cheek blush patches from the scissors below the gold pivot. Seamlessly restore the pale peach-pink surface and shading beneath them. Preserve the ivory rounded blades, gold pivot, two coral-pink handle loops and their transparent holes, highlights, thick cocoa outlines, scale, position and square aspect ratio. Change only the facial features. Keep the cute rounded illustrated style and colors. No eyes, mouth, cheeks, face, facial expression, new ornament, text, watermark or extra object. Preserve actual alpha transparency in all background pixels outside the object/card; no opaque backdrop or external shadow.

### card-back.png

Use case: precise-object-edit. Input image: sole edit target, existing game-card artwork. Remove only both cartoon eyes, the smiling mouth and both pink cheek blush patches from the circular cream center of the lotus flower. Seamlessly restore a plain cream-gold circle with its soft shading and highlight. Preserve the exact lotus petals, leaves, ornaments, coral-red pattern, cream-gold border, cocoa outlines, rounded corners, scale, position and 2:3 portrait aspect ratio. Change only the facial features. Keep the cute rounded illustrated style and colors. No eyes, mouth, cheeks, face, facial expression, new ornament, text, watermark or extra object. Preserve actual alpha transparency in all background pixels outside the object/card; no opaque backdrop or external shadow.

All four outputs visually inspected: no eyes, mouth or cheek blush. Symbol sizes remain 1254 x 1254; back remains 1024 x 1536. Alpha and transparent top-left pixels verified; source/runtime copies match.
