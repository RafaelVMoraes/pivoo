import type { SupportedLanguage, TranslationDictionary } from './types';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'pt', 'fr'];

export const pickTranslationsByPrefixes = (
  source: TranslationDictionary,
  prefixes: string[],
): TranslationDictionary => {
  const normalizedPrefixes = prefixes.map((prefix) =>
    prefix.endsWith('.') ? prefix : `${prefix}.`,
  );

  return Object.fromEntries(
    Object.entries(source).filter(([key]) =>
      normalizedPrefixes.some((prefix) => key.startsWith(prefix)),
    ),
  );
};

export const validateTranslationMap = (translations: TranslationDictionary) => {
  const missingByLanguage: Record<SupportedLanguage, string[]> = {
    en: [],
    pt: [],
    fr: [],
  };

  Object.entries(translations).forEach(([key, entry]) => {
    SUPPORTED_LANGUAGES.forEach((language) => {
      if (!entry[language]?.trim()) {
        missingByLanguage[language].push(key);
      }
    });
  });

  return {
    isValid: Object.values(missingByLanguage).every((items) => items.length === 0),
    missingByLanguage,
  };
};
