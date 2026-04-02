export type SupportedLanguage = 'en' | 'pt' | 'fr';

export type TranslationEntry = Record<SupportedLanguage, string>;

export type TranslationDictionary = Record<string, TranslationEntry>;
