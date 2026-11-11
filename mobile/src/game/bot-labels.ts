import type { TranslationKey } from '../i18n';
import type { BotPersonaId } from './bot-persona';

export const botNameKey: Record<BotPersonaId, TranslationKey> = { opener: 'botOpener', keeper: 'botKeeper', counter: 'botCounter', mimic: 'botMimic' };
export const botHintKey: Record<BotPersonaId, TranslationKey> = { opener: 'botHintOpener', keeper: 'botHintKeeper', counter: 'botHintCounter', mimic: 'botHintMimic' };
