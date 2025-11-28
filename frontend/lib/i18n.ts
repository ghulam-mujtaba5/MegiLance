// @AI-HINT: Internationalization (i18n) configuration for multi-language support
// Supports dynamic language loading and RTL layouts

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ar' | 'ja' | 'pt';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
  dateFormat: string;
  currencyFormat: Intl.NumberFormatOptions;
}

export const SUPPORTED_LOCALES: Record<Locale, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
    dateFormat: 'MM/DD/YYYY',
    currencyFormat: { style: 'currency', currency: 'USD' },
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    flag: '🇪🇸',
    dateFormat: 'DD/MM/YYYY',
    currencyFormat: { style: 'currency', currency: 'EUR' },
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    flag: '🇫🇷',
    dateFormat: 'DD/MM/YYYY',
    currencyFormat: { style: 'currency', currency: 'EUR' },
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    flag: '🇩🇪',
    dateFormat: 'DD.MM.YYYY',
    currencyFormat: { style: 'currency', currency: 'EUR' },
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    flag: '🇨🇳',
    dateFormat: 'YYYY/MM/DD',
    currencyFormat: { style: 'currency', currency: 'CNY' },
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦',
    dateFormat: 'DD/MM/YYYY',
    currencyFormat: { style: 'currency', currency: 'SAR' },
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    flag: '🇯🇵',
    dateFormat: 'YYYY/MM/DD',
    currencyFormat: { style: 'currency', currency: 'JPY' },
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    flag: '🇧🇷',
    dateFormat: 'DD/MM/YYYY',
    currencyFormat: { style: 'currency', currency: 'BRL' },
  },
};

export const DEFAULT_LOCALE: Locale = 'en';

// Translation dictionary type
export type TranslationDict = {
  [key: string]: string | TranslationDict;
};

// Translation cache
const translationCache = new Map<Locale, TranslationDict>();

/**
 * Load translations for a locale
 */
export async function loadTranslations(locale: Locale): Promise<TranslationDict> {
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!;
  }

  try {
    // Dynamic import of translation files
    const translations = await import(`@/locales/${locale}.json`);
    translationCache.set(locale, translations.default);
    return translations.default;
  } catch (error) {
    console.warn(`Failed to load translations for ${locale}, falling back to ${DEFAULT_LOCALE}`);
    if (locale !== DEFAULT_LOCALE) {
      return loadTranslations(DEFAULT_LOCALE);
    }
    return {};
  }
}

/**
 * Get nested translation value
 */
export function getTranslation(
  translations: TranslationDict,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace parameters
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
      return params[paramKey]?.toString() ?? `{{${paramKey}}}`;
    });
  }

  return value;
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Format currency according to locale
 */
export function formatCurrency(amount: number, locale: Locale, currency?: string): string {
  const config = SUPPORTED_LOCALES[locale];
  const options = { ...config.currencyFormat };
  if (currency) {
    options.currency = currency;
  }
  return new Intl.NumberFormat(locale, options).format(amount);
}

/**
 * Format number according to locale
 */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date, locale: Locale): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffDays > 0) {
    return rtf.format(-diffDays, 'day');
  } else if (diffHours > 0) {
    return rtf.format(-diffHours, 'hour');
  } else if (diffMins > 0) {
    return rtf.format(-diffMins, 'minute');
  } else {
    return rtf.format(-diffSecs, 'second');
  }
}

/**
 * Detect user's preferred locale
 */
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  // Check localStorage first
  const stored = localStorage.getItem('megilance-locale') as Locale;
  if (stored && SUPPORTED_LOCALES[stored]) {
    return stored;
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0] as Locale;
  if (SUPPORTED_LOCALES[browserLang]) {
    return browserLang;
  }

  return DEFAULT_LOCALE;
}

/**
 * Save locale preference
 */
export function saveLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('megilance-locale', locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = SUPPORTED_LOCALES[locale].direction;
  }
}
