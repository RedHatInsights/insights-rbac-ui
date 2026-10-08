import React, { useEffect, useState } from 'react';
import { type IntlConfig, IntlProvider } from 'react-intl';
import { defaultLocale } from '../../locales/locale';
import { type LocaleMessages, loadLocaleMessages } from './localeCatalogs';

export type LocaleMessagesLoader = (locale: string) => Promise<LocaleMessages>;

interface IntlMessagesProviderProps {
  locale: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadMessages?: LocaleMessagesLoader;
  onError?: IntlConfig['onError'];
}

interface CatalogLoadSuccess {
  locale: string;
  messages: LocaleMessages;
}

interface CatalogLoadFailure {
  locale: string;
  error: unknown;
}

type CatalogLoadState = CatalogLoadSuccess | CatalogLoadFailure;

const loadedCatalogs = new Map<string, LocaleMessages>();
const pendingCatalogs = new Map<string, Promise<LocaleMessages>>();

export const getLoadedLocaleMessages = (locale: string): LocaleMessages | undefined => loadedCatalogs.get(locale);

export const preloadLocaleMessages = (locale: string, loadMessages: LocaleMessagesLoader = loadLocaleMessages): Promise<LocaleMessages> => {
  const loaded = loadedCatalogs.get(locale);
  if (loaded) {
    return Promise.resolve(loaded);
  }

  const pending = pendingCatalogs.get(locale);
  if (pending) {
    return pending;
  }

  const loading = Promise.resolve()
    .then(() => loadMessages(locale))
    .then((messages) => {
      loadedCatalogs.set(locale, messages);
      return messages;
    })
    .finally(() => pendingCatalogs.delete(locale));

  pendingCatalogs.set(locale, loading);
  return loading;
};

export const IntlMessagesProvider: React.FC<IntlMessagesProviderProps> = ({
  locale,
  children,
  fallback = null,
  loadMessages = loadLocaleMessages,
  onError,
}) => {
  const [catalog, setCatalog] = useState<CatalogLoadState>();

  useEffect(() => {
    if (getLoadedLocaleMessages(locale)) {
      return;
    }

    let active = true;

    preloadLocaleMessages(locale, loadMessages).then(
      (messages) => {
        if (active) {
          setCatalog({ locale, messages });
        }
      },
      (error: unknown) => {
        if (active) {
          setCatalog({ locale, error });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [loadMessages, locale]);

  const loadedMessages = getLoadedLocaleMessages(locale);
  if (loadedMessages) {
    return (
      <IntlProvider locale={locale} defaultLocale={defaultLocale} messages={loadedMessages} onError={onError}>
        {children}
      </IntlProvider>
    );
  }

  if (catalog?.locale === locale) {
    if ('error' in catalog) {
      throw catalog.error;
    }

    return (
      <IntlProvider locale={locale} defaultLocale={defaultLocale} messages={catalog.messages} onError={onError}>
        {children}
      </IntlProvider>
    );
  }

  return <>{fallback}</>;
};
