import { dictionaries, resolveDeviceLocale, translate, type TranslationKey } from './index';

test('normalizes device locales to the supported vi/en pair', () => {
  expect(resolveDeviceLocale('vi-VN')).toBe('vi');
  expect(resolveDeviceLocale('en-US')).toBe('en');
  expect(resolveDeviceLocale('ja-JP')).toBe('en');
  expect(resolveDeviceLocale(null)).toBe('en');
});

test('keeps dictionaries in parity and translates every typed key', () => {
  const keys = Object.keys(dictionaries.en) as TranslationKey[];
  expect(Object.keys(dictionaries.vi).sort()).toEqual(keys.slice().sort());
  for (const key of keys) {
    expect(translate('en', key)).toBeTruthy();
    expect(translate('vi', key)).toBeTruthy();
  }
});
