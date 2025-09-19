import { fetchGroups } from '../../redux/groups/helper';
import asyncDebounce from '../../utilities/async-debounce';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';
import { locale } from '../../locales/locale';

export const asyncValidator = async (groupName: string, idKey: string, id?: string): Promise<void> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as unknown as Record<string, string> }, cache);

  if (!groupName) {
    return undefined;
  }

  if (groupName.length > 150) {
    throw intl.formatMessage(messages.maxCharactersWarning, { number: 150 });
  }

  const response = await fetchGroups({
    limit: 10,
    offset: 0,
    filters: { name: groupName },
    nameMatch: 'exact',
  }).catch((error: unknown) => {
    console.error(error);
    return undefined;
  });

  if (id ? response?.data?.some((item: any) => item[idKey] !== id) : (response?.data?.length || 0) > 0) {
    throw intl.formatMessage(messages.nameAlreadyTaken);
  }

  return undefined;
};

export const debouncedAsyncValidator = asyncDebounce((value: string, idKey: string, id?: string) => asyncValidator(value, idKey, id), 300);
