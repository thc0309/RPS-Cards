import { FOLK_DEFAULT, type CosmeticId, type CosmeticLoadout } from './catalog';

export type { CosmeticId } from './catalog';

export function normalizeCosmeticId(value: unknown): CosmeticId {
  return value === 'folk_default' ? 'folk_default' : FOLK_DEFAULT.id;
}

export function resolveCosmetic(value: unknown): CosmeticLoadout {
  void value;
  return FOLK_DEFAULT;
}
