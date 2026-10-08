import { defaultPreferences, normalizePreferences, selectPersistedPreferences } from './persistence';

test('normalizes corrupt preferences without dropping the active session contract', () => {
  expect(normalizePreferences({ locale: 'fr', uiThemeId: 'missing' }, 'vi-VN')).toEqual({
    locale: 'vi', uiThemeId: 'folk_default', cardSkinId: 'folk_default', boardThemeId: 'folk_default',
    soundEnabled: true, vibrationEnabled: false,
  });
  expect(normalizePreferences(null, 'ja-JP')).toEqual(defaultPreferences('ja-JP'));
  expect(selectPersistedPreferences({ ...defaultPreferences(), activeSessionId: 'session-secret' })).toEqual(defaultPreferences());
});

test('defaults to sound on and vibration off when old preferences omit them', () => {
  expect(defaultPreferences('vi')).toMatchObject({ soundEnabled: true, vibrationEnabled: false });
  expect(normalizePreferences({ locale: 'en', uiThemeId: 'folk_default' }, 'vi')).toEqual({
    ...defaultPreferences('vi'), locale: 'en',
  });
});

test('only accepts boolean sound and vibration preferences', () => {
  for (const value of [null, 'false', 'true', 0, 1, [], {}]) {
    expect(normalizePreferences({ soundEnabled: value, vibrationEnabled: value }, 'vi')).toMatchObject({
      soundEnabled: true, vibrationEnabled: false,
    });
  }
  expect(normalizePreferences({ soundEnabled: false, vibrationEnabled: true })).toMatchObject({
    soundEnabled: false, vibrationEnabled: true,
  });
});

test('round-trips feedback preferences without persisting session secrets', () => {
  const preferences = { ...defaultPreferences('vi'), soundEnabled: false, vibrationEnabled: true };
  const saved = selectPersistedPreferences({ ...preferences, activeSessionId: 'session-secret' });
  expect(saved).toEqual(preferences);
  expect(normalizePreferences(JSON.parse(JSON.stringify(saved)))).toEqual(preferences);
});
