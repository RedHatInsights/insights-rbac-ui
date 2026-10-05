import type { Locale } from '../../locales/locale';

export type LocaleMessages = Record<string, string>;

const localeCatalogLoaders: Record<Locale, () => Promise<LocaleMessages>> = {
  en: async () => (await import(/* webpackChunkName: "locale-en" */ '../../locales/en.json')).default as LocaleMessages,
};

export const loadLocaleMessages = (locale: string): Promise<LocaleMessages> => {
  const loadCatalog = localeCatalogLoaders[locale as Locale];
  if (!loadCatalog) {
    return Promise.reject(new Error(`No message catalog registered for locale "${locale}"`));
  }

  return loadCatalog();
};
