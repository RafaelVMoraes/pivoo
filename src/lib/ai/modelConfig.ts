const CUSTOM_API_KEY_STORAGE_KEY = 'pivoo.customApiKey';

export const DEFAULT_AI_MODEL = 'gemma-3-27b-it';
export const CUSTOM_AI_MODEL = 'gemini-2.5-flash';

export function getStoredCustomApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(CUSTOM_API_KEY_STORAGE_KEY)?.trim() || '';
}

export function setStoredCustomApiKey(value: string): void {
  if (typeof window === 'undefined') return;

  const normalized = value.trim();
  if (!normalized) {
    localStorage.removeItem(CUSTOM_API_KEY_STORAGE_KEY);
    return;
  }

  localStorage.setItem(CUSTOM_API_KEY_STORAGE_KEY, normalized);
}

export function hasCustomApiKey(value?: string | null): boolean {
  return Boolean((value ?? '').trim());
}

export function resolveModelFromApiKey(value?: string | null): string {
  return hasCustomApiKey(value) ? CUSTOM_AI_MODEL : DEFAULT_AI_MODEL;
}
