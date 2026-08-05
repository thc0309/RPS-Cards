import { I18n } from 'i18n-js';
import { en } from './en';
import { vi } from './vi';

export type Locale = 'en' | 'vi';
export type Dictionary = { readonly [Key in keyof typeof en]: string };
export type TranslationKey = keyof Dictionary;

export const dictionaries: Record<Locale, Dictionary> = { en, vi };

export function resolveDeviceLocale(languageCode?: string | null): Locale {
  return languageCode?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

const i18n = new I18n(dictionaries);
i18n.enableFallback = true;

export function translate(locale: Locale, key: TranslationKey): string {
  i18n.locale = locale;
  return i18n.t(key);
}
