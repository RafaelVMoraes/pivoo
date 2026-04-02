import { translations } from '../translations.all';
import { pickTranslationsByPrefixes } from '../utils';

export const dashboardTranslations = pickTranslationsByPrefixes(translations, ['dashboard']);
