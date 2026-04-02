import { useEffect, useState } from 'react';
import { useProfile } from './useProfile';
import { getTranslation, type SupportedLanguage } from '@/i18n';

export const useTranslation = () => {
  const { profile } = useProfile();
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  const normalizeLanguage = (lang?: string): SupportedLanguage => {
    if (!lang) return 'en';

    const normalized = lang.toLowerCase();
    if (normalized.startsWith('pt')) return 'pt';
    if (normalized.startsWith('fr')) return 'fr';
    return 'en';
  };

  useEffect(() => {
    if (profile?.language) {
      setLanguage(normalizeLanguage(profile.language));
    }
  }, [profile?.language]);

  const t = (key: string, params?: Record<string, string | number>): string =>
    getTranslation({ key, language, params });

  return {
    t,
    language,
    setLanguage: (lang: SupportedLanguage) => setLanguage(lang),
  };
};
