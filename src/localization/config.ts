import { SupportedLanguage, LanguageInfo } from "./types";

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇵🇹",
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
  },
  it: {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
  },
  zh: {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
  },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
