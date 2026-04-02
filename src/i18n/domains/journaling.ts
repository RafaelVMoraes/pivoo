import { translations } from '../translations.all';
import { pickTranslationsByPrefixes } from '../utils';

export const journalingTranslations = pickTranslationsByPrefixes(translations, [
  'reflection',
  'kpi',
  'motivation',
]);
