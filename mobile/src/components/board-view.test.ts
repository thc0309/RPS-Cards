import { getBoardBackdropLayout, resolveBoardZones } from './board-view';

test.each([[832, 400], [568, 238], [874, 451], [800, 400]])('centers the woven artwork on the arena and covers the entire %s dp surface', (height, centerY) => {
  const backdrop = getBoardBackdropLayout(height, centerY);
  expect(backdrop.top + backdrop.height / 2).toBeCloseTo(centerY);
  expect(backdrop.top).toBeLessThanOrEqual(0);
  expect(backdrop.top + backdrop.height).toBeGreaterThanOrEqual(height);
});

test('keeps upper/lower board halves mirrored with per-player themes', () => {
  expect(resolveBoardZones('future-theme', 'folk_default')).toEqual([
    { side: 'UPPER', owner: 'OPPONENT', boardThemeId: 'folk_default', mirroredGeometry: true },
    { side: 'LOWER', owner: 'LOCAL', boardThemeId: 'folk_default', mirroredGeometry: true },
  ]);
});
