import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/i18n/translations.all.ts');
const content = fs.readFileSync(filePath, 'utf8');

const entryRegex = /'([^']+)'\s*:\s*\{([\s\S]*?)\n\s*\},?/g;
const languageRegex = {
  en: /\ben\s*:\s*(['"`])([\s\S]*?)\1/m,
  pt: /\bpt\s*:\s*(['"`])([\s\S]*?)\1/m,
  fr: /\bfr\s*:\s*(['"`])([\s\S]*?)\1/m,
};

const missingByLanguage = { en: [], pt: [], fr: [] };

let match;
while ((match = entryRegex.exec(content)) !== null) {
  const key = match[1];
  const block = match[2];

  for (const language of Object.keys(languageRegex)) {
    const langMatch = block.match(languageRegex[language]);
    if (!langMatch || !langMatch[2].trim()) {
      missingByLanguage[language].push(key);
    }
  }
}

const hasMissing = Object.values(missingByLanguage).some((items) => items.length > 0);

if (hasMissing) {
  console.error('[i18n] Missing translation keys by language:');
  for (const [language, keys] of Object.entries(missingByLanguage)) {
    if (keys.length > 0) {
      console.error(`- ${language}: ${keys.join(', ')}`);
    }
  }
  process.exit(1);
}

console.log('[i18n] All translation keys contain en/pt/fr values.');
