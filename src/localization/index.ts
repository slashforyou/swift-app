/**
 * Export principal du système de localisation
 */

export { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './config';
export {
    LOCALE_MAP, formatAmount, formatCurrency, formatDate,
    formatDateShort, formatDateTime, formatDateWithDay, formatNumber, formatTime, getLocale
} from './formatters';
export type { LanguageInfo, SupportedLanguage, TranslationKey, TranslationKeys } from './types';
export { LocalizationProvider, useLocalization, useTranslation } from './useLocalization';
