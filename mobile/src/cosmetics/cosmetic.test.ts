import { normalizeCosmeticId, resolveCosmetic } from './normalize';

test('falls back unknown cosmetics to folk_default', () => {
  expect(normalizeCosmeticId('future_shop_item')).toBe('folk_default');
  expect(resolveCosmetic(undefined).id).toBe('folk_default');
});
