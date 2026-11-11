import { normalizeCosmeticId, type CosmeticId } from '../cosmetics/normalize';

export function getBoardBackdropLayout(height: number, arenaCenterY: number) {
  // The woven artwork's medallion is centered in the source image.
  const offset = arenaCenterY - height / 2;
  const extension = Math.abs(offset);
  return { height: height + extension * 2, top: offset - extension };
}

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
