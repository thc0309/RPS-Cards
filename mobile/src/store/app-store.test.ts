import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from './app-store';
import { defaultPreferences } from './persistence';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { values.set(key, value); }),
    removeItem: jest.fn(async (key: string) => { values.delete(key); }),
    clear: jest.fn(async () => { values.clear(); }),
  };
});
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'vi' }] }));

const storageKey = 'rps-cards-preferences';

beforeEach(async () => {
  useAppStore.setState({
    ...defaultPreferences('vi'), activeSessionId: null, activeRoomCode: null, activeSeat: null,
    hasHydrated: false,
  });
  await AsyncStorage.clear();
});

test('sound and vibration setters persist then hydrate without disturbing locale or session', async () => {
  const state = useAppStore.getState();
  state.setLocale('en');
  state.setActiveSession('session-secret');
  state.setActiveRoom('ABCDE', 'PLAYER_B');
  state.setSoundEnabled(false);
  state.setVibrationEnabled(true);

  const expected = { ...defaultPreferences('en'), soundEnabled: false, vibrationEnabled: true };
  expect(useAppStore.getState()).toMatchObject({
    ...expected, activeSessionId: 'session-secret', activeRoomCode: 'ABCDE', activeSeat: 'PLAYER_B',
  });
  const saved = await AsyncStorage.getItem(storageKey);
  expect(JSON.parse(saved!)).toEqual({ state: expected, version: 0 });

  useAppStore.setState(defaultPreferences('vi'));
  await AsyncStorage.setItem(storageKey, saved!);
  await useAppStore.persist.rehydrate();
  expect(useAppStore.getState()).toMatchObject({
    ...expected, activeSessionId: 'session-secret', activeRoomCode: 'ABCDE', activeSeat: 'PLAYER_B', hasHydrated: true,
  });
});

test('old or malformed saved feedback defaults without restoring private session data', async () => {
  useAppStore.getState().setActiveSession('live-session');
  useAppStore.getState().setActiveRoom('FGHIJ', 'PLAYER_A');
  for (const feedback of [{}, { soundEnabled: 'false', vibrationEnabled: 1 }]) {
    await AsyncStorage.setItem(storageKey, JSON.stringify({
      state: { locale: 'en', ...feedback, activeSessionId: 'saved-secret', activeRoomCode: 'OLDXX', activeSeat: 'PLAYER_B', hand: ['private'] }, version: 0,
    }));
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState()).toMatchObject({
      locale: 'en', soundEnabled: true, vibrationEnabled: false,
      uiThemeId: 'folk_default', cardSkinId: 'folk_default', boardThemeId: 'folk_default',
      activeSessionId: 'live-session', activeRoomCode: 'FGHIJ', activeSeat: 'PLAYER_A', hasHydrated: true,
    });
    expect(useAppStore.getState()).not.toHaveProperty('hand');
  }
});
