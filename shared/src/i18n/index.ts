/**
 * Shared i18n contract — platform neutral.
 *
 * Web uses strings.ts directly. React Native will use this interface.
 * RTL support: set `writingDirection: 'rtl'` in React Native styles
 * when locale is 'ar'. The web frontend sets `dir="rtl"` on the root element.
 */

export type Locale = 'en' | 'ar' | 'ur' | 'fr' | 'ms' | 'id'

export interface LocaleConfig {
  locale: Locale
  dir: 'ltr' | 'rtl'
  label: string
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { locale: 'en', dir: 'ltr', label: 'English' },
  { locale: 'ar', dir: 'rtl', label: 'العربية' },
  { locale: 'ur', dir: 'rtl', label: 'اردو' },
  { locale: 'fr', dir: 'ltr', label: 'Français' },
  { locale: 'ms', dir: 'ltr', label: 'Bahasa Melayu' },
  { locale: 'id', dir: 'ltr', label: 'Bahasa Indonesia' },
]

export function isRtl(locale: Locale): boolean {
  return SUPPORTED_LOCALES.find((l) => l.locale === locale)?.dir === 'rtl'
}
