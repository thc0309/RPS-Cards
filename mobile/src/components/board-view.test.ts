import { resolveBoardZones } from './board-view';

test('keeps upper/lower board halves mirrored with per-player themes', () => {
  expect(resolveBoardZones('future-theme', 'folk_default')).toEqual([
    { side: 'UPPER', owner: 'OPPONENT', boardThemeId: 'folk_default', mirroredGeometry: true },
    { side: 'LOWER', owner: 'LOCAL', boardThemeId: 'folk_default', mirroredGeometry: true },
  ]);
});
