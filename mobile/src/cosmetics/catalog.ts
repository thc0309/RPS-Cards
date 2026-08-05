export type CosmeticId = 'folk_default';

export interface CosmeticLoadout {
  readonly id: CosmeticId;
  readonly labelKey: 'defaultTheme';
  readonly surface: string;
  readonly accent: string;
}

export const FOLK_DEFAULT: CosmeticLoadout = {
  id: 'folk_default',
  labelKey: 'defaultTheme',
  surface: '#F5E7C5',
  accent: '#A63D2F',
};

export const cosmeticCatalog = { folk_default: FOLK_DEFAULT } as const;
