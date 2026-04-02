import { translations } from '../translations.all';
import { pickTranslationsByPrefixes } from '../utils';

export const authTranslations = pickTranslationsByPrefixes(translations, ['auth']);
