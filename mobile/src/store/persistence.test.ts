import { defaultPreferences, normalizePreferences, selectPersistedPreferences } from './persistence';

test('normalizes corrupt preferences without dropping the active session contract', () => {
  expect(normalizePreferences({ locale: 'fr', uiThemeId: 'missing' }, 'vi-VN')).toEqual({
    locale: 'vi', uiThemeId: 'folk_default', cardSkinId: 'folk_default', boardThemeId: 'folk_default',
  });
  expect(normalizePreferences(null, 'ja-JP')).toEqual(defaultPreferences('ja-JP'));
  expect(selectPersistedPreferences({ ...defaultPreferences(), activeSessionId: 'session-secret' })).toEqual(defaultPreferences());
});
