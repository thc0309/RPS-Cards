import { folkAssets } from './folk-assets';

describe('folk assets', () => {
  it('exposes only the mounted folk_default layers', () => {
    expect(folkAssets.backgrounds.village).toBeDefined();
    expect(folkAssets.backgrounds.woven).toBeDefined();
    expect(folkAssets.controls.logo).toBeDefined();
    expect(folkAssets.icons.bot).toBeDefined();
    expect(Object.keys(folkAssets.controls)).toEqual(['logo', 'redButton', 'blueButton', 'redPlaque', 'bluePlaque', 'inputFrame', 'paperPanel']);
  });
});
