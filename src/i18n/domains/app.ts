import { translations } from '../translations.all';
import { pickTranslationsByPrefixes } from '../utils';

export const appTranslations = pickTranslationsByPrefixes(translations, [
  'chatbot',
  'checkin',
  'selfDiscovery',
  'intro',
  'profile',
  'settings',
  'history',
  'privacy',
  'tasks',
  'activity',
  'frequency',
  'common',
  'language',
]);
