/**
 * Export principal du système de localisation
 */

export { LocalizationProvider, useLocalization, useTranslation } from './useLocalization';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './config';
export type { SupportedLanguage, LanguageInfo, TranslationKeys, TranslationKey } from './types';