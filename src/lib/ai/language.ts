export type SupportedLanguage = 'en' | 'pt' | 'fr';

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  pt: 'Portuguese',
  fr: 'French',
};

export function normalizeLanguage(language?: string | null): SupportedLanguage {
  if (language === 'pt' || language === 'fr') {
    return language;
  }

  return 'en';
}

export function toPromptLanguage(language?: string | null): string {
  const normalized = normalizeLanguage(language);
  return LANGUAGE_LABELS[normalized];
}
