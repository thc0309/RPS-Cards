import { normalizeCosmeticId, type CosmeticId } from '../cosmetics/normalize';

export interface BoardZone {
  readonly side: 'UPPER' | 'LOWER';
  readonly owner: 'OPPONENT' | 'LOCAL';
  readonly boardThemeId: CosmeticId;
  readonly mirroredGeometry: true;
}

export function resolveBoardZones(localThemeId: unknown, opponentThemeId: unknown): readonly [BoardZone, BoardZone] {
  return [
    { side: 'UPPER', owner: 'OPPONENT', boardThemeId: normalizeCosmeticId(opponentThemeId), mirroredGeometry: true },
    { side: 'LOWER', owner: 'LOCAL', boardThemeId: normalizeCosmeticId(localThemeId), mirroredGeometry: true },
  ];
}
