import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocales } from 'expo-localization';
import { defaultPreferences, normalizePreferences, selectPersistedPreferences, type Preferences } from './persistence';

interface AppState extends Preferences {
  readonly activeSessionId: string | null;
  readonly activeRoomCode: string | null;
  readonly activeSeat: 'PLAYER_A' | 'PLAYER_B' | null;
  readonly hasHydrated: boolean;
  setLocale: (locale: Preferences['locale']) => void;
  setCosmetic: (kind: 'uiThemeId' | 'cardSkinId' | 'boardThemeId', id: Preferences['uiThemeId']) => void;
  setActiveSession: (sessionId: string | null) => void;
  setActiveRoom: (roomCode: string | null, seat?: 'PLAYER_A' | 'PLAYER_B' | null) => void;
  setHydrated: () => void;
}

const deviceLanguage = getLocales()[0]?.languageCode;
const appStateCreator: StateCreator<AppState> = (set) => ({
  ...defaultPreferences(deviceLanguage),
  activeSessionId: null,
  activeRoomCode: null,
  activeSeat: null,
  hasHydrated: false,
  setLocale: (locale: Preferences['locale']) => set({ locale }),
  setCosmetic: (kind: 'uiThemeId' | 'cardSkinId' | 'boardThemeId', id: Preferences['uiThemeId']) => set({ [kind]: id }),
  setActiveSession: (activeSessionId: string | null) => set({ activeSessionId }),
  setActiveRoom: (activeRoomCode: string | null, activeSeat: 'PLAYER_A' | 'PLAYER_B' | null = null) => set({ activeRoomCode, activeSeat }),
  setHydrated: () => set({ hasHydrated: true }),
});

export const useAppStore = create<AppState>()(persist(appStateCreator, {
  name: 'rps-cards-preferences',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state): Preferences => selectPersistedPreferences(state),
  merge: (persisted, current) => ({ ...current, ...normalizePreferences(persisted, deviceLanguage) }),
  onRehydrateStorage: () => (state) => state?.setHydrated(),
}));
