import { translations } from '../translations.all';
import { pickTranslationsByPrefixes } from '../utils';

export const navigationTranslations = pickTranslationsByPrefixes(translations, ['nav']);
