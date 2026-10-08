export const supportedLocales = ['en'] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = 'en';
export const locale: Locale = defaultLocale;
