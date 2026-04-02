import { translations } from '../translations.all';
import { pickTranslationsByPrefixes } from '../utils';

export const goalsTranslations = pickTranslationsByPrefixes(translations, [
  'goals',
  'goal',
  'addGoalDialog',
  'editGoalDialog',
  'goalDetailsDialog',
  'goalFilters',
  'statusTabs',
  'category',
]);
