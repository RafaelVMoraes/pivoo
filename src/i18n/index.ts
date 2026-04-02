import { appTranslations } from './domains/app';
import { authTranslations } from './domains/auth';
import { dashboardTranslations } from './domains/dashboard';
import { goalsTranslations } from './domains/goals';
import { journalingTranslations } from './domains/journaling';
import { miscTranslations } from './domains/misc';
import { navigationTranslations } from './domains/navigation';
import type { SupportedLanguage, TranslationDictionary } from './types';
import { validateTranslationMap } from './utils';

const namespaces: TranslationDictionary[] = [
  navigationTranslations,
  authTranslations,
  dashboardTranslations,
  goalsTranslations,
  journalingTranslations,
  appTranslations,
  miscTranslations,
];

export const translationMap: TranslationDictionary = Object.assign({}, ...namespaces);

const translationValidation = validateTranslationMap(translationMap);

const translationAliases: Record<string, string> = {
  'goal.statusOnhold': 'goal.status.on_hold',
  'goal.statusInprogress': 'goal.status.in_progress',
  'goal.delete.confirmation': 'goal.confirmDelete',
  'goal.keepItUp': 'goal.streak.keepItUp',
  'goal.startToday': 'goal.streak.startToday',
};

if (import.meta.env.DEV && !translationValidation.isValid) {
  console.warn('[i18n] Missing translation keys found', translationValidation.missingByLanguage);
}

export const getTranslation = ({
  key,
  language,
  params,
}: {
  key: string;
  language: SupportedLanguage;
  params?: Record<string, string | number>;
}) => {
  const resolvedKey = translationAliases[key] ?? key;
  const translation = translationMap[resolvedKey];

  if (!translation) {
    console.warn(`[i18n] Translation missing for key: ${key}`);
    return key;
  }

  let result = translation[language] || translation.en;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      const value = String(paramValue);
      result = result
        .replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), value)
        .replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value);
    });
  }

  return result;
};

export { translationValidation };
export type { SupportedLanguage, TranslationDictionary };
