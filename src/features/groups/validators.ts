import { groupsApi } from '../../data/api/groups';
import { debounceAsync as asyncDebounce } from '../../utilities/debounce';
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

  const response = await groupsApi
    .listGroups({
      limit: 10,
      offset: 0,
      name: groupName,
      nameMatch: 'exact',
    })
    .catch((error: unknown) => {
      console.error(error);
      return undefined;
    });

  const groups = response?.data?.data ?? [];

  if (id ? groups.some((item) => item[idKey as keyof typeof item] !== id) : groups.length > 0) {
    throw intl.formatMessage(messages.nameAlreadyTaken);
  }

  return undefined;
};

export const debouncedAsyncValidator = asyncDebounce((value: string, idKey: string, id?: string) => asyncValidator(value, idKey, id), 250);
