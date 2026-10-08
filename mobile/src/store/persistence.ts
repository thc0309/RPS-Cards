import type { Locale } from '../i18n';
import { resolveDeviceLocale } from '../i18n';
import { normalizeCosmeticId, type CosmeticId } from '../cosmetics/normalize';

export interface Preferences {
  readonly locale: Locale;
  readonly uiThemeId: CosmeticId;
  readonly cardSkinId: CosmeticId;
  readonly boardThemeId: CosmeticId;
  readonly soundEnabled: boolean;
  readonly vibrationEnabled: boolean;
}

export const PREFERENCE_KEYS = ['locale', 'uiThemeId', 'cardSkinId', 'boardThemeId', 'soundEnabled', 'vibrationEnabled'] as const;

export function defaultPreferences(deviceLanguage?: string | null): Preferences {
  return {
    locale: resolveDeviceLocale(deviceLanguage), uiThemeId: 'folk_default', cardSkinId: 'folk_default', boardThemeId: 'folk_default',
    soundEnabled: true, vibrationEnabled: false,
  };
}

export function normalizePreferences(value: unknown, deviceLanguage?: string | null): Preferences {
  const defaults = defaultPreferences(deviceLanguage);
  if (!value || typeof value !== 'object') return defaults;
  const candidate = value as Partial<Record<(typeof PREFERENCE_KEYS)[number], unknown>>;
  return {
    locale: candidate.locale === 'vi' || candidate.locale === 'en' ? candidate.locale : defaults.locale,
    uiThemeId: normalizeCosmeticId(candidate.uiThemeId),
    cardSkinId: normalizeCosmeticId(candidate.cardSkinId),
    boardThemeId: normalizeCosmeticId(candidate.boardThemeId),
    soundEnabled: typeof candidate.soundEnabled === 'boolean' ? candidate.soundEnabled : defaults.soundEnabled,
    vibrationEnabled: typeof candidate.vibrationEnabled === 'boolean' ? candidate.vibrationEnabled : defaults.vibrationEnabled,
  };
}

export function selectPersistedPreferences(state: Preferences & { readonly activeSessionId?: string | null }): Preferences {
  return {
    locale: state.locale,
    uiThemeId: state.uiThemeId,
    cardSkinId: state.cardSkinId,
    boardThemeId: state.boardThemeId,
    soundEnabled: state.soundEnabled,
    vibrationEnabled: state.vibrationEnabled,
  };
}
