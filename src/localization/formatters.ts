/**
 * Utilitaires de formatage localisé pour dates et nombres
 * Utilise la langue courante du système i18n
 */

import { SupportedLanguage } from "./types";

/**
 * Mapping des codes de langue vers les locales Intl complètes
 */
export const LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-PT",
  it: "it-IT",
  zh: "zh-CN",
  hi: "hi-IN",
};

/**
 * Obtient la locale Intl pour une langue donnée
 */
export function getLocale(language: SupportedLanguage): string {
  return LOCALE_MAP[language] || "en-US";
}

/**
 * Formate une date selon la langue courante
 */
export function formatDate(
  date: Date | string | number,
  language: SupportedLanguage,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return dateObj.toLocaleDateString(
    getLocale(language),
    options || defaultOptions,
  );
}

/**
 * Formate une date courte (ex: 02/01/2026)
 */
export function formatDateShort(
  date: Date | string | number,
  language: SupportedLanguage,
): string {
  return formatDate(date, language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Maps JS Date.getDay() (0=Sunday) to translation keys
 */
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * Maps JS Date.getMonth() (0=January) to translation keys
 */
const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

/**
 * Formate une date avec jour de la semaine.
 * Utilise les traductions (calendar.daysLong / calendar.months) au lieu de Intl
 * pour garantir le fonctionnement sur Hermes (Android).
 */
export function formatDateWithDay(
  date: Date | string | number,
  language: SupportedLanguage,
  t?: (key: string, params?: Record<string, string | number>) => string,
): string {
  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  if (t) {
    const dayKey = DAY_KEYS[dateObj.getDay()];
    const monthKey = MONTH_KEYS[dateObj.getMonth()];
    const dayName = t(`calendar.daysLong.${dayKey}`);
    const monthName = t(`calendar.months.${monthKey}`);
    const dayNum = dateObj.getDate();
    const year = dateObj.getFullYear();

    return t("home.today.dateFormat", {
      day: dayName,
      date: dayNum,
      month: monthName,
      year,
    });
  }

  // Fallback Intl (desktop / web)
  return formatDate(date, language, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formate une heure selon la langue courante
 */
export function formatTime(
  date: Date | string | number,
  language: SupportedLanguage,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  return dateObj.toLocaleTimeString(
    getLocale(language),
    options || defaultOptions,
  );
}

/**
 * Formate une date et heure complète
 */
export function formatDateTime(
  date: Date | string | number,
  language: SupportedLanguage,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return dateObj.toLocaleString(getLocale(language), options || defaultOptions);
}

/**
 * Formate un nombre selon la langue courante
 */
export function formatNumber(
  value: number,
  language: SupportedLanguage,
  options?: Intl.NumberFormatOptions,
): string {
  return value.toLocaleString(getLocale(language), options);
}

/**
 * Formate une devise (montant en centimes → affichage)
 */
export function formatCurrency(
  amountInCents: number,
  language: SupportedLanguage,
  currency: string = "EUR",
): string {
  return (amountInCents / 100).toLocaleString(getLocale(language), {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formate un montant simple (sans symbole devise, mais avec séparateurs locaux)
 */
export function formatAmount(
  amountInCents: number,
  language: SupportedLanguage,
): string {
  return (amountInCents / 100).toLocaleString(getLocale(language), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
